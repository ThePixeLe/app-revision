/**
 * badge.model.ts
 *
 * Ce fichier définit la structure d'un BADGE (achievement/récompense).
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine les badges scouts, les médailles olympiques, ou les trophées PlayStation.
 * Chaque badge récompense un accomplissement spécifique.
 *
 * Pourquoi les badges fonctionnent-ils ?
 * -------------------------------------
 * Recherches en psychologie (Deterding, 2012) :
 * - Feedback visuel immédiat
 * - Sentiment d'accomplissement
 * - Collection (on veut tous les avoir !)
 * - Statut social (montrer ses badges)
 *
 * Philosophie David J. Malan :
 * "Celebrate every milestone, no matter how small."
 *
 * Note : Ce modèle est déjà inclus dans progress.model.ts,
 * mais on le définit séparément pour plus de clarté et de réutilisabilité.
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

/**
 * Type de badge (catégorie/rareté)
 * -------------------------------
 */
export type BadgeType =
  | 'bronze'    // Facile à obtenir (premiers pas)
  | 'silver'    // Nécessite un peu d'effort
  | 'gold'      // Demande du travail
  | 'platinum'  // Très difficile à obtenir
  | 'special';  // Badges uniques/événementiels

/**
 * Catégorie de badge
 * -----------------
 * Permet de grouper les badges par thème.
 */
export type BadgeCategory =
  | 'progression'   // Liés à la progression (niveaux, XP)
  | 'completion'    // Liés à la complétion (exercices finis)
  | 'mastery'       // Liés à la maîtrise (scores élevés)
  | 'dedication'    // Liés à l'assiduité (streak, temps)
  | 'speed'         // Liés à la rapidité (temps records)
  | 'exploration'   // Liés à l'exploration (essayer tout)
  | 'perfection'    // Liés à la perfection (100% partout)
  | 'special';      // Badges spéciaux/secrets

/**
 * Interface principale : Badge
 * ---------------------------
 */
export interface Badge {
  // ===== IDENTIFICATION =====

  /**
   * Identifiant unique du badge
   * Ex: "first-step", "loop-master", "centurion"
   *
   * Convention de nommage : kebab-case (minuscules avec tirets)
   * Pourquoi ? Plus facile à taper et à lire dans le code !
   */
  id: string;

  /**
   * Nom affiché du badge
   * Ex: "Premier Pas", "Maître des Boucles", "Centurion"
   *
   * C'est ce que l'utilisateur voit dans l'interface.
   * Court et percutant !
   */
  name: string;

  /**
   * Description de comment obtenir le badge
   * Ex: "Terminer ton premier exercice"
   * Ex: "Terminer les 9 exercices sur les boucles"
   *
   * Doit être clair et motivant !
   * L'utilisateur doit comprendre EXACTEMENT quoi faire.
   */
  description: string;

  // ===== CLASSIFICATION =====

  /**
   * Type/rareté du badge
   * Définit la difficulté d'obtention et la valeur perçue.
   */
  type: BadgeType;

  /**
   * Catégorie thématique
   * Permet de filtrer et d'organiser les badges.
   */
  category: BadgeCategory;

  // ===== VISUEL =====

  /**
   * Icône du badge
   * Peut être :
   * - Un emoji : "🎯", "🏆", "⭐", "🔥"
   * - Un nom d'icône Lucide : "trophy", "star", "zap", "award"
   *
   * Pourquoi les deux options ?
   * - Emoji : rapide et universel
   * - Lucide : plus professionnel et cohérent avec l'UI
   */
  icon: string;

  /**
   * Couleur du badge (format hexadécimal)
   * Exemples :
   * - Bronze : "#CD7F32"
   * - Silver : "#C0C0C0"
   * - Gold : "#FFD700"
   * - Platinum : "#E5E4E2"
   *
   * Utilisé pour l'arrière-plan ou la bordure du badge.
   */
  color: string;

  /**
   * Image du badge (optionnel)
   * Chemin vers une image personnalisée
   * Ex: "assets/images/badges/master-badge.png"
   *
   * Si défini, remplace icon + color
   */
  image?: string;

  // ===== DÉBLOCAGE =====

  /**
   * Conditions pour débloquer le badge
   * Structure flexible pour différents types de conditions.
   *
   * Exemples :
   * - { type: 'exercises', count: 1 } → Terminer 1 exercice
   * - { type: 'exercises', count: 100 } → Terminer 100 exercices
   * - { type: 'streak', days: 7 } → 7 jours consécutifs
   * - { type: 'level', level: 10 } → Atteindre niveau 10
   * - { type: 'score', average: 90 } → Moyenne de 90/100
   * - { type: 'subject', subject: 'algo', completion: 100 } → 100% algo
   */
  unlockCondition: {
    type: 'exercises' | 'streak' | 'level' | 'score' | 'subject' | 'time' | 'pomodoro' | 'custom';
    [key: string]: any; // Propriétés additionnelles selon le type
  };

