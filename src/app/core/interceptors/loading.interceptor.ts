/**
 * loading.interceptor.ts
 *
 * Intercepteur de gestion de l'état de CHARGEMENT global.
 *
 * Qu'est-ce que cet interceptor fait ?
 * -----------------------------------
 * Il gère automatiquement l'affichage d'un indicateur de chargement
 * (spinner, barre de progression, etc.) pendant les requêtes HTTP.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine un ascenseur avec un voyant "En mouvement" :
 * - Tu appuies sur le bouton → Le voyant s'allume
 * - L'ascenseur arrive → Le voyant s'éteint
 *
 * Cet interceptor fait pareil :
 * - Requête HTTP envoyée → Loading ON
 * - Réponse reçue → Loading OFF
 *
 * Gestion des requêtes multiples :
 * -------------------------------
 * Si 3 requêtes sont en cours simultanément :
 * - Requête 1 commence → Loading ON
 * - Requête 2 commence → Toujours ON (compteur = 2)
 * - Requête 3 commence → Toujours ON (compteur = 3)
 * - Requête 1 termine → Toujours ON (compteur = 2)
 * - Requête 2 termine → Toujours ON (compteur = 1)
 * - Requête 3 termine → Loading OFF (compteur = 0)
 *
 * Le loading ne s'éteint que quand TOUTES les requêtes sont terminées.
 *
 * Note pour cette app :
 * --------------------
 * Cette app utilise principalement IndexedDB (local),
 * donc peu de requêtes HTTP longues. Mais le service de loading
 * peut aussi être utilisé manuellement pour d'autres opérations.
 *
 * Philosophie David J. Malan :
 * "Always show progress to the user."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';

// ============================================================
// SERVICE DE LOADING
// ============================================================

/**
 * SERVICE LOADING
 * ---------------
 * Gère l'état de chargement global de l'application.
 *
 * Utilisation dans un composant :
 * ```typescript
 * constructor(public loadingService: LoadingService) {}
 *
 * // Dans le template :
 * <div *ngIf="loadingService.loading$ | async" class="spinner"></div>
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  /**
   * Compteur de requêtes en cours
   * ----------------------------
   * Incrémenté à chaque requête, décrémenté à chaque réponse.
   */
  private loadingCount = 0;

  /**
   * BehaviorSubject pour l'état de loading
   * -------------------------------------
   * - true : Au moins une requête en cours
   * - false : Aucune requête en cours
   */
  private loadingSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable public de l'état de loading
   */
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Message de chargement optionnel
   * -------------------------------
   * Permet d'afficher un message spécifique.
   */
  private messageSubject = new BehaviorSubject<string>('Chargement...');
  public message$ = this.messageSubject.asObservable();

  /**
   * Démarre le loading
   * -----------------
   * @param message - Message optionnel à afficher
   */
  show(message: string = 'Chargement...'): void {
    this.loadingCount++;
    this.messageSubject.next(message);

    if (this.loadingCount === 1) {
      // Première requête, active le loading
      this.loadingSubject.next(true);
    }
  }

  /**
   * Arrête le loading
   * ----------------
   */
  hide(): void {
    this.loadingCount--;

    if (this.loadingCount <= 0) {
      // Plus de requêtes en cours
      this.loadingCount = 0; // Sécurité anti-négatif
      this.loadingSubject.next(false);
    }
  }

  /**
   * Force l'arrêt du loading
   * -----------------------
   * Remet le compteur à zéro et désactive le loading.
   * Utile en cas d'erreur ou de navigation.
   */
  forceHide(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Retourne l'état actuel
   * ---------------------
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

// ============================================================
// INTERCEPTEUR DE LOADING
// ============================================================

/**
 * INTERCEPTEUR LOADING
 * --------------------
 * Active/désactive automatiquement le loading
 * pour chaque requête HTTP.
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loadingService: LoadingService) {}

  /**
   * Intercepte les requêtes HTTP
   * ---------------------------
   * @param request - Requête sortante
   * @param next - Handler pour passer au prochain interceptor
   * @returns Observable de la réponse
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    // Vérifie si cette requête doit déclencher le loading
    // Certaines requêtes "silencieuses" peuvent être exclues
    const skipLoading = request.headers.has('X-Skip-Loading');

    if (!skipLoading) {
      // Active le loading
      this.loadingService.show();
    }

    return next.handle(request).pipe(
      // finalize s'exécute que la requête réussisse ou échoue
      finalize(() => {
        if (!skipLoading) {
          this.loadingService.hide();
        }
      })
    );
  }
}

/**
 * Provider pour enregistrer l'intercepteur
 * ----------------------------------------
 * À ajouter dans app.config.ts avec errorInterceptorProvider
 */
export const loadingInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: LoadingInterceptor,
  multi: true
};

