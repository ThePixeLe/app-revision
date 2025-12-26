/**
 * pdf-export.model.ts
 *
 * Modele de donnees pour l'EXPORT PDF.
 *
 * Analogie du monde reel :
 * ----------------------
 * Imagine une imprimerie qui prend tes notes numeriques
 * et cree un beau document PDF professionnel !
 *
 * Ce modele definit :
 * - La configuration d'export (quoi inclure)
 * - Le style du document (theme, couleurs)
 * - La structure des sections
 *
 * Philosophie David J. Malan :
 * "A well-organized document reflects a well-organized mind."
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

// ============================================================
// TYPES ET ENUMERATIONS
// ============================================================

/**
 * THEME DU PDF
 * -----------
 * Style visuel du document exporte.
 */
export type PDFTheme = 'light' | 'dark' | 'professional' | 'minimal';

/**
 * FORMAT DE PAGE
 * -------------
 */
export type PageFormat = 'a4' | 'letter' | 'a5';

/**
 * ORIENTATION
 * ----------
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * TYPE DE SECTION
 * --------------
 * Types de contenu dans le PDF.
 */
export type SectionType =
  | 'text'      // Paragraphe de texte
  | 'list'      // Liste a puces
  | 'code'      // Bloc de code
  | 'table'     // Tableau
  | 'heading'   // Titre/sous-titre
  | 'keypoint'  // Point cle avec importance
  | 'concept';  // Concept avec description

// ============================================================
// INTERFACES DE CONFIGURATION
// ============================================================

/**
 * CONFIGURATION D'EXPORT PDF
 * -------------------------
 * Options pour generer le PDF.
 */
export interface PDFExportConfig {
  // ===== CONTENU A INCLURE =====

  /**
   * Inclure le resume principal
   */
  includeSummary: boolean;

  /**
   * Inclure les points cles
   */
  includeKeyPoints: boolean;

  /**
   * Inclure les concepts principaux
   */
  includeConcepts: boolean;

  /**
   * Inclure les notes personnelles
   */
  includeNotes: boolean;

  /**
   * Inclure les exercices suggeres
   */
  includeExercises: boolean;

  /**
   * Inclure les flashcards
   */
  includeFlashcards?: boolean;

  // ===== MISE EN PAGE =====

  /**
   * Titre du document
   */
  title: string;

  /**
   * Sous-titre (optionnel)
   */
  subtitle?: string;

  /**
   * Auteur (optionnel)
   */
  author?: string;

  /**
   * Inclure la table des matieres
   */
  includeTableOfContents: boolean;

  /**
   * Inclure le logo Study Tracker
   */
  includeLogo: boolean;

  /**
   * Inclure la date de generation
   */
  includeDate: boolean;

  /**
   * Inclure les numeros de page
   */
  includePageNumbers: boolean;

  // ===== STYLE =====

  /**
   * Theme du document
   */
  theme: PDFTheme;

  /**
   * Couleur d'accent
   */
  accentColor: string;

  /**
   * Format de page
   */
  pageFormat: PageFormat;

  /**
   * Orientation
   */
  orientation: PageOrientation;

  /**
   * Taille de police de base
   */
  baseFontSize: number;
}

/**
 * CONFIGURATION DE THEME
 * ---------------------
 * Couleurs et styles pour chaque theme.
 */
export interface ThemeConfig {
  /**
   * Nom du theme
   */
  name: string;

  /**
   * Couleur de fond principale
   */
  backgroundColor: string;

  /**
   * Couleur du texte principal
   */
  textColor: string;

  /**
   * Couleur du texte secondaire
   */
  textSecondary: string;

  /**
   * Couleur des titres
   */
  headingColor: string;

  /**
   * Couleur d'accent
   */
  accentColor: string;

  /**
   * Couleur des bordures
   */
  borderColor: string;

  /**
   * Couleur de fond des blocs de code
   */
  codeBackground: string;

  /**
   * Couleur des liens
   */
  linkColor: string;
}

// ============================================================
// INTERFACES DE CONTENU
// ============================================================

/**
 * SECTION DU PDF
 * -------------
 * Un bloc de contenu dans le document.
 */
export interface PDFSection {
  /**
   * Identifiant unique
   */
  id: string;

  /**
   * Titre de la section
   */
  title: string;

  /**
   * Contenu de la section
   */
  content: string;

  /**
   * Type de section
   */
  type: SectionType;

  /**
   * Niveau de titre (1-4) pour les headings
   */
  level?: number;

  /**
   * Saut de page avant cette section
   */
  pageBreakBefore?: boolean;

  /**
   * Metadata additionnelles
   */
  metadata?: Record<string, unknown>;
}

/**
 * TABLE DES MATIERES
 * -----------------
 */
export interface TOCEntry {
  /**
   * Titre de l'entree
   */
  title: string;

  /**
   * Niveau d'indentation (1-4)
   */
  level: number;

  /**
   * Numero de page
   */
  pageNumber: number;
}

/**
 * DOCUMENT PDF COMPLET
 * -------------------
 * Structure complete du document a generer.
 */
export interface PDFDocument {
  /**
   * Configuration d'export
   */
  config: PDFExportConfig;

  /**
   * Table des matieres
   */
  tableOfContents?: TOCEntry[];

  /**
   * Sections du document
   */
  sections: PDFSection[];

  /**
   * Metadonnees du document
   */
  metadata: {
    createdAt: Date;
    pageCount?: number;
    wordCount?: number;
  };
}

// ============================================================
// INTERFACES DE RESULTAT
// ============================================================

