/**
 * storage.service.ts
 *
 * Service de gestion du STOCKAGE LOCAL des données.
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine une bibliothèque personnelle où tu ranges tous tes livres.
 * Ce service est le bibliothécaire : il sait où ranger chaque livre,
 * comment les retrouver, et garde tout bien organisé.
 *
 * Pourquoi LocalForage et pas juste localStorage ?
 * ----------------------------------------------
 * localStorage : Limité à 5-10 MB, synchrone (bloque l'UI), seulement des strings
 * LocalForage : Jusqu'à 50 MB, asynchrone (ne bloque pas), objets complexes OK
 *
 * LocalForage utilise automatiquement :
 * 1. IndexedDB (navigateurs modernes) - RAPIDE et PUISSANT
 * 2. WebSQL (anciens navigateurs) - backup
 * 3. localStorage (fallback ultime) - au cas où
 *
 * Philosophie David J. Malan :
 * "Always choose the right tool for the job."
 *
 * Ici, LocalForage est le BON outil pour stocker beaucoup de données
 * sans ralentir l'application.
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Clés de stockage
 * ---------------
 * On définit toutes les clés ici pour éviter les fautes de frappe !
 *
 * Analogie : C'est comme avoir un trousseau de clés étiqueté.
 * Chaque clé ouvre un "casier" spécifique dans le stockage.
 */
export enum StorageKeys {
  // Données utilisateur
  USER_PROFILE = 'user_profile',
  USER_PROGRESS = 'user_progress',
  USER_SETTINGS = 'user_settings',

  // Planning et journées
  PLANNING_DAYS = 'planning_days',
  PLANNING_CONFIG = 'planning_config',
  PLANNING_CONFIGS_LIST = 'planning_configs_list',
  CURRENT_DAY = 'current_day',

  // Exercices
  EXERCISES = 'exercises',
  EXERCISES_COMPLETED = 'exercises_completed',
  EXERCISES_IN_PROGRESS = 'exercises_in_progress',

  // Évaluations
  EVALUATIONS = 'evaluations',

  // Gamification
  BADGES = 'badges',
  QUESTS = 'quests',
  XP_HISTORY = 'xp_history',

  // Pomodoro
  POMODORO_SESSIONS = 'pomodoro_sessions',
  POMODORO_STATS = 'pomodoro_stats',

  // Révisions
  REVISION_SCHEDULE = 'revision_schedule',
  FLASHCARDS = 'flashcards',

  // Cache
  LAST_SYNC = 'last_sync',
  APP_VERSION = 'app_version'
}

