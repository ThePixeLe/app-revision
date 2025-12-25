/**
 * error.interceptor.ts
 *
 * Intercepteur de gestion des ERREURS HTTP globales.
 *
 * Qu'est-ce qu'un Interceptor ?
 * ----------------------------
 * Un interceptor est comme un "filtre" sur toutes les requêtes HTTP.
 * Il peut modifier les requêtes AVANT qu'elles partent
 * et les réponses AVANT qu'elles arrivent au code.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine un service de courrier avec un contrôle qualité :
 * - Chaque lettre envoyée passe par le contrôle
 * - Chaque lettre reçue aussi
 *
 * L'interceptor fait pareil pour les requêtes HTTP :
 * - Requête sortante → Peut ajouter des headers, logger, etc.
 * - Réponse entrante → Peut gérer les erreurs, transformer les données, etc.
 *
 * Cet interceptor spécifiquement :
 * -------------------------------
 * Gère les ERREURS de manière centralisée :
 * - Erreurs réseau (pas de connexion)
 * - Erreurs serveur (500, 503...)
 * - Erreurs client (400, 401, 403, 404...)
 *
 * Avantage :
 * Au lieu de gérer les erreurs dans CHAQUE service,
 * on les gère UNE FOIS ici.
 *
 * Note pour cette app :
 * --------------------
 * Cette app utilise principalement IndexedDB (local),
 * donc peu de requêtes HTTP. Mais cet interceptor est prêt
 * pour une future API backend.
 *
 * Philosophie David J. Malan :
 * "Fail gracefully."
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
  HttpErrorResponse,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

/**
 * Interface pour une erreur applicative
 * -------------------------------------
 * Structure standardisée pour les erreurs.
 */
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  retryable: boolean;
}

/**
 * INTERCEPTEUR D'ERREURS
 * ----------------------
 * Capture et traite toutes les erreurs HTTP.
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  /**
   * Intercepte les requêtes HTTP
   * ---------------------------
   * @param request - Requête sortante
   * @param next - Handler pour passer au prochain interceptor
   * @returns Observable de la réponse (ou erreur)
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      // Retry automatique pour les erreurs transitoires
      // (erreur réseau, serveur temporairement indisponible)
      retry({
        count: 2,
        delay: 1000,
        resetOnSuccess: true
      }),

      // Gestion des erreurs
      catchError((error: HttpErrorResponse) => {
        const appError = this.handleError(error);
        return throwError(() => appError);
      })
    );
  }

  /**
   * Traite une erreur HTTP
   * ---------------------
   * Convertit l'erreur HTTP en erreur applicative standardisée.
   *
   * @param error - Erreur HTTP reçue
   * @returns Erreur applicative formatée
   */
  private handleError(error: HttpErrorResponse): AppError {
    let appError: AppError;

    if (error.error instanceof ErrorEvent) {
      // ============================================================
      // ERREUR CÔTÉ CLIENT (réseau, JavaScript, etc.)
      // ============================================================
      appError = {
        code: 'CLIENT_ERROR',
        message: 'Une erreur est survenue',
        details: error.error.message,
        timestamp: new Date(),
        retryable: true
      };

      console.error('❌ Erreur client:', error.error.message);

    } else {
      // ============================================================
      // ERREUR CÔTÉ SERVEUR (HTTP status codes)
      // ============================================================
      appError = this.mapHttpError(error);

      console.error(
        `❌ Erreur serveur: ${error.status} ${error.statusText}`,
        error.error
      );
    }

    // Log pour debug (à remplacer par un vrai service de logging en prod)
    this.logError(appError, error);

    return appError;
  }

  /**
   * Mappe un code HTTP vers une erreur applicative
   * ----------------------------------------------
   * Chaque code HTTP a une signification et un message adapté.
   *
   * @param error - Erreur HTTP
   * @returns Erreur applicative
   */
  private mapHttpError(error: HttpErrorResponse): AppError {
    const baseError: AppError = {
      code: `HTTP_${error.status}`,
      message: 'Erreur inconnue',
      details: error.message,
      timestamp: new Date(),
      retryable: false
    };

    switch (error.status) {
      // ===== ERREURS CLIENT (4xx) =====

      case 400:
        // Bad Request - Requête malformée
        return {
          ...baseError,
          code: 'BAD_REQUEST',
          message: 'Requête invalide',
          details: 'Les données envoyées sont incorrectes.',
          retryable: false
        };

      case 401:
        // Unauthorized - Non authentifié
        return {
          ...baseError,
          code: 'UNAUTHORIZED',
          message: 'Non autorisé',
          details: 'Tu dois te connecter pour accéder à cette ressource.',
          retryable: false
        };

      case 403:
        // Forbidden - Pas les droits
        return {
          ...baseError,
          code: 'FORBIDDEN',
          message: 'Accès refusé',
          details: 'Tu n\'as pas les droits pour accéder à cette ressource.',
          retryable: false
        };

      case 404:
        // Not Found - Ressource inexistante
        return {
          ...baseError,
          code: 'NOT_FOUND',
          message: 'Ressource non trouvée',
          details: 'La ressource demandée n\'existe pas.',
          retryable: false
        };

      case 408:
        // Request Timeout
        return {
          ...baseError,
          code: 'TIMEOUT',
          message: 'Délai dépassé',
          details: 'Le serveur a mis trop de temps à répondre.',
          retryable: true
        };

      case 429:
        // Too Many Requests - Rate limiting
        return {
          ...baseError,
          code: 'RATE_LIMITED',
          message: 'Trop de requêtes',
          details: 'Patiente quelques instants avant de réessayer.',
          retryable: true
        };

      // ===== ERREURS SERVEUR (5xx) =====

      case 500:
        // Internal Server Error
        return {
          ...baseError,
          code: 'SERVER_ERROR',
          message: 'Erreur serveur',
          details: 'Le serveur a rencontré une erreur. Réessaie plus tard.',
          retryable: true
        };

      case 502:
        // Bad Gateway
        return {
          ...baseError,
          code: 'BAD_GATEWAY',
          message: 'Service temporairement indisponible',
          details: 'Le serveur est en maintenance ou surchargé.',
          retryable: true
        };

      case 503:
        // Service Unavailable
        return {
          ...baseError,
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service indisponible',
          details: 'Le service est temporairement hors ligne.',
          retryable: true
        };

      case 504:
        // Gateway Timeout
        return {
          ...baseError,
          code: 'GATEWAY_TIMEOUT',
          message: 'Délai dépassé',
          details: 'Le serveur n\'a pas répondu à temps.',
          retryable: true
        };

      // ===== ERREUR RÉSEAU (status 0) =====

      case 0:
        return {
          ...baseError,
          code: 'NETWORK_ERROR',
          message: 'Erreur de connexion',
          details: 'Vérifie ta connexion internet.',
          retryable: true
        };

      default:
        return baseError;
    }
  }

  /**
   * Log une erreur (pour debug/monitoring)
   * -------------------------------------
   * En production, ça enverrait à un service comme Sentry.
   *
   * @param appError - Erreur applicative
   * @param httpError - Erreur HTTP originale
   */
  private logError(appError: AppError, httpError: HttpErrorResponse): void {
    // Structure de log
    const logEntry = {
      timestamp: appError.timestamp.toISOString(),
      code: appError.code,
      message: appError.message,
      url: httpError.url,
      status: httpError.status,
      details: appError.details
    };

    // En dev, on affiche dans la console
    console.group('🔴 Error Log');
    console.table(logEntry);
    console.groupEnd();

    // TODO: En prod, envoyer à un service de monitoring
    // this.loggingService.logError(logEntry);
  }
}

