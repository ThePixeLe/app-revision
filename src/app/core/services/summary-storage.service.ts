/**
 * summary-storage.service.ts
 *
 * Service pour STOCKER les resumes PDF dans IndexedDB.
 *
 * Fonctionnement :
 * ---------------
 * 1. Sauvegarde les resumes generes
 * 2. Gere le cache du texte extrait
 * 3. Permet la recherche et le filtrage
 * 4. Synchronise avec LocalForage
 *
 * Philosophie David J. Malan :
 * "Persistence is the key to long-term learning."
 *
 * Les resumes sont sauvegardes pour pouvoir les consulter
 * plus tard, sans avoir a regenerer a chaque fois.
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { StorageService, StorageKeys } from './storage.service';
import { PDFSummary } from '../models/pdf-summary.model';

// ============================================================
// INTERFACES INTERNES
// ============================================================

/**
 * Cache du texte extrait
 */
interface TextCacheEntry {
  pdfId: string;
  text: string;
  pageCount: number;
  cachedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SummaryStorageService {

  // ============================================================
  // PROPRIETES
  // ============================================================

  /** Liste des resumes */
  private summariesSubject = new BehaviorSubject<PDFSummary[]>([]);
  summaries$ = this.summariesSubject.asObservable();

  /** Cache du texte en memoire */
  private textCache = new Map<string, TextCacheEntry>();

  /** Chargement initial effectue ? */
  private loaded = false;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private storageService: StorageService) {
    this.loadSummaries();
  }

  // ============================================================
  // METHODES PUBLIQUES - CRUD
  // ============================================================

  /**
   * SAUVEGARDER UN RESUME
   * --------------------
   */
  saveSummary(summary: PDFSummary): Observable<PDFSummary> {
    return this.getAllSummaries().pipe(
      map(summaries => {
        // Verifier si existe deja
        const existingIndex = summaries.findIndex(s => s.id === summary.id);

        if (existingIndex >= 0) {
          // Mettre a jour
          summaries[existingIndex] = { ...summary, updatedAt: new Date() };
        } else {
          // Ajouter
          summaries.push(summary);
        }

        return summaries;
      }),
      tap(summaries => {
        // Sauvegarder dans IndexedDB
        this.storageService.set(StorageKeys.PDF_SUMMARIES, summaries).subscribe();
        this.summariesSubject.next(summaries);
      }),
      map(() => summary),
      catchError(error => {
        console.error('❌ Failed to save summary:', error);
        throw error;
      })
    );
  }

  /**
   * OBTENIR UN RESUME PAR ID
   * -----------------------
   */
  getSummary(id: string): Observable<PDFSummary | null> {
    return this.summaries$.pipe(
      map(summaries => summaries.find(s => s.id === id) || null)
    );
  }

  /**
   * OBTENIR UN RESUME PAR PDF ID
   * ---------------------------
   */
  getSummaryByPdf(pdfId: string): Observable<PDFSummary | null> {
    return this.summaries$.pipe(
      map(summaries => summaries.find(s => s.pdfId === pdfId) || null)
    );
  }

  /**
   * OBTENIR TOUS LES RESUMES
   * -----------------------
   */
  getAllSummaries(): Observable<PDFSummary[]> {
    if (!this.loaded) {
      return this.loadSummaries();
    }
    return this.summaries$;
  }

  /**
   * SUPPRIMER UN RESUME
   * ------------------
   */
  deleteSummary(id: string): Observable<void> {
    return this.getAllSummaries().pipe(
      map(summaries => summaries.filter(s => s.id !== id)),
      tap(summaries => {
        this.storageService.set(StorageKeys.PDF_SUMMARIES, summaries).subscribe();
        this.summariesSubject.next(summaries);
      }),
      map(() => undefined),
      catchError(error => {
        console.error('❌ Failed to delete summary:', error);
        throw error;
      })
    );
  }

