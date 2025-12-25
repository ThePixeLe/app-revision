/**
 * exercise.model.ts
 *
 * Modèle de données pour les EXERCICES d'algorithmique.
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine un carnet d'exercices de maths comme au lycée :
 * - Chaque exercice a un numéro, un énoncé, une difficulté
 * - Tu peux le marquer comme "fait" ou "à revoir"
 * - Tu notes tes solutions (brouillon, puis propre)
 * - Le prof te donne une note
 *
 * Ce modèle représente EXACTEMENT ça, mais en version numérique !
 *
 * Contexte du projet :
 * -------------------
 * Tu as 12 jours pour maîtriser :
 * - Algèbre de Boole (tables de vérité, simplification)
 * - Conditions (if/else, switch)
 * - Boucles (for, while, do-while)
 * - Tableaux (déclaration, parcours, manipulation)
 * - Java (syntaxe, classes, objets)
 *
 * Chaque sujet contient plusieurs exercices de difficulté croissante.
 *
 * Philosophie David J. Malan :
 * "Practice doesn't make perfect. PERFECT practice makes perfect."
 *
 * L'idée n'est pas de faire 100 exercices mal,
 * mais de BIEN faire chaque exercice, le comprendre,
 * puis le réviser au bon moment (spaced repetition).
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

// ============================================================
// TYPES ET ÉNUMÉRATIONS
// ============================================================

/**
 * TYPE D'EXERCICE
 * ---------------
 * Catégorise les exercices par sujet.
 *
 * Pourquoi des types séparés ?
 * ---------------------------
 * 1. Filtrage : "Montre-moi seulement les exercices sur les boucles"
 * 2. Statistiques : "J'ai fait 80% des exercices sur les conditions"
 * 3. Progression : Débloquer les sujets dans l'ordre
 *
 * Ordre pédagogique recommandé :
 * 1. boole → Fondations logiques (AND, OR, NOT)
 * 2. condition → Utilise la logique booléenne
 * 3. boucle → Répétition + conditions
 * 4. tableau → Boucles pour parcourir
 * 5. java → Synthèse de tout en langage réel
 */
export type ExerciseType =
  | 'boole'      // Algèbre de Boole : tables de vérité, simplification
  | 'condition'  // Structures conditionnelles : if, else, switch
  | 'boucle'     // Boucles : for, while, do-while
  | 'tableau'    // Tableaux : déclaration, parcours, tri
  | 'fonction'   // Fonctions et procédures
  | 'java';      // Java : syntaxe, POO, collections

/**
 * NIVEAU DE DIFFICULTÉ
 * -------------------
 * Échelle de difficulté pour chaque exercice.
 *
 * Pourquoi 4 niveaux ?
 * -------------------
 * - Trop peu (2-3) → Pas assez de nuance
 * - Trop (5+) → Difficile à évaluer objectivement
 * - 4 niveaux → Sweet spot utilisé par beaucoup de systèmes éducatifs
 *
 * Correspondance avec les notes :
 * - facile → ~12-14/20 attendu
 * - moyen → ~10-12/20 attendu
 * - difficile → ~8-10/20 attendu
 * - expert → ~6-8/20 attendu (au premier essai)
 *
 * Récompenses XP (voir progress.model.ts) :
 * - facile → 10 XP
 * - moyen → 25 XP
 * - difficile → 50 XP
 * - expert → 100 XP
 */
export type ExerciseDifficulty =
  | 'facile'     // Compréhension basique, application directe
  | 'moyen'      // Nécessite réflexion, combinaison de concepts
  | 'difficile'  // Problème complexe, plusieurs étapes
  | 'expert';    // Niveau examen, cas limites, optimisation

/**
 * STATUT DE L'EXERCICE
 * -------------------
 * Où en es-tu avec cet exercice ?
 *
 * Machine à états (state machine) :
 *
 *   ┌─────────────────────────────────────────┐
 *   │                                         │
 *   ▼                                         │
 * [todo] ──► [in-progress] ──► [completed] ──► [reviewed]
 *   │              │                │              │
 *   │              │                │              │
 *   │              ▼                ▼              │
 *   │         [blocked]        [failed]           │
 *   │              │                │              │
 *   └──────────────┴────────────────┴──────────────┘
 *
 * Explication de chaque statut :
 * - todo : Pas encore commencé
 * - in-progress : En cours de résolution
 * - completed : Terminé et compris
 * - reviewed : Révisé avec succès (révision espacée)
 * - blocked : Bloqué, besoin d'aide
 * - failed : Échoué, à refaire
 */