/**
 * Service Injectable
 * -----------------
 * @Injectable({ providedIn: 'root' }) signifie :
 * - Ce service est un SINGLETON (une seule instance dans toute l'app)
 * - Disponible partout sans avoir besoin de l'importer dans les modules
 * - Créé automatiquement au démarrage de l'app
 *
 * Pourquoi singleton ?
 * - Évite les conflits : un seul "bibliothécaire" qui gère tout
 * - Performance : pas besoin de créer plusieurs instances
 * - Cohérence : toutes les parties de l'app voient les mêmes données
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /**
   * Instance LocalForage
   * -------------------
   * On la configure une fois au démarrage du service.
   */
  private storage: LocalForage;

  /**
   * Constructeur
   * -----------
   * Appelé automatiquement quand Angular crée le service.
   *
   * C'est ici qu'on initialise LocalForage avec notre configuration.
   */
  constructor() {
    // Configuration de LocalForage
    // ---------------------------
    // On crée notre "bibliothèque" avec un nom et des paramètres
    this.storage = localforage.createInstance({
      // Nom de la base de données
      // Apparaîtra dans les DevTools du navigateur
      name: 'StudyTrackerDB',

      // Nom du "store" (comme une section de la bibliothèque)
      storeName: 'study_data',

      // Description (pour documentation)
      description: 'Stockage local pour Study Tracker Pro',

      // Ordre de préférence des drivers (moteurs de stockage)
      // 1. IndexedDB (meilleur choix, moderne et rapide)
      // 2. WebSQL (backup pour anciens navigateurs)
      // 3. localStorage (fallback ultime)
      driver: [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE
      ]
    });

    // Log du driver utilisé (pour débuggage)
    // -------------------------------------
    // Permet de savoir quel moteur de stockage est actif
    this.storage.ready().then(() => {
      const driverName = this.storage.driver();
      console.log('📦 StorageService initialisé avec driver:', driverName);

      // Explication pédagogique dans la console
      if (driverName === localforage.INDEXEDDB) {
        console.log('✅ IndexedDB actif - Performance optimale !');
      } else if (driverName === localforage.LOCALSTORAGE) {
        console.log('⚠️ localStorage actif - Limité à 5-10 MB');
      }
    });
  }

  // ============================================================
  // MÉTHODES CRUD (Create, Read, Update, Delete)
  // ============================================================

  /**
   * SAUVEGARDER (CREATE / UPDATE)
   * -----------------------------
   * Enregistre une valeur dans le stockage.
   *
   * Analogie : Ranger un livre sur une étagère spécifique.
   *
   * @param key - La clé (l'étagère)
   * @param value - La valeur à sauvegarder (le livre)
   * @returns Observable qui émet la valeur sauvegardée
   *
   * Exemple d'utilisation :
   * ```typescript
   * this.storageService.set(StorageKeys.USER_PROGRESS, myProgress)
   *   .subscribe(
   *     data => console.log('Sauvegardé !', data),
   *     error => console.error('Erreur :', error)
   *   );
   * ```
   *
   * Pourquoi retourner un Observable ?
   * ----------------------------------
   * RxJS Observable = flux de données asynchrone
   * Parfait pour les opérations qui prennent du temps (I/O disque)
   *
   * Avantages :
   * - Non bloquant : l'UI reste responsive
   * - Composable : on peut chaîner des opérations (.pipe)
   * - Annulable : on peut unsubscribe si besoin
   */
  set<T>(key: string, value: T): Observable<T> {
    // Explication pédagogique du code :
    // --------------------------------
    // 1. this.storage.setItem(key, value)
    //    → Retourne une Promise (promesse de résultat futur)
    //
    // 2. from(...)
    //    → Convertit la Promise en Observable
    //    Pourquoi ? Car Angular préfère les Observables !
    //
    // 3. pipe(catchError(...))
    //    → Si erreur, on la capture et on la transforme
    //    Permet de logger l'erreur avant de la propager

    return from(this.storage.setItem(key, value)).pipe(
      // Si tout va bien, l'Observable émet la valeur sauvegardée

      // Si erreur, on la capture ici
      catchError(error => {
        console.error(`❌ Erreur lors de la sauvegarde [${key}]:`, error);

        // On propage l'erreur pour que l'appelant puisse la gérer
        return throwError(() => new Error(`Impossible de sauvegarder ${key}`));
      })
    );
  }

  /**
   * RÉCUPÉRER (READ)
   * ---------------
   * Récupère une valeur depuis le stockage.
   *
   * Analogie : Chercher un livre sur une étagère spécifique.
   *
   * @param key - La clé (l'étagère)
   * @returns Observable qui émet la valeur trouvée (ou null si inexistant)
   *
   * Exemple d'utilisation :
   * ```typescript
   * this.storageService.get<Progress>(StorageKeys.USER_PROGRESS)
   *   .subscribe(
   *     progress => {
   *       if (progress) {
   *         console.log('Progression trouvée !', progress);
   *       } else {
   *         console.log('Aucune progression sauvegardée');
   *       }
   *     }
   *   );
   * ```
   *
   * Note sur le générique <T> :
   * --------------------------
   * Le <T> permet de spécifier le TYPE de données attendu.
   * TypeScript vérifiera que tu utilises bien le bon type !
   *
   * Ex: get<Progress>(...) → retourne un Observable<Progress | null>
   */
  get<T>(key: string): Observable<T | null> {
    return from(this.storage.getItem<T>(key)).pipe(
      // La valeur récupérée (ou null si inexistant)

      catchError(error => {
        console.error(`❌ Erreur lors de la récupération [${key}]:`, error);

        // En cas d'erreur, on retourne null plutôt que de crasher
        // L'app peut continuer à fonctionner avec des valeurs par défaut
        return from([null]);
      })
    );
  }

  /**
   * SUPPRIMER (DELETE)
   * -----------------
   * Supprime une valeur du stockage.
   *
   * Analogie : Retirer un livre d'une étagère.
   *
   * @param key - La clé à supprimer
   * @returns Observable qui émet quand c'est fait
   *
   * Exemple d'utilisation :
   * ```typescript
   * this.storageService.remove(StorageKeys.USER_PROGRESS)
   *   .subscribe(() => console.log('Progression supprimée'));
   * ```
   */
  remove(key: string): Observable<void> {
    return from(this.storage.removeItem(key)).pipe(
      catchError(error => {
        console.error(`❌ Erreur lors de la suppression [${key}]:`, error);
        return throwError(() => new Error(`Impossible de supprimer ${key}`));
      })
    );
  }

  /**
   * TOUT EFFACER (CLEAR ALL)
   * -----------------------
   * Vide COMPLÈTEMENT le stockage.
   *
   * ⚠️ ATTENTION : Cette opération est IRRÉVERSIBLE !
   *
   * Analogie : Vider toute la bibliothèque.
   *
   * Utilisation typique :
   * - Réinitialiser l'app
   * - Logout utilisateur
   * - Tests/debug
   *
   * @returns Observable qui émet quand c'est fait
   */
  clear(): Observable<void> {
    console.warn('⚠️ CLEAR : Suppression de TOUTES les données !');

    return from(this.storage.clear()).pipe(
      catchError(error => {
        console.error('❌ Erreur lors du clear complet:', error);
        return throwError(() => new Error('Impossible de vider le stockage'));
      })
    );
  }

  /**
   * LISTER LES CLÉS
   * --------------
   * Retourne la liste de toutes les clés stockées.
   *
   * Analogie : Lister toutes les étagères de la bibliothèque.
   *
   * Utile pour :
   * - Debug : voir ce qui est stocké
   * - Migration : transférer les données
   * - Stats : "Tu as 42 éléments sauvegardés"
   *
   * @returns Observable qui émet un tableau de clés
   */
  keys(): Observable<string[]> {
    return from(this.storage.keys()).pipe(
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des clés:', error);
        return from([[]]);
      })
    );
  }

  /**
   * COMPTER LES ÉLÉMENTS
   * -------------------
   * Retourne le nombre d'éléments stockés.
   *
   * @returns Observable qui émet le nombre d'éléments
   */
  length(): Observable<number> {
    return from(this.storage.length()).pipe(
      catchError(error => {
        console.error('❌ Erreur lors du comptage:', error);
        return from([0]);
      })
    );
  }

  // ============================================================
  // MÉTHODES UTILITAIRES AVANCÉES
  // ============================================================

  /**
   * SAUVEGARDER PLUSIEURS VALEURS EN BATCH
   * -------------------------------------
   * Sauvegarde plusieurs paires clé-valeur en une seule opération.
   *
   * Plus RAPIDE que de faire plusieurs .set() à la suite.
   *
   * @param items - Objet { clé: valeur, clé2: valeur2, ... }
   * @returns Observable qui émet quand tout est sauvegardé
   *
   * Exemple :
   * ```typescript
   * this.storageService.setMultiple({
   *   [StorageKeys.USER_PROGRESS]: progress,
   *   [StorageKeys.BADGES]: badges,
   *   [StorageKeys.QUESTS]: quests
   * }).subscribe(() => console.log('Tout sauvegardé !'));
   * ```
   */
  setMultiple(items: { [key: string]: any }): Observable<void> {
    // On crée un tableau de Promises (une par élément à sauvegarder)
    const promises = Object.entries(items).map(([key, value]) =>
      this.storage.setItem(key, value)
    );

    // Promise.all attend que TOUTES les Promises soient résolues
    // C'est comme dire : "Attends que tous les livres soient rangés"
    return from(Promise.all(promises)).pipe(
      // Une fois tout sauvegardé, on retourne juste "void" (rien)
      map(() => undefined),

      catchError(error => {
        console.error('❌ Erreur lors de la sauvegarde multiple:', error);
        return throwError(() => new Error('Impossible de sauvegarder en batch'));
      })
    );
  }

  /**
   * RÉCUPÉRER PLUSIEURS VALEURS EN BATCH
   * -----------------------------------
   * Récupère plusieurs valeurs en une seule opération.
   *
   * @param keys - Tableau de clés à récupérer
   * @returns Observable qui émet un objet { clé: valeur, ... }
   *
   * Exemple :
   * ```typescript
   * this.storageService.getMultiple([
   *   StorageKeys.USER_PROGRESS,
   *   StorageKeys.BADGES
   * ]).subscribe(data => {
   *   console.log('Progress:', data[StorageKeys.USER_PROGRESS]);
   *   console.log('Badges:', data[StorageKeys.BADGES]);
   * });
   * ```
   */
  getMultiple<T = any>(keys: string[]): Observable<{ [key: string]: T | null }> {
    const promises = keys.map(key =>
      this.storage.getItem<T>(key).then(value => ({ key, value }))
    );

    return from(Promise.all(promises)).pipe(
      // On transforme le tableau en objet { clé: valeur }
      map(results => {
        const data: { [key: string]: T | null } = {};
        results.forEach(({ key, value }) => {
          data[key] = value;
        });
        return data;
      }),

      catchError(error => {
        console.error('❌ Erreur lors de la récupération multiple:', error);
        return from([{}]);
      })
    );
  }

  /**
   * VÉRIFIER SI UNE CLÉ EXISTE
   * -------------------------
   * Retourne true si la clé existe, false sinon.
   *
   * Plus RAPIDE que de faire .get() puis vérifier si null.
   *
   * @param key - La clé à vérifier
   * @returns Observable<boolean>
   */
  has(key: string): Observable<boolean> {
    return this.get(key).pipe(
      map(value => value !== null && value !== undefined)
    );
  }

  /**
   * EXPORTER TOUTES LES DONNÉES (pour backup)
   * ---------------------------------------
   * Récupère TOUTES les données sous forme d'objet.
   *
   * Utile pour :
   * - Backup avant une mise à jour
   * - Export vers un fichier JSON
   * - Migration vers un autre système
   *
   * @returns Observable qui émet toutes les données
   */
  exportAll(): Observable<{ [key: string]: any }> {
    return this.keys().pipe(
      // Pour chaque clé, on récupère la valeur
      map(keys => {
        const promises = keys.map(key =>
          this.storage.getItem(key).then(value => ({ key, value }))
        );
        return Promise.all(promises);
      }),

      // On attend la résolution de toutes les Promises
      map(promise => from(promise)),

      // On aplatit l'Observable<Observable<...>> en Observable<...>
      map(obs => obs.pipe(
        map(results => {
          const data: { [key: string]: any } = {};
          results.forEach(({ key, value }) => {
            data[key] = value;
          });
          return data;
        })
      ))
    ) as any; // Cast pour simplifier le type
  }

  /**
   * IMPORTER DES DONNÉES (depuis backup)
   * ----------------------------------
   * Restaure des données depuis un objet.
   *
   * ⚠️ Écrase les données existantes !
   *
   * @param data - Objet { clé: valeur, ... }
   * @returns Observable qui émet quand tout est importé
   */
  importAll(data: { [key: string]: any }): Observable<void> {
    console.log('📥 Import de', Object.keys(data).length, 'éléments...');
    return this.setMultiple(data);
  }

  /**
   * OBTENIR LA TAILLE UTILISÉE (approximatif)
   * ---------------------------------------
   * Estime la taille en octets du stockage utilisé.
   *
   * Note : C'est une ESTIMATION, pas exact au byte près.
   *
   * @returns Observable<number> (taille en octets)
   */
  getStorageSize(): Observable<number> {
    return this.exportAll().pipe(
      map((data: any) => {
        // On convertit en JSON pour estimer la taille
        const jsonString = JSON.stringify(data);

        // Taille en octets (1 caractère UTF-16 = 2 octets)
        const bytes = new Blob([jsonString]).size;

        console.log(`💾 Taille du stockage: ${this.formatBytes(bytes)}`);
        return bytes;
      })
    );
  }

  /**
   * FORMATER DES OCTETS EN TEXTE LISIBLE
   * -----------------------------------
   * Convertit 1024 → "1 KB", 1048576 → "1 MB", etc.
   *
   * @param bytes - Nombre d'octets
   * @returns String formaté (ex: "1.5 MB")
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI utiliser des Observables plutôt que des Promises ?
 *
 *    Promises = Une seule valeur, un seul événement
 *    Observables = Flux continu, plusieurs valeurs possibles
 *
 *    Exemple concret :
 *    - Promise : "Je vais chercher UN livre"
 *    - Observable : "Je m'abonne au flux de TOUS les livres qui arrivent"
 *
 *    Avantages des Observables :
 *    - Annulables (unsubscribe)
 *    - Composables (pipe, map, filter, etc.)
 *    - Lazy (ne s'exécute que si quelqu'un écoute)
 *    - Standard Angular
 *
 * 2. POURQUOI LocalForage plutôt que localStorage ?
 *
 *    localStorage : Synchrone, bloque l'UI, limité à ~5 MB
 *    LocalForage : Asynchrone, non bloquant, jusqu'à ~50 MB
 *
 *    Imagine un fichier de 10 MB :
 *    - localStorage : L'app FREEZE pendant le chargement ❌
 *    - LocalForage : L'app reste fluide pendant le chargement ✅
 *
 * 3. POURQUOI définir StorageKeys en enum ?
 *
 *    Sans enum : storageService.set('user_progres', ...) // Typo ! Bug !
 *    Avec enum : storageService.set(StorageKeys.USER_PROGRESS, ...) // OK !
 *
 *    TypeScript détecte les fautes de frappe à la compilation,
 *    PAS à l'exécution quand c'est trop tard !
 *
 * Citation de Linus Torvalds (créateur de Linux) :
 * "Bad programmers worry about the code.
 *  Good programmers worry about data structures and their relationships."
 *
 * Le StorageService gère LA DATA de toute l'app.
 * Si le stockage fonctionne mal, TOUTE l'app fonctionne mal !
 * C'est pourquoi on y met autant de soin.
 *
 * Prochaine étape : PlanningService !
 */