  /**
   * Est-ce que le badge est débloqué ?
   * false par défaut, true une fois les conditions remplies.
   */
  unlocked: boolean;

  /**
   * Date de déblocage
   * undefined si pas encore débloqué
   *
   * Permet de :
   * - Afficher "Obtenu le 25/12/2024"
   * - Trier les badges par date d'obtention
   * - Calculer "Badges obtenus cette semaine"
   */
  unlockedAt?: Date;

  // ===== RÉCOMPENSES =====

  /**
   * XP gagnés en débloquant ce badge
   *
   * Échelle suggérée :
   * - Bronze : 50-100 XP
   * - Silver : 100-250 XP
   * - Gold : 250-500 XP
   * - Platinum : 500-1000 XP
   * - Special : Variable
   *
   * Pourquoi récompenser avec de l'XP ?
   * Double satisfaction : badge + progression niveau !
   */
  xpReward: number;

  // ===== RARETÉ =====

  /**
   * Est-ce un badge caché/secret ?
   *
   * Si true :
   * - N'apparaît pas dans la liste avant d'être débloqué
   * - Effet surprise quand on l'obtient !
   *
   * Exemples de badges cachés :
   * - "Night Owl" : Étudier après minuit
   * - "Sunday Warrior" : Travailler un dimanche
   * - "Perfectionist" : Avoir 100% partout
   *
   * Inspiration : Achievements secrets de Steam/PlayStation
   */
  hidden: boolean;

  /**
   * Rareté du badge (pourcentage d'utilisateurs qui l'ont)
   * Ex: 95.5 (= 95.5% des utilisateurs ont ce badge)
   *
   * Calculé automatiquement en mode multi-utilisateurs.
   * En mode solo : toujours undefined (pas de comparaison possible)
   *
   * Pourquoi c'est important ?
   * - Badges rares (< 5%) = prestige !
   * - "Seulement 2% des joueurs ont ce badge"
   * - Motivation à aller chercher les badges difficiles
   */
  rarity?: number;

  // ===== PROGRESSION =====

  /**
   * Progression actuelle vers ce badge
   * Ex: Si "Centurion" (100 exercices) et tu en as fait 37
   * → progress = 37
   *
   * Permet d'afficher :
   * - "37 / 100 exercices"
   * - Barre de progression : 37%
   * - "Plus que 63 exercices !"
   */
  progress?: number;

  /**
   * Objectif à atteindre
   * Ex: Pour "Centurion" → target = 100
   *
   * Utilisé avec progress pour calculer le pourcentage :
   * percentage = (progress / target) * 100
   */
  target?: number;

  // ===== MÉTADONNÉES =====

  /**
   * Ordre d'affichage
   * Plus le nombre est petit, plus le badge est affiché en premier.
   *
   * Permet de mettre en avant certains badges :
   * - Badges importants : order = 1, 2, 3...
   * - Badges secondaires : order = 100, 101...
   */
  order: number;

  /**
   * Date de création du badge dans le système
   */
  createdAt: Date;
}

/**
 * Badges prédéfinis du système
 * ---------------------------
 * Liste des badges disponibles dans l'application.
 */