export type ExerciseStatus =
  | 'todo'         // À faire
  | 'in-progress'  // En cours
  | 'completed'    // Terminé
  | 'reviewed'     // Révisé
  | 'blocked'      // Bloqué
  | 'failed';      // Échoué

// ============================================================
// INTERFACES PRINCIPALES
// ============================================================

/**
 * SOLUTION D'UN EXERCICE
 * ---------------------
 * Contient le travail de l'étudiant sur un exercice.
 *
 * Pourquoi séparer pseudo-code et Java ?
 * -------------------------------------
 * Méthodologie en deux étapes (CS50 style) :
 *
 * 1. PSEUDO-CODE d'abord
 *    - Réfléchir à l'algorithme SANS syntaxe
 *    - Se concentrer sur la LOGIQUE
 *    - Plus facile à modifier
 *
 * 2. JAVA ensuite
 *    - Traduire le pseudo-code en code réel
 *    - Gérer la syntaxe, les types
 *    - Tester et débugger
 *
 * Citation de Donald Knuth :
 * "Premature optimization is the root of all evil."
 *
 * Traduction : D'abord, fais marcher. Ensuite, optimise.
 * Le pseudo-code = "faire marcher" (logique)
 * Le Java = "optimiser" (implémentation réelle)
 */
export interface ExerciseSolution {
  /**
   * Pseudo-code de la solution
   * -------------------------
   * Algorithme en langage naturel structuré.
   *
   * Exemple :
   * ```
   * ALGORITHME CalculerMoyenne
   * DÉBUT
   *   somme ← 0
   *   POUR i DE 1 À n FAIRE
   *     somme ← somme + notes[i]
   *   FIN POUR
   *   moyenne ← somme / n
   *   RETOURNER moyenne
   * FIN
   * ```
   */
  pseudoCode: string;

  /**
   * Code Java de la solution
   * -----------------------
   * Implémentation réelle en Java.
   *
   * Exemple :
   * ```java
   * public static double calculerMoyenne(int[] notes) {
   *     int somme = 0;
   *     for (int i = 0; i < notes.length; i++) {
   *         somme += notes[i];
   *     }
   *     return (double) somme / notes.length;
   * }
   * ```
   */
  javaCode: string;

  /**
   * Notes personnelles
   * -----------------
   * Réflexions, difficultés rencontrées, astuces à retenir.
   *
   * Très important pour la révision !
   * "Pourquoi j'ai fait cette erreur ?" → Ne pas la refaire.
   */
  notes: string;

  /**
   * Date de la dernière modification
   */
  lastModified: Date;
}

/**
 * TENTATIVE D'EXERCICE
 * -------------------
 * Historique d'une tentative de résolution.
 *
 * Pourquoi garder l'historique ?
 * -----------------------------
 * 1. Voir ta progression : "J'ai mis 45 min la 1ère fois, 10 min la 2ème"
 * 2. Identifier les patterns : "Je fais toujours la même erreur"
 * 3. Motivation : "J'étais nul au début, maintenant je gère !"
 *
 * Analogie :
 * C'est comme les temps au tour en Formule 1.
 * Chaque tour est enregistré pour analyser la performance.
 */
export interface ExerciseAttempt {
  /**
   * Identifiant unique de la tentative
   */
  id: string;

  /**
   * Date et heure de la tentative
   */
  attemptedAt: Date;

  /**
   * Durée de la tentative (en secondes)
   * ----------------------------------
   * Mesure le temps passé sur l'exercice.
   *
   * Pourquoi en secondes et pas en minutes ?
   * → Plus précis pour les calculs
   * → Facile à convertir : minutes = secondes / 60
   */
  duration: number;

  /**
   * Réussi ou non ?
   */
  success: boolean;

  /**
   * Score obtenu (0-100)
   * -------------------
   * Auto-évaluation ou évaluation du correcteur.
   *
   * Barème suggéré :
   * - 90-100 : Parfait, prêt pour l'examen
   * - 70-89 : Bien, quelques erreurs mineures
   * - 50-69 : Passable, à réviser
   * - 0-49 : À refaire complètement
   */
  score: number;

