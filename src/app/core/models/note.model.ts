/**
 * note.model.ts
 *
 * Modele de donnees pour les NOTES personnelles.
 *
 * Analogie du monde reel :
 * ----------------------
 * Imagine un carnet de notes numerique ou tu peux :
 * - Ecrire tes reflexions sur les cours
 * - Sauvegarder les resumes generes par l'IA
 * - Creer des flashcards pour reviser
 * - Organiser tout avec des tags
 *
 * Philosophie David J. Malan :
 * "Writing is thinking. The clearer you write, the clearer you think."
 *
 * Prendre des notes aide a STRUCTURER ses pensees.
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

// ============================================================
// TYPES ET ENUMERATIONS
// ============================================================

/**
 * TYPE DE NOTE
 * -----------
 * Categorise les notes par leur origine/usage.
 *
 * - summary : Note generee depuis un resume de PDF
 * - personal : Note personnelle ecrite manuellement
 * - flashcard : Note format question/reponse pour revision
 * - question : Question a poser au prof
 */
export type NoteType = 'summary' | 'personal' | 'flashcard' | 'question';

/**
 * CATEGORIE DE NOTE
 * ----------------
 * Correspond aux sujets d'etude.
 */
export type NoteCategory = 'algo' | 'java' | 'algebre' | 'poo' | 'bdd' | 'general';

// ============================================================
// INTERFACES PRINCIPALES
// ============================================================

/**
 * NOTE
 * ----
 * Interface principale pour une note.
 *
 * Supporte le format Markdown pour un formatage riche :
 * - **gras**, *italique*
 * - Listes a puces
 * - Blocs de code
 * - etc.
 */
export interface Note {
  // ===== IDENTIFICATION =====

  /**
   * Identifiant unique
   * Format : "note-{timestamp}"
   */
  id: string;

  /**
   * Titre de la note
   */
  title: string;

  /**
   * Contenu de la note (Markdown supporte)
   */
  content: string;

  /**
   * Type de note
   */
  type: NoteType;

  // ===== RELATIONS =====

  /**
   * ID du PDF lie (optionnel)
   * Pour les notes associees a un cours specifique
   */
  pdfId?: string;

  /**
   * ID du resume lie (optionnel)
   * Pour les notes generees depuis un resume
   */
  summaryId?: string;

  // ===== ORGANISATION =====

  /**
   * Tags personnalises pour filtrage
   * Exemples : ['examen', 'important', 'a-revoir']
   */
  tags: string[];

  /**
   * Categorie de cours
   */
  category?: NoteCategory;

  /**
   * Marque comme favori
   */
  isFavorite: boolean;

  /**
   * Epingle en haut de la liste
   */
  isPinned: boolean;

  /**
   * Note archivee (cachee de la vue principale)
   */
  isArchived?: boolean;

  // ===== METADONNEES =====

  /**
   * Date de creation
   */
  createdAt: Date;

  /**
   * Date de derniere modification
   */
  updatedAt: Date;

  /**
   * Nombre de mots (calcule automatiquement)
   */
  wordCount: number;

  /**
   * Couleur personnalisee (optionnel)
   * Pour differencier visuellement les notes
   */
  color?: string;
}

/**
 * FLASHCARD
 * --------
 * Extension de Note pour le format question/reponse.
 */
export interface Flashcard extends Note {
  type: 'flashcard';

  /**
   * Question (recto de la carte)
   */
  question: string;

  /**
   * Reponse (verso de la carte)
   */
  answer: string;

  /**
   * Niveau de maitrise (revision espacee)
   * 0 = jamais revu, 5 = parfaitement maitrise
   */
  masteryLevel: number;

  /**
   * Date de prochaine revision
   */
  nextReviewDate?: Date;

  /**
   * Nombre de revisions effectuees
   */
  reviewCount: number;
}

// ============================================================
// INTERFACES DE RECHERCHE ET FILTRAGE
// ============================================================

/**
 * RESULTAT DE RECHERCHE
 * --------------------
 * Retourne lors d'une recherche dans les notes.
 */
export interface NoteSearchResult {
  /**
   * La note trouvee
   */
  note: Note;

  /**
   * Ou le match a ete trouve
   */
  matchType: 'title' | 'content' | 'tag';

  /**
   * Extrait du texte avec le match
   */
  snippet: string;

