/**
 * generated-exercise.model.ts
 *
 * Modèles pour le GÉNÉRATEUR D'EXERCICES IA.
 *
 * Ce module définit les interfaces pour :
 * - Les formats d'exercices générables
 * - La configuration de génération
 * - La structure des réponses IA
 *
 * Philosophie David J. Malan :
 * "The goal is not to replace the teacher, but to augment them."
 *
 * L'IA génère des exercices, mais c'est toi qui apprends !
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { ExerciseType, ExerciseDifficulty } from './exercise.model';

// ============================================================
// TYPES DE FORMAT D'EXERCICE
// ============================================================

/**
 * FORMAT D'EXERCICE
 * ----------------
 * Les différents types d'exercices que l'IA peut générer.
 *
 * Chaque format a ses avantages pédagogiques :
 * - qcm : Évaluation rapide des connaissances
 * - code-completion : Comprendre la structure du code
 * - debugging : Développer l'oeil critique
 * - pseudo-code : Penser algorithme avant syntaxe
 * - implementation : Pratique réelle de programmation
 */
export type ExerciseFormat =
  | 'qcm'              // Question à choix multiples (4 options, 1 correcte)
  | 'code-completion'  // Compléter le code manquant (remplir les ___)
  | 'debugging'        // Trouver et corriger les erreurs dans le code
  | 'pseudo-code'      // Écrire l'algorithme en pseudo-code
  | 'implementation';  // Implémenter en Java

/**
 * Labels et descriptions pour chaque format
 */
export const EXERCISE_FORMATS: {
  value: ExerciseFormat;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: 'qcm',
    label: 'QCM',
    icon: '📝',
    description: 'Question à choix multiples avec 4 options'
  },
  {
    value: 'code-completion',
    label: 'Complétion de code',
    icon: '✏️',
    description: 'Remplir les parties manquantes du code'
  },
  {
    value: 'debugging',
    label: 'Debugging',
    icon: '🐛',
    description: 'Trouver et corriger les erreurs'
  },
  {
    value: 'pseudo-code',
    label: 'Pseudo-code',
    icon: '📋',
    description: 'Écrire l\'algorithme en langage naturel'
  },
  {
    value: 'implementation',
    label: 'Implémentation Java',
    icon: '☕',
    description: 'Coder la solution en Java'
  }
];

// ============================================================
// CONFIGURATION DE GÉNÉRATION
// ============================================================

/**
 * CONFIGURATION DE GÉNÉRATION
 * --------------------------
 * Paramètres choisis par l'utilisateur pour la génération.
 */
export interface GenerationConfig {
  /**
   * Type d'exercice (sujet)
   * Ex: 'boucle', 'condition', 'tableau'
   */
  type: ExerciseType;

  /**
   * Niveau de difficulté
   */
  difficulty: ExerciseDifficulty;

  /**
   * Format de l'exercice
   */
  format: ExerciseFormat;

  /**
   * Inclure la solution avec l'exercice ?
   * Utile pour l'auto-correction
   */
  includeSolution: boolean;

  /**
   * Inclure des indices progressifs ?
   * Aide sans donner la réponse
   */
  includeHints: boolean;
}

// ============================================================
// STRUCTURE DE RÉPONSE IA
// ============================================================

/**
 * OPTION DE QCM
 * ------------
 * Une option de réponse pour les exercices QCM.
 */
export interface QCMOption {
  /**
   * Texte de l'option
   */
  text: string;

  /**
   * Est-ce la bonne réponse ?
   */
  isCorrect: boolean;
}

/**
 * SOLUTION GÉNÉRÉE
 * ---------------
 * Solution fournie par l'IA pour l'exercice.
 */
export interface GeneratedSolution {
  /**
   * Solution en pseudo-code
   */
  pseudoCode?: string;

  /**
   * Solution en Java
   */
  javaCode?: string;

  /**
   * Explication de la solution
   */
  explanation?: string;
}

/**
 * RÉPONSE DE GÉNÉRATION
 * --------------------
 * Structure complète de l'exercice généré par l'IA.
 */
export interface GeneratedExerciseResponse {
  /**
   * Titre court et descriptif
   * Max 60 caractères recommandé
   */
  title: string;

  /**
   * Énoncé complet du problème
   * Contient tous les détails nécessaires
   */
  description: string;

  /**
   * Format de l'exercice
   */
  format: ExerciseFormat;

  /**
   * Options de réponse (pour QCM uniquement)
   * 4 options avec une seule correcte
   */
  options?: QCMOption[];

  /**
   * Code à compléter ou débugger
   * Pour les formats code-completion et debugging
   */
  codeSnippet?: string;

  /**
   * Solution de l'exercice (optionnelle)
   * Incluse seulement si demandée
   */
  solution?: GeneratedSolution;

  /**
   * Indices progressifs (optionnels)
   * De plus en plus révélateurs
   */
  hints?: string[];
}

// ============================================================
// ÉTAT DE GÉNÉRATION
// ============================================================

/**
 * ÉTAT DE GÉNÉRATION
 * -----------------
 * États possibles du processus de génération.
 */
