/**
 * index.ts - Directives
 *
 * Point d'entrée pour toutes les directives de l'application.
 *
 * Utilisation :
 * ```typescript
 * import { AutoFocusDirective, ClickOutsideDirective, TooltipDirective } from './shared/directives';
 * ```
 *
 * Dans un composant standalone :
 * ```typescript
 * @Component({
 *   imports: [AutoFocusDirective, TooltipDirective]
 * })
 * ```
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

// Auto focus
export { AutoFocusDirective } from './auto-focus.directive';

// Click outside detection
export { ClickOutsideDirective } from './click-outside.directive';

// Tooltip
export { TooltipDirective } from './tooltip.directive';
