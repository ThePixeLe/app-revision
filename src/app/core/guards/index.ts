/**
 * index.ts - Guards
 *
 * Point d'entrée pour tous les guards de l'application.
 *
 * Utilisation :
 * ```typescript
 * import {
 *   hasStartedGuard,
 *   minLevelGuard,
 *   dayAccessGuard
 * } from './core/guards';
 * ```
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

// Progress guards
export {
  hasStartedGuard,
  minLevelGuard,
  hasCompletedExercisesGuard
} from './progress.guard';

// Day access guards
export {
  dayAccessGuard,
  freeDayAccessGuard
} from './day-access.guard';
