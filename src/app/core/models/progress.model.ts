/**
 * progress.model.ts
 *
 * Ce fichier définit la structure de la PROGRESSION GLOBALE de l'utilisateur.
 * C'est le système de gamification complet : XP, niveaux, badges, quêtes, stats.
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine un jeu vidéo RPG (Role Playing Game) :
 * - Tu gagnes de l'XP en faisant des quêtes
 * - Tu montes de niveau
 * - Tu débloques des badges/achievements
 * - Tu vois tes statistiques détaillées
 *
 * C'est EXACTEMENT pareil ici, mais pour l'apprentissage !
 *
 * Pourquoi la gamification fonctionne-t-elle ?
 * ------------------------------------------
 * Recherches en psychologie cognitive (Deci & Ryan, 2000) :
 * - Motivation intrinsèque > motivation extrinsèque
 * - Le feedback immédiat améliore l'apprentissage de 30%
 * - Les objectifs clairs augmentent la persévérance de 50%
 * - La progression visible booste la dopamine (hormone du plaisir)
 *
 * Citation de David J. Malan :
 * "Make learning fun, and students will learn more."
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

/**
 * Interface Badge (Achievement)
 * ----------------------------
 * Représente un badge débloqué par l'utilisateur.
 */
export interface Badge {
  // Identifiant unique du badge
  id: string;

  // Nom du badge
  // Ex: "Premier Pas", "Maître des Boucles", "Centurion" (100 exercices)
  name: string;

  // Description de comment l'obtenir
  // Ex: "Terminer ton premier exercice"
  description: string;

  // Type de badge (catégorie)
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'special';

  // Icône (emoji ou nom d'icône Lucide)
  // Ex: "🎯", "trophy", "star"
  icon: string;

  // Couleur associée (hex)
  // Ex: "#CD7F32" (bronze), "#C0C0C0" (silver), "#FFD700" (gold)
  color: string;

  // Date de déblocage
  // undefined si pas encore débloqué
  unlockedAt?: Date;

  // Récompense en XP pour avoir débloqué ce badge
  // Ex: 100 XP pour "Premier Pas", 500 XP pour "Centurion"
  xpReward: number;

  // Est-ce un badge caché ? (surprise)
  // Ex: Badge spécial pour avoir étudié un dimanche
  hidden: boolean;

  // Rareté du badge (pourcentage d'utilisateurs qui l'ont)
  // Ex: 95% ont "Premier Pas", mais seulement 5% ont "Perfectionniste"
  rarity?: number;
}

/**
 * Interface Quest (Quête)
 * ----------------------
 * Représente une quête/mission à accomplir.
 */
export interface Quest {
  // Identifiant unique de la quête
  id: string;

  // Titre de la quête
  // Ex: "Le Marathon des Algorithmes", "Semaine Parfaite"
  title: string;

  // Description détaillée
  // Ex: "Termine 20 exercices d'algorithmique en 1 semaine"
  description: string;

  // Type de quête
  // daily : quête quotidienne (réinitialisée chaque jour)
  // weekly : quête hebdomadaire
  // main : quête principale du programme
  // side : quête secondaire (bonus)
  type: 'daily' | 'weekly' | 'main' | 'side';

  // Objectif à atteindre
  // Ex: { type: 'exercices', target: 20, current: 8 }
  objective: {
    type: 'exercices' | 'pomodoros' | 'streak' | 'score' | 'time';
    target: number;    // Objectif à atteindre
    current: number;   // Progression actuelle
  };

  // Récompenses
  rewards: {
    xp: number;           // XP gagnés
    badge?: string;       // Badge débloqué (ID)
    special?: string;     // Récompense spéciale (texte libre)
  };

  // Statut de la quête
  status: 'locked' | 'available' | 'in-progress' | 'completed';

  // Date limite (pour daily/weekly)
  deadline?: Date;

  // Date de début (pour savoir depuis quand elle est active)
  startedAt?: Date;

  // Date de complétion
  completedAt?: Date;

  // Difficulté (1 à 5)
  difficulty: number;
}

/**
 * Statistiques par matière
 * ------------------------
 * Stats détaillées pour une phase (Algèbre, Algo, Java).
 */
export interface SubjectProgress {
  // Nom de la matière
  subject: 'algebre' | 'algo' | 'java' | 'consolidation';

  // Nombre d'exercices terminés
  completed: number;

  // Nombre total d'exercices
  total: number;

  // Pourcentage de complétion (0-100)
  // Calculé automatiquement : (completed / total) * 100
  percentage: number;

  // Score moyen obtenu (sur 100)
  averageScore: number;

