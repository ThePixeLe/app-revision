/**
 * progress.service.ts
 *
 * Service de gestion de la PROGRESSION de l'utilisateur.
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine un RPG (jeu de rôle) comme Pokémon ou Final Fantasy :
 * - Tu gagnes de l'XP en combattant (ici, en faisant des exercices)
 * - Tu montes de niveau
 * - Tu débloques des capacités (ici, des badges)
 * - Tu as des statistiques (HP, attaque, défense → ici, progression par sujet)
 *
 * Ce service est le "moteur RPG" de l'application.
 * Il gère TOUT ce qui concerne ta progression dans l'apprentissage.
 *
 * Responsabilités :
 * ----------------
 * 1. Gérer l'XP et les niveaux
 * 2. Calculer et maintenir le streak (série de jours consécutifs)
 * 3. Débloquer les badges selon les conditions
 * 4. Suivre les statistiques détaillées
 * 5. Sauvegarder/charger la progression
 *
 * Philosophie David J. Malan :
 * "Progress, not perfection, is what matters."
 *
 * Ce service mesure et célèbre CHAQUE progrès, pas la perfection.
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';

// Import des modèles
import {
  Progress,
  XPSource,
  XPTransaction,
  calculateLevel,
  calculateXPForLevel,
  calculateTotalXPForLevel,
  createDefaultProgress
} from '../models/progress.model';

import {
  Badge,
  BadgeCategory,
  PREDEFINED_BADGES,
  canUnlockBadge
} from '../models/badge.model';

// Import des services
import { StorageService, StorageKeys } from './storage.service';

/**
 * Service Injectable
 * -----------------
 * @Injectable({ providedIn: 'root' }) signifie que ce service :
 * - Est un SINGLETON (une seule instance pour toute l'app)
 * - Est disponible partout sans import dans les modules
 * - Est créé automatiquement au premier usage
 *
 * Pourquoi singleton pour la progression ?
 * ----------------------------------------
 * La progression est une donnée GLOBALE.
 * Si on avait plusieurs instances, elles auraient des XP différents !
 * Un seul service = une seule source de vérité.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  // ============================================================
  // ÉTAT INTERNE (BehaviorSubjects)
  // ============================================================

  /**
   * BehaviorSubject de la progression
   * ---------------------------------
   * Pourquoi BehaviorSubject et pas Subject ?
   *
   * Subject : Émet seulement aux abonnés ACTUELS
   * BehaviorSubject : Garde la DERNIÈRE valeur et la donne aux NOUVEAUX abonnés
   *
   * Exemple :
   * - Component A s'abonne → reçoit la progression actuelle
   * - 5 secondes plus tard, Component B s'abonne → reçoit AUSSI la progression
   *
   * Sans BehaviorSubject, Component B ne recevrait rien jusqu'à la prochaine mise à jour.
   */
  private progressSubject = new BehaviorSubject<Progress | null>(null);

  /**
   * Observable public de la progression
   * ----------------------------------
   * Les composants s'abonnent à ceci, pas au Subject directement.
   *
   * Pourquoi cacher le Subject ?
   * → Encapsulation : On ne veut pas que les composants fassent .next()
   * → Le service CONTRÔLE les mises à jour
   */
  public progress$: Observable<Progress | null> = this.progressSubject.asObservable();

  /**
   * Observable du niveau actuel
   * --------------------------
   * Permet aux composants de s'abonner directement au niveau.
   */
  public level$: Observable<number> = this.progress$.pipe(
    map(p => p?.level || 1)
  );

  /**
   * Observable de l'XP total
   * -----------------------
   * Permet aux composants de s'abonner directement à l'XP.
   */
  public xp$: Observable<number> = this.progress$.pipe(
    map(p => p?.totalXP || 0)
  );

  /**
   * Observable du streak
   * -------------------
   * Permet aux composants de s'abonner directement au streak.
   */
  public streak$: Observable<number> = this.progress$.pipe(
    map(p => p?.streak || 0)
  );

  /**
   * BehaviorSubject des badges
   * -------------------------
   * Liste complète des badges (débloqués ou non).
   */
  private badgesSubject = new BehaviorSubject<Badge[]>([]);

  /**
   * Observable public des badges
   */
  public badges$: Observable<Badge[]> = this.badgesSubject.asObservable();

  /**
   * BehaviorSubject pour les badges récemment débloqués
   * --------------------------------------------------
   * Permet d'afficher des notifications "Badge débloqué !"
   */
  private newlyUnlockedBadgesSubject = new BehaviorSubject<Badge[]>([]);

  /**
   * Observable public des badges récemment débloqués
   */
  public newlyUnlockedBadges$: Observable<Badge[]> = this.newlyUnlockedBadgesSubject.asObservable();

  /**
   * Constructeur
   * -----------
   * Appelé automatiquement par Angular lors de la création du service.
   *
   * @param storageService - Service de stockage injecté automatiquement (DI)
   */
  constructor(private storageService: StorageService) {
    // Charge la progression au démarrage
    this.loadProgress();
    this.loadBadges();
  }

  // ============================================================
  // INITIALISATION ET CHARGEMENT
  // ============================================================

  /**
   * CHARGER LA PROGRESSION
   * ---------------------
   * Récupère la progression depuis le stockage local.
   * Si aucune progression n'existe, crée une nouvelle avec les valeurs par défaut.
   *
   * Flux :
   * 1. Demande au StorageService de récupérer USER_PROGRESS
   * 2. Si trouvé → utilise ces données
   * 3. Si non trouvé → crée un nouveau profil
   * 4. Met à jour le BehaviorSubject
   */
  private loadProgress(): void {
    console.log('📊 Chargement de la progression...');

    this.storageService.get<Progress>(StorageKeys.USER_PROGRESS)
      .subscribe({
        next: (savedProgress) => {
          if (savedProgress) {
            // Progression existante trouvée
            console.log('✅ Progression trouvée - Niveau', savedProgress.level);

            // Vérifie le streak (peut avoir été brisé si l'utilisateur n'est pas venu hier)
            const checkedProgress = this.checkStreak(savedProgress);

            this.progressSubject.next(checkedProgress);

            // Sauvegarde si le streak a changé
            if (checkedProgress.streak !== savedProgress.streak) {
              this.saveProgress(checkedProgress);
            }
          } else {
            // Première utilisation, crée un nouveau profil
            console.log('📝 Création d\'un nouveau profil...');
            const newProgress = createDefaultProgress();

            this.progressSubject.next(newProgress);
            this.saveProgress(newProgress);
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement de la progression:', error);

          // En cas d'erreur, crée un nouveau profil
          const newProgress = createDefaultProgress();
          this.progressSubject.next(newProgress);
        }
      });
  }

  /**
   * CHARGER LES BADGES
   * -----------------
   * Récupère les badges depuis le stockage ou crée la liste par défaut.
   */
  private loadBadges(): void {
    console.log('🏆 Chargement des badges...');

    this.storageService.get<Badge[]>(StorageKeys.BADGES)
      .subscribe({
        next: (savedBadges) => {
          if (savedBadges && savedBadges.length > 0) {
            console.log('✅ Badges trouvés:', savedBadges.length);
            this.badgesSubject.next(savedBadges);
          } else {
            console.log('📝 Création des badges par défaut...');
            this.createDefaultBadges();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des badges:', error);
          this.createDefaultBadges();
        }
      });
  }

  /**
   * CRÉER LES BADGES PAR DÉFAUT
   * --------------------------
   * Initialise tous les badges prédéfinis avec le statut "locked".
   */
  private createDefaultBadges(): void {
    // Cast en Badge[] car PREDEFINED_BADGES contient tous les champs requis
    const badges = PREDEFINED_BADGES.map(badge => ({
      ...badge,
      unlocked: false,
      unlockedAt: undefined
    })) as Badge[];

    this.badgesSubject.next(badges);
    this.saveBadges(badges);
  }

  /**
   * SAUVEGARDER LA PROGRESSION
   * -------------------------
   * Persiste la progression dans le stockage local.
   *
   * @param progress - Progression à sauvegarder
   */
  private saveProgress(progress: Progress): void {
    this.storageService.set(StorageKeys.USER_PROGRESS, progress)
      .subscribe({
        next: () => console.log('💾 Progression sauvegardée'),
        error: (error) => console.error('❌ Erreur de sauvegarde:', error)
      });
  }

  /**
   * SAUVEGARDER LES BADGES
   * ---------------------
   * Persiste les badges dans le stockage local.
   *
   * @param badges - Badges à sauvegarder
   */
  private saveBadges(badges: Badge[]): void {
    this.storageService.set(StorageKeys.BADGES, badges)
      .subscribe({
        next: () => console.log('💾 Badges sauvegardés'),
        error: (error) => console.error('❌ Erreur de sauvegarde badges:', error)
      });
  }

  // ============================================================
  // GESTION DE L'XP ET DES NIVEAUX
  // ============================================================

  /**
   * AJOUTER DE L'XP
   * --------------
   * Ajoute des points d'expérience et gère le level up.
   *
   * @param amount - Quantité d'XP à ajouter
   * @param source - Description de la source (pour l'historique)
   * @returns Observable<Progress> - Progression mise à jour
   *
   * Flux détaillé :
   * 1. Récupère la progression actuelle
   * 2. Ajoute l'XP
   * 3. Vérifie si level up
   * 4. Crée une transaction XP (historique)
   * 5. Met à jour le streak si nécessaire
   * 6. Sauvegarde
   * 7. Émet la nouvelle progression
   *
   * Exemple d'utilisation :
   * ```typescript
   * this.progressService.addXP(50, 'Exercice conditions #3')
   *   .subscribe(progress => {
   *     console.log('Nouveau niveau:', progress.level);
   *   });
   * ```
   */
  addXP(amount: number, source: string): Observable<Progress> {
    return new Observable(observer => {
      const currentProgress = this.progressSubject.value;

      if (!currentProgress) {
        observer.error(new Error('Progression non initialisée'));
        return;
      }

      // Copie la progression pour éviter les mutations directes
      // (Immutabilité = moins de bugs)
      const updatedProgress = { ...currentProgress };
      const now = new Date();

      // === ÉTAPE 1 : Ajoute l'XP ===
      const oldLevel = updatedProgress.level;
      updatedProgress.xp += amount;

      // === ÉTAPE 2 : Vérifie le level up ===
      const newLevel = calculateLevel(updatedProgress.xp);

      if (newLevel > oldLevel) {
        console.log(`🎉 LEVEL UP ! ${oldLevel} → ${newLevel}`);
        updatedProgress.level = newLevel;
        updatedProgress.levelUpHistory.push({
          level: newLevel,
          achievedAt: now,
          totalXP: updatedProgress.xp
        });
      }

      // === ÉTAPE 3 : Crée la transaction XP ===
      const transaction: XPTransaction = {
        id: `xp-${Date.now()}`,
        amount,
        source: this.parseXPSource(source),
        description: source,
        earnedAt: now,
        levelBefore: oldLevel,
        levelAfter: newLevel
      };

      updatedProgress.xpHistory.push(transaction);

      // Garde seulement les 100 dernières transactions (économie mémoire)
      if (updatedProgress.xpHistory.length > 100) {
        updatedProgress.xpHistory = updatedProgress.xpHistory.slice(-100);
      }

      // === ÉTAPE 4 : Met à jour la date de dernière activité ===
      updatedProgress.lastActivityDate = now;
      updatedProgress.updatedAt = now;

      // === ÉTAPE 5 : Vérifie et met à jour le streak ===
      const checkedProgress = this.updateStreak(updatedProgress);

      // === ÉTAPE 6 : Sauvegarde et émet ===
      this.progressSubject.next(checkedProgress);
      this.saveProgress(checkedProgress);

      // Vérifie si des badges peuvent être débloqués
      this.checkBadgeUnlocks();

      observer.next(checkedProgress);
      observer.complete();
    });
  }

  /**
   * PARSER LA SOURCE D'XP
   * --------------------
   * Détermine le type de source à partir de la description.
   *
   * @param description - Description de la source
   * @returns Type de source XP
   */
  private parseXPSource(description: string): XPSource {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('exercice')) return 'exercise';
    if (lowerDesc.includes('pomodoro')) return 'pomodoro';
    if (lowerDesc.includes('quête') || lowerDesc.includes('quest')) return 'quest';
    if (lowerDesc.includes('badge')) return 'badge';
    if (lowerDesc.includes('streak')) return 'streak';
    if (lowerDesc.includes('révision') || lowerDesc.includes('review')) return 'review';
    if (lowerDesc.includes('level')) return 'level-up';
    if (lowerDesc.includes('bonus')) return 'bonus';

    return 'bonus'; // Par défaut
  }

  // ============================================================
  // GESTION DU STREAK
  // ============================================================

  /**
   * VÉRIFIER LE STREAK
   * -----------------
   * Vérifie si le streak est toujours valide (activité hier).
   * Si non, le réinitialise.
   *
   * @param progress - Progression à vérifier
   * @returns Progression avec streak mis à jour
   *
   * Logique :
   * - Si dernière activité = aujourd'hui → OK, streak maintenu
   * - Si dernière activité = hier → OK, streak maintenu
   * - Si dernière activité = avant-hier ou plus → Streak brisé !
   */
  private checkStreak(progress: Progress): Progress {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = new Date(progress.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    // Calcule la différence en jours
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Si plus d'un jour sans activité, le streak est brisé
    if (diffDays > 1) {
      console.log(`💔 Streak brisé ! (${diffDays} jours sans activité)`);

      // Sauvegarde l'ancien streak si c'est le meilleur
      if (progress.streak > progress.longestStreak) {
        progress.longestStreak = progress.streak;
      }

      // Reset le streak
      progress.streak = 0;
      progress.streakStartDate = today;
    }

    return progress;
  }

  /**
   * METTRE À JOUR LE STREAK
   * ----------------------
   * Incrémente le streak si c'est le premier activité de la journée.
   *
   * @param progress - Progression à mettre à jour
   * @returns Progression avec streak mis à jour
   */
  private updateStreak(progress: Progress): Progress {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = new Date(progress.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    // Si c'est la première activité d'aujourd'hui
    if (today.getTime() > lastActivity.getTime()) {
      progress.streak += 1;
      console.log(`🔥 Streak : ${progress.streak} jour(s) !`);

      // Met à jour le record si nécessaire
      if (progress.streak > progress.longestStreak) {
        progress.longestStreak = progress.streak;
        console.log(`🏆 Nouveau record de streak : ${progress.longestStreak} jours !`);
      }

      // Bonus XP pour les milestones de streak
      const streakBonuses: { [key: number]: number } = {
        7: 50,    // 1 semaine
        14: 100,  // 2 semaines
        30: 200,  // 1 mois
        60: 300,  // 2 mois
        90: 500   // 3 mois
      };

      const bonus = streakBonuses[progress.streak];
      if (bonus) {
        console.log(`🎁 Bonus streak ${progress.streak} jours : +${bonus} XP !`);
        // Note: On ne fait pas addXP ici pour éviter une boucle infinie
        // Le bonus est ajouté directement
        progress.xp += bonus;

        // Vérifie le level up après le bonus
        const newLevel = calculateLevel(progress.xp);
        if (newLevel > progress.level) {
          progress.level = newLevel;
        }
      }
    }

    return progress;
  }

  // ============================================================
  // GESTION DES BADGES
  // ============================================================

  /**
   * VÉRIFIER LES BADGES À DÉBLOQUER
   * ------------------------------
   * Parcourt tous les badges et vérifie leurs conditions.
   *
   * Cette méthode est appelée après chaque gain d'XP.
   */
  checkBadgeUnlocks(): void {
    const progress = this.progressSubject.value;
    const badges = this.badgesSubject.value;

    if (!progress || !badges.length) return;

    const newlyUnlocked: Badge[] = [];
    const now = new Date();

    const updatedBadges = badges.map(badge => {
      // Skip les badges déjà débloqués
      if (badge.unlocked) return badge;

      // Vérifie si le badge peut être débloqué
      if (canUnlockBadge(badge, progress)) {
        console.log(`🏆 Badge débloqué : ${badge.name} !`);

        const unlockedBadge = {
          ...badge,
          unlocked: true,
          unlockedAt: now
        };

        newlyUnlocked.push(unlockedBadge);
        return unlockedBadge;
      }

      return badge;
    });

    // Si des badges ont été débloqués
    if (newlyUnlocked.length > 0) {
      // Met à jour les badges
      this.badgesSubject.next(updatedBadges);
      this.saveBadges(updatedBadges);

      // Notifie les badges débloqués
      this.newlyUnlockedBadgesSubject.next(newlyUnlocked);

      // Ajoute l'XP des badges (sans déclencher une nouvelle vérification)
      const badgeXP = newlyUnlocked.reduce((sum, badge) => sum + badge.xpReward, 0);
      if (badgeXP > 0 && progress) {
        const updatedProgress = {
          ...progress,
          xp: progress.xp + badgeXP,
          updatedAt: now
        };

        // Vérifie le level up
        const newLevel = calculateLevel(updatedProgress.xp);
        if (newLevel > updatedProgress.level) {
          updatedProgress.level = newLevel;
        }

        this.progressSubject.next(updatedProgress);
        this.saveProgress(updatedProgress);
      }
    }
  }

  /**
   * EFFACER LES BADGES RÉCEMMENT DÉBLOQUÉS
   * -------------------------------------
   * Appelé après avoir affiché les notifications.
   */
  clearNewlyUnlockedBadges(): void {
    this.newlyUnlockedBadgesSubject.next([]);
  }

  /**
   * OBTENIR LES BADGES PAR CATÉGORIE
   * --------------------------------
   * Filtre les badges par catégorie.
   *
   * @param category - Catégorie de badges
   * @returns Observable<Badge[]>
   */
  getBadgesByCategory(category: BadgeCategory): Observable<Badge[]> {
    return this.badges$.pipe(
      map(badges => badges.filter(badge => badge.category === category))
    );
  }

  /**
   * OBTENIR LES BADGES DÉBLOQUÉS
   * ---------------------------
   * Retourne uniquement les badges débloqués.
   *
   * @returns Observable<Badge[]>
   */
  getUnlockedBadges(): Observable<Badge[]> {
    return this.badges$.pipe(
      map(badges => badges.filter(badge => badge.unlocked))
    );
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - STATISTIQUES
  // ============================================================

  /**
   * OBTENIR LA PROGRESSION ACTUELLE
   * ------------------------------
   * Retourne un snapshot de la progression actuelle.
   *
   * @returns Observable<Progress | null>
   */
  getProgress(): Observable<Progress | null> {
    return this.progress$;
  }

  /**
   * OBTENIR LE NIVEAU ACTUEL
   * -----------------------
   * Retourne le niveau actuel de l'utilisateur.
   *
   * @returns Observable<number>
   */
  getLevel(): Observable<number> {
    return this.progress$.pipe(
      map(progress => progress?.level || 1)
    );
  }

  /**
   * OBTENIR L'XP ACTUEL
   * ------------------
   * Retourne l'XP total de l'utilisateur.
   *
   * @returns Observable<number>
   */
  getXP(): Observable<number> {
    return this.progress$.pipe(
      map(progress => progress?.xp || 0)
    );
  }

  /**
   * OBTENIR LE STREAK ACTUEL
   * -----------------------
   * Retourne le nombre de jours consécutifs d'activité.
   *
   * @returns Observable<number>
   */
  getStreak(): Observable<number> {
    return this.progress$.pipe(
      map(progress => progress?.streak || 0)
    );
  }

  /**
   * OBTENIR LE POURCENTAGE VERS LE PROCHAIN NIVEAU
   * ---------------------------------------------
   * Calcule le pourcentage de progression vers le niveau suivant.
   *
   * @returns Observable<number> - Pourcentage (0-100)
   */
  getLevelProgress(): Observable<number> {
    return this.progress$.pipe(
      map(progress => {
        if (!progress) return 0;

        const currentLevelXP = calculateTotalXPForLevel(progress.level);
        const nextLevelXP = calculateTotalXPForLevel(progress.level + 1);
        const xpInCurrentLevel = progress.xp - currentLevelXP;
        const xpNeededForLevel = nextLevelXP - currentLevelXP;

        return Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);
      })
    );
  }

  /**
   * OBTENIR L'XP RESTANT POUR LE PROCHAIN NIVEAU
   * -------------------------------------------
   * Calcule combien d'XP il reste avant le level up.
   *
   * @returns Observable<number>
   */
  getXPToNextLevel(): Observable<number> {
    return this.progress$.pipe(
      map(progress => {
        if (!progress) return 0;

        const nextLevelXP = calculateTotalXPForLevel(progress.level + 1);
        return nextLevelXP - progress.xp;
      })
    );
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - MISE À JOUR DES STATS
  // ============================================================

  /**
   * INCRÉMENTER LES POMODOROS
   * ------------------------
   * Ajoute 1 au compteur de sessions Pomodoro.
   *
   * @returns Observable<Progress>
   */
  incrementPomodoros(): Observable<Progress> {
    return new Observable(observer => {
      const progress = this.progressSubject.value;

      if (!progress) {
        observer.error(new Error('Progression non initialisée'));
        return;
      }

      const updatedProgress = {
        ...progress,
        stats: {
          ...progress.stats,
          pomodoroSessions: progress.stats.pomodoroSessions + 1
        },
        updatedAt: new Date()
      };

      this.progressSubject.next(updatedProgress);
      this.saveProgress(updatedProgress);

      observer.next(updatedProgress);
      observer.complete();
    });
  }

  /**
   * AJOUTER DU TEMPS D'ÉTUDE
   * -----------------------
   * Ajoute des heures au compteur total.
   *
   * @param hours - Heures à ajouter
   * @returns Observable<Progress>
   */
  addStudyTime(hours: number): Observable<Progress> {
    return new Observable(observer => {
      const progress = this.progressSubject.value;

      if (!progress) {
        observer.error(new Error('Progression non initialisée'));
        return;
      }

      const updatedProgress = {
        ...progress,
        stats: {
          ...progress.stats,
          totalHours: progress.stats.totalHours + hours
        },
        updatedAt: new Date()
      };

      this.progressSubject.next(updatedProgress);
      this.saveProgress(updatedProgress);

      observer.next(updatedProgress);
      observer.complete();
    });
  }

  /**
   * METTRE À JOUR LA PROGRESSION D'UN SUJET
   * --------------------------------------
   * Met à jour le pourcentage de complétion d'un sujet.
   *
   * @param subject - Le sujet (boole, conditions, boucles, tableaux, java)
   * @param percentage - Nouveau pourcentage (0-100)
   * @returns Observable<Progress>
   */
  updateSubjectProgress(
    subject: 'boole' | 'conditions' | 'boucles' | 'tableaux' | 'java',
    percentage: number
  ): Observable<Progress> {
    return new Observable(observer => {
      const progress = this.progressSubject.value;

      if (!progress) {
        observer.error(new Error('Progression non initialisée'));
        return;
      }

      const updatedProgress = {
        ...progress,
        stats: {
          ...progress.stats,
          bySubject: {
            ...progress.stats.bySubject,
            [subject]: {
              ...progress.stats.bySubject[subject],
              percentage: Math.min(100, Math.max(0, percentage))
            }
          }
        },
        updatedAt: new Date()
      };

      this.progressSubject.next(updatedProgress);
      this.saveProgress(updatedProgress);

      // Vérifie les badges après mise à jour
      this.checkBadgeUnlocks();

      observer.next(updatedProgress);
      observer.complete();
    });
  }

  // ============================================================
  // MÉTHODES UTILITAIRES
  // ============================================================

  /**
   * RÉINITIALISER LA PROGRESSION
   * ---------------------------
   * ⚠️ ATTENTION : Supprime TOUTE la progression !
   *
   * Utilisé pour :
   * - Tests
   * - Reset volontaire de l'utilisateur
   * - Debug
   *
   * @returns Observable<void>
   */
  resetProgress(): Observable<void> {
    return new Observable(observer => {
      console.warn('⚠️ RESET : Réinitialisation de la progression !');

      const newProgress = createDefaultProgress();

      this.progressSubject.next(newProgress);
      this.saveProgress(newProgress);

      // Reset aussi les badges
      this.createDefaultBadges();

      observer.next();
      observer.complete();
    });
  }

  /**
   * EXPORTER LA PROGRESSION
   * ----------------------
   * Retourne toutes les données de progression pour export.
   *
   * @returns Observable<{ progress: Progress; badges: Badge[] }>
   */
  exportData(): Observable<{ progress: Progress | null; badges: Badge[] }> {
    return combineLatest([this.progress$, this.badges$]).pipe(
      take(1),
      map(([progress, badges]) => ({ progress, badges }))
    );
  }

  /**
   * IMPORTER LA PROGRESSION
   * ----------------------
   * Restaure la progression depuis un export.
   *
   * @param data - Données à importer
   * @returns Observable<void>
   */
  importData(data: { progress: Progress; badges: Badge[] }): Observable<void> {
    return new Observable(observer => {
      console.log('📥 Import des données de progression...');

      if (data.progress) {
        this.progressSubject.next(data.progress);
        this.saveProgress(data.progress);
      }

      if (data.badges) {
        this.badgesSubject.next(data.badges);
        this.saveBadges(data.badges);
      }

      console.log('✅ Import terminé !');

      observer.next();
      observer.complete();
    });
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un système de niveaux ?
 *
 *    Psychologie de la progression :
 *    Les humains sont motivés par le PROGRÈS VISIBLE.
 *
 *    "Level 5" est plus satisfaisant que "500 XP" car :
 *    - C'est un MILESTONE (étape franchie)
 *    - C'est comparable ("Je suis niveau 5, toi ?")
 *    - C'est un ACCOMPLISSEMENT (pas juste un nombre)
 *
 * 2. POURQUOI le streak est-il si important ?
 *
 *    Habit Loop (Charles Duhigg) :
 *    CUE → ROUTINE → REWARD
 *
 *    - CUE : "Je ne veux pas briser mon streak"
 *    - ROUTINE : Faire au moins un exercice
 *    - REWARD : "🔥 Streak maintenu !"
 *
 *    Après 21-66 jours, ça devient une HABITUDE.
 *
 * 3. POURQUOI des badges à plusieurs niveaux (bronze → platinum) ?
 *
 *    Progression à long terme :
 *    - Bronze = "J'ai commencé" (encouragement initial)
 *    - Silver = "Je progresse" (confirmation)
 *    - Gold = "Je maîtrise" (compétence)
 *    - Platinum = "Je suis expert" (excellence)
 *
 *    Chaque niveau donne un nouvel objectif à atteindre.
 *
 * 4. POURQUOI limiter l'historique XP à 100 entrées ?
 *
 *    Trade-off mémoire/utilité :
 *    - Trop de données = app lente + stockage saturé
 *    - Pas assez = impossible d'analyser les patterns
 *    - 100 entrées ≈ 2-4 semaines d'activité = sweet spot
 *
 * Citation de Mihaly Csikszentmihalyi (Flow) :
 * "The best moments in our lives are not the passive, receptive, relaxing times...
 *  The best moments usually occur if a person's body or mind is stretched to its limits
 *  in a voluntary effort to accomplish something difficult and worthwhile."
 *
 * Ce système crée ces "best moments" :
 * - Level up = accomplissement
 * - Badge débloqué = reconnaissance
 * - Streak maintenu = discipline récompensée
 *
 * L'apprentissage devient un JEU, et le jeu devient APPRENTISSAGE.
 */
