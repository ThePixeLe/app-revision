/**
 * evaluation.model.ts
 *
 * Modèle de données pour l'AUTO-ÉVALUATION par chapitre.
 *
 * Qu'est-ce que l'auto-évaluation ?
 * ---------------------------------
 * C'est la capacité à juger objectivement sa propre compréhension.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine un joueur de tennis qui analyse son propre match :
 * - "Mon service est bon" ✅
 * - "Mon revers a besoin de travail" ⚠️
 * - "Je dois demander au coach comment améliorer mon jeu au filet" 💬
 *
 * Ce modèle représente EXACTEMENT ça, mais pour l'apprentissage !
 *
 * Contexte du projet :
 * -------------------
 * À la fin de chaque chapitre (ou pendant l'apprentissage), tu peux :
 * 1. Noter ta compréhension sur 10
 * 2. Lister ce que tu maîtrises
 * 3. Lister ce qui reste flou
 * 4. Formuler des questions pour ton formateur
 *
 * Pourquoi c'est important ?
 * -------------------------
 * La MÉTACOGNITION (penser à sa propre pensée) est la compétence
 * qui distingue les étudiants efficaces des autres.
 *
 * Recherche de Dunning-Kruger (1999) :
 * - Les incompétents surestiment leurs capacités
 * - Les compétents sous-estiment les leurs
 *
 * L'auto-évaluation régulière combat ce biais !
 *
 * Philosophie David J. Malan :
 * "The most successful students are those who know what they don't know."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

// ============================================================
// TYPES ET ÉNUMÉRATIONS
// ============================================================

/**
 * CATÉGORIE D'ÉVALUATION
 * ----------------------
 * Correspond aux trois grandes matières du cours.
 *
 * Pourquoi ces trois catégories ?
 * ------------------------------
 * 1. algebre → Fondation théorique (logique, Boole)
 * 2. algo → Réflexion algorithmique (pseudo-code)
 * 3. java → Implémentation pratique (code réel)
 *
 * C'est une progression naturelle :
 * Théorie → Réflexion → Pratique
 */
export type EvaluationCategory = 'algebre' | 'algo' | 'java';

/**
 * NIVEAU DE SCORE
 * ---------------
 * Interprétation des scores sur 10.
 *
 * Barème d'interprétation :
 * ------------------------
 * 1-3 : "Je ne comprends pas du tout"
 *       → Action : Reprendre le cours depuis le début
 *
 * 4-5 : "Je comprends les bases mais j'hésite beaucoup"
 *       → Action : Refaire les exercices de base
 *
 * 6-7 : "Je maîtrise avec quelques hésitations"
 *       → Action : Pratiquer avec des exercices variés
 *
 * 8-9 : "Je maîtrise bien"
 *       → Action : Passer aux exercices avancés
 *
 * 10 : "Je pourrais l'expliquer à quelqu'un d'autre"
 *      → Action : Aider les autres / Passer au sujet suivant
 *
 * Principe de Feynman :
 * "Si tu ne peux pas l'expliquer simplement,
 *  c'est que tu ne le comprends pas assez bien."
 */
export type ScoreLevel =
  | 'needs-work'   // 1-3 : Besoin de beaucoup de travail
  | 'average'      // 4-5 : Moyen, des lacunes importantes
  | 'good'         // 6-7 : Bien, quelques points à revoir
  | 'excellent';   // 8-10 : Excellent, prêt pour l'examen

// ============================================================
// INTERFACES PRINCIPALES
// ============================================================

/**
 * CHAPITRE À ÉVALUER
 * ------------------
 * Représente un chapitre du cours pouvant être évalué.
 *
 * Structure du cours :
 * -------------------
 * - Algèbre de Boole (2 chapitres)
 * - Algorithmique (4 chapitres)
 * - Java (4 chapitres)
 *
 * Chaque chapitre contient des "topics" (sujets) spécifiques
 * qui servent de suggestions pour l'auto-évaluation.
 */
export interface EvaluationChapter {
  /**
   * Identifiant unique du chapitre
   * Format : "{categorie}-{numero}"
   * Exemples : "alg-01", "algo-02", "java-03"
   */
  id: string;

  /**
   * Nom du chapitre
   * Exemple : "Tables de vérité", "Boucles", "Tableaux Java"
   */
  name: string;

  /**
   * Catégorie du chapitre
   */
  category: EvaluationCategory;