/**
 * RESULTAT D'EXPORT
 * ----------------
 * Retourne par le service d'export.
 */
export interface PDFExportResult {
  /**
   * Succes ou echec
   */
  success: boolean;

  /**
   * Le PDF en Blob (si succes)
   */
  blob?: Blob;

  /**
   * Nom de fichier suggere
   */
  filename?: string;

  /**
   * URL de preview (data URL ou blob URL)
   */
  previewUrl?: string;

  /**
   * Nombre de pages generees
   */
  pageCount?: number;

  /**
   * Taille du fichier en octets
   */
  fileSize?: number;

  /**
   * Message d'erreur (si echec)
   */
  error?: string;

  /**
   * Temps de generation en ms
   */
  generationTime?: number;
}

// ============================================================
// CONSTANTES DE CONFIGURATION
// ============================================================

/**
 * Configuration des themes
 */
export const PDF_THEMES: Record<PDFTheme, ThemeConfig> = {
  light: {
    name: 'Clair',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    textSecondary: '#6b7280',
    headingColor: '#111827',
    accentColor: '#3b82f6',
    borderColor: '#e5e7eb',
    codeBackground: '#f3f4f6',
    linkColor: '#2563eb'
  },
  dark: {
    name: 'Sombre',
    backgroundColor: '#1f2937',
    textColor: '#f9fafb',
    textSecondary: '#9ca3af',
    headingColor: '#ffffff',
    accentColor: '#60a5fa',
    borderColor: '#374151',
    codeBackground: '#111827',
    linkColor: '#93c5fd'
  },
  professional: {
    name: 'Professionnel',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    textSecondary: '#64748b',
    headingColor: '#0f172a',
    accentColor: '#0ea5e9',
    borderColor: '#cbd5e1',
    codeBackground: '#f1f5f9',
    linkColor: '#0284c7'
  },
  minimal: {
    name: 'Minimaliste',
    backgroundColor: '#fafafa',
    textColor: '#18181b',
    textSecondary: '#71717a',
    headingColor: '#09090b',
    accentColor: '#a1a1aa',
    borderColor: '#e4e4e7',
    codeBackground: '#f4f4f5',
    linkColor: '#3f3f46'
  }
};

/**
 * Configuration par defaut
 */
export const DEFAULT_EXPORT_CONFIG: PDFExportConfig = {
  includeSummary: true,
  includeKeyPoints: true,
  includeConcepts: true,
  includeNotes: true,
  includeExercises: false,
  includeFlashcards: false,
  title: 'Notes de revision',
  includeTableOfContents: true,
  includeLogo: true,
  includeDate: true,
  includePageNumbers: true,
  theme: 'professional',
  accentColor: '#3b82f6',
  pageFormat: 'a4',
  orientation: 'portrait',
  baseFontSize: 11
};

/**
 * Dimensions des formats de page (en mm)
 */
export const PAGE_DIMENSIONS: Record<PageFormat, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
  a5: { width: 148, height: 210 }
};

/**
 * Marges par defaut (en mm)
 */
export const DEFAULT_MARGINS = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * CREER UNE CONFIGURATION D'EXPORT
 * -------------------------------
 * Factory function avec valeurs par defaut.
 */
export function createExportConfig(
  data: Partial<PDFExportConfig> & { title: string }
): PDFExportConfig {
  return {
    ...DEFAULT_EXPORT_CONFIG,
    ...data
  };
}

/**
 * OBTENIR LA CONFIGURATION DU THEME
 */
export function getThemeConfig(theme: PDFTheme): ThemeConfig {
  return PDF_THEMES[theme];
}

/**
 * CREER UNE SECTION
 */
export function createSection(
  data: Partial<PDFSection> & {
    title: string;
    content: string;
    type: SectionType;
  }
): PDFSection {
  return {
    id: data.id || `section-${Date.now()}`,
    title: data.title,
    content: data.content,
    type: data.type,
    level: data.level,
    pageBreakBefore: data.pageBreakBefore || false,
    metadata: data.metadata
  };
}

/**
 * GENERER UN NOM DE FICHIER
 * ------------------------
 * Cree un nom de fichier base sur le titre et la date.
 */
export function generateFilename(title: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${sanitizedTitle}-${date}.pdf`;
}

/**
 * FORMATER LA TAILLE DE FICHIER
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI plusieurs themes ?
 *
 *    Chaque contexte a ses besoins :
 *    - Light : Impression papier (economise l'encre)
 *    - Dark : Lecture sur ecran le soir
 *    - Professional : Documents officiels
 *    - Minimal : Concentration maximale
 *
 * 2. POURQUOI une table des matieres ?
 *
 *    Pour un document > 3 pages, la navigation devient cruciale.
 *    Une bonne TOC = un document utilisable.
 *
 *    "A document without a table of contents
 *     is like a city without street signs."
 *
 * 3. POURQUOI exporter en PDF ?
 *
 *    PDF = Portable Document Format
 *    - Meme rendu sur TOUS les appareils
 *    - Imprimable directement
 *    - Partageable facilement
 *    - Archivable a long terme
 *
 *    Contrairement au HTML/Markdown qui depend du lecteur.
 *
 * 4. POURQUOI les sections typees ?
 *
 *    Permet un formatage SEMANTIQUE :
 *    - 'code' → police monospace, fond colore
 *    - 'keypoint' → mise en evidence, bullet point
 *    - 'concept' → encadre avec titre
 *
 *    Le contenu dicte la presentation, pas l'inverse.
 */
