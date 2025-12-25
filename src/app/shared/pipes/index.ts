/**
 * index.ts - Pipes
 *
 * Point d'entrée pour tous les pipes de l'application.
 *
 * Utilisation :
 * ```typescript
 * import { TimeFormatPipe, RelativeTimePipe, DifficultyPipe } from './shared/pipes';
 * ```
 *
 * Dans un composant standalone :
 * ```typescript
 * @Component({
 *   imports: [TimeFormatPipe, DifficultyPipe]
 * })
 * ```
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

// Time formatting
export { TimeFormatPipe } from './time-format.pipe';

// Relative time
export { RelativeTimePipe } from './relative-time.pipe';

// Difficulty formatting
export { DifficultyPipe, StarsPipe } from './difficulty.pipe';
