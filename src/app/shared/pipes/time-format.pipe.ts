/**
 * time-format.pipe.ts
 *
 * Pipe de formatage du TEMPS.
 *
 * Qu'est-ce qu'un Pipe ?
 * ---------------------
 * Un pipe transforme une valeur dans le template.
 * C'est comme un "filtre" qui modifie l'affichage SANS modifier les données.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine une paire de lunettes de soleil :
 * - Le paysage ne change pas
 * - Mais tu le VOIS différemment
 *
 * Un pipe fait pareil avec les données :
 * - La valeur (300 secondes) ne change pas
 * - Mais elle est AFFICHÉE différemment ("05:00")
 *
 * Ce pipe spécifiquement :
 * -----------------------
 * Convertit des secondes en format lisible :
 * - 65 → "01:05"
 * - 3665 → "01:01:05"
 *
 * Utilisation :
 * ```html
 * <span>{{ elapsedTime | timeFormat }}</span>
 * <span>{{ elapsedTime | timeFormat:'long' }}</span>
 * ```
 *
 * Philosophie David J. Malan :
 * "Make the computer do the hard work."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Format de sortie
 * ---------------
 * - 'short' : MM:SS (par défaut)
 * - 'long' : HH:MM:SS
 * - 'verbose' : "5 min 30 sec"
 */
type TimeFormatType = 'short' | 'long' | 'verbose';

@Pipe({
  name: 'timeFormat',
  standalone: true,
  pure: true  // Pure = recalculé seulement si l'input change
})
export class TimeFormatPipe implements PipeTransform {

  /**
   * Transforme des secondes en format temps lisible
   * -----------------------------------------------
   * @param seconds - Nombre de secondes
   * @param format - Format de sortie ('short', 'long', 'verbose')
   * @returns Temps formaté
   *
   * Exemples :
   * - transform(65) → "01:05"
   * - transform(65, 'long') → "00:01:05"
   * - transform(65, 'verbose') → "1 min 5 sec"
   * - transform(3665, 'verbose') → "1 h 1 min 5 sec"
   */
  transform(seconds: number | null | undefined, format: TimeFormatType = 'short'): string {
    // Gestion des valeurs nulles/undefined
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return format === 'verbose' ? '0 sec' : '00:00';
    }

    // Assure que c'est un entier positif
    seconds = Math.max(0, Math.floor(seconds));

    // Calcul des heures, minutes, secondes
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    switch (format) {
      case 'long':
        return this.formatLong(hours, minutes, secs);

      case 'verbose':
        return this.formatVerbose(hours, minutes, secs);

      case 'short':
      default:
        return this.formatShort(hours, minutes, secs);
    }
  }

  /**
   * Format court : MM:SS ou HH:MM:SS si > 1h
   */
  private formatShort(hours: number, minutes: number, secs: number): string {
    const mm = minutes.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');

    if (hours > 0) {
      const hh = hours.toString().padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }

    return `${mm}:${ss}`;
  }

  /**
   * Format long : HH:MM:SS toujours
   */
  private formatLong(hours: number, minutes: number, secs: number): string {
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  }

  /**
   * Format verbeux : "X h Y min Z sec"
   */
  private formatVerbose(hours: number, minutes: number, secs: number): string {
    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`);
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs} sec`);
    }

    return parts.join(' ');
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un pipe et pas une fonction dans le composant ?
 *
 *    RÉUTILISABILITÉ :
 *    - Fonction dans un composant → Utilisable dans CE composant seulement
 *    - Pipe → Utilisable dans TOUS les templates de l'app
 *
 *    DRY (Don't Repeat Yourself) !
 *
 * 2. POURQUOI pure: true ?
 *
 *    PERFORMANCE :
 *    - Pure pipe → Recalculé SEULEMENT si l'input change
 *    - Impure pipe → Recalculé à CHAQUE cycle de détection de changement
 *
 *    Pour un formatage simple comme celui-ci, pure = optimal.
 *
 * 3. POURQUOI plusieurs formats ?
 *
 *    CONTEXTE D'UTILISATION :
 *    - Timer en cours → Format court (05:23)
 *    - Historique → Format verbeux (5 min 23 sec)
 *    - Export de données → Format long (00:05:23)
 *
 *    Un seul pipe, plusieurs cas d'usage.
 *
 * 4. POURQUOI padStart(2, '0') ?
 *
 *    LISIBILITÉ :
 *    - Sans padding : "5:3" → Ambigu (5h03 ou 0h05:03 ?)
 *    - Avec padding : "05:03" → Clair et standard
 *
 *    C'est le format universel des chronomètres.
 */