  /**
   * SUPPRIMER LE RESUME D'UN PDF
   * ---------------------------
   */
  deleteSummaryByPdf(pdfId: string): Observable<void> {
    return this.getAllSummaries().pipe(
      map(summaries => summaries.filter(s => s.pdfId !== pdfId)),
      tap(summaries => {
        this.storageService.set(StorageKeys.PDF_SUMMARIES, summaries).subscribe();
        this.summariesSubject.next(summaries);
      }),
      map(() => undefined)
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - FAVORIS
  // ============================================================

  /**
   * BASCULER FAVORI
   * --------------
   */
  toggleFavorite(id: string): Observable<PDFSummary | null> {
    return this.getAllSummaries().pipe(
      map(summaries => {
        const summary = summaries.find(s => s.id === id);
        if (summary) {
          summary.isFavorite = !summary.isFavorite;
          summary.updatedAt = new Date();
        }
        return { summaries, updated: summary };
      }),
      tap(({ summaries }) => {
        this.storageService.set(StorageKeys.PDF_SUMMARIES, summaries).subscribe();
        this.summariesSubject.next(summaries);
      }),
      map(({ updated }) => updated || null)
    );
  }

  /**
   * OBTENIR LES FAVORIS
   * ------------------
   */
  getFavorites(): Observable<PDFSummary[]> {
    return this.summaries$.pipe(
      map(summaries => summaries.filter(s => s.isFavorite))
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - TAGS
  // ============================================================

  /**
   * AJOUTER UN TAG
   * -------------
   */
  addTag(id: string, tag: string): Observable<PDFSummary | null> {
    return this.getAllSummaries().pipe(
      map(summaries => {
        const summary = summaries.find(s => s.id === id);
        if (summary && !summary.tags.includes(tag)) {
          summary.tags.push(tag);
          summary.updatedAt = new Date();
        }
        return { summaries, updated: summary };
      }),
      tap(({ summaries }) => {
        this.storageService.set(StorageKeys.PDF_SUMMARIES, summaries).subscribe();
        this.summariesSubject.next(summaries);
      }),
      map(({ updated }) => updated || null)
    );
  }

  /**
   * SUPPRIMER UN TAG
   * ---------------
   */
  removeTag(id: string, tag: string): Observable<PDFSummary | null> {
    return this.getAllSummaries().pipe(
      map(summaries => {
        const summary = summaries.find(s => s.id === id);
        if (summary) {
          summary.tags = summary.tags.filter(t => t !== tag);
          summary.updatedAt = new Date();
        }
        return { summaries, updated: summary };
      }),
      tap(({ summaries }) => {
        this.storageService.set(StorageKeys.PDF_SUMMARIES, summaries).subscribe();
        this.summariesSubject.next(summaries);
      }),
      map(({ updated }) => updated || null)
    );
  }

  /**
   * OBTENIR TOUS LES TAGS
   * --------------------
   */
  getAllTags(): Observable<string[]> {
    return this.summaries$.pipe(
      map(summaries => {
        const allTags = summaries.flatMap(s => s.tags);
        return [...new Set(allTags)].sort();
      })
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - CACHE TEXTE
  // ============================================================

  /**
   * CACHER LE TEXTE EXTRAIT
   * ----------------------
   */
  cacheExtractedText(pdfId: string, text: string, pageCount: number): void {
    this.textCache.set(pdfId, {
      pdfId,
      text,
      pageCount,
      cachedAt: new Date()
    });

    // Sauvegarder aussi dans IndexedDB
    this.saveTextCache();
  }

  /**
   * OBTENIR LE TEXTE CACHE
   * ---------------------
   */
  getCachedText(pdfId: string): string | null {
    const entry = this.textCache.get(pdfId);
    return entry?.text || null;
  }

  /**
   * VERIFIER SI TEXTE CACHE
   * ----------------------
   */
  hasTextCache(pdfId: string): boolean {
    return this.textCache.has(pdfId);
  }

  /**
   * VIDER LE CACHE TEXTE
   * -------------------
   */
  clearTextCache(): void {
    this.textCache.clear();
    this.storageService.remove(StorageKeys.PDF_TEXT_CACHE).subscribe();
  }

  // ============================================================
  // METHODES PUBLIQUES - STATISTIQUES
  // ============================================================

  /**
   * OBTENIR LES STATISTIQUES
   * -----------------------
   */
  getStats(): Observable<{
    total: number;
    favorites: number;
    byCategory: Record<string, number>;
    recentCount: number;
  }> {
    return this.summaries$.pipe(
      map(summaries => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const byCategory: Record<string, number> = {};
        summaries.forEach(s => {
          byCategory[s.category] = (byCategory[s.category] || 0) + 1;
        });

        return {
          total: summaries.length,
          favorites: summaries.filter(s => s.isFavorite).length,
          byCategory,
          recentCount: summaries.filter(s =>
            new Date(s.createdAt) > oneWeekAgo
          ).length
        };
      })
    );
  }

  // ============================================================
  // METHODES PUBLIQUES - RECHERCHE
  // ============================================================

  /**
   * RECHERCHER DANS LES RESUMES
   * --------------------------
   */
  search(query: string): Observable<PDFSummary[]> {
    const lowerQuery = query.toLowerCase();

    return this.summaries$.pipe(
      map(summaries => summaries.filter(s =>
        s.pdfTitle.toLowerCase().includes(lowerQuery) ||
        s.summary.toLowerCase().includes(lowerQuery) ||
        s.keyPoints.some(kp => kp.text.toLowerCase().includes(lowerQuery)) ||
        s.mainConcepts.some(mc =>
          mc.title.toLowerCase().includes(lowerQuery) ||
          mc.description.toLowerCase().includes(lowerQuery)
        ) ||
        s.tags.some(t => t.toLowerCase().includes(lowerQuery))
      ))
    );
  }

  /**
   * FILTRER PAR CATEGORIE
   * --------------------
   */
  filterByCategory(category: string): Observable<PDFSummary[]> {
    return this.summaries$.pipe(
      map(summaries => summaries.filter(s => s.category === category))
    );
  }

  // ============================================================
  // METHODES PRIVEES
  // ============================================================

  /**
   * Charger les resumes depuis IndexedDB
   */
  private loadSummaries(): Observable<PDFSummary[]> {
    return this.storageService.get<PDFSummary[]>(StorageKeys.PDF_SUMMARIES).pipe(
      map(summaries => summaries || []),
      tap(summaries => {
        this.summariesSubject.next(summaries);
        this.loaded = true;
        console.log(`📚 Loaded ${summaries.length} summaries`);
      }),
      catchError(error => {
        console.error('❌ Failed to load summaries:', error);
        this.loaded = true;
        return of([]);
      })
    );
  }

  /**
   * Sauvegarder le cache texte
   */
  private saveTextCache(): void {
    const cacheArray = Array.from(this.textCache.values());
    this.storageService.set(StorageKeys.PDF_TEXT_CACHE, cacheArray).subscribe();
  }

  /**
   * Charger le cache texte
   */
  private loadTextCache(): void {
    this.storageService.get<TextCacheEntry[]>(StorageKeys.PDF_TEXT_CACHE)
      .subscribe(entries => {
        if (entries) {
          entries.forEach(entry => {
            this.textCache.set(entry.pdfId, entry);
          });
        }
      });
  }
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI cacher le texte extrait ?
 *
 *    L'extraction PDF prend ~2-5 secondes.
 *    Si l'utilisateur veut regenerer avec une autre longueur,
 *    inutile de re-extraire !
 *
 *    Cache = Gain de temps = Meilleure UX
 *
 * 2. POURQUOI BehaviorSubject ?
 *
 *    BehaviorSubject garde la derniere valeur.
 *    Quand un composant s'abonne, il recoit IMMEDIATEMENT
 *    la valeur actuelle, sans attendre.
 *
 *    Subject normal : Attendre le prochain emit
 *    BehaviorSubject : Valeur immédiate + prochains emits
 *
 * 3. POURQUOI Observable plutot que Promise ?
 *
 *    Angular prefere les Observables :
 *    - Annulables (unsubscribe)
 *    - Composables (pipe, map, filter)
 *    - Peuvent emettre plusieurs valeurs
 *
 *    Les Observables sont le "langage" d'Angular.
 *
 * 4. POURQUOI separer storage et summarization ?
 *
 *    Principe de responsabilite unique (SRP) :
 *    - PDFSummarizationService → Generation
 *    - SummaryStorageService → Persistance
 *
 *    Plus facile a tester et maintenir !
 */
