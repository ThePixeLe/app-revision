/**
 * difficulty.pipe.ts
 *
 * Pipe de formatage de la DIFFICULTÉ.
 *
 * Qu'est-ce que ce pipe fait ?
 * ---------------------------
 * Convertit un niveau de difficulté en représentation visuelle :
 * - Étoiles : ⭐⭐⭐
 * - Label : "Moyen"
 * - Couleur : code hexadécimal
 *
 * Utilisation :
 * ```html
 * <span>{{ exercise.difficulty | difficulty }}</span>
 * <!-- Affiche : ⭐⭐ -->
 *
 * <span>{{ exercise.difficulty | difficulty:'label' }}</span>
 * <!-- Affiche : "Moyen" -->
 *
 * <span [style.color]="exercise.difficulty | difficulty:'color'">
 *   {{ exercise.title }}
 * </span>
 * ```
 *
 * Philosophie David J. Malan :
 * "A picture is worth a thousand words."
 *
 * Les étoiles = une image instantanément compréhensible.
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Types de difficulté supportés
 */
type DifficultyLevel = 'facile' | 'moyen' | 'difficile' | 'expert' | number;

/**
 * Clés de configuration valides
 */
type DifficultyKey = 'facile' | 'moyen' | 'difficile' | 'expert';

/**
 * Format de sortie
 */
type DifficultyFormat = 'stars' | 'label' | 'color' | 'badge';

@Pipe({
  name: 'difficulty',
  standalone: true,
  pure: true
})
export class DifficultyPipe implements PipeTransform {

  /**
   * Configuration des niveaux de difficulté
   */
  private readonly config = {
    facile: { stars: 1, label: 'Facile', color: '#10b981', emoji: '🟢' },
    moyen: { stars: 2, label: 'Moyen', color: '#f59e0b', emoji: '🟡' },
    difficile: { stars: 3, label: 'Difficile', color: '#f97316', emoji: '🟠' },
    expert: { stars: 4, label: 'Expert', color: '#ef4444', emoji: '🔴' }
  };

  /**
   * Transforme une difficulté en format lisible
   * ------------------------------------------
   * @param value - Niveau de difficulté (string ou number 1-4)
   * @param format - Format de sortie
   * @returns Représentation formatée
   */
  transform(
    value: DifficultyLevel | null | undefined,
    format: DifficultyFormat = 'stars'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Normalise la valeur en clé de config
    const key = this.normalizeValue(value);
    const config = this.config[key];

    if (!config) {
      return '';
    }

    switch (format) {
      case 'stars':
        return '⭐'.repeat(config.stars);

      case 'label':
        return config.label;

      case 'color':
        return config.color;

      case 'badge':
        return `${config.emoji} ${config.label}`;

      default:
        return '⭐'.repeat(config.stars);
    }
  }

  /**
   * Normalise la valeur en clé de configuration
   * ------------------------------------------
   * Supporte :
   * - Strings : 'facile', 'moyen', 'difficile', 'expert'
   * - Numbers : 1, 2, 3, 4
   */
  private normalizeValue(value: DifficultyLevel): DifficultyKey {
    if (typeof value === 'number') {
      const mapping: { [key: number]: DifficultyKey } = {
        1: 'facile',
        2: 'moyen',
        3: 'difficile',
        4: 'expert'
      };
      return mapping[value] || 'facile';
    }

    // Vérifie que la valeur est une clé valide
    if (value in this.config) {
      return value as DifficultyKey;
    }

    return 'facile';
  }
}

/**
 * PIPE STARS GÉNÉRIQUE
 * --------------------
 * Affiche un nombre d'étoiles basé sur une valeur numérique.
 *
 * Utilisation :
 * ```html
 * <span>{{ score | stars:5 }}</span>
 * <!-- Si score = 3, affiche : ⭐⭐⭐☆☆ -->
 * ```
 */
@Pipe({
  name: 'stars',
  standalone: true,
  pure: true
})
export class StarsPipe implements PipeTransform {

  /**
   * Affiche des étoiles
   * ------------------
   * @param value - Nombre d'étoiles pleines
   * @param max - Nombre maximum d'étoiles (défaut: 5)
   * @param filled - Emoji étoile pleine (défaut: ⭐)
   * @param empty - Emoji étoile vide (défaut: ☆)
   * @returns Chaîne d'étoiles
   */
  transform(
    value: number | null | undefined,
    max: number = 5,
    filled: string = '⭐',
    empty: string = '☆'
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return empty.repeat(max);
    }

    // Clamp entre 0 et max
    const stars = Math.max(0, Math.min(max, Math.round(value)));
    const emptyStars = max - stars;

    return filled.repeat(stars) + empty.repeat(emptyStars);
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI des étoiles plutôt que des chiffres ?
 *
 *    RECONNAISSANCE VISUELLE :
 *    Le cerveau traite les images ~60,000x plus vite que le texte.
 *    ⭐⭐⭐ est compris instantanément.
 *    "Difficulté 3/4" nécessite une lecture.
 *
 * 2. POURQUOI des couleurs associées ?
 *
 *    SÉMANTIQUE DES COULEURS :
 *    - Vert = facile, feu vert, go !
 *    - Jaune = moyen, attention
 *    - Orange = difficile, avertissement
 *    - Rouge = expert, danger/défi
 *
 *    C'est universel (feux de signalisation).
 *
 * 3. POURQUOI supporter number ET string ?
 *
 *    FLEXIBILITÉ :
 *    - Les données peuvent venir d'une API avec des strings
 *    - Les calculs internes utilisent souvent des numbers
 *    - Le pipe s'adapte au lieu de forcer un format
 *
 * 4. POURQUOI un pipe séparé pour les étoiles génériques ?
 *
 *    RÉUTILISABILITÉ :
 *    - DifficultyPipe : Spécifique aux exercices
 *    - StarsPipe : Générique (notes, ratings, scores...)
 *
 *    Deux outils pour deux usages différents.
 */