  /**
   * Sujets couverts dans ce chapitre
   * ---------------------------------
   * Liste des concepts/sujets du chapitre.
   *
   * Utilité :
   * - Suggestions pour "Points maîtrisés"
   * - Suggestions pour "Points à revoir"
   * - Checklist de révision
   *
   * Exemple pour "Boucles" :
   * ['Pour', 'Tant que', 'Répéter...Jusqu\'à', 'Boucles imbriquées']
   */
  topics: string[];

  /**
   * Le chapitre a-t-il déjà été évalué ?
   * -----------------------------------
   * Permet d'afficher un indicateur visuel.
   *
   * false = 📝 (à évaluer)
   * true = ✅ (déjà évalué)
   */
  hasEvaluation: boolean;

  /**
   * Dernière note obtenue (si évalué)
   * ---------------------------------
   * Affichée pour référence rapide.
   */
  lastScore?: number;

  /**
   * Date de dernière évaluation
   */
  lastEvaluatedAt?: Date;
}

/**
 * AUTO-ÉVALUATION
 * ---------------
 * L'interface principale : une évaluation complète d'un chapitre.
 *
 * C'est le cœur du système de métacognition !
 *
 * Structure en 5 parties :
 * -----------------------
 * 1. Identification → Quel chapitre ?
 * 2. Note globale → Score sur 10
 * 3. Points maîtrisés → Ce que tu sais faire ✅
 * 4. Points à revoir → Ce qui reste flou ⚠️
 * 5. Questions → Ce que tu veux demander 💬
 */
export interface Evaluation {
  // ===== IDENTIFICATION =====

  /**
   * Identifiant unique de l'évaluation
   * Format : "eval-{timestamp}"
   */
  id: string;

  /**
   * ID du chapitre évalué
   * Référence vers EvaluationChapter.id
   */
  chapterId: string;

  /**
   * Nom du chapitre (dénormalisé pour affichage)
   * ---------------------------------------------
   * Pourquoi dupliquer cette info ?
   *
   * → Performance : Évite de chercher le chapitre à chaque affichage
   * → Historique : Si le nom du chapitre change, l'historique reste lisible
   *
   * C'est un compromis classique : espace vs performance
   */
  chapterName: string;

  /**
   * Catégorie du chapitre
   */
  category: EvaluationCategory;

  // ===== NOTE GLOBALE =====

  /**
   * Score d'auto-évaluation (1-10)
   * -----------------------------
   * La note que tu te donnes pour ce chapitre.
   *
   * Conseils pour s'auto-évaluer honnêtement :
   * -----------------------------------------
   * 1. Pense à un exercice typique du chapitre
   * 2. Demande-toi : "Pourrais-je le faire SANS aide ?"
   * 3. Sois honnête - c'est pour toi, pas pour les autres
   *
   * Attention au biais de surconfiance !
   * En cas de doute, note un point de moins.
   */
  score: number;

  // ===== POINTS MAÎTRISÉS =====

  /**
   * Ce que tu maîtrises bien
   * -----------------------
   * Liste des concepts/compétences que tu as compris.
   *
   * Pourquoi c'est important ?
   * -------------------------
   * 1. CONFIANCE : Tu vois que tu sais des choses !
   * 2. BASE : Ce sont les fondations pour la suite
   * 3. EXAMEN : Tu sais ce que tu n'as pas besoin de réviser
   *
   * Exemples :
   * - "Je sais faire une table de vérité simple"
   * - "Je comprends la boucle for"
   * - "Je sais déclarer un tableau en Java"
   */
  mastered: string[];

  // ===== POINTS À REVOIR =====

  /**
   * Ce qui reste à travailler
   * -------------------------
   * Liste des concepts/compétences qui restent flous.
   *
   * Pourquoi c'est important ?
   * -------------------------
   * 1. DIRECTION : Tu sais exactement quoi réviser
   * 2. PRIORITÉ : Les points faibles d'abord
   * 3. PROGRÈS : Tu peux suivre ta progression
   *
   * Exemples :
   * - "Je confonds ET et OU dans certains cas"
   * - "Les boucles imbriquées me posent problème"
   * - "Je ne comprends pas quand utiliser while vs for"
   *
   * Astuce :
   * -------
   * Plus tu es précis, plus tu pourras cibler ta révision.
   * "Je ne comprends pas les boucles" → Trop vague
   * "Je ne sais pas quand la condition est évaluée dans do-while" → Précis !
   */
  toReview: string[];

