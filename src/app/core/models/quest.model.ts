/**
 * quest.model.ts
 *
 * Ce fichier définit la structure d'une QUÊTE (mission à accomplir).
 *
 * Analogie du monde réel :
 * ----------------------
 * Dans un jeu vidéo RPG, tu as des quêtes :
 * - Quête principale : histoire du jeu (obligatoire)
 * - Quêtes secondaires : bonus, explorations (optionnelles)
 * - Quêtes quotidiennes : petites missions qui se renouvellent
 * - Quêtes hebdomadaires : défis plus longs
 *
 * C'est PAREIL ici pour l'apprentissage !
 *
 * Pourquoi les quêtes fonctionnent-elles ?
 * ---------------------------------------
 * Recherche en game design (Zichermann & Cunningham, 2011) :
 * - Objectifs clairs → Direction précise
 * - Récompenses visibles → Motivation extrinsèque
 * - Progression trackée → Satisfaction du progrès
 * - Variété → Évite la monotonie
 *
 * Citation de David J. Malan :
 * "Give students clear goals, and they'll surprise you with what they achieve."
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

/**
 * Type de quête
 * ------------
 */
export type QuestType =
  | 'daily'    // Quête quotidienne (se réinitialise chaque jour)
  | 'weekly'   // Quête hebdomadaire (se réinitialise chaque semaine)
  | 'main'     // Quête principale du programme (obligatoire)
  | 'side';    // Quête secondaire/bonus (optionnelle)

/**
 * Statut d'une quête
 * -----------------
 */
export type QuestStatus =
  | 'locked'       // Pas encore accessible (prérequis non remplis)
  | 'available'    // Disponible mais pas commencée
  | 'in-progress'  // En cours de réalisation
  | 'completed';   // Terminée !

/**
 * Type d'objectif de quête
 * -----------------------
 * Détermine ce qu'il faut faire pour compléter la quête.
 */
export type ObjectiveType =
  | 'exercises'    // Terminer X exercices
  | 'pomodoros'    // Faire X sessions Pomodoro
  | 'streak'       // Maintenir un streak de X jours
  | 'score'        // Obtenir un score moyen de X
  | 'time'         // Passer X minutes/heures
  | 'subject'      // Terminer X% d'une matière
  | 'evaluation'   // Faire X auto-évaluations
  | 'revision';    // Réviser X exercices

/**
 * Interface principale : Quest
 * ---------------------------
 */
export interface Quest {
  // ===== IDENTIFICATION =====

  /**
   * Identifiant unique de la quête
   * Ex: "quest-daily-3-exercises", "quest-main-algebre"
   *
   * Convention : "quest-{type}-{description-courte}"
   */
  id: string;

  /**
   * Titre de la quête
   * Ex: "Le Marathon des Algorithmes", "Semaine Parfaite"
   *
   * Doit être accrocheur et motivant !
   * Pense aux quêtes de World of Warcraft ou Skyrim.
   */
  title: string;

  /**
   * Description détaillée de la quête
   * Ex: "Termine 20 exercices d'algorithmique en moins d'une semaine"
   *
   * Explique :
   * - Quoi faire exactement
   * - Combien de temps tu as
   * - Pourquoi c'est intéressant
   */
  description: string;

  /**
   * Saveur/Lore (optionnel)
   * Texte narratif pour rendre la quête plus immersive
   *
   * Ex: "Les algorithmes sont les sorts des développeurs modernes.
   *      Maîtrise-les, et tu pourras résoudre n'importe quel problème !"
   *
   * Inspiré des jeux RPG où chaque quête a une histoire.
   */
  flavor?: string;

  // ===== CLASSIFICATION =====

  /**
   * Type de quête
   */
  type: QuestType;

  /**
   * Statut actuel de la quête
   */
  status: QuestStatus;

  // ===== OBJECTIF =====

  /**
   * L'objectif à accomplir
   * Structure flexible selon le type d'objectif.
   *
   * Exemples :
   *
   * 1. Terminer 5 exercices :
   *    { type: 'exercises', target: 5, current: 2 }
   *
   * 2. Faire 4 Pomodoros :
   *    { type: 'pomodoros', target: 4, current: 1 }
   *
   * 3. Maintenir un streak de 7 jours :
   *    { type: 'streak', target: 7, current: 3 }
   *
   * 4. Atteindre 80% de moyenne :
   *    { type: 'score', target: 80, current: 65 }
   *
   * 5. Terminer 100% de l'algèbre :
   *    { type: 'subject', subject: 'algebre', target: 100, current: 45 }
   */
  objective: {
    type: ObjectiveType;
    target: number;      // Objectif à atteindre
    current: number;     // Progression actuelle
    unit?: string;       // Unité (jours, exercices, %, etc.)
    subject?: string;    // Pour les objectifs par matière
  };

