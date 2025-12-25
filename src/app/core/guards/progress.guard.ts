/**
 * progress.guard.ts
 *
 * Guard de vérification de la PROGRESSION utilisateur.
 *
 * Qu'est-ce qu'un Guard ?
 * ----------------------
 * Un guard est comme un "vigile" devant une porte.
 * Avant de laisser entrer quelqu'un, il vérifie certaines conditions.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine un parc d'attractions avec des attractions à restrictions :
 * - "Taille minimum 1m40" → Tu ne peux pas monter si tu es trop petit
 * - "Réservé aux VIP" → Tu dois avoir le bon pass
 *
 * Ce guard vérifie que l'utilisateur a fait un minimum de progression
 * avant d'accéder à certaines fonctionnalités.
 *
 * Utilisations possibles :
 * -----------------------
 * 1. Vérifier si c'est la première visite (onboarding)
 * 2. Débloquer des fonctionnalités selon le niveau
 * 3. Afficher un message d'encouragement si peu de progression
 *
 * Angular 17+ :
 * ------------
 * Les guards sont maintenant des FONCTIONS (functional guards)
 * au lieu de classes avec canActivate().
 *
 * C'est plus simple et plus léger !
 *
 * Philosophie David J. Malan :
 * "Good fences make good neighbors."
 *
 * Les guards = "good fences" qui protègent certaines routes.
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { ProgressService } from '../services/progress.service';

/**
 * GUARD : Vérifie si l'utilisateur a commencé
 * ------------------------------------------
 * Utilisé pour rediriger les nouveaux utilisateurs vers un onboarding
 * ou pour afficher un message de bienvenue.
 *
 * Retourne :
 * - true : L'utilisateur peut accéder à la route
 * - false : L'utilisateur est redirigé
 *
 * @example
 * ```typescript
 * {
 *   path: 'advanced-stats',
 *   loadComponent: () => import('./stats.component'),
 *   canActivate: [hasStartedGuard]
 * }
 * ```
 */
export const hasStartedGuard: CanActivateFn = (route, state) => {
  const progressService = inject(ProgressService);
  const router = inject(Router);

  return progressService.progress$.pipe(
    take(1),
    map(progress => {
      // Vérifie si l'utilisateur a fait au moins une action
      if (progress && progress.totalXP > 0) {
        return true;
      }

      // Sinon, redirige vers le dashboard avec un message
      console.log('🚫 Guard: Utilisateur sans progression, redirection...');
      router.navigate(['/dashboard'], {
        queryParams: { welcome: 'true' }
      });
      return false;
    })
  );
};

/**
 * GUARD : Vérifie le niveau minimum
 * ---------------------------------
 * Empêche l'accès aux fonctionnalités avancées
 * tant que l'utilisateur n'a pas atteint un certain niveau.
 *
 * Configuration via route.data.minLevel
 *
 * @example
 * ```typescript
 * {
 *   path: 'advanced',
 *   loadComponent: () => import('./advanced.component'),
 *   canActivate: [minLevelGuard],
 *   data: { minLevel: 5 }
 * }
 * ```
 */
export const minLevelGuard: CanActivateFn = (route, state) => {
  const progressService = inject(ProgressService);
  const router = inject(Router);

  // Récupère le niveau minimum requis depuis les data de la route
  const minLevel = route.data?.['minLevel'] || 1;

  return progressService.progress$.pipe(
    take(1),
    map(progress => {
      const currentLevel = progress?.level || 1;

      if (currentLevel >= minLevel) {
        return true;
      }

      // Niveau insuffisant
      console.log(`🚫 Guard: Niveau ${currentLevel} < ${minLevel} requis`);
      router.navigate(['/profile'], {
        queryParams: {
          message: `Niveau ${minLevel} requis pour accéder à cette fonctionnalité`
        }
      });
      return false;
    })
  );
};

/**
 * GUARD : Vérifie qu'au moins un exercice est terminé
 * ---------------------------------------------------
 * Utile pour débloquer la page de révision.
 *
 * @example
 * ```typescript
 * {
 *   path: 'revision',
 *   loadComponent: () => import('./revision.component'),
 *   canActivate: [hasCompletedExercisesGuard]
 * }
 * ```
 */
export const hasCompletedExercisesGuard: CanActivateFn = (route, state) => {
  const progressService = inject(ProgressService);
  const router = inject(Router);

  return progressService.progress$.pipe(
    take(1),
    map(progress => {
      // Récupère le nombre d'exercices complétés depuis les stats
      const completedExercises = progress?.stats?.exercisesCompleted || 0;

      if (completedExercises > 0) {
        return true;
      }

      // Pas d'exercices terminés
      console.log('🚫 Guard: Aucun exercice terminé');
      router.navigate(['/exercises'], {
        queryParams: {
          message: 'Termine au moins un exercice pour accéder aux révisions'
        }
      });
      return false;
    })
  );
};

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI des guards fonctionnels ?
 *
 *    Angular 14+ a introduit les functional guards.
 *    Au lieu de :
 *
 *    @Injectable()
 *    export class MyGuard implements CanActivate {
 *      canActivate() { ... }
 *    }
 *
 *    On écrit simplement :
 *
 *    export const myGuard: CanActivateFn = () => { ... }
 *
 *    Avantages :
 *    - Moins de code
 *    - Plus facile à tester
 *    - Injection de dépendances avec inject()
 *
 * 2. POURQUOI take(1) ?
 *
 *    Les Observables peuvent émettre plusieurs valeurs.
 *    Un guard doit retourner UNE seule décision.
 *
 *    take(1) prend la première valeur et complète l'Observable.
 *    Sans ça, le guard resterait "en attente" indéfiniment.
 *
 * 3. POURQUOI rediriger plutôt que bloquer ?
 *
 *    User Experience (UX) :
 *    - Bloquer sans explication = frustration
 *    - Rediriger avec message = compréhension
 *
 *    L'utilisateur comprend POURQUOI il ne peut pas accéder
 *    et COMMENT débloquer la fonctionnalité.
 *
 * 4. POURQUOI des guards séparés ?
 *
 *    Single Responsibility Principle (SRP) :
 *    - hasStartedGuard → Vérifie le démarrage
 *    - minLevelGuard → Vérifie le niveau
 *    - hasCompletedExercisesGuard → Vérifie les exercices
 *
 *    On peut combiner les guards sur une route :
 *    canActivate: [hasStartedGuard, minLevelGuard]
 *
 *    Tous doivent retourner true pour accéder.
 *
 * Citation de Martin Fowler :
 * "Any fool can write code that a computer can understand.
 *  Good programmers write code that humans can understand."
 *
 * Des guards bien nommés = code auto-documenté.
 */