  // Temps total passé (en minutes)
  timeSpent: number;

  // Nombre de sessions Pomodoro
  pomodoroSessions: number;

  // Niveau de maîtrise (calculé selon plusieurs critères)
  // beginner : 0-30% fait
  // intermediate : 31-60% fait
  // advanced : 61-90% fait
  // expert : 91-100% fait avec score > 80
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  // Dernière activité
  lastActivity?: Date;

  // Graphique d'évolution (tableau de points de données)
  // Ex: [{ date: '2024-12-23', score: 6 }, { date: '2024-12-24', score: 7 }]
  progressHistory: Array<{
    date: Date;
    score: number;
    exercisesCompleted: number;
  }>;
}

/**
 * Interface principale : Progress
 * ------------------------------
 * Représente toute la progression de l'utilisateur.
 */
export interface Progress {
  // ===== IDENTIFICATION =====

  /**
   * ID de l'utilisateur
   * Pour l'instant c'est "user-1" (un seul utilisateur local)
   * Mais préparé pour le multi-utilisateurs futur !
   */
  userId: string;

  // ===== SYSTÈME XP ET NIVEAUX =====

  /**
   * Points d'expérience totaux
   *
   * Comment gagner de l'XP ?
   * - Terminer un exercice : 10-50 XP (selon difficulté)
   * - Faire une session Pomodoro : 5 XP
   * - Compléter une journée : 100 XP
   * - Réviser un exercice : 20 XP
   * - Débloquer un badge : 50-500 XP (selon rareté)
   * - Compléter une quête : 100-1000 XP (selon difficulté)
   *
   * Pourquoi l'XP ?
   * - Feedback immédiat : tu VOIS ta progression
   * - Motivation : "Encore 50 XP pour le niveau 5 !"
   * - Comparaison (avec soi-même) : "J'ai gagné 500 XP cette semaine !"
   */
  totalXP: number;

  /**
   * Niveau actuel (1 à 50+)
   *
   * Formule de calcul du niveau :
   * Level = floor(sqrt(totalXP / 100)) + 1
   *
   * Tableau de correspondance :
   * Niveau 1  : 0-99 XP
   * Niveau 2  : 100-399 XP
   * Niveau 3  : 400-899 XP
   * Niveau 4  : 900-1599 XP
   * Niveau 5  : 1600-2499 XP
   * ...
   * Niveau 10 : 9900-10999 XP
   *
   * Pourquoi cette formule ?
   * - Au début : on monte vite (motivation !)
   * - Ensuite : ça ralentit (challenge approprié)
   * - C'est la courbe classique des RPG
   */
  level: number;

  /**
   * XP actuel dans le niveau en cours
   * Ex: Si tu as 450 XP total, tu es niveau 3 avec 50 XP dans ce niveau
   * (car niveau 3 commence à 400 XP)
   */
  currentLevelXP: number;

  /**
   * XP requis pour le prochain niveau
   * Ex: Si tu es niveau 3, il faut 500 XP de plus pour niveau 4
   * (car niveau 4 commence à 900 XP, et tu es à 400 XP)
   */
  xpToNextLevel: number;

  // ===== STREAK (SÉRIE) =====

  /**
   * Nombre de jours consécutifs d'apprentissage
   *
   * Ex: Si tu travailles le 23, 24, 25, 26 décembre → streak = 4 jours
   * Si tu sautes le 27 → streak revient à 0 le 28
   *
   * Pourquoi le streak est important ?
   * Recherches montrent que la régularité > intensité ponctuelle
   * Mieux vaut 1h par jour pendant 10 jours
   * Que 10h d'un coup puis rien pendant 9 jours !
   *
   * Inspiration : Duolingo, GitHub, Snapchat...
   * Le streak crée une HABITUDE.
   */
  streak: number;

  /**
   * Meilleur streak de tous les temps
   * Ex: 14 jours (record personnel)
   *
   * Pourquoi stocker le record ?
   * - Fierté : "Mon record est 14 jours !"
   * - Objectif : "Je veux battre mon record !"
   */
  bestStreak: number;

  /**
   * Date de la dernière activité
   * Utilisé pour calculer si le streak continue ou se brise
   */
  lastActivityDate: Date;

  // ===== BADGES ET ACHIEVEMENTS =====

  /**
   * Liste de tous les badges
   * Inclut les badges débloqués ET ceux à débloquer
   */
  badges: Badge[];

  /**
   * Badges récemment débloqués (dernières 24h)
   * Pour les afficher avec une animation "NEW!" dans l'interface
   */
  recentBadges: string[]; // IDs des badges