  // ===== RÉCOMPENSES =====

  /**
   * Récompenses pour compléter la quête
   */
  rewards: {
    /**
     * XP gagnés
     *
     * Échelle suggérée :
     * - Daily : 50-150 XP
     * - Weekly : 200-500 XP
     * - Main : 500-2000 XP
     * - Side : 100-300 XP
     */
    xp: number;

    /**
     * Badge débloqué (ID du badge)
     * Optionnel, certaines quêtes donnent un badge unique !
     */
    badge?: string;

    /**
     * Récompense spéciale (texte libre)
     * Ex: "Accès à des exercices bonus"
     * Ex: "Nouveau thème de couleur pour l'app"
     * Ex: "Message de félicitations personnalisé"
     */
    special?: string;
  };

  // ===== CONTRAINTES TEMPORELLES =====

  /**
   * Date limite pour compléter la quête
   * Obligatoire pour daily/weekly, optionnel pour main/side
   *
   * Exemples :
   * - Daily : 23:59 aujourd'hui
   * - Weekly : dimanche à 23:59
   * - Main : 4 janvier 2025 (fin du programme)
   */
  deadline?: Date;

  /**
   * Date de début de la quête
   * Quand l'utilisateur a commencé à travailler dessus
   */
  startedAt?: Date;

  /**
   * Date de complétion
   * Quand la quête a été terminée
   */
  completedAt?: Date;

  /**
   * Durée estimée (en minutes)
   * Combien de temps ça devrait prendre
   * Ex: 60 (= 1 heure), 240 (= 4 heures)
   *
   * Aide l'utilisateur à planifier :
   * "Cette quête prend environ 2 heures"
   */
  estimatedDuration?: number;

  // ===== DIFFICULTÉ =====

  /**
   * Niveau de difficulté (1 à 5)
   * 1 ⭐ : Très facile
   * 2 ⭐⭐ : Facile
   * 3 ⭐⭐⭐ : Moyen
   * 4 ⭐⭐⭐⭐ : Difficile
   * 5 ⭐⭐⭐⭐⭐ : Très difficile
   *
   * Permet de filtrer : "Montre-moi les quêtes faciles"
   */
  difficulty: number;

  // ===== PRÉREQUIS =====

  /**
   * Prérequis pour débloquer cette quête
   * Liste d'IDs de quêtes qui doivent être complétées avant
   *
   * Ex: Pour "Quête Maître Algo", il faut avoir fini :
   * - "Quête Conditions"
   * - "Quête Boucles"
   * - "Quête Tableaux"
   *
   * Si le tableau est vide ou undefined, pas de prérequis.
   */
  prerequisites?: string[];

  /**
   * Niveau minimum requis
   * Ex: 5 (il faut être niveau 5+ pour cette quête)
   *
   * Évite que les débutants soient submergés de quêtes difficiles.
   */
  minimumLevel?: number;

  // ===== CHAÎNAGE DE QUÊTES =====

  /**
   * Quête suivante (optionnel)
   * Permet de créer des "chaînes" de quêtes
   *
   * Ex: "Quête Boucles Partie 1" → "Quête Boucles Partie 2"
   *
   * Quand tu termines cette quête, la suivante se débloque !
   */
  nextQuest?: string;

  /**
   * Fait partie d'une série ? (optionnel)
   * Ex: { name: "Saga Algorithmique", part: 2, total: 5 }
   * → "Partie 2/5 de la Saga Algorithmique"
   *
   * Donne une vue d'ensemble : "Tu as fait 2/5 de cette série"
   */
  series?: {
    name: string;   // Nom de la série
    part: number;   // Numéro de la partie actuelle
    total: number;  // Nombre total de parties
  };

  // ===== AFFICHAGE =====

  /**
   * Icône de la quête
   * Emoji ou nom d'icône Lucide
   * Ex: "🎯", "⚔️", "target", "sword"
   */
  icon: string;

  /**
   * Couleur de la quête (hex)
   * Pour différencier visuellement les quêtes
   */
  color: string;