  /**
   * Erreurs commises
   * ---------------
   * Liste des erreurs pour analyse.
   *
   * Exemples :
   * - "Oublié d'initialiser la variable"
   * - "Condition inversée dans le if"
   * - "Boucle infinie"
   */
  errors: string[];

  /**
   * Notes sur cette tentative
   */
  notes: string;
}

/**
 * EXERCICE
 * --------
 * L'interface principale représentant un exercice complet.
 *
 * C'est le cœur du système d'apprentissage !
 */
export interface Exercise {
  // ===== IDENTIFICATION =====

  /**
   * Identifiant unique
   * -----------------
   * Format recommandé : "ex-{type}-{numero}"
   * Exemples : "ex-cond-1", "ex-boucle-5", "ex-tableau-3"
   */
  id: string;

  /**
   * Type d'exercice (sujet)
   */
  type: ExerciseType;

  /**
   * Catégorie de l'exercice (alias pour type)
   */
  category?: string;

  /**
   * ID du jour auquel appartient l'exercice
   */
  dayId?: string;

  /**
   * Titre court et descriptif
   * ------------------------
   * Exemples :
   * - "Nombre positif ou négatif"
   * - "Factorielle"
   * - "Tri à bulles"
   */
  title: string;

  /**
   * Énoncé complet de l'exercice
   * ---------------------------
   * Le problème à résoudre, avec tous les détails.
   */
  description: string;

  /**
   * Niveau de difficulté
   */
  difficulty: ExerciseDifficulty;

  // ===== SOURCE =====

  /**
   * Document source (PDF)
   * --------------------
   * D'où vient cet exercice ?
   * Utile pour référence et révision.
   */
  document: string;

  /**
   * Numéro de page dans le document
   */
  pageNumber: number;

  // ===== PROGRESSION =====

  /**
   * Statut actuel de l'exercice
   */
  status: ExerciseStatus;

  /**
   * Temps total passé sur l'exercice (en secondes)
   * ---------------------------------------------
   * Cumul de toutes les tentatives.
   */
  timeSpent: number;

  /**
   * Nombre de tentatives
   */
  attempts: number;

  /**
   * Historique des tentatives
   */
  attemptHistory?: ExerciseAttempt[];

  /**
   * Score moyen (0-100)
   */
  averageScore?: number;

  /**
   * Meilleur score obtenu (0-100)
   */
  bestScore?: number;

  // ===== SOLUTION =====

  /**
   * Solution de l'étudiant
   */
  solution?: ExerciseSolution;

  /**
   * Notes générales sur l'exercice
   */
  notes: string;

  // ===== RÉVISION ESPACÉE =====

  /**
   * Date de la prochaine révision
   * ----------------------------
   * Système de révision espacée (Spaced Repetition).
   *
   * Pourquoi la révision espacée ?
   * -----------------------------
   * Courbe de l'oubli (Hermann Ebbinghaus, 1885) :
   *
   * Mémoire
   *   100% ┤████
   *    80% ┤  ████
   *    60% ┤      ████
   *    40% ┤          ████
   *    20% ┤              ████████████
   *     0% ┼──────────────────────────► Temps
   *        J1  J2  J3  J7  J14  J30
   *
   * Sans révision, on oublie ~80% en 24h !
   * Avec révision espacée, on retient ~90% à long terme.
   *
   * Intervalles optimaux :
   * - 1ère révision : 1 jour après
   * - 2ème révision : 3 jours après
   * - 3ème révision : 7 jours après
   * - 4ème révision : 14 jours après
   * - 5ème révision : 30 jours après
   */
  nextReviewDate?: Date;

  /**
   * Niveau de maîtrise (0-5)
   * -----------------------
   * Utilisé pour calculer l'intervalle de révision.
   *
   * 0 = Jamais fait
   * 1 = Fait une fois, beaucoup d'erreurs
   * 2 = Quelques erreurs
   * 3 = Réussi avec hésitation
   * 4 = Réussi facilement
   * 5 = Maîtrisé parfaitement
   */
  masteryLevel?: number;

  /**
   * Nombre de révisions effectuées
   */
  reviewCount?: number;

