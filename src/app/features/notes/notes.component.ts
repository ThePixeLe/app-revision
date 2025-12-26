/**
 * notes.component.ts
 *
 * Page de gestion des notes personnelles.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page centrale pour toutes tes notes :
 * - Notes personnelles
 * - Resumes de PDF generes par l'IA
 * - Flashcards de revision
 *
 * Analogie du monde reel :
 * -----------------------
 * C'est ton carnet de notes numerique.
 * Tu peux y ecrire, organiser et retrouver
 * toutes tes notes en un seul endroit.
 *
 * Fonctionnalites :
 * ----------------
 * 1. Liste des notes (grille/liste)
 * 2. Filtrage par type, categorie, tags
 * 3. Recherche dans le contenu
 * 4. Creation/Edition de notes (Markdown)
 * 5. Favoris et notes epinglees
 * 6. Export en PDF
 *
 * Philosophie David J. Malan :
 * "Notes are the bridge between learning and remembering."
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NotesService } from '../../core/services/notes.service';
import {
  Note,
  NoteType,
  NoteCategory,
  NoteFilters,
  NoteSortOptions,
  filterNotes,
  sortNotes
} from '../../core/models/note.model';

import { MarkdownEditorComponent } from '../../shared/components/markdown-editor/markdown-editor.component';

/**
 * Modes d'affichage
 */
type ViewMode = 'grid' | 'list';

/**
 * Onglets de filtrage rapide
 */
interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  filter: Partial<NoteFilters>;
}

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarkdownEditorComponent],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIETES
  // ============================================================

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  /** Toutes les notes */
  allNotes: Note[] = [];

  /** Notes filtrees */
  filteredNotes: Note[] = [];

  /** Note selectionnee (pour edition) */
  selectedNote: Note | null = null;

  /** Mode d'affichage */
  viewMode: ViewMode = 'grid';

  /** Recherche */
  searchTerm = '';

  /** Filtres actifs */
  filters: NoteFilters = {};

  /** Tri actif */
  sortOptions: NoteSortOptions = {
    by: 'updatedAt',
    order: 'desc'
  };

  /** Filtre rapide actif */
  activeQuickFilter = 'all';

  /** Modal d'edition ouverte */
  isEditorOpen = false;

  /** Mode creation (vs edition) */
  isCreating = false;

  /** Chargement en cours */
  isLoading = true;

  // ============================================================
  // DONNEES STATIQUES
  // ============================================================

  /**
   * Filtres rapides
   */
  quickFilters: QuickFilter[] = [
    {
      id: 'all',
      label: 'Toutes',
      icon: '📝',
      filter: {}
    },
    {
      id: 'personal',
      label: 'Personnelles',
      icon: '✏️',
      filter: { types: ['personal'] }
    },
    {
      id: 'summaries',
      label: 'Resumes IA',
      icon: '🤖',
      filter: { types: ['summary'] }
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: '🎴',
      filter: { types: ['flashcard'] }
    },
    {
      id: 'favorites',
      label: 'Favoris',
      icon: '⭐',
      filter: { favoritesOnly: true }
    },
    {
      id: 'pinned',
      label: 'Epinglees',
      icon: '📌',
      filter: {}
    }
  ];

  /**
   * Options de categorie
   */
  categories: { value: NoteCategory; label: string; color: string }[] = [
    { value: 'algo', label: 'Algorithmique', color: '#8b5cf6' },
    { value: 'java', label: 'Java', color: '#f97316' },
    { value: 'algebre', label: 'Algebre', color: '#3b82f6' },
    { value: 'poo', label: 'POO', color: '#ec4899' },
    { value: 'bdd', label: 'Base de donnees', color: '#06b6d4' },
    { value: 'general', label: 'General', color: '#64748b' }
  ];

  /**
   * Options de tri
   */
  sortFields = [
    { value: 'updatedAt', label: 'Date modification' },
    { value: 'createdAt', label: 'Date creation' },
    { value: 'title', label: 'Titre' }
  ];

  // ============================================================
  // CONSTRUCTEUR ET CYCLE DE VIE
  // ============================================================

  constructor(private notesService: NotesService) {}

  ngOnInit(): void {
    this.loadNotes();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNEES
  // ============================================================

  /**
   * Charge les notes depuis le service
   */
  private loadNotes(): void {
    this.isLoading = true;

    this.notesService.notes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notes => {
        this.allNotes = notes;
        this.applyFilters();
        this.isLoading = false;
        console.log(`📝 ${notes.length} notes chargees`);
      });
  }

  /**
   * Configure la recherche avec debounce
   */
  private setupSearch(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.filters.searchQuery = term || undefined;
        this.applyFilters();
      });
  }

  // ============================================================
  // FILTRAGE ET TRI
  // ============================================================

  /**
   * Applique les filtres et le tri
   */
  applyFilters(): void {
    let notes = [...this.allNotes];

    // Appliquer les filtres
    notes = filterNotes(notes, this.filters);

    // Appliquer le tri
    notes = sortNotes(notes, this.sortOptions);

    // Les notes epinglees en premier
    notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    this.filteredNotes = notes;
  }

  /**
   * Gere la saisie de recherche
   */
  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject$.next(this.searchTerm);
  }

  /**
   * Selectionne un filtre rapide
   */
  selectQuickFilter(filterId: string): void {
    this.activeQuickFilter = filterId;

    const quickFilter = this.quickFilters.find(f => f.id === filterId);
    if (quickFilter) {
      // Reset filters and apply quick filter
      this.filters = { ...quickFilter.filter };
      if (this.searchTerm) {
        this.filters.searchQuery = this.searchTerm;
      }
      this.applyFilters();
    }
  }

  /**
   * Change le tri
   */
  onSortChange(field: string): void {
    if (this.sortOptions.by === field) {
      // Toggle direction
      this.sortOptions.order = this.sortOptions.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortOptions.by = field as any;
      this.sortOptions.order = 'desc';
    }
    this.applyFilters();
  }

  /**
   * Filtre par categorie
   */
  filterByCategory(category: NoteCategory | null): void {
    if (category) {
      this.filters.categories = [category];
    } else {
      delete this.filters.categories;
    }
    this.applyFilters();
  }

  // ============================================================
  // ACTIONS CRUD
  // ============================================================

  /**
   * Ouvre l'editeur pour creer une note
   */
  createNote(): void {
    this.selectedNote = null;
    this.isCreating = true;
    this.isEditorOpen = true;
  }

  /**
   * Ouvre l'editeur pour modifier une note
   */
  editNote(note: Note): void {
    this.selectedNote = { ...note };
    this.isCreating = false;
    this.isEditorOpen = true;
  }

  /**
   * Ferme l'editeur
   */
  closeEditor(): void {
    this.isEditorOpen = false;
    this.selectedNote = null;
  }

  /**
   * Sauvegarde une note (creation ou modification)
   */
  saveNote(noteData: Partial<Note>): void {
    if (this.isCreating) {
      // Creation
      this.notesService.createNote(noteData as Note)
        .pipe(takeUntil(this.destroy$))
        .subscribe(newNote => {
          console.log('✅ Note creee:', newNote.title);
          this.closeEditor();
        });
    } else if (this.selectedNote) {
      // Modification
      this.notesService.updateNote(this.selectedNote.id, noteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe(updatedNote => {
          if (updatedNote) {
            console.log('✅ Note mise a jour:', updatedNote.title);
          }
          this.closeEditor();
        });
    }
  }

  /**
   * Supprime une note
   */
  deleteNote(note: Note, event: Event): void {
    event.stopPropagation();

    if (confirm(`Supprimer la note "${note.title}" ?`)) {
      this.notesService.deleteNote(note.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          console.log('🗑️ Note supprimee:', note.title);
        });
    }
  }

  /**
   * Toggle favori
   */
  toggleFavorite(note: Note, event: Event): void {
    event.stopPropagation();
    this.notesService.toggleFavorite(note.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  /**
   * Toggle epingle
   */
  togglePin(note: Note, event: Event): void {
    event.stopPropagation();
    this.notesService.togglePinned(note.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  /**
   * Change le mode d'affichage
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  /**
   * Obtient la couleur d'une categorie
   */
  getCategoryColor(category?: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.color || '#64748b';
  }

  /**
   * Obtient le label d'une categorie
   */
  getCategoryLabel(category?: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.label || 'General';
  }

  /**
   * Obtient l'icone du type de note
   */
  getTypeIcon(type: NoteType): string {
    const icons: Record<NoteType, string> = {
      'personal': '✏️',
      'summary': '🤖',
      'flashcard': '🎴',
      'question': '❓'
    };
    return icons[type] || '📝';
  }

  /**
   * Formate une date relative
   */
  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'A l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return new Date(date).toLocaleDateString('fr-FR');
  }

  /**
   * Extrait un apercu du contenu markdown
   */
  getContentPreview(content: string, maxLength = 120): string {
    // Supprime les balises markdown
    const stripped = content
      .replace(/#{1,6}\s/g, '')        // Titres
      .replace(/\*\*(.+?)\*\*/g, '$1') // Gras
      .replace(/\*(.+?)\*/g, '$1')     // Italique
      .replace(/`(.+?)`/g, '$1')       // Code inline
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Liens
      .replace(/\n/g, ' ')             // Sauts de ligne
      .trim();

    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  }

  /**
   * Compte les notes par filtre rapide
   */
  getQuickFilterCount(filterId: string): number {
    const quickFilter = this.quickFilters.find(f => f.id === filterId);
    if (!quickFilter) return 0;

    return filterNotes(this.allNotes, quickFilter.filter).length;
  }
}
