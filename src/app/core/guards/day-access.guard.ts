/**
 * day-access.guard.ts
 *
 * Guard de contrôle d'accès aux JOURNÉES du planning.
 *
 * Qu'est-ce que ce guard ?
 * -----------------------
 * Il vérifie si l'utilisateur peut accéder à une journée spécifique
 * du planning de 12 jours.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine un jeu vidéo avec des niveaux :
 * - Niveau 1 : Toujours accessible
 * - Niveau 2 : Débloqué après avoir terminé le niveau 1
 * - Niveau 3 : Débloqué après avoir terminé le niveau 2
 * - etc.
 *
 * Ce guard implémente la même logique pour les 12 jours du programme.
 *
 * Règles d'accès :
 * ---------------
 * - Jour 1 : Toujours accessible (point de départ)
 * - Jour N : Accessible si Jour N-1 est complété à au moins 50%
 *
 * Pourquoi 50% et pas 100% ?
 * -------------------------
 * - Flexibilité : On peut avancer même avec quelques exercices non faits
 * - Motivation : Évite le blocage complet
 * - Réalisme : En vrai, on n'attend pas toujours 100% avant de continuer
 *
 * Philosophie David J. Malan :
 * "Progress, not perfection."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { PlanningService } from '../services/planning.service';

/**
 * GUARD : Vérifie l'accès à une journée
 * -------------------------------------
 * Contrôle que l'utilisateur peut accéder au jour demandé.
 *
 * Le numéro du jour est extrait de l'URL (/planning/day-3 → jour 3)
 *
 * @example
 * ```typescript
 * {
 *   path: 'planning/:dayId',
 *   loadComponent: () => import('./day-detail.component'),
 *   canActivate: [dayAccessGuard]
 * }
 * ```
 */
export const dayAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state
) => {
  const planningService = inject(PlanningService);
  const router = inject(Router);

  // Récupère le dayId depuis les paramètres de l'URL
  const dayId = route.paramMap.get('dayId');

  if (!dayId) {
    console.log('🚫 Guard: Pas de dayId dans l\'URL');
    router.navigate(['/planning']);
    return false;
  }

  // Extrait le numéro du jour (ex: "day-3" → 3)
  const dayNumber = extractDayNumber(dayId);

  if (dayNumber === null) {
    console.log('🚫 Guard: Format de dayId invalide:', dayId);
    router.navigate(['/planning']);
    return false;
  }

  // Jour 1 toujours accessible
  if (dayNumber === 1) {
    return true;
  }

  // Vérifie si le jour précédent est suffisamment complété
  return planningService.days$.pipe(
    take(1),
    map(days => {
      // Trouve le jour précédent
      const previousDay = days.find(d => d.dayNumber === dayNumber - 1);

      if (!previousDay) {
        // Jour précédent non trouvé, on autorise quand même
        console.log(`⚠️ Guard: Jour ${dayNumber - 1} non trouvé, accès autorisé`);
        return true;
      }

      // Calcule le pourcentage de complétion du jour précédent
      const completionPercentage = calculateDayCompletion(previousDay);

      if (completionPercentage >= 50) {
        console.log(`✅ Guard: Jour ${dayNumber - 1} complété à ${completionPercentage}%, accès autorisé`);
        return true;
      }

      // Accès refusé
      console.log(`🚫 Guard: Jour ${dayNumber - 1} complété à ${completionPercentage}% < 50%`);
      router.navigate(['/planning'], {
        queryParams: {
          blocked: dayNumber,
          message: `Complete le Jour ${dayNumber - 1} à au moins 50% pour débloquer le Jour ${dayNumber}`
        }
      });
      return false;
    })
  );
};

/**
 * GUARD : Mode libre (pas de restriction)
 * ---------------------------------------
 * Alternative au dayAccessGuard qui permet l'accès libre
 * à toutes les journées.
 *
 * Utile pour :
 * - Mode développement
 * - Utilisateurs avancés
 * - Révision libre
 *
 * @example
 * Dans settings, l'utilisateur peut activer le "mode libre"
 * qui utilise ce guard au lieu de dayAccessGuard.
 */