  /**
   * Compteur de répétitions réussies (SM-2)
   * --------------------------------------
   * Utilisé par l'algorithme SM-2 pour calculer l'intervalle.
   * Reset à 0 en cas d'échec.
   */
  revisionCount?: number;

  /**
   * Facteur de facilité (SM-2)
   * -------------------------
   * EF (Ease Factor) utilisé par SM-2.
   * Valeur initiale : 2.5
   * Min : 1.3
   *
   * Plus le facteur est élevé, plus l'intervalle augmente vite.
   */
  easeFactor?: number;

  /**
   * Intervalle actuel en jours (SM-2)
   * --------------------------------
   * Nombre de jours jusqu'à la prochaine révision.
   */
  interval?: number;

  /**
   * Date de la dernière révision
   */
  lastReviewDate?: Date;

  /**
   * Qualité de la dernière révision (0-5)
   * ------------------------------------
   * Note donnée lors de la dernière révision SM-2.
   * 0-2 : Échec
   * 3 : Correct avec difficulté
   * 4 : Correct
   * 5 : Parfait
   */
  lastReviewQuality?: number;

  /**
   * Score de l'exercice (0-100)
   */
  score?: number;

  /**
   * Date de complétion de l'exercice
   */
  completedAt?: Date;

  // ===== MÉTADONNÉES =====

  /**
   * Date de création
   */
  createdAt: Date;

  /**
   * Date de dernière modification
   */
  updatedAt: Date;

  /**
   * Tags personnalisés
   * -----------------
   * Pour organiser et filtrer les exercices.
   * Exemples : ["examen", "difficile", "à-revoir"]
   */
  tags?: string[];
}

// ============================================================
// INTERFACES DE STATISTIQUES
// ============================================================

/**
 * STATISTIQUES D'EXERCICES
 * -----------------------
 * Vue d'ensemble de la progression sur les exercices.
 */
export interface ExerciseStats {
  /**
   * Nombre total d'exercices
   */
  total: number;

  /**
   * Nombre d'exercices complétés
   */
  completed: number;

  /**
   * Nombre d'exercices en cours
   */
  inProgress: number;

  /**
   * Nombre d'exercices à faire
   */
  todo: number;

  /**
   * Nombre d'exercices bloqués
   */
  blocked?: number;

  /**
   * Pourcentage de complétion (0-100)
   */
  completionPercentage?: number;

  /**
   * Temps total passé (en heures)
   */
  totalTimeSpent?: number;

  /**
   * Score moyen global
   */
  averageScore: number;

  /**
   * Statistiques par type d'exercice
   */
  byType: {
    [key in ExerciseType]?: {
      total: number;
      completed: number;
      averageScore?: number;
    };
  };

  /**
   * Statistiques par difficulté
   */
  byDifficulty: {
    [key in ExerciseDifficulty]: {
      total: number;
      completed: number;
      averageScore?: number;
    };
  };

  /**
   * Exercices à réviser aujourd'hui
   */
  dueForReview?: number;

  /**
   * Nombre total d'exercices révisés au moins une fois
   */
  totalReviewed?: number;