/**
 * Provider pour enregistrer l'intercepteur
 * ----------------------------------------
 * À ajouter dans app.config.ts :
 *
 * ```typescript
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { errorInterceptorProvider } from './core/interceptors/error.interceptor';
 *
 * export const appConfig = {
 *   providers: [
 *     provideHttpClient(),
 *     errorInterceptorProvider
 *   ]
 * };
 * ```
 */
export const errorInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: ErrorInterceptor,
  multi: true
};

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI centraliser la gestion des erreurs ?
 *
 *    DRY (Don't Repeat Yourself) :
 *    Sans intercepteur, tu écrirais ce code dans CHAQUE service :
 *
 *    ```typescript
 *    this.http.get('/api/data').pipe(
 *      catchError(error => {
 *        if (error.status === 404) { ... }
 *        if (error.status === 500) { ... }
 *        // etc.
 *      })
 *    );
 *    ```
 *
 *    Avec l'intercepteur, c'est géré UNE FOIS pour toutes les requêtes.
 *
 * 2. POURQUOI retry automatiquement ?
 *
 *    RÉSILIENCE :
 *    Certaines erreurs sont transitoires :
 *    - Perte de connexion WiFi pendant 2 secondes
 *    - Serveur qui redémarre
 *    - Pic de charge momentané
 *
 *    Réessayer 2 fois avec 1 seconde de délai résout 90% de ces cas
 *    SANS que l'utilisateur ne voie d'erreur.
 *
 * 3. POURQUOI des messages user-friendly ?
 *
 *    UX (User Experience) :
 *    - "HTTP 503" → Incompréhensible pour 99% des gens
 *    - "Service indisponible" → Clair et actionnable
 *
 *    Le code technique (HTTP_503) est gardé pour le debug,
 *    le message humain est pour l'utilisateur.
 *
 * 4. POURQUOI un flag "retryable" ?
 *
 *    UI INTELLIGENTE :
 *    Le frontend peut afficher :
 *    - Erreur retryable → Bouton "Réessayer"
 *    - Erreur non retryable → Message explicatif sans bouton
 *
 *    Ça évite que l'utilisateur clique 100 fois sur "Réessayer"
 *    pour une erreur 404 (qui ne marchera jamais).
 *
 * Citation de Grace Hopper :
 * "The most damaging phrase in the language is:
 *  'It's always been done that way.'"
 *
 * Les intercepteurs = nouvelle façon (meilleure) de gérer les erreurs.
 */