// ============================================================
// DÉCORATEUR POUR LE LOADING MANUEL
// ============================================================

/**
 * DÉCORATEUR @WithLoading()
 * -------------------------
 * Ajoute automatiquement le loading à une méthode async.
 *
 * @param message - Message à afficher pendant le chargement
 *
 * @example
 * ```typescript
 * @WithLoading('Sauvegarde en cours...')
 * async saveData(): Promise<void> {
 *   await this.api.save(this.data);
 * }
 * ```
 *
 * Note: Nécessite l'injection de LoadingService dans la classe.
 */
export function WithLoading(message: string = 'Chargement...') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Récupère le LoadingService (doit être injecté dans la classe)
      const loadingService: LoadingService = (this as any).loadingService;

      if (loadingService) {
        loadingService.show(message);
      }

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        if (loadingService) {
          loadingService.hide();
        }
      }
    };

    return descriptor;
  };
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI montrer un indicateur de chargement ?
 *
 *    FEEDBACK UTILISATEUR :
 *    Les études UX montrent que :
 *    - Sans feedback → L'utilisateur pense que l'app est cassée
 *    - Avec spinner → L'utilisateur sait que ça charge
 *    - Avec barre de progression → Encore mieux (donne une idée du temps)
 *
 *    Règle des 100ms/1s/10s (Jakob Nielsen) :
 *    - < 100ms : Réponse instantanée, pas besoin de feedback
 *    - 100ms - 1s : L'utilisateur remarque le délai
 *    - 1s - 10s : Montrer un indicateur de progression
 *    - > 10s : Donner des détails sur ce qui se passe
 *
 * 2. POURQUOI un compteur de requêtes ?
 *
 *    REQUÊTES CONCURRENTES :
 *    Une page peut lancer plusieurs requêtes en parallèle.
 *
 *    Sans compteur :
 *    - Req 1 démarre → Loading ON
 *    - Req 2 démarre → (déjà ON)
 *    - Req 1 termine → Loading OFF ❌ (mais Req 2 est toujours en cours !)
 *
 *    Avec compteur :
 *    - Req 1 démarre → count=1, ON
 *    - Req 2 démarre → count=2, ON
 *    - Req 1 termine → count=1, ON (car >0)
 *    - Req 2 termine → count=0, OFF ✅
 *
 * 3. POURQUOI le header X-Skip-Loading ?
 *
 *    REQUÊTES SILENCIEUSES :
 *    Certaines requêtes ne doivent pas montrer de loading :
 *    - Polling en arrière-plan
 *    - Analytics
 *    - Préchargement
 *
 *    Le header permet de les exclure explicitement.
 *
 * 4. POURQUOI finalize() plutôt que dans subscribe() ?
 *
 *    GARANTIE D'EXÉCUTION :
 *    finalize() s'exécute TOUJOURS, que l'Observable :
 *    - Complète avec succès
 *    - Émette une erreur
 *    - Soit unsubscribed
 *
 *    C'est l'équivalent de finally {} en try/catch.
 *
 * Citation de Alan Kay :
 * "Simple things should be simple,
 *  complex things should be possible."
 *
 * Le loading automatique = simple par défaut, personnalisable si besoin.
 */
