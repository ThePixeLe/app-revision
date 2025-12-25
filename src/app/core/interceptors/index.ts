/**
 * index.ts - Interceptors
 *
 * Point d'entrée pour tous les intercepteurs HTTP.
 *
 * Utilisation dans app.config.ts :
 * ```typescript
 * import {
 *   errorInterceptorProvider,
 *   loadingInterceptorProvider,
 *   LoadingService
 * } from './core/interceptors';
 *
 * export const appConfig = {
 *   providers: [
 *     provideHttpClient(),
 *     errorInterceptorProvider,
 *     loadingInterceptorProvider
 *   ]
 * };
 * ```
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

// Error interceptor
export {
  ErrorInterceptor,
  errorInterceptorProvider,
  AppError
} from './error.interceptor';

// Loading interceptor & service
export {
  LoadingInterceptor,
  LoadingService,
  loadingInterceptorProvider,
  WithLoading
} from './loading.interceptor';