  /**
   * Score de pertinence (0-100)
   */
  relevanceScore?: number;
}

/**
 * FILTRES DE NOTES
 * ---------------
 * Options de filtrage pour la liste des notes.
 */
export interface NoteFilters {
  /**
   * Filtrer par type
   */
  types?: NoteType[];

  /**
   * Filtrer par categorie
   */
  categories?: NoteCategory[];

  /**
   * Filtrer par tags (OR)
   */
  tags?: string[];

  /**
   * Afficher seulement les favoris
   */
  favoritesOnly?: boolean;

  /**
   * Afficher les archives
   */
  includeArchived?: boolean;

  /**
   * Recherche textuelle
   */
  searchQuery?: string;
}

/**
 * OPTIONS DE TRI
 * -------------
 */
export type NoteSortBy = 'createdAt' | 'updatedAt' | 'title' | 'wordCount';
export type NoteSortOrder = 'asc' | 'desc';

export interface NoteSortOptions {
  by: NoteSortBy;
  order: NoteSortOrder;
}

// ============================================================
// STATISTIQUES
// ============================================================

/**
 * STATISTIQUES DES NOTES
 * ---------------------
 */
export interface NoteStats {
  /**
   * Nombre total de notes
   */
  total: number;

  /**
   * Repartition par type
   */
  byType: Record<NoteType, number>;

  /**
   * Repartition par categorie
   */
  byCategory: Record<string, number>;

  /**
   * Nombre de favoris
   */
  favorites: number;

  /**
   * Nombre de notes archivees
   */
  archived: number;

  /**
   * Notes modifiees cette semaine
   */
  recentlyUpdated: number;

  /**
   * Nombre total de mots
   */
  totalWords: number;

  /**
   * Tags les plus utilises
   */
  topTags: { tag: string; count: number }[];
}

// ============================================================
// CONSTANTES DE CONFIGURATION
// ============================================================

/**
 * Configuration des types de notes
 */
export const NOTE_TYPE_CONFIG: Record<NoteType, {
  label: string;
  emoji: string;
  description: string;
  color: string;
}> = {
  summary: {
    label: 'Resume',
    emoji: '📋',
    description: 'Resume genere depuis un PDF',
    color: '#3b82f6'
  },
  personal: {
    label: 'Personnel',
    emoji: '📝',
    description: 'Note personnelle',
    color: '#10b981'
  },
  flashcard: {
    label: 'Flashcard',
    emoji: '🎴',
    description: 'Question/Reponse pour revision',
    color: '#8b5cf6'
  },
  question: {
    label: 'Question',
    emoji: '❓',
    description: 'Question a poser au prof',
    color: '#f59e0b'
  }
};

/**
 * Configuration des categories
 */
export const NOTE_CATEGORY_CONFIG: Record<NoteCategory, {
  label: string;
  emoji: string;
}> = {
  algo: { label: 'Algorithmique', emoji: '🔢' },
  java: { label: 'Java', emoji: '☕' },
  algebre: { label: 'Algebre de Boole', emoji: '🔣' },
  poo: { label: 'POO', emoji: '📦' },
  bdd: { label: 'Base de donnees', emoji: '🗃️' },
  general: { label: 'General', emoji: '📚' }
};

/**
 * Couleurs predefinies pour les notes
 */
export const NOTE_COLORS = [
  '#ef4444', // Rouge
  '#f97316', // Orange
  '#f59e0b', // Ambre
  '#84cc16', // Vert lime
  '#10b981', // Emeraude
  '#06b6d4', // Cyan
  '#3b82f6', // Bleu
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#6b7280'  // Gris
];

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * CREER UNE NOUVELLE NOTE
 * ----------------------
 * Factory function avec valeurs par defaut.
 */
export function createNote(
  data: Partial<Note> & {
    title: string;
    content: string;
  }
): Note {
  const now = new Date();

  return {
    id: data.id || `note-${Date.now()}`,
    title: data.title,
    content: data.content,
    type: data.type || 'personal',
    pdfId: data.pdfId,
    summaryId: data.summaryId,
    tags: data.tags || [],
    category: data.category,
    isFavorite: data.isFavorite || false,
    isPinned: data.isPinned || false,
    isArchived: data.isArchived || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    wordCount: data.wordCount || countWords(data.content),
    color: data.color
  };
}