  // ===== QUÊTES =====

  /**
   * Liste de toutes les quêtes
   * Inclut les quêtes actives, complétées et à venir
   */
  quests: Quest[];

  /**
   * Quête principale en cours
   * Ex: "Terminer la phase Algèbre de Boole"
   */
  currentMainQuest?: string; // ID de la quête

  // ===== STATISTIQUES GLOBALES =====

  /**
   * Statistiques générales
   */
  stats: {
    // Temps total passé sur l'app (en minutes)
    // Inclut : exercices, révisions, évaluations, lectures
    totalHours: number;

    // Nombre total d'exercices terminés
    exercisesCompleted: number;

    // Nombre total d'exercices disponibles
    totalExercises: number;

    // Pourcentage global de complétion
    globalCompletion: number;

    // Score moyen sur tous les exercices (sur 100)
    averageScore: number;

    // Nombre de sessions Pomodoro effectuées
    pomodoroSessions: number;

    // Nombre d'évaluations faites
    evaluationsCompleted: number;

    // Nombre de révisions effectuées
    revisionsCompleted: number;

    // Statistiques par matière
    bySubject: {
      algebre: SubjectProgress;
      algo: SubjectProgress;
      java: SubjectProgress;
      consolidation: SubjectProgress;
    };

    // Meilleur jour (date où tu as gagné le plus d'XP)
    bestDay?: {
      date: Date;
      xpEarned: number;
      exercisesCompleted: number;
    };

    // Graphique de progression globale (30 derniers jours)
    progressChart: Array<{
      date: Date;
      xp: number;
      exercises: number;
      time: number;
    }>;
  };

  // ===== PRÉFÉRENCES ET OBJECTIFS =====

  /**
   * Objectif quotidien (personnalisable)
   * Ex: { exercises: 3, pomodoros: 4, time: 120 }
   *
   * Pourquoi des objectifs quotidiens ?
   * - Donne une direction claire chaque jour
   * - Évite l'overwhelm : "Juste 3 exercices aujourd'hui"
   * - Sentiment d'accomplissement : cocher la case ✅
   */
  dailyGoal: {
    exercises: number;    // Nombre d'exercices à faire
    pomodoros: number;    // Nombre de Pomodoros
    time: number;         // Temps à passer (minutes)
  };

  /**
   * Objectif atteint aujourd'hui ?
   */
  dailyGoalAchieved: boolean;

  /**
   * Nombre de jours où l'objectif a été atteint
   * Ex: 8 jours sur les 10 derniers
   */
  goalsAchievedCount: number;

  // ===== LEADERBOARD (CLASSEMENT) =====

  /**
   * Position dans le classement global
   * (Pour l'instant, c'est toujours 1 car utilisateur unique)
   * Mais préparé pour le futur !
   */
  rank?: number;

  /**
   * Nombre total d'utilisateurs (pour le classement)
   */
  totalUsers?: number;

  // ===== MÉTADONNÉES =====

  /**
   * Date de début du programme
   * Ex: 25 décembre 2024
   */
  startDate: Date;

  /**
   * Date de fin prévue du programme
   * Ex: 4 janvier 2025 (12 jours après)
   */
  endDate: Date;

  /**
   * Jour actuel du programme (1 à 12)
   */
  currentDay: number;

  /**
   * Date de création du profil
   */
  createdAt: Date;

  /**
   * Date de dernière mise à jour
   */
  updatedAt: Date;
}

/**
 * Fonction utilitaire : calculer le niveau depuis l'XP
 * ---------------------------------------------------
 * Utilise la formule mathématique pour déterminer le niveau.
 *
 * @param xp - Points d'expérience totaux
 * @returns Le niveau correspondant
 */