  // ===== QUESTIONS =====

  /**
   * Questions pour le formateur
   * ---------------------------
   * Les questions que tu veux poser.
   *
   * Pourquoi noter les questions ?
   * -----------------------------
   * 1. Tu les oublies souvent avant le cours suivant
   * 2. Tu peux les envoyer par email avant la séance
   * 3. C'est une preuve de réflexion active
   *
   * Types de bonnes questions :
   * - "Pourquoi... ?" (comprendre le raisonnement)
   * - "Quelle est la différence entre... ?" (clarifier)
   * - "Comment savoir quand... ?" (appliquer)
   * - "Que se passe-t-il si... ?" (explorer les cas limites)
   *
   * Mauvaise question : "Je ne comprends pas"
   * Bonne question : "Je ne comprends pas pourquoi on utilise
   *                   < et pas <= dans la condition de la boucle for"
   */
  questionsForTeacher: string[];

  // ===== NOTES PERSONNELLES =====

  /**
   * Notes libres
   * ------------
   * Espace pour toute remarque personnelle.
   *
   * Exemples d'utilisation :
   * - Difficultés rencontrées
   * - Temps passé sur le chapitre
   * - Ressources utiles trouvées
   * - Liens avec d'autres sujets
   */
  notes: string;

  // ===== MÉTADONNÉES =====

  /**
   * Date de création de l'évaluation
   */
  evaluatedAt: Date;

  /**
   * Date de dernière modification
   * -----------------------------
   * Permet de savoir si l'évaluation a été mise à jour.
   */
  updatedAt?: Date;
}

// ============================================================
// INTERFACES DE STATISTIQUES
// ============================================================

/**
 * STATISTIQUES D'AUTO-ÉVALUATION
 * ------------------------------
 * Vue d'ensemble des évaluations.
 *
 * Utilité :
 * --------
 * - Tableau de bord de progression
 * - Identifier les matières faibles
 * - Suivre l'évolution dans le temps
 */
export interface EvaluationStats {
  /**
   * Score moyen global (sur 10)
   */
  averageScore: number;

  /**
   * Nombre total d'évaluations effectuées
   */
  totalEvaluations: number;

  /**
   * Nombre de chapitres disponibles
   */
  totalChapters: number;

  /**
   * Pourcentage de chapitres évalués
   */
  evaluationPercentage: number;

  /**
   * Nombre de chapitres à revoir (score < 6)
   * ----------------------------------------
   * Un score < 6 indique une maîtrise insuffisante
   * pour être confiant à l'examen.
   */
  chaptersToReview: number;

  /**
   * Statistiques par catégorie
   * -------------------------
   * Permet d'identifier les matières problématiques.
   */
  byCategory: {
    [key in EvaluationCategory]: {
      averageScore: number;
      totalEvaluations: number;
      totalChapters: number;
    };
  };

  /**
   * Évolution dans le temps
   * ----------------------
   * Pour afficher un graphique de progression.
   */
  history?: {
    date: Date;
    averageScore: number;
  }[];
}

/**
 * RÉSUMÉ D'UNE ÉVALUATION
 * -----------------------
 * Version allégée pour les listes et aperçus.
 */
export interface EvaluationSummary {
  id: string;
  chapterId: string;
  chapterName: string;
  category: EvaluationCategory;
  score: number;
  masteredCount: number;
  toReviewCount: number;
  questionsCount: number;
  evaluatedAt: Date;
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * OBTENIR LE NIVEAU DE SCORE
 * --------------------------
 * Convertit un score numérique en niveau qualitatif.
 *
 * @param score - Score sur 10
 * @returns Niveau correspondant
 *
 * Exemple :
 * ```typescript
 * getScoreLevel(8); // 'excellent'
 * getScoreLevel(5); // 'average'
 * getScoreLevel(2); // 'needs-work'
 * ```
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'average';
  return 'needs-work';
}

/**
 * OBTENIR LE LABEL DU NIVEAU
 * --------------------------
 * Retourne un label lisible avec emoji.
 *
 * @param level - Niveau de score
 * @returns Label avec emoji
 */
export function getScoreLevelLabel(level: ScoreLevel): string {
  const labels: { [key in ScoreLevel]: string } = {
    'needs-work': '🔴 À travailler',
    'average': '🟡 Moyen',
    'good': '🟢 Bien',
    'excellent': '⭐ Excellent'
  };

  return labels[level];
}