  /**
   * Taux de rétention (% de révisions réussies)
   */
  retentionRate?: number;
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * CALCULER LE POURCENTAGE DE COMPLÉTION
 * ------------------------------------
 * Retourne le pourcentage d'exercices terminés.
 *
 * @param exercises - Liste des exercices
 * @returns Pourcentage (0-100)
 *
 * Exemple :
 * ```typescript
 * const exercises = [...]; // 10 exercices, 7 complétés
 * const percentage = calculateCompletionPercentage(exercises);
 * console.log(percentage); // 70
 * ```
 */
export function calculateCompletionPercentage(exercises: Exercise[]): number {
  // Protection contre la division par zéro
  // C'est un piège classique en programmation !
  if (exercises.length === 0) {
    return 0;
  }

  // Compte les exercices complétés ou révisés
  const completed = exercises.filter(
    ex => ex.status === 'completed' || ex.status === 'reviewed'
  ).length;

  // Calcule le pourcentage et arrondit
  return Math.round((completed / exercises.length) * 100);
}

/**
 * CALCULER LA DATE DE PROCHAINE RÉVISION
 * -------------------------------------
 * Implémente l'algorithme de révision espacée.
 *
 * @param masteryLevel - Niveau de maîtrise actuel (0-5)
 * @param wasSuccessful - La dernière tentative était-elle réussie ?
 * @returns Date de la prochaine révision
 *
 * Algorithme :
 * -----------
 * Si réussi → augmente l'intervalle (on retient mieux)
 * Si échoué → réinitialise à 1 jour (besoin de revoir)
 *
 * Intervalles selon le niveau :
 * - Niveau 1 : 1 jour
 * - Niveau 2 : 3 jours
 * - Niveau 3 : 7 jours
 * - Niveau 4 : 14 jours
 * - Niveau 5 : 30 jours
 *
 * Basé sur l'algorithme SM-2 (SuperMemo 2)
 * utilisé par Anki et autres apps de flashcards.
 */
export function calculateNextReviewDate(
  masteryLevel: number,
  wasSuccessful: boolean
): Date {
  const now = new Date();

  // Si échec, on révise dans 1 jour (reset)
  if (!wasSuccessful) {
    now.setDate(now.getDate() + 1);
    return now;
  }

  // Intervalles en jours selon le niveau
  // Ces valeurs sont basées sur des recherches en sciences cognitives
  const intervals: { [key: number]: number } = {
    0: 1,   // Jamais fait → demain
    1: 1,   // Niveau 1 → 1 jour
    2: 3,   // Niveau 2 → 3 jours
    3: 7,   // Niveau 3 → 1 semaine
    4: 14,  // Niveau 4 → 2 semaines
    5: 30   // Niveau 5 → 1 mois
  };

  // Calcule la prochaine date
  const daysToAdd = intervals[Math.min(masteryLevel, 5)] || 1;
  now.setDate(now.getDate() + daysToAdd);

  return now;
}

/**
 * CALCULER LES XP GAGNÉS POUR UN EXERCICE
 * --------------------------------------
 * Retourne les points d'expérience selon la difficulté.
 *
 * @param difficulty - Niveau de difficulté
 * @param isFirstAttempt - Est-ce la première tentative ?
 * @returns Points XP gagnés
 *
 * Système de récompense :
 * ----------------------
 * - Récompense proportionnelle à la difficulté
 * - Bonus pour la première tentative réussie
 * - Pas de points négatifs (on encourage, on ne punit pas)
 */
export function calculateExerciseXP(
  difficulty: ExerciseDifficulty,
  isFirstAttempt: boolean = false
): number {
  // Points de base selon la difficulté
  const baseXP: { [key in ExerciseDifficulty]: number } = {
    facile: 10,
    moyen: 25,
    difficile: 50,
    expert: 100
  };

  let xp = baseXP[difficulty];

  // Bonus de 50% pour la première tentative réussie
  // (encourage à bien faire du premier coup)
  if (isFirstAttempt) {
    xp = Math.round(xp * 1.5);
  }

  return xp;
}

/**
 * OBTENIR LE LABEL DE DIFFICULTÉ
 * -----------------------------
 * Retourne un label lisible pour l'affichage.
 *
 * @param difficulty - Niveau de difficulté
 * @returns Label avec emoji
 */
export function getDifficultyLabel(difficulty: ExerciseDifficulty): string {
  const labels: { [key in ExerciseDifficulty]: string } = {
    facile: '🟢 Facile',
    moyen: '🟡 Moyen',
    difficile: '🟠 Difficile',
    expert: '🔴 Expert'
  };

  return labels[difficulty];
}

/**
 * OBTENIR LE LABEL DE STATUT
 * -------------------------
 * Retourne un label lisible pour l'affichage.
 *
 * @param status - Statut de l'exercice
 * @returns Label avec emoji
 */
export function getStatusLabel(status: ExerciseStatus): string {
  const labels: { [key in ExerciseStatus]: string } = {
    'todo': '📋 À faire',
    'in-progress': '🔄 En cours',
    'completed': '✅ Terminé',
    'reviewed': '🔁 Révisé',
    'blocked': '🚧 Bloqué',
    'failed': '❌ Échoué'
  };

  return labels[status];
}

/**
 * OBTENIR LE LABEL DE TYPE
 * -----------------------
 * Retourne un label lisible pour l'affichage.
 *
 * @param type - Type d'exercice
 * @returns Label avec emoji
 */
export function getTypeLabel(type: ExerciseType): string {
  const labels: { [key in ExerciseType]: string } = {
    boole: '🔣 Algèbre de Boole',
    condition: '🔀 Conditions',
    boucle: '🔁 Boucles',
    tableau: '📊 Tableaux',
    fonction: '📦 Fonctions',
    java: '☕ Java'
  };

  return labels[type];
}

/**
 * FILTRER LES EXERCICES À RÉVISER
 * ------------------------------
 * Retourne les exercices dont la date de révision est passée.
 *
 * @param exercises - Liste des exercices
 * @returns Exercices à réviser aujourd'hui
 */
export function getExercisesDueForReview(exercises: Exercise[]): Exercise[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return exercises.filter(ex => {
    // Seulement les exercices complétés ou révisés
    if (ex.status !== 'completed' && ex.status !== 'reviewed') {
      return false;
    }

    // Si pas de date de révision, à réviser
    if (!ex.nextReviewDate) {
      return true;
    }

    // Si la date de révision est aujourd'hui ou avant
    const reviewDate = new Date(ex.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);

    return reviewDate.getTime() <= today.getTime();
  });
}

/**
 * CRÉER UN NOUVEL EXERCICE
 * -----------------------
 * Factory function pour créer un exercice avec les valeurs par défaut.
 *
 * @param data - Données partielles de l'exercice
 * @returns Exercice complet avec valeurs par défaut
 */
export function createExercise(
  data: Partial<Exercise> & {
    id: string;
    type: ExerciseType;
    title: string;
    description: string;
    difficulty: ExerciseDifficulty;
  }
): Exercise {
  const now = new Date();

  return {
    // Données fournies
    id: data.id,
    type: data.type,
    title: data.title,
    description: data.description,
    difficulty: data.difficulty,

    // Valeurs par défaut pour les champs optionnels
    document: data.document || '',
    pageNumber: data.pageNumber || 1,
    status: data.status || 'todo',
    timeSpent: data.timeSpent || 0,
    attempts: data.attempts || 0,
    attemptHistory: data.attemptHistory || [],
    notes: data.notes || '',
    tags: data.tags || [],

    // Métadonnées
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI séparer pseudo-code et Java ?
 *
 *    Le cerveau humain ne peut pas gérer deux problèmes à la fois :
 *    - Problème 1 : Quelle est la LOGIQUE de la solution ?
 *    - Problème 2 : Comment l'ÉCRIRE en Java ?
 *
 *    En séparant les deux, on réduit la charge cognitive.
 *    C'est comme construire une maison :
 *    D'abord le plan (pseudo-code), ensuite les briques (Java).
 *
 * 2. POURQUOI la révision espacée ?
 *
 *    La mémoire humaine est comme un muscle :
 *    - Sans exercice → elle s'atrophie (on oublie)
 *    - Avec exercice au bon moment → elle se renforce
 *
 *    Les intervalles optimaux (1, 3, 7, 14, 30 jours) sont basés
 *    sur des décennies de recherche en psychologie cognitive.
 *
 *    Hermann Ebbinghaus (1885) a découvert la "courbe de l'oubli".
 *    Piotr Wozniak (1987) a créé l'algorithme SM-2 pour la combattre.
 *
 * 3. POURQUOI garder l'historique des tentatives ?
 *
 *    "Those who cannot remember the past are condemned to repeat it."
 *    — George Santayana
 *
 *    En analysant tes erreurs passées, tu peux :
 *    - Identifier tes points faibles
 *    - Éviter de refaire les mêmes erreurs
 *    - Voir ta progression (motivation !)
 *
 * 4. POURQUOI un système de points (XP) ?
 *
 *    Gamification = Motivation intrinsèque + extrinsèque
 *
 *    Motivation intrinsèque : Le plaisir d'apprendre
 *    Motivation extrinsèque : Les récompenses (XP, badges)
 *
 *    Les deux combinées = Apprentissage optimal
 *
 *    Référence : "Reality Is Broken" de Jane McGonigal
 *
 * Citation finale de David J. Malan :
 * "What ultimately matters in this course is not so much
 *  where you end up relative to your classmates,
 *  but where you end up relative to where you began."
 *
 * Traduction : Ce qui compte, ce n'est pas d'être meilleur que les autres,
 * c'est d'être meilleur que toi-même d'hier.
 *
 * Chaque exercice terminé te rapproche de cet objectif !
 */