export const PREDEFINED_BADGES: Partial<Badge>[] = [
  // ===== BADGES PROGRESSION =====
  {
    id: 'first-step',
    name: 'Premier Pas',
    description: 'Terminer ton premier exercice',
    type: 'bronze',
    category: 'progression',
    icon: '👟',
    color: '#CD7F32',
    unlockCondition: { type: 'exercises', count: 1 },
    xpReward: 50,
    hidden: false,
    order: 1
  },
  {
    id: 'decathlon',
    name: 'Décathlon',
    description: 'Terminer 10 exercices',
    type: 'silver',
    category: 'progression',
    icon: '🏃',
    color: '#C0C0C0',
    unlockCondition: { type: 'exercises', count: 10 },
    xpReward: 100,
    hidden: false,
    order: 2
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Terminer 100 exercices',
    type: 'gold',
    category: 'progression',
    icon: '💯',
    color: '#FFD700',
    unlockCondition: { type: 'exercises', count: 100 },
    xpReward: 500,
    hidden: false,
    order: 3
  },

  // ===== BADGES STREAK =====
  {
    id: 'on-fire',
    name: 'En Feu',
    description: 'Maintenir un streak de 3 jours',
    type: 'bronze',
    category: 'dedication',
    icon: '🔥',
    color: '#FF4500',
    unlockCondition: { type: 'streak', days: 3 },
    xpReward: 75,
    hidden: false,
    order: 10
  },
  {
    id: 'unstoppable',
    name: 'Inarrêtable',
    description: 'Maintenir un streak de 7 jours',
    type: 'gold',
    category: 'dedication',
    icon: '⚡',
    color: '#FFD700',
    unlockCondition: { type: 'streak', days: 7 },
    xpReward: 300,
    hidden: false,
    order: 11
  },

  // ===== BADGES MAÎTRISE =====
  {
    id: 'algebre-master',
    name: 'Maître de l\'Algèbre',
    description: 'Terminer tous les exercices d\'algèbre de Boole',
    type: 'gold',
    category: 'mastery',
    icon: '🔵',
    color: '#3B82F6',
    unlockCondition: { type: 'subject', subject: 'algebre', completion: 100 },
    xpReward: 400,
    hidden: false,
    order: 20
  },
  {
    id: 'algo-master',
    name: 'Maître de l\'Algo',
    description: 'Terminer tous les exercices d\'algorithmique',
    type: 'gold',
    category: 'mastery',
    icon: '🟣',
    color: '#8B5CF6',
    unlockCondition: { type: 'subject', subject: 'algo', completion: 100 },
    xpReward: 400,
    hidden: false,
    order: 21
  },
  {
    id: 'java-master',
    name: 'Maître Java',
    description: 'Terminer tous les exercices Java',
    type: 'gold',
    category: 'mastery',
    icon: '🟢',
    color: '#10B981',
    unlockCondition: { type: 'subject', subject: 'java', completion: 100 },
    xpReward: 400,
    hidden: false,
    order: 22
  },

  // ===== BADGES SPÉCIAUX/CACHÉS =====
  {
    id: 'night-owl',
    name: 'Oiseau de Nuit',
    description: 'Étudier après minuit',
    type: 'special',
    category: 'special',
    icon: '🦉',
    color: '#4B0082',
    unlockCondition: { type: 'custom', condition: 'study_after_midnight' },
    xpReward: 150,
    hidden: true, // Badge secret !
    order: 100
  },
  {
    id: 'perfectionist',
    name: 'Perfectionniste',
    description: 'Obtenir 100% à tous les exercices',
    type: 'platinum',
    category: 'perfection',
    icon: '💎',
    color: '#E5E4E2',
    unlockCondition: { type: 'score', average: 100, all: true },
    xpReward: 1000,
    hidden: true,
    order: 101
  }
];

/**
 * Fonction utilitaire : vérifier si un badge peut être débloqué
 * -----------------------------------------------------------
 * Évalue les conditions et retourne true/false.
 *
 * @param badge - Le badge à vérifier
 * @param userStats - Statistiques de l'utilisateur
 * @returns true si le badge peut être débloqué
 */
export function canUnlockBadge(badge: Badge, userStats: any): boolean {
  // Si déjà débloqué, retourne false
  if (badge.unlocked) return false;

  const condition = badge.unlockCondition;

  switch (condition.type) {
    case 'exercises':
      return userStats.exercisesCompleted >= condition['count'];

    case 'streak':
      return userStats.currentStreak >= condition['days'];

    case 'level':
      return userStats.level >= condition['level'];

    case 'score':
      return userStats.averageScore >= condition['average'];

    case 'subject':
      const subjectProgress = userStats.bySubject[condition['subject']];
      return subjectProgress && subjectProgress.percentage >= condition['completion'];

    case 'time':
      return userStats.totalHours >= condition['hours'];

    case 'pomodoro':
      return userStats.pomodoroSessions >= condition['count'];

    case 'custom':
      // Pour les badges spéciaux, logique personnalisée
      // À implémenter selon les besoins
      return false;

    default:
      return false;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI des badges de différentes raretés ?
 *
 *    Psychologie de la collection :
 *    - Bronze : Accessibles → Confiance initiale
 *    - Silver : Atteignables → Sentiment de progression
 *    - Gold : Challenging → Fierté d'accomplissement
 *    - Platinum : Prestige → Statut d'élite
 *
 *    Tout le monde peut avoir des badges bronze,
 *    mais seuls les plus dévoués auront les platinum !
 *
 * 2. POURQUOI des badges cachés ?
 *
 *    Élément de surprise et de découverte !
 *    "Oh ! Je ne savais pas qu'il y avait un badge pour ça !"
 *
 *    Encourage l'exploration et évite la lassitude.
 *    Si tous les badges sont visibles dès le début,
 *    ça peut être décourageant (trop de choix).
 *
 * 3. POURQUOI récompenser avec de l'XP ?
 *
 *    Renforcement positif double :
 *    Badge = Récompense symbolique (statut, fierté)
 *    XP = Récompense concrète (progression visible)
 *
 *    Les deux ensemble = Motivation maximale !
 *
 * Citation de Jane McGonigal (game designer) :
 * "When we're playing a game, we're actively trying to solve problems.
 *  That's what makes games feel rewarding."
 *
 * Les badges transforment l'apprentissage en "jeu" avec des problèmes à résoudre.
 *
 * Prochaine étape : Quest Model (dernier modèle !)
 */