/**
 * OBTENIR LA COULEUR DE LA CATÉGORIE
 * ----------------------------------
 * Pour l'affichage cohérent dans l'UI.
 *
 * @param category - Catégorie
 * @returns Code couleur hexadécimal
 */
export function getCategoryColor(category: EvaluationCategory): string {
  const colors: { [key in EvaluationCategory]: string } = {
    'algebre': '#3b82f6',  // Bleu
    'algo': '#8b5cf6',     // Violet
    'java': '#10b981'      // Vert
  };

  return colors[category];
}

/**
 * OBTENIR LE LABEL DE LA CATÉGORIE
 * --------------------------------
 * Retourne le nom complet de la catégorie.
 *
 * @param category - Catégorie
 * @returns Nom complet avec emoji
 */
export function getCategoryLabel(category: EvaluationCategory): string {
  const labels: { [key in EvaluationCategory]: string } = {
    'algebre': '🔵 Algèbre de Boole',
    'algo': '🟣 Algorithmique',
    'java': '🟢 Java'
  };

  return labels[category];
}

/**
 * CALCULER LES STATISTIQUES
 * -------------------------
 * Génère les statistiques à partir des évaluations.
 *
 * @param evaluations - Liste des évaluations
 * @param chapters - Liste des chapitres
 * @returns Statistiques complètes
 */
export function calculateEvaluationStats(
  evaluations: Evaluation[],
  chapters: EvaluationChapter[]
): EvaluationStats {
  // Initialisation
  const stats: EvaluationStats = {
    averageScore: 0,
    totalEvaluations: evaluations.length,
    totalChapters: chapters.length,
    evaluationPercentage: 0,
    chaptersToReview: 0,
    byCategory: {
      algebre: { averageScore: 0, totalEvaluations: 0, totalChapters: 0 },
      algo: { averageScore: 0, totalEvaluations: 0, totalChapters: 0 },
      java: { averageScore: 0, totalEvaluations: 0, totalChapters: 0 }
    }
  };

  // Si pas d'évaluations, retourne les stats vides
  if (evaluations.length === 0) {
    // Compte juste les chapitres par catégorie
    chapters.forEach(ch => {
      stats.byCategory[ch.category].totalChapters++;
    });
    return stats;
  }

  // Calcul du score moyen global
  const totalScore = evaluations.reduce((sum, ev) => sum + ev.score, 0);
  stats.averageScore = Math.round((totalScore / evaluations.length) * 10) / 10;

  // Pourcentage d'évaluation
  stats.evaluationPercentage = Math.round(
    (evaluations.length / chapters.length) * 100
  );

  // Chapitres à revoir (score < 6)
  stats.chaptersToReview = evaluations.filter(ev => ev.score < 6).length;

  // Statistiques par catégorie
  chapters.forEach(ch => {
    stats.byCategory[ch.category].totalChapters++;
  });

  evaluations.forEach(ev => {
    stats.byCategory[ev.category].totalEvaluations++;
  });

  // Score moyen par catégorie
  (['algebre', 'algo', 'java'] as EvaluationCategory[]).forEach(cat => {
    const catEvaluations = evaluations.filter(ev => ev.category === cat);
    if (catEvaluations.length > 0) {
      const catTotal = catEvaluations.reduce((sum, ev) => sum + ev.score, 0);
      stats.byCategory[cat].averageScore =
        Math.round((catTotal / catEvaluations.length) * 10) / 10;
    }
  });

  return stats;
}

/**
 * CRÉER UN RÉSUMÉ D'ÉVALUATION
 * ----------------------------
 * Convertit une évaluation complète en résumé.
 *
 * @param evaluation - Évaluation complète
 * @returns Résumé allégé
 */
export function createEvaluationSummary(
  evaluation: Evaluation
): EvaluationSummary {
  return {
    id: evaluation.id,
    chapterId: evaluation.chapterId,
    chapterName: evaluation.chapterName,
    category: evaluation.category,
    score: evaluation.score,
    masteredCount: evaluation.mastered.length,
    toReviewCount: evaluation.toReview.length,
    questionsCount: evaluation.questionsForTeacher.filter(q => q.trim()).length,
    evaluatedAt: evaluation.evaluatedAt
  };
}