  /**
   * Ordre d'affichage
   * Plus petit = affiché en premier
   */
  order: number;

  // ===== MÉTADONNÉES =====

  /**
   * Est-ce une quête cachée/secrète ?
   * Si true, n'apparaît pas dans la liste avant d'être débloquée
   */
  hidden: boolean;

  /**
   * Tags pour catégoriser
   * Ex: ["algorithmique", "débutant", "quotidien"]
   */
  tags?: string[];

  /**
   * Date de création
   */
  createdAt: Date;

  /**
   * Date de dernière mise à jour
   */
  updatedAt: Date;
}

/**
 * Quêtes prédéfinies du système
 * ----------------------------
 */
export const PREDEFINED_QUESTS: Partial<Quest>[] = [
  // ===== QUÊTES QUOTIDIENNES =====
  {
    id: 'daily-3-exercises',
    title: 'Triple Menace',
    description: 'Termine 3 exercices aujourd\'hui',
    flavor: 'Chaque jour est une opportunité de s\'améliorer. Commence petit, vise grand !',
    type: 'daily',
    status: 'available',
    objective: {
      type: 'exercises',
      target: 3,
      current: 0,
      unit: 'exercices'
    },
    rewards: {
      xp: 50
    },
    difficulty: 1,
    icon: '🎯',
    color: '#10B981',
    order: 1,
    hidden: false
  },
  {
    id: 'daily-4-pomodoros',
    title: 'Focus Master',
    description: 'Réalise 4 sessions Pomodoro aujourd\'hui',
    flavor: 'La concentration est un muscle. Entraîne-le !',
    type: 'daily',
    status: 'available',
    objective: {
      type: 'pomodoros',
      target: 4,
      current: 0,
      unit: 'sessions'
    },
    rewards: {
      xp: 75
    },
    difficulty: 2,
    icon: '⏱️',
    color: '#F59E0B',
    order: 2,
    hidden: false
  },

  // ===== QUÊTES HEBDOMADAIRES =====
  {
    id: 'weekly-perfect-streak',
    title: 'Semaine Parfaite',
    description: 'Maintiens un streak de 7 jours',
    flavor: 'La constance bat le talent quand le talent n\'est pas constant.',
    type: 'weekly',
    status: 'available',
    objective: {
      type: 'streak',
      target: 7,
      current: 0,
      unit: 'jours'
    },
    rewards: {
      xp: 300,
      badge: 'unstoppable'
    },
    difficulty: 3,
    icon: '🔥',
    color: '#EF4444',
    order: 10,
    hidden: false
  },

  // ===== QUÊTES PRINCIPALES =====
  {
    id: 'main-algebre-complete',
    title: 'Conquérant de l\'Algèbre',
    description: 'Termine tous les exercices d\'algèbre de Boole',
    flavor: 'Les portes logiques sont les fondations de l\'informatique. Maîtrise-les !',
    type: 'main',
    status: 'available',
    objective: {
      type: 'subject',
      subject: 'algebre',
      target: 100,
      current: 0,
      unit: '%'
    },
    rewards: {
      xp: 500,
      badge: 'algebre-master'
    },
    difficulty: 3,
    icon: '🔵',
    color: '#3B82F6',
    order: 20,
    hidden: false,
    nextQuest: 'main-algo-complete'
  },
  {
    id: 'main-algo-complete',
    title: 'Seigneur des Algorithmes',
    description: 'Termine tous les exercices d\'algorithmique',
    flavor: 'Un algorithme bien conçu est comme une belle symphonie : chaque note à sa place.',
    type: 'main',
    status: 'locked',
    objective: {
      type: 'subject',
      subject: 'algo',
      target: 100,
      current: 0,
      unit: '%'
    },
    rewards: {
      xp: 800,
      badge: 'algo-master'
    },
    difficulty: 4,
    icon: '🟣',
    color: '#8B5CF6',
    order: 21,
    hidden: false,
    prerequisites: ['main-algebre-complete'],
    nextQuest: 'main-java-complete',
    series: {
      name: 'Programme Complet',
      part: 2,
      total: 3
    }
  },
  {
    id: 'main-java-complete',
    title: 'Champion Java',
    description: 'Termine tous les exercices Java',
    flavor: 'Java n\'est pas juste un langage, c\'est une philosophie de programmation.',
    type: 'main',
    status: 'locked',
    objective: {
      type: 'subject',
      subject: 'java',
      target: 100,
      current: 0,
      unit: '%'
    },
    rewards: {
      xp: 1000,
      badge: 'java-master',
      special: 'Certificat de réussite du programme !'
    },
    difficulty: 5,
    icon: '🟢',
    color: '#10B981',
    order: 22,
    hidden: false,
    prerequisites: ['main-algo-complete'],
    series: {
      name: 'Programme Complet',
      part: 3,
      total: 3
    }
  },

  // ===== QUÊTES SECONDAIRES =====
  {
    id: 'side-speed-demon',
    title: 'Démon de Vitesse',
    description: 'Termine 10 exercices en moins de 2 heures',
    flavor: 'La rapidité vient avec la maîtrise. Montre ta puissance !',
    type: 'side',
    status: 'available',
    objective: {
      type: 'exercises',
      target: 10,
      current: 0,
      unit: 'exercices'
    },
    rewards: {
      xp: 250,
      badge: 'speed-demon'
    },
    difficulty: 4,
    icon: '⚡',
    color: '#FBBF24',
    order: 30,
    hidden: false,
    estimatedDuration: 120
  }
];

