/**
 * notes.service.ts
 *
 * Service pour GERER les notes personnelles.
 *
 * Fonctionnalites :
 * ----------------
 * - CRUD complet (Create, Read, Update, Delete)
 * - Recherche full-text
 * - Filtrage par type, categorie, tags
 * - Tri par date, titre
 * - Favoris et epingles
 * - Export/Import JSON
 *
 * Philosophie David J. Malan :
 * "Good notes are the foundation of good learning."
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { StorageService, StorageKeys } from './storage.service';
import {
  Note,
  Flashcard,
  NoteType,
  NoteCategory,
  NoteFilters,
  NoteSortOptions,
  NoteSearchResult,
  NoteStats,
  createNote,
  createFlashcard,
  filterNotes,
  sortNotes,
  countWords
} from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  // ============================================================
  // PROPRIETES
  // ============================================================

  /** Liste des notes */
  private notesSubject = new BehaviorSubject<Note[]>([]);
  notes$ = this.notesSubject.asObservable();

  /** Chargement effectue ? */
  private loaded = false;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private storageService: StorageService) {
    this.loadNotes();
  }

  // ============================================================
  // METHODES PUBLIQUES - CRUD
  // ============================================================

  /**
   * CREER UNE NOTE
   * -------------
   */
  createNote(data: Partial<Note> & { title: string; content: string }): Observable<Note> {
    const note = createNote(data);

    return this.getAllNotes().pipe(
      map(notes => [...notes, note]),
      tap(notes => {
        this.saveAndUpdate(notes);
      }),
      map(() => note),
      catchError(error => {
        console.error('❌ Failed to create note:', error);
        throw error;
      })
    );
  }

  /**
   * CREER UNE FLASHCARD
   * ------------------
   */
  createFlashcardNote(data: { question: string; answer: string } & Partial<Flashcard>): Observable<Flashcard> {
    const flashcard = createFlashcard(data);

    return this.getAllNotes().pipe(
      map(notes => [...notes, flashcard]),
      tap(notes => {
        this.saveAndUpdate(notes);
      }),
      map(() => flashcard)
    );
  }

  /**
   * OBTENIR UNE NOTE PAR ID
   * ----------------------
   */
  getNote(id: string): Observable<Note | null> {
    return this.notes$.pipe(
      map(notes => notes.find(n => n.id === id) || null)
    );
  }

  /**
   * OBTENIR TOUTES LES NOTES
   * -----------------------
   */
  getAllNotes(): Observable<Note[]> {
    if (!this.loaded) {
      return this.loadNotes();
    }
    return this.notes$;
  }

  /**
   * METTRE A JOUR UNE NOTE
   * ---------------------
   */
  updateNote(id: string, updates: Partial<Note>): Observable<Note | null> {
    return this.getAllNotes().pipe(
      map(notes => {
        const index = notes.findIndex(n => n.id === id);
        if (index === -1) return { notes, updated: null };

        const updated: Note = {
          ...notes[index],
          ...updates,
          updatedAt: new Date(),
          wordCount: updates.content
            ? countWords(updates.content)
            : notes[index].wordCount
        };

        notes[index] = updated;
        return { notes, updated };
      }),
      tap(({ notes }) => {
        this.saveAndUpdate(notes);
      }),
      map(({ updated }) => updated)
    );
  }

  /**
   * SUPPRIMER UNE NOTE
   * -----------------
   */
  deleteNote(id: string): Observable<void> {
    return this.getAllNotes().pipe(
      map(notes => notes.filter(n => n.id !== id)),
      tap(notes => {
        this.saveAndUpdate(notes);
      }),
      map(() => undefined)
    );
  }

  /**
   * SUPPRIMER PLUSIEURS NOTES
   * ------------------------
   */
  deleteNotes(ids: string[]): Observable<void> {
    return this.getAllNotes().pipe(
      map(notes => notes.filter(n => !ids.includes(n.id))),
      tap(notes => {
        this.saveAndUpdate(notes);
      }),
      map(() => undefined)
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - FAVORIS ET EPINGLES
  // ============================================================

  /**
   * BASCULER FAVORI
   * --------------
   */
  toggleFavorite(id: string): Observable<Note | null> {
    return this.getAllNotes().pipe(
      map(notes => {
        const note = notes.find(n => n.id === id);
        if (note) {
          note.isFavorite = !note.isFavorite;
          note.updatedAt = new Date();
        }
        return { notes, updated: note };
      }),
      tap(({ notes }) => {
        this.saveAndUpdate(notes);
      }),
      map(({ updated }) => updated || null)
    );
  }

  /**
   * BASCULER EPINGLE
   * ---------------
   */
  togglePinned(id: string): Observable<Note | null> {
    return this.getAllNotes().pipe(
      map(notes => {
        const note = notes.find(n => n.id === id);
        if (note) {
          note.isPinned = !note.isPinned;
          note.updatedAt = new Date();
        }
        return { notes, updated: note };
      }),
      tap(({ notes }) => {
        this.saveAndUpdate(notes);
      }),
      map(({ updated }) => updated || null)
    );
  }

  /**
   * ARCHIVER UNE NOTE
   * ----------------
   */
  archiveNote(id: string): Observable<Note | null> {
    return this.updateNote(id, { isArchived: true });
  }

  /**
   * DESARCHIVER UNE NOTE
   * -------------------
   */
  unarchiveNote(id: string): Observable<Note | null> {
    return this.updateNote(id, { isArchived: false });
  }

  // ============================================================
  // METHODES PUBLIQUES - RECHERCHE ET FILTRAGE
  // ============================================================

  /**
   * RECHERCHER DANS LES NOTES
   * ------------------------
   */
  searchNotes(query: string): Observable<NoteSearchResult[]> {
    const lowerQuery = query.toLowerCase();

    return this.notes$.pipe(
      map(notes => {
        const results: NoteSearchResult[] = [];

        notes.forEach(note => {
          // Chercher dans le titre
          if (note.title.toLowerCase().includes(lowerQuery)) {
            results.push({
              note,
              matchType: 'title',
              snippet: note.title,
              relevanceScore: 100
            });
            return;
          }

          // Chercher dans le contenu
          const contentIndex = note.content.toLowerCase().indexOf(lowerQuery);
          if (contentIndex !== -1) {
            const start = Math.max(0, contentIndex - 30);
            const end = Math.min(note.content.length, contentIndex + query.length + 30);
            results.push({
              note,
              matchType: 'content',
              snippet: '...' + note.content.substring(start, end) + '...',
              relevanceScore: 80
            });
            return;
          }

          // Chercher dans les tags
          const matchingTag = note.tags.find(t => t.toLowerCase().includes(lowerQuery));
          if (matchingTag) {
            results.push({
              note,
              matchType: 'tag',
              snippet: `Tag: ${matchingTag}`,
              relevanceScore: 60
            });
          }
        });

        // Trier par pertinence
        return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      })
    );
  }

  /**
   * FILTRER LES NOTES
   * ----------------
   */
  getFilteredNotes(filters: NoteFilters): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => filterNotes(notes, filters))
    );
  }

  /**
   * TRIER LES NOTES
   * --------------
   */
  getSortedNotes(options: NoteSortOptions): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => sortNotes(notes, options))
    );
  }

  /**
   * OBTENIR PAR PDF
   * --------------
   */
  getNotesByPdf(pdfId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(n => n.pdfId === pdfId))
    );
  }

  /**
   * OBTENIR PAR RESUME
   * -----------------
   */
  getNotesBySummary(summaryId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(n => n.summaryId === summaryId))
    );
  }

  /**
   * OBTENIR PAR CATEGORIE
   * --------------------
   */
  getNotesByCategory(category: NoteCategory): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(n => n.category === category))
    );
  }

  /**
   * OBTENIR PAR TYPE
   * ---------------
   */
  getNotesByType(type: NoteType): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(n => n.type === type))
    );
  }

  /**
   * OBTENIR LES FAVORIS
   * ------------------
   */
  getFavorites(): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(n => n.isFavorite && !n.isArchived))
    );
  }

  /**
   * OBTENIR LES FLASHCARDS
   * ---------------------
   */
  getFlashcards(): Observable<Flashcard[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(n => n.type === 'flashcard') as Flashcard[])
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - TAGS
  // ============================================================

  /**
   * AJOUTER UN TAG
   * -------------
   */
  addTag(noteId: string, tag: string): Observable<Note | null> {
    return this.getAllNotes().pipe(
      map(notes => {
        const note = notes.find(n => n.id === noteId);
        if (note && !note.tags.includes(tag)) {
          note.tags.push(tag);
          note.updatedAt = new Date();
        }
        return { notes, updated: note };
      }),
      tap(({ notes }) => {
        this.saveAndUpdate(notes);
      }),
      map(({ updated }) => updated || null)
    );
  }

  /**
   * SUPPRIMER UN TAG
   * ---------------
   */
  removeTag(noteId: string, tag: string): Observable<Note | null> {
    return this.getAllNotes().pipe(
      map(notes => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
          note.tags = note.tags.filter(t => t !== tag);
          note.updatedAt = new Date();
        }
        return { notes, updated: note };
      }),
      tap(({ notes }) => {
        this.saveAndUpdate(notes);
      }),
      map(({ updated }) => updated || null)
    );
  }

  /**
   * OBTENIR TOUS LES TAGS
   * --------------------
   */
  getAllTags(): Observable<{ tag: string; count: number }[]> {
    return this.notes$.pipe(
      map(notes => {
        const tagCounts = new Map<string, number>();

        notes.forEach(note => {
          note.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });

        return Array.from(tagCounts.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);
      })
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - STATISTIQUES
  // ============================================================

  /**
   * OBTENIR LES STATISTIQUES
   * -----------------------
   */
  getStats(): Observable<NoteStats> {
    return this.notes$.pipe(
      map(notes => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Par type
        const byType: Record<NoteType, number> = {
          summary: 0,
          personal: 0,
          flashcard: 0,
          question: 0
        };
        notes.forEach(n => {
          byType[n.type] = (byType[n.type] || 0) + 1;
        });

        // Par categorie
        const byCategory: Record<string, number> = {};
        notes.forEach(n => {
          if (n.category) {
            byCategory[n.category] = (byCategory[n.category] || 0) + 1;
          }
        });

        // Top tags
        const tagCounts = new Map<string, number>();
        notes.forEach(n => {
          n.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });
        const topTags = Array.from(tagCounts.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return {
          total: notes.length,
          byType,
          byCategory,
          favorites: notes.filter(n => n.isFavorite).length,
          archived: notes.filter(n => n.isArchived).length,
          recentlyUpdated: notes.filter(n =>
            new Date(n.updatedAt) > oneWeekAgo
          ).length,
          totalWords: notes.reduce((sum, n) => sum + n.wordCount, 0),
          topTags
        };
      })
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - EXPORT/IMPORT
  // ============================================================

  /**
   * EXPORTER LES NOTES EN JSON
   * -------------------------
   */
  exportNotes(noteIds?: string[]): Observable<string> {
    return this.notes$.pipe(
      map(notes => {
        const toExport = noteIds
          ? notes.filter(n => noteIds.includes(n.id))
          : notes;

        return JSON.stringify(toExport, null, 2);
      })
    );
  }

  /**
   * IMPORTER DES NOTES DEPUIS JSON
   * -----------------------------
   */
  importNotes(json: string): Observable<Note[]> {
    try {
      const imported: Note[] = JSON.parse(json);

      // Valider et regenerer les IDs pour eviter les conflits
      const validNotes = imported.map(note => ({
        ...note,
        id: `note-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date()
      }));

      return this.getAllNotes().pipe(
        map(existingNotes => [...existingNotes, ...validNotes]),
        tap(notes => {
          this.saveAndUpdate(notes);
        }),
        map(() => validNotes)
      );
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw new Error('Format JSON invalide');
    }
  }

  // ============================================================
  // METHODES PRIVEES
  // ============================================================

  /**
   * Charger les notes depuis IndexedDB
   */
  private loadNotes(): Observable<Note[]> {
    return this.storageService.get<Note[]>(StorageKeys.PDF_NOTES).pipe(
      map(notes => notes || []),
      tap(notes => {
        this.notesSubject.next(notes);
        this.loaded = true;
        console.log(`📝 Loaded ${notes.length} notes`);
      }),
      catchError(error => {
        console.error('❌ Failed to load notes:', error);
        this.loaded = true;
        return of([]);
      })
    );
  }

  /**
   * Sauvegarder et mettre a jour
   */
  private saveAndUpdate(notes: Note[]): void {
    this.storageService.set(StorageKeys.PDF_NOTES, notes).subscribe();
    this.notesSubject.next(notes);
  }
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un service dedie aux notes ?
 *
 *    Separation of Concerns (SoC) :
 *    - Resumes PDF → SummaryStorageService
 *    - Notes personnelles → NotesService
 *
 *    Chaque service a UNE responsabilite.
 *    Plus facile a maintenir et tester !
 *
 * 2. POURQUOI la recherche full-text ?
 *
 *    Avec 50+ notes, retrouver quelque chose devient DUR.
 *    La recherche permet de retrouver instantanement :
 *    - Par titre
 *    - Par contenu
 *    - Par tag
 *
 *    "The best note is the one you can find."
 *
 * 3. POURQUOI export/import JSON ?
 *
 *    - Backup : Sauvegarder ses notes ailleurs
 *    - Migration : Changer de navigateur
 *    - Partage : Donner ses notes a un ami
 *
 *    JSON est universel et lisible par les humains.
 *
 * 4. POURQUOI separer favoris et epingles ?
 *
 *    - Favori = "J'aime cette note, importante"
 *    - Epingle = "Je veux la voir en premier"
 *
 *    Ce sont deux concepts DIFFERENTS !
 *    Une note peut etre favorite sans etre epinglee.
 */
