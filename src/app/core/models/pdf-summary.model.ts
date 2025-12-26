/**
 * pdf-summary.model.ts
 *
 * Modele de donnees pour les RESUMES DE PDF generes par IA.
 *
 * Analogie du monde reel :
 * ----------------------
 * Imagine que tu as un assistant qui lit tes PDFs de cours
 * et te fait des fiches de revision automatiquement !
 *
 * Ce modele represente :
 * - Le resume genere par l'IA (Ollama)
 * - Les points cles extraits
 * - Les concepts principaux
 * - Les exercices suggeres
 *
 * Philosophie David J. Malan :
 * "The goal is not to memorize, but to understand."
 *
 * Un bon resume aide a COMPRENDRE, pas juste a memoriser.
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

// ============================================================
// TYPES ET ENUMERATIONS
// ============================================================

/**
 * LONGUEUR DU RESUME
 * -----------------
 * Determine le niveau de detail du resume genere.
 *
 * - short : 3-5 points cles, ideal pour revision rapide
 * - medium : 5-8 points, equilibre detail/concision
 * - long : 8-12 points, comprehension approfondie
 */
export type SummaryLength = 'short' | 'medium' | 'long';

/**
 * STATUT DU RESUME
 * ---------------
 * Ou en est la generation du resume ?
 *
 * Machine a etats :
 *
 *   [pending] --> [extracting] --> [summarizing] --> [completed]
 *       |             |                |                 |
 *       +----------->[error]<---------+-----------------+
 */
export type SummaryStatus =
  | 'pending'      // En attente de demarrage
  | 'extracting'   // Extraction du texte du PDF en cours
  | 'summarizing'  // IA en train de resumer
  | 'completed'    // Resume pret !
  | 'error';       // Erreur survenue

/**
 * NIVEAU D'IMPORTANCE
 * ------------------
 * Pour prioriser les points cles.
 */
export type ImportanceLevel = 'high' | 'medium' | 'low';

/**
 * DIFFICULTE D'EXERCICE
 * --------------------
 * Pour les exercices suggeres par l'IA.
 */
export type SuggestedDifficulty = 'facile' | 'moyen' | 'difficile';

// ============================================================
// INTERFACES PRINCIPALES
// ============================================================

/**
 * POINT CLE
 * --------
 * Un point important extrait du PDF.
 *
 * Exemple :
 * {
 *   id: 'kp-1',
 *   text: 'Une boucle for permet de repeter un bloc de code un nombre defini de fois',
 *   importance: 'high',
 *   pageReference: 5
 * }
 */
export interface KeyPoint {
  /**
   * Identifiant unique du point cle
   */
  id: string;

  /**
   * Texte du point cle
   */
  text: string;

  /**
   * Niveau d'importance
   */
  importance: ImportanceLevel;

  /**
   * Reference a la page du PDF (optionnel)
   */
  pageReference?: number;
}

/**
 * CONCEPT PRINCIPAL
 * ----------------
 * Un concept important identifie dans le PDF.
 *
 * Exemple :
 * {
 *   id: 'mc-1',
 *   title: 'Boucle For',
 *   description: 'Structure de controle qui permet de repeter...',
 *   relatedTopics: ['boucle while', 'iteration', 'compteur']
 * }
 */
export interface MainConcept {
  /**
   * Identifiant unique du concept
   */
  id: string;

  /**
   * Titre du concept
   */
  title: string;

  /**
   * Description detaillee
   */
  description: string;

  /**
   * Sujets lies (optionnel)
   */
  relatedTopics?: string[];
}

/**
 * EXERCICE SUGGERE
 * ---------------
 * Un exercice propose par l'IA base sur le contenu du PDF.
 */
export interface SuggestedExercise {
  /**
   * Identifiant unique
   */
  id: string;

  /**
   * Titre de l'exercice
   */
  title: string;

  /**
   * Description de l'exercice
   */
  description: string;

  /**
   * Niveau de difficulte
   */
  difficulty: SuggestedDifficulty;

  /**
   * Type d'exercice
   */
  type: 'practice' | 'quiz' | 'project';
}

/**
 * RESUME PDF
 * ---------
 * Interface principale representant un resume complet.
 */
export interface PDFSummary {
  // ===== IDENTIFICATION =====

  /**
   * Identifiant unique
   * Format : "summary-{pdfId}-{timestamp}"
   */
  id: string;