export function calculateLevel(xp: number): number {
  // Formule : Level = floor(sqrt(XP / 100)) + 1
  // Pourquoi cette formule ? Progression logarithmique
  // Au début on monte vite, puis ça ralentit
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Fonction utilitaire : calculer l'XP requis pour un niveau
 * --------------------------------------------------------
 * Calcule combien d'XP il faut pour atteindre un niveau donné.
 *
 * @param level - Le niveau cible
 * @returns XP requis pour ce niveau
 */
export function xpRequiredForLevel(level: number): number {
  // Formule inverse : XP = ((Level - 1)^2) * 100
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Fonction utilitaire : calculer la progression dans le niveau actuel
 * ------------------------------------------------------------------
 * Retourne un pourcentage (0-100) de progression dans le niveau.
 *
 * @param progress - Objet Progress
 * @returns Pourcentage de progression (0-100)
 */
export function calculateLevelProgress(progress: Progress): number {
  const currentLevelXP = progress.currentLevelXP;
  const xpToNext = progress.xpToNextLevel;

  // Si pas d'XP requis (niveau max atteint ?), retourne 100%
  if (xpToNext === 0) return 100;

  // Calcule le pourcentage
  const percentage = (currentLevelXP / (currentLevelXP + xpToNext)) * 100;

  // Arrondit à 1 décimale
  return Math.round(percentage * 10) / 10;
}

/**
 * Fonction utilitaire : vérifier le streak
 * ---------------------------------------
 * Détermine si le streak est toujours actif ou brisé.
 *
 * @param lastActivityDate - Date de dernière activité
 * @returns true si le streak est actif, false s'il est brisé
 */
export function isStreakActive(lastActivityDate: Date): boolean {
  const now = new Date();
  const lastActivity = new Date(lastActivityDate);

  // Réinitialise les heures pour comparer juste les dates
  now.setHours(0, 0, 0, 0);
  lastActivity.setHours(0, 0, 0, 0);

  // Calcule la différence en jours
  const diffTime = now.getTime() - lastActivity.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Streak actif si :
  // - Activité aujourd'hui (diffDays = 0)
  // - Activité hier (diffDays = 1)
  // Sinon, streak brisé !
  return diffDays <= 1;
}

/**
 * Fonction utilitaire : calculer l'XP gagné pour un exercice
 * ---------------------------------------------------------
 * Calcule combien d'XP donner selon la difficulté et le score.
 *
 * @param difficulty - Difficulté de l'exercice
 * @param score - Score obtenu (sur 100)
 * @param isFirstAttempt - Est-ce la 1ère tentative ?
 * @returns XP à attribuer
 */
export function calculateExerciseXP(
  difficulty: 'facile' | 'moyen' | 'difficile' | 'expert',
  score: number,
  isFirstAttempt: boolean
): number {
  // XP de base selon difficulté
  let baseXP = 0;
  switch (difficulty) {
    case 'facile': baseXP = 10; break;
    case 'moyen': baseXP = 25; break;
    case 'difficile': baseXP = 40; break;
    case 'expert': baseXP = 60; break;
  }

  // Bonus selon le score
  // Score parfait (100) : +50% XP
  // Score moyen (70) : +20% XP
  // Score faible (50) : +0% XP
  const scoreBonus = Math.max(0, (score - 50) / 100);

  // Bonus 1ère tentative : +20% XP
  const firstAttemptBonus = isFirstAttempt ? 0.2 : 0;

  // Calcul final
  const totalXP = baseXP * (1 + scoreBonus + firstAttemptBonus);

  // Arrondit à l'entier
  return Math.round(totalXP);
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI la gamification fonctionne-t-elle ?
 *
 *    Neurosciences : La progression visible déclenche la dopamine
 *    (hormone du plaisir et de la motivation).
 *
 *    Quand tu montes de niveau ou débloques un badge,
 *    ton cerveau reçoit une RÉCOMPENSE chimique.
 *    C'est la même sensation que dans les jeux vidéo !
 *
 * 2. POURQUOI le streak (série) est-il si efficace ?
 *
 *    Psychologie comportementale : La peur de perdre > envie de gagner
 *
 *    "Ne casse pas ta série de 10 jours !"
 *    → Plus motivant que "Commence une série"
 *
 *    C'est l'effet "Loss Aversion" de Kahneman & Tversky.
 *
 * 3. POURQUOI des badges ET des quêtes ?
 *
 *    Badges = reconnaissance du passé ("Tu as fait ça !")
 *    Quêtes = direction vers le futur ("Fais ça maintenant !")
 *
 *    Les deux ensemble créent un équilibre motivation :
 *    - Célébrer les victoires (badges)
 *    - Guider vers l'action (quêtes)
 *
 * 4. POURQUOI des objectifs quotidiens personnalisables ?
 *
 *    Théorie de l'autodétermination (Deci & Ryan) :
 *    L'autonomie augmente la motivation intrinsèque.
 *
 *    Si TU choisis ton objectif (3 exercices ou 5 ?),
 *    tu t'engages davantage que si c'est imposé.
 *
 * Citation de B.F. Skinner (psychologue comportementaliste) :
 * "The consequences of behavior determine the probability
 *  that the behavior will occur again."
 *
 * Traduction : Si faire un exercice → XP, badges, progression visible
 * → Tu auras envie de faire plus d'exercices !
 *
 * C'est du "renforcement positif" en action.
 *
 * Prochaine étape : Badge Model (plus simple, promis !)
 */