export const freeDayAccessGuard: CanActivateFn = (route, state) => {
  // Toujours autoriser
  return true;
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Extrait le numéro du jour depuis l'ID
 * -------------------------------------
 * @param dayId - ID du jour (ex: "day-3", "day-12")
 * @returns Numéro du jour (1-12) ou null si invalide
 *
 * Formats supportés :
 * - "day-1" → 1
 * - "day-12" → 12
 * - "3" → 3 (fallback)
 */
function extractDayNumber(dayId: string): number | null {
  // Format "day-N"
  const match = dayId.match(/^day-(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 12) {
      return num;
    }
  }

  // Fallback : essaie de parser directement
  const directNum = parseInt(dayId, 10);
  if (!isNaN(directNum) && directNum >= 1 && directNum <= 12) {
    return directNum;
  }

  return null;
}

/**
 * Calcule le pourcentage de complétion d'une journée
 * --------------------------------------------------
 * @param day - Objet Day
 * @returns Pourcentage de complétion (0-100)
 *
 * Critères de complétion :
 * - Sessions terminées
 * - Exercices complétés
 *
 * Formule : (sessions_done + exercises_done) / (total_sessions + total_exercises) * 100
 */
function calculateDayCompletion(day: any): number {
  // Si le jour est marqué comme terminé
  if (day.status === 'completed') {
    return 100;
  }

  // Compte les sessions terminées
  const totalSessions = day.sessions?.length || 0;
  const completedSessions = day.sessions?.filter((s: any) => s.completed)?.length || 0;

  // Compte les exercices terminés
  const totalExercises = day.exerciseIds?.length || 0;
  // Note: On n'a pas accès direct au statut des exercices ici
  // On suppose 0 pour simplifier (le vrai calcul serait dans le service)
  const completedExercises = 0;

  const total = totalSessions + totalExercises;
  if (total === 0) {
    return day.status === 'in-progress' ? 25 : 0;
  }

  const completed = completedSessions + completedExercises;
  return Math.round((completed / total) * 100);
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI débloquer progressivement ?
 *
 *    PSYCHOLOGIE DE L'APPRENTISSAGE :
 *    - Trop de contenu d'un coup → Paralysie par l'analyse
 *    - Progression guidée → Focus sur une chose à la fois
 *
 *    C'est le principe du "scaffolding" (échafaudage) :
 *    On construit une fondation avant d'ajouter des étages.
 *
 * 2. POURQUOI 50% et pas 100% ?
 *
 *    ÉQUILIBRE :
 *    - 100% requis → Trop strict, frustration si blocage sur un exercice
 *    - 0% requis → Pas de structure, risque de sauter des bases
 *    - 50% → Compromis : tu as vu le contenu, tu peux avancer
 *
 *    L'idée est de s'assurer que les BASES sont comprises
 *    avant de passer à la suite.
 *
 * 3. POURQUOI un guard et pas juste de l'UI ?
 *
 *    SÉCURITÉ :
 *    Un utilisateur malin pourrait taper l'URL directement.
 *    Le guard empêche ça au niveau du ROUTEUR.
 *
 *    C'est la différence entre :
 *    - "Cacher le bouton" (facile à contourner)
 *    - "Bloquer la porte" (impossible à contourner)
 *
 * 4. POURQUOI le mode libre ?
 *
 *    FLEXIBILITÉ :
 *    Certains utilisateurs préfèrent apprendre dans un ordre différent.
 *    Le mode libre respecte cette autonomie.
 *
 *    C'est comme à la fac : cours obligatoires ET cours optionnels.
 *
 * Citation de Vygotsky (Zone Proximale de Développement) :
 * "Ce que l'enfant peut faire avec de l'aide aujourd'hui,
 *  il pourra le faire seul demain."
 *
 * Le déblocage progressif = aide structurée pour progresser.
 */