/**
 * CRÉER UNE NOUVELLE ÉVALUATION
 * -----------------------------
 * Factory function avec valeurs par défaut.
 *
 * @param chapter - Chapitre à évaluer
 * @returns Nouvelle évaluation vide
 */
export function createEmptyEvaluation(
  chapter: EvaluationChapter
): Evaluation {
  return {
    id: `eval-${Date.now()}`,
    chapterId: chapter.id,
    chapterName: chapter.name,
    category: chapter.category,
    score: 5,
    mastered: [],
    toReview: [],
    questionsForTeacher: [],
    notes: '',
    evaluatedAt: new Date()
  };
}

/**
 * VÉRIFIER SI UNE ÉVALUATION EST COMPLÈTE
 * ---------------------------------------
 * Une évaluation est considérée "complète" si :
 * - Le score a été défini
 * - Au moins un point maîtrisé OU à revoir a été noté
 *
 * @param evaluation - Évaluation à vérifier
 * @returns true si l'évaluation est complète
 */
export function isEvaluationComplete(evaluation: Evaluation): boolean {
  return (
    evaluation.score > 0 &&
    (evaluation.mastered.length > 0 || evaluation.toReview.length > 0)
  );
}

/**
 * OBTENIR LES CONSEILS SELON LE SCORE
 * -----------------------------------
 * Retourne des conseils personnalisés selon le niveau.
 *
 * @param score - Score sur 10
 * @returns Conseil adapté
 *
 * Philosophie :
 * ------------
 * Les conseils sont toujours constructifs et orientés action.
 * Jamais de jugement négatif !
 */
export function getScoreAdvice(score: number): string {
  if (score >= 9) {
    return "Excellent ! Tu pourrais aider d'autres étudiants sur ce chapitre.";
  }
  if (score >= 7) {
    return "Bien ! Quelques exercices supplémentaires et tu seras prêt.";
  }
  if (score >= 5) {
    return "Moyen. Reprends les points à revoir et refais les exercices de base.";
  }
  if (score >= 3) {
    return "Ce chapitre nécessite plus de travail. Reprends le cours depuis le début.";
  }
  return "Ne te décourage pas ! Demande de l'aide et reprends les bases.";
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI l'auto-évaluation fonctionne ?
 *
 *    L'EFFET DE GÉNÉRATION (Generation Effect) :
 *    Quand tu génères toi-même une information (comme "je maîtrise X"),
 *    tu la retiens mieux que si on te la donne.
 *
 *    En notant tes forces et faiblesses, tu les mémorises !
 *
 * 2. POURQUOI demander des questions ?
 *
 *    LA QUESTION EST LE SIGNE DE LA COMPRÉHENSION :
 *    Si tu ne peux pas formuler de question, deux possibilités :
 *    a) Tu comprends parfaitement (rare)
 *    b) Tu ne comprends pas assez pour savoir ce qui manque (fréquent)
 *
 *    Forcer à écrire des questions révèle les zones d'ombre.
 *
 * 3. POURQUOI le score sur 10 ?
 *
 *    GRANULARITÉ OPTIMALE :
 *    - Sur 5 : Trop grossier (chaque point = 20% de différence)
 *    - Sur 20 : Trop fin (illusion de précision)
 *    - Sur 10 : Juste assez (chaque point = 10% de différence)
 *
 *    C'est aussi l'échelle la plus intuitive en France.
 *
 * 4. POURQUOI séparer "maîtrisé" et "à revoir" ?
 *
 *    BIAIS DE NÉGATIVITÉ :
 *    Le cerveau humain retient mieux le négatif que le positif.
 *    Sans la liste "maîtrisé", tu ne verrais que tes lacunes → découragement.
 *
 *    En listant aussi les succès, tu maintiens la motivation.
 *
 * 5. POURQUOI sauvegarder l'historique ?
 *
 *    COURBE DE PROGRESSION :
 *    Voir son évolution est le meilleur motivateur.
 *    "Il y a 2 semaines j'étais à 4/10, maintenant je suis à 7/10 !"
 *
 *    C'est comme le suivi de poids pour quelqu'un qui fait un régime.
 *
 * Citation de Bloom (1984) :
 * "The greatest gains in learning come from students who engage in
 *  self-assessment and self-monitoring of their learning."
 *
 * Traduction : Les plus grands progrès viennent des étudiants qui
 * s'auto-évaluent et suivent leur propre apprentissage.
 *
 * C'est EXACTEMENT ce que ce modèle permet de faire !
 */