  /**
   * ID du PDF source (reference vers Resource)
   */
  pdfId: string;

  /**
   * Titre du PDF (denormalise pour affichage)
   */
  pdfTitle: string;

  /**
   * Nom du fichier PDF
   */
  pdfFilename?: string;

  /**
   * Categorie du cours
   */
  category: 'algo' | 'java' | 'algebre' | 'poo' | 'bdd' | 'general';

  // ===== TEXTE EXTRAIT =====

  /**
   * Texte complet extrait du PDF
   * Cache pour eviter de re-extraire
   */
  extractedText: string;

  /**
   * Nombre de pages du PDF
   */
  pageCount: number;

  /**
   * Date de l'extraction
   */
  extractedAt: Date;

  // ===== RESUME IA =====

  /**
   * Longueur du resume choisie
   */
  summaryLength: SummaryLength;

  /**
   * Texte du resume (2-3 paragraphes)
   */
  summary: string;

  /**
   * Points cles extraits
   */
  keyPoints: KeyPoint[];

  /**
   * Concepts principaux identifies
   */
  mainConcepts: MainConcept[];

  /**
   * Exercices suggeres par l'IA
   */
  suggestedExercises: SuggestedExercise[];

  // ===== STATUT ET METADONNEES =====

  /**
   * Statut actuel de la generation
   */
  status: SummaryStatus;

  /**
   * Date de generation du resume
   */
  summarizedAt?: Date;

  /**
   * Modele Ollama utilise
   */
  modelUsed?: string;

  /**
   * Temps de generation (en ms)
   */
  generationTime?: number;

  /**
   * Message d'erreur si status === 'error'
   */
  errorMessage?: string;

  // ===== ORGANISATION UTILISATEUR =====

  /**
   * Marque comme favori
   */
  isFavorite: boolean;

  /**
   * Tags personnalises
   */
  tags: string[];

  // ===== TIMESTAMPS =====

  /**
   * Date de creation
   */
  createdAt: Date;

  /**
   * Date de derniere modification
   */
  updatedAt: Date;
}

// ============================================================
// INTERFACES DE CONFIGURATION
// ============================================================

/**
 * CONFIGURATION DE GENERATION
 * --------------------------
 * Parametres pour generer un resume.
 */
export interface SummaryGenerationConfig {
  /**
   * ID du PDF a resumer
   */
  pdfId: string;

  /**
   * Chemin vers le fichier PDF
   */
  pdfPath: string;

  /**
   * Longueur du resume souhaite
   */
  length: SummaryLength;

  /**
   * Inclure les points cles ?
   */
  includeKeyPoints: boolean;

  /**
   * Inclure les concepts principaux ?
   */
  includeConcepts: boolean;

  /**
   * Inclure les exercices suggeres ?
   */
  includeExercises: boolean;

  /**
   * Prompt personnalise (optionnel)
   */
  customPrompt?: string;
}

/**
 * RESULTAT DE GENERATION
 * ---------------------
 * Retourne par le service de summarization.
 */
export interface SummaryGenerationResult {
  /**
   * Succes ou echec
   */
  status: 'success' | 'error';

  /**
   * Le resume genere (si succes)
   */
  summary?: PDFSummary;

  /**
   * Message d'erreur (si echec)
   */
  error?: string;

  /**
   * Temps de generation en ms
   */
  generationTime?: number;
}

/**
 * RESULTAT D'EXTRACTION
 * --------------------
 * Retourne par le service d'extraction PDF.
 */
export interface ExtractionResult {
  /**
   * Succes ou echec
   */
  success: boolean;

  /**
   * Texte extrait
   */
  text: string;

  /**
   * Nombre de pages
   */
  pageCount: number;

  /**
   * Message d'erreur (si echec)
   */
  error?: string;

  /**
   * Temps d'extraction en ms
   */
  extractionTime?: number;
}

// ============================================================
// CONSTANTES DE CONFIGURATION
// ============================================================

/**
 * Configuration des longueurs de resume
 */