/**
 * CREER UNE FLASHCARD
 * ------------------
 */
export function createFlashcard(
  data: Partial<Flashcard> & {
    question: string;
    answer: string;
  }
): Flashcard {
  const now = new Date();

  return {
    id: data.id || `flashcard-${Date.now()}`,
    title: data.title || data.question.substring(0, 50),
    content: `**Q:** ${data.question}\n\n**R:** ${data.answer}`,
    type: 'flashcard',
    question: data.question,
    answer: data.answer,
    masteryLevel: data.masteryLevel || 0,
    nextReviewDate: data.nextReviewDate,
    reviewCount: data.reviewCount || 0,
    pdfId: data.pdfId,
    summaryId: data.summaryId,
    tags: data.tags || ['flashcard'],
    category: data.category,
    isFavorite: data.isFavorite || false,
    isPinned: data.isPinned || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    wordCount: countWords(data.question + ' ' + data.answer)
  };
}

/**
 * COMPTER LES MOTS
 * ---------------
 */
export function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * OBTENIR LE LABEL DU TYPE
 */
export function getNoteTypeLabel(type: NoteType): string {
  return `${NOTE_TYPE_CONFIG[type].emoji} ${NOTE_TYPE_CONFIG[type].label}`;
}

/**
 * OBTENIR LE LABEL DE CATEGORIE
 */
export function getNoteCategoryLabel(category: NoteCategory): string {
  return `${NOTE_CATEGORY_CONFIG[category].emoji} ${NOTE_CATEGORY_CONFIG[category].label}`;
}

/**
 * FILTRER LES NOTES
 * ----------------
 */
export function filterNotes(notes: Note[], filters: NoteFilters): Note[] {
  return notes.filter(note => {
    // Filtre par type
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(note.type)) return false;
    }

    // Filtre par categorie
    if (filters.categories && filters.categories.length > 0) {
      if (!note.category || !filters.categories.includes(note.category)) return false;
    }

    // Filtre par tags
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => note.tags.includes(tag));
      if (!hasTag) return false;
    }

    // Filtre favoris
    if (filters.favoritesOnly && !note.isFavorite) return false;

    // Filtre archives
    if (!filters.includeArchived && note.isArchived) return false;

    // Recherche textuelle
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const inTitle = note.title.toLowerCase().includes(query);
      const inContent = note.content.toLowerCase().includes(query);
      const inTags = note.tags.some(tag => tag.toLowerCase().includes(query));
      if (!inTitle && !inContent && !inTags) return false;
    }

    return true;
  });
}

/**
 * TRIER LES NOTES
 * --------------
 */
export function sortNotes(notes: Note[], options: NoteSortOptions): Note[] {
  const sorted = [...notes].sort((a, b) => {
    let comparison = 0;

    switch (options.by) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'wordCount':
        comparison = a.wordCount - b.wordCount;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
      default:
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    return options.order === 'desc' ? -comparison : comparison;
  });

  // Toujours mettre les notes epinglees en premier
  return sorted.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI prendre des notes ?
 *
 *    "I hear and I forget.
 *     I see and I remember.
 *     I write and I understand."
 *     - Confucius
 *
 *    L'acte d'ecrire force le cerveau a TRAITER l'information,
 *    pas juste a la recevoir passivement.
 *
 * 2. POURQUOI supporter Markdown ?
 *
 *    Markdown = Format simple mais puissant
 *    - **gras** pour les concepts importants
 *    - `code` pour les exemples
 *    - Listes pour structurer
 *
 *    Plus simple que Word, plus portable, plus geek !
 *
 * 3. POURQUOI les flashcards ?
 *
 *    Technique de "Active Recall" :
 *    - Se poser une question FORCE le cerveau a chercher
 *    - Plus efficace que relire passivement
 *
 *    Combine avec "Spaced Repetition" :
 *    - Revoir juste avant d'oublier
 *    - Optimise le temps de revision
 *
 * 4. POURQUOI les tags ?
 *
 *    Le cerveau pense en ASSOCIATIONS, pas en hierarchies.
 *    Une note peut etre liee a plusieurs concepts :
 *    - Tags: ['boucle', 'tableau', 'examen']
 *
 *    Plus flexible qu'un systeme de dossiers rigide.
 */
