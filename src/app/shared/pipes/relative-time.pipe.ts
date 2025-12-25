/**
 * relative-time.pipe.ts
 *
 * Pipe de formatage du temps RELATIF.
 *
 * Qu'est-ce que ce pipe fait ?
 * ---------------------------
 * Convertit une date en temps relatif lisible :
 * - "Il y a 5 minutes"
 * - "Hier"
 * - "Il y a 3 jours"
 *
 * Analogie du monde réel :
 * -----------------------
 * Quand quelqu'un te demande "C'était quand ?",
 * tu ne réponds pas "Le 24/12/2024 à 14:35:22".
 * Tu dis "Il y a 2 heures" ou "Hier soir".
 *
 * Ce pipe fait pareil : il humanise les dates.
 *
 * Utilisation :
 * ```html
 * <span>{{ lastActivity | relativeTime }}</span>
 * <!-- Affiche : "Il y a 5 minutes" -->
 * ```
 *
 * Philosophie David J. Malan :
 * "Design for humans, not for computers."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: true
})
export class RelativeTimePipe implements PipeTransform {

  /**
   * Transforme une date en temps relatif
   * -----------------------------------
   * @param value - Date à transformer (Date, string, ou timestamp)
   * @returns Temps relatif en français
   *
   * Exemples :
   * - Il y a 30 secondes → "À l'instant"
   * - Il y a 5 minutes → "Il y a 5 minutes"
   * - Il y a 2 heures → "Il y a 2 heures"
   * - Hier → "Hier"
   * - Il y a 3 jours → "Il y a 3 jours"
   * - Il y a 2 semaines → "Il y a 2 semaines"
   * - Plus ancien → Date formatée
   */
  transform(value: Date | string | number | null | undefined): string {
    if (!value) {
      return 'Jamais';
    }

    // Convertit en objet Date
    const date = this.toDate(value);
    if (!date) {
      return 'Date invalide';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);

    // Futur (date dans le futur)
    if (diffMs < 0) {
      return this.formatFuture(date, -diffDay);
    }

    // Passé
    if (diffSec < 60) {
      return 'À l\'instant';
    }

    if (diffMin < 60) {
      return diffMin === 1 ? 'Il y a 1 minute' : `Il y a ${diffMin} minutes`;
    }

    if (diffHour < 24) {
      return diffHour === 1 ? 'Il y a 1 heure' : `Il y a ${diffHour} heures`;
    }

    if (diffDay === 1) {
      return 'Hier';
    }

    if (diffDay < 7) {
      return `Il y a ${diffDay} jours`;
    }

    if (diffWeek < 4) {
      return diffWeek === 1 ? 'Il y a 1 semaine' : `Il y a ${diffWeek} semaines`;
    }

    if (diffMonth < 12) {
      return diffMonth === 1 ? 'Il y a 1 mois' : `Il y a ${diffMonth} mois`;
    }

    // Plus d'un an : affiche la date
    return this.formatDate(date);
  }

  /**
   * Convertit une valeur en Date
   */
  private toDate(value: Date | string | number): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      return new Date(value);
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  /**
   * Formate une date future
   */
  private formatFuture(date: Date, daysFromNow: number): string {
    if (daysFromNow === 0) {
      return 'Aujourd\'hui';
    }
    if (daysFromNow === 1) {
      return 'Demain';
    }
    if (daysFromNow < 7) {
      return `Dans ${daysFromNow} jours`;
    }
    return this.formatDate(date);
  }

  /**
   * Formate une date de manière standard
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI le temps relatif plutôt que la date absolue ?
 *
 *    COGNITION HUMAINE :
 *    Notre cerveau comprend mieux le RELATIF que l'ABSOLU.
 *
 *    "Il y a 5 minutes" → Immédiatement compréhensible
 *    "24/12/2024 14:30" → Nécessite un calcul mental
 *
 * 2. POURQUOI "À l'instant" plutôt que "Il y a 0 secondes" ?
 *
 *    NATUREL :
 *    Personne ne dit "Il y a 23 secondes" dans la vie réelle.
 *    "À l'instant" est plus naturel et moins précis (ce qui est OK).
 *
 * 3. POURQUOI basculer vers la date après un certain temps ?
 *
 *    PRÉCISION :
 *    - "Il y a 2 heures" → Utile et précis
 *    - "Il y a 47 jours" → Moins utile, autant donner la date
 *
 *    Le seuil est subjectif, ici on bascule après ~1 mois.
 *
 * 4. POURQUOI gérer le futur ?
 *
 *    ROBUSTESSE :
 *    Une date de "prochaine révision" peut être dans le futur.
 *    Au lieu de crasher ou d'afficher "-5 jours", on gère le cas.
 */