/**
 * Fonction utilitaire : calculer le pourcentage de progression
 * ----------------------------------------------------------
 *
 * @param quest - La quête
 * @returns Pourcentage (0-100)
 */
export function calculateQuestProgress(quest: Quest): number {
  const { current, target } = quest.objective;
  if (target === 0) return 0;

  const percentage = (current / target) * 100;
  return Math.min(100, Math.round(percentage * 10) / 10);
}

/**
 * Fonction utilitaire : vérifier si une quête est complétée
 * -------------------------------------------------------
 *
 * @param quest - La quête
 * @returns true si complétée
 */
export function isQuestCompleted(quest: Quest): boolean {
  return quest.objective.current >= quest.objective.target;
}

/**
 * Fonction utilitaire : vérifier si une quête peut être débloquée
 * -------------------------------------------------------------
 * Vérifie les prérequis et le niveau minimum.
 *
 * @param quest - La quête
 * @param completedQuests - IDs des quêtes déjà complétées
 * @param userLevel - Niveau actuel de l'utilisateur
 * @returns true si la quête peut être débloquée
 */
export function canUnlockQuest(
  quest: Quest,
  completedQuests: string[],
  userLevel: number
): boolean {
  // Vérifier le niveau minimum
  if (quest.minimumLevel && userLevel < quest.minimumLevel) {
    return false;
  }

  // Vérifier les prérequis
  if (quest.prerequisites && quest.prerequisites.length > 0) {
    const allPrerequisitesMet = quest.prerequisites.every(
      prereqId => completedQuests.includes(prereqId)
    );
    return allPrerequisitesMet;
  }

  // Pas de contraintes, peut être débloquée
  return true;
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI des quêtes ET des badges ?
 *
 *    Badges = Récompense du PASSÉ ("Tu as fait ça !")
 *    Quêtes = Direction vers le FUTUR ("Fais ça maintenant !")
 *
 *    Les deux ensemble créent un cercle vertueux :
 *    - Quête → motivation à agir
 *    - Badge → célébration de l'action
 *    - Nouvelle quête → cycle continue !
 *
 * 2. POURQUOI différents types de quêtes ?
 *
 *    - Daily : Crée une HABITUDE quotidienne
 *    - Weekly : Objectifs plus ambitieux, moins de pression
 *    - Main : Donne la BIG PICTURE, le fil conducteur
 *    - Side : Apporte de la VARIÉTÉ, évite la lassitude
 *
 *    Variété = engagement maintenu dans le temps !
 *
 * 3. POURQUOI des prérequis et des chaînes de quêtes ?
 *
 *    Apprentissage progressif !
 *    On ne peut pas faire Java sans comprendre l'algo.
 *    On ne peut pas faire l'algo sans comprendre la logique de base.
 *
 *    Les prérequis forcent une progression LOGIQUE,
 *    pas juste une collection chaotique de badges.
 *
 * Citation de Shigeru Miyamoto (créateur de Mario/Zelda) :
 * "A good game is easy to learn, but hard to master."
 *
 * Les quêtes daily sont faciles (apprendre),
 * Les quêtes main sont difficiles (maîtriser).
 *
 * Bravo ! 🎉 Tous les modèles sont terminés !
 * Prochaine étape : Les SERVICES !
 */