export const SUMMARY_LENGTH_CONFIG: Record<SummaryLength, {
  label: string;
  emoji: string;
  pointCount: string;
  description: string;
  maxTokens: number;
}> = {
  short: {
    label: 'Court',
    emoji: '📝',
    pointCount: '3-5 points',
    description: 'Resume concis avec les points essentiels',
    maxTokens: 500
  },
  medium: {
    label: 'Moyen',
    emoji: '📄',
    pointCount: '5-8 points',
    description: 'Resume detaille avec exemples',
    maxTokens: 1000
  },
  long: {
    label: 'Complet',
    emoji: '📚',
    pointCount: '8-12 points',
    description: 'Resume comprehensif avec contexte',
    maxTokens: 2000
  }
};

/**
 * Configuration des niveaux d'importance
 */
export const IMPORTANCE_CONFIG: Record<ImportanceLevel, {
  label: string;
  emoji: string;
  color: string;
}> = {
  high: {
    label: 'Essentiel',
    emoji: '🔴',
    color: '#ef4444'
  },
  medium: {
    label: 'Important',
    emoji: '🟡',
    color: '#f59e0b'
  },
  low: {
    label: 'Complementaire',
    emoji: '🟢',
    color: '#10b981'
  }
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * CREER UN NOUVEAU RESUME
 * ----------------------
 * Factory function avec valeurs par defaut.
 */
export function createPDFSummary(
  data: Partial<PDFSummary> & {
    pdfId: string;
    pdfTitle: string;
  }
): PDFSummary {
  const now = new Date();

  return {
    id: data.id || `summary-${data.pdfId}-${Date.now()}`,
    pdfId: data.pdfId,
    pdfTitle: data.pdfTitle,
    pdfFilename: data.pdfFilename,
    category: data.category || 'general',
    extractedText: data.extractedText || '',
    pageCount: data.pageCount || 0,
    extractedAt: data.extractedAt || now,
    summaryLength: data.summaryLength || 'medium',
    summary: data.summary || '',
    keyPoints: data.keyPoints || [],
    mainConcepts: data.mainConcepts || [],
    suggestedExercises: data.suggestedExercises || [],
    status: data.status || 'pending',
    summarizedAt: data.summarizedAt,
    modelUsed: data.modelUsed,
    generationTime: data.generationTime,
    errorMessage: data.errorMessage,
    isFavorite: data.isFavorite || false,
    tags: data.tags || [],
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

/**
 * OBTENIR LE LABEL DE LONGUEUR
 */
export function getSummaryLengthLabel(length: SummaryLength): string {
  return `${SUMMARY_LENGTH_CONFIG[length].emoji} ${SUMMARY_LENGTH_CONFIG[length].label}`;
}

/**
 * OBTENIR LE LABEL D'IMPORTANCE
 */
export function getImportanceLabel(importance: ImportanceLevel): string {
  return `${IMPORTANCE_CONFIG[importance].emoji} ${IMPORTANCE_CONFIG[importance].label}`;
}

/**
 * COMPTER LES POINTS CLES PAR IMPORTANCE
 */
export function countKeyPointsByImportance(
  keyPoints: KeyPoint[]
): Record<ImportanceLevel, number> {
  return {
    high: keyPoints.filter(kp => kp.importance === 'high').length,
    medium: keyPoints.filter(kp => kp.importance === 'medium').length,
    low: keyPoints.filter(kp => kp.importance === 'low').length
  };
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI extraire des points cles plutot que juste un resume ?
 *
 *    Le cerveau humain retient mieux les LISTES que les PARAGRAPHES.
 *    C'est le principe des "bullet points" utilise partout :
 *    - Presentations PowerPoint
 *    - Fiches de revision
 *    - Notes de cours
 *
 *    Les points cles sont plus ACTIONNABLES :
 *    "Retiens que X fait Y" > "Il existe plusieurs manieres de..."
 *
 * 2. POURQUOI classer par importance ?
 *
 *    Principe de Pareto (80/20) :
 *    - 20% des concepts couvrent 80% de l'examen
 *    - Mieux vaut maitriser les HIGH que survoler tout
 *
 *    En cas de manque de temps :
 *    1. Revise les HIGH
 *    2. Puis les MEDIUM
 *    3. Les LOW si tu as le temps
 *
 * 3. POURQUOI suggerer des exercices ?
 *
 *    "Tell me and I forget.
 *     Teach me and I remember.
 *     Involve me and I learn."
 *     - Benjamin Franklin
 *
 *    Lire un resume =/= Comprendre
 *    Faire des exercices = Vraie comprehension
 *
 *    L'IA suggere des exercices ADAPTES au contenu du PDF,
 *    pour transformer la lecture passive en apprentissage actif.
 */