export type GenerationStatus =
  | 'idle'        // En attente
  | 'checking'    // Vérification Ollama
  | 'generating'  // Génération en cours
  | 'success'     // Exercice généré
  | 'error';      // Erreur

/**
 * RÉSULTAT DE GÉNÉRATION
 * ---------------------
 * Résultat complet d'une tentative de génération.
 */
export interface GenerationResult {
  /**
   * Statut de la génération
   */
  status: GenerationStatus;

  /**
   * Exercice généré (si succès)
   */
  exercise?: GeneratedExerciseResponse;

  /**
   * Message d'erreur (si échec)
   */
  error?: string;

  /**
   * Temps de génération (en ms)
   */
  generationTime?: number;
}

// ============================================================
// DESCRIPTIONS DES TYPES (pour les prompts)
// ============================================================

/**
 * Descriptions détaillées de chaque type d'exercice
 * Utilisées pour construire les prompts IA
 */
export const TYPE_DESCRIPTIONS: { [key in ExerciseType]: string } = {
  boole: 'Algèbre de Boole : tables de vérité, lois de De Morgan, simplification logique, portes logiques (AND, OR, NOT, XOR)',
  condition: 'Structures conditionnelles : if/else, else if, switch/case, opérateurs de comparaison, conditions imbriquées',
  boucle: 'Boucles : for, while, do-while, boucles imbriquées, parcours de tableaux, conditions d\'arrêt',
  tableau: 'Tableaux : déclaration, initialisation, parcours, recherche, tri, manipulation d\'indices',
  fonction: 'Fonctions et procédures : paramètres, valeurs de retour, portée des variables, récursivité',
  java: 'Programmation Java : syntaxe, types primitifs, classes, objets, méthodes, POO basique'
};

/**
 * Descriptions des niveaux de difficulté
 * Utilisées pour guider l'IA
 */
export const DIFFICULTY_DESCRIPTIONS: { [key in ExerciseDifficulty]: string } = {
  facile: 'Concept simple, une seule notion, application directe du cours',
  moyen: 'Combine 2 notions, nécessite réflexion et adaptation',
  difficile: 'Problème complexe, plusieurs étapes, logique avancée',
  expert: 'Niveau examen, cas limites, optimisation, algorithme non trivial'
};

/**
 * Instructions spécifiques par format
 * Guident l'IA sur le format de réponse attendu
 */
export const FORMAT_INSTRUCTIONS: { [key in ExerciseFormat]: string } = {
  qcm: `Génère une question à choix multiples avec EXACTEMENT 4 options dont UNE SEULE est correcte.
Les distracteurs doivent être plausibles mais clairement faux pour quelqu'un qui maîtrise le concept.`,

  'code-completion': `Génère un exercice où l'étudiant doit compléter du code avec des parties manquantes.
Indique les parties à compléter avec "___" ou "// À COMPLÉTER".
Le code doit être syntaxiquement correct une fois complété.`,

  debugging: `Génère du code contenant 1 à 3 erreurs volontaires que l'étudiant doit identifier et corriger.
Les erreurs peuvent être : syntaxiques, logiques, ou d'algorithme.
Le code doit sembler plausible au premier regard.`,

  'pseudo-code': `Génère un problème algorithmique que l'étudiant doit résoudre en pseudo-code.
L'énoncé doit être clair et précis sur les entrées/sorties attendues.
Pas besoin de syntaxe spécifique, juste la logique.`,

  implementation: `Génère un problème à implémenter en Java.
L'énoncé doit spécifier clairement : les entrées, les sorties, et les contraintes.
Le niveau doit correspondre à un étudiant apprenant Java.`
};

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI plusieurs formats d'exercices ?
 *
 *    Chaque format développe une compétence différente :
 *    - QCM → Reconnaissance et compréhension
 *    - Complétion → Application dans un contexte
 *    - Debugging → Analyse critique et attention aux détails
 *    - Pseudo-code → Pensée algorithmique pure
 *    - Implémentation → Synthèse complète
 *
 *    La variété maintient l'engagement et développe des compétences complémentaires.
 *
 * 2. POURQUOI des indices progressifs ?
 *
 *    Zone Proximale de Développement (Vygotsky) :
 *    L'apprentissage optimal se fait juste au-delà de ce qu'on sait déjà.
 *
 *    Les indices permettent de :
 *    - Éviter la frustration (blocage total)
 *    - Maintenir le défi (pas trop facile)
 *    - Guider sans donner la réponse
 *
 * 3. POURQUOI l'IA pour générer des exercices ?
 *
 *    - Personnalisation : Exercices adaptés au niveau de chacun
 *    - Variété infinie : Jamais les mêmes exercices
 *    - Disponibilité : Exercices à la demande, 24/7
 *    - Progression : Difficulté ajustable
 *
 *    L'IA n'est pas le professeur, elle est l'assistant du professeur.
 *
 * Citation de Seymour Papert :
 * "The role of the teacher is to create the conditions for invention
 *  rather than provide ready-made knowledge."
 */
