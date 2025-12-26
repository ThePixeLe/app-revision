/**
 * pdf-extraction.service.ts
 *
 * Service pour EXTRAIRE le texte des fichiers PDF.
 *
 * Fonctionnement :
 * ---------------
 * 1. Charge le PDF avec pdf.js (pdfjs-dist)
 * 2. Parcourt chaque page
 * 3. Extrait le texte de chaque page
 * 4. Concatene le tout
 *
 * Technologie utilisee :
 * ---------------------
 * pdf.js (pdfjs-dist) - Bibliotheque Mozilla pour le rendu PDF
 * Meme technologie que Firefox pour afficher les PDFs !
 *
 * Philosophie David J. Malan :
 * "Abstraction is the art of hiding complexity."
 *
 * Ce service cache toute la complexite de l'extraction PDF
 * derriere une simple methode extractText().
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Injectable } from '@angular/core';
import { ExtractionResult } from '../models/pdf-summary.model';

// Import de pdf.js
// La bibliotheque est deja installee (pdfjs-dist@5.4.449)
import * as pdfjsLib from 'pdfjs-dist';

// ============================================================
// INTERFACES INTERNES
// ============================================================

/**
 * Cache pour le texte extrait
 */
interface TextCache {
  pdfPath: string;
  text: string;
  pageCount: number;
  cachedAt: Date;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PDFExtractionService {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  /**
   * Duree du cache (24 heures)
   */
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

  /**
   * Cache en memoire pour eviter de re-extraire
   */
  private cache = new Map<string, TextCache>();

  /**
   * Worker pdf.js initialise ?
   */
  private workerInitialized = false;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor() {
    this.initializeWorker();
  }

  /**
   * Initialise le worker pdf.js
   * Le worker permet de traiter les PDFs en arriere-plan
   * sans bloquer l'interface utilisateur.
   */
  private initializeWorker(): void {
    if (this.workerInitialized) return;

    try {
      // Configuration du worker
      // Le worker est un script qui tourne dans un thread separe
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

      this.workerInitialized = true;
      console.log('📄 PDF.js worker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize PDF.js worker:', error);
    }
  }

  // ============================================================
  // METHODES PUBLIQUES
  // ============================================================

  /**
   * EXTRAIRE LE TEXTE D'UN PDF
   * -------------------------
   * Methode principale pour extraire tout le texte d'un PDF.
   *
   * @param pdfUrl - URL ou chemin vers le PDF
   * @returns Promise avec le resultat d'extraction
   *
   * Exemple :
   * ```typescript
   * const result = await pdfExtractionService.extractText('/assets/docs/algo.pdf');
   * if (result.success) {
   *   console.log('Texte:', result.text);
   *   console.log('Pages:', result.pageCount);
   * }
   * ```
   */
  async extractText(pdfUrl: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      // Verifier le cache
      const cached = this.getFromCache(pdfUrl);
      if (cached) {
        console.log('📄 PDF text loaded from cache:', pdfUrl);
        return {
          success: true,
          text: cached.text,
          pageCount: cached.pageCount,
          extractionTime: Date.now() - startTime
        };
      }

      console.log('📄 Extracting text from PDF:', pdfUrl);

      // Charger le document PDF
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      const pageCount = pdf.numPages;
      let fullText = '';

      // Extraire le texte de chaque page
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Concatener les items de texte
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }

      // Nettoyer le texte
      fullText = this.cleanText(fullText);

      // Mettre en cache
      this.addToCache(pdfUrl, fullText, pageCount);

      const extractionTime = Date.now() - startTime;
      console.log(`✅ PDF extracted: ${pageCount} pages in ${extractionTime}ms`);

      return {
        success: true,
        text: fullText,
        pageCount,
        extractionTime
      };

    } catch (error: any) {
      console.error('❌ PDF extraction error:', error);

      return {
        success: false,
        text: '',
        pageCount: 0,
        error: error.message || 'Failed to extract text from PDF',
        extractionTime: Date.now() - startTime
      };
    }
  }

  /**
   * EXTRAIRE DES PAGES SPECIFIQUES
   * -----------------------------
   * Extrait le texte d'une plage de pages.
   *
   * @param pdfUrl - URL du PDF
   * @param startPage - Page de debut (1-indexed)
   * @param endPage - Page de fin (1-indexed)
   */
  async extractPages(
    pdfUrl: string,
    startPage: number,
    endPage: number
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      const totalPages = pdf.numPages;

      // Valider les pages
      startPage = Math.max(1, startPage);
      endPage = Math.min(totalPages, endPage);

      let text = '';

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        text += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }

      return {
        success: true,
        text: this.cleanText(text),
        pageCount: endPage - startPage + 1,
        extractionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        text: '',
        pageCount: 0,
        error: error.message,
        extractionTime: Date.now() - startTime
      };
    }
  }

  /**
   * OBTENIR LE NOMBRE DE PAGES
   * -------------------------
   * Sans extraire le texte complet.
   */
  async getPageCount(pdfUrl: string): Promise<number> {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch (error) {
      console.error('❌ Failed to get page count:', error);
      return 0;
    }
  }

  /**
   * VERIFIER SI UN PDF EST VALIDE
   * ----------------------------
   */
  async isValidPDF(pdfUrl: string): Promise<boolean> {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      await loadingTask.promise;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * VIDER LE CACHE
   * -------------
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ PDF text cache cleared');
  }

  /**
   * SUPPRIMER DU CACHE
   * -----------------
   */
  removeFromCache(pdfUrl: string): void {
    this.cache.delete(pdfUrl);
  }

  // ============================================================
  // METHODES PRIVEES
  // ============================================================

  /**
   * Nettoyer le texte extrait
   * - Supprimer les espaces multiples
   * - Normaliser les sauts de ligne
   */
  private cleanText(text: string): string {
    return text
      // Remplacer les espaces multiples par un seul
      .replace(/\s+/g, ' ')
      // Normaliser les sauts de ligne
      .replace(/\n\s*\n/g, '\n\n')
      // Supprimer les espaces en debut/fin
      .trim();
  }

  /**
   * Obtenir du cache
   */
  private getFromCache(pdfUrl: string): TextCache | null {
    const cached = this.cache.get(pdfUrl);

    if (!cached) return null;

    // Verifier expiration
    if (new Date() > cached.expiresAt) {
      this.cache.delete(pdfUrl);
      return null;
    }

    return cached;
  }

  /**
   * Ajouter au cache
   */
  private addToCache(pdfUrl: string, text: string, pageCount: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION_MS);

    this.cache.set(pdfUrl, {
      pdfPath: pdfUrl,
      text,
      pageCount,
      cachedAt: now,
      expiresAt
    });
  }
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI utiliser pdf.js ?
 *
 *    pdf.js est la bibliotheque de reference pour les PDFs web :
 *    - Developpee par Mozilla (Firefox)
 *    - Open source et bien maintenue
 *    - Pas besoin de plugin navigateur
 *    - Fonctionne 100% en JavaScript
 *
 * 2. POURQUOI un worker ?
 *
 *    Le traitement d'un PDF peut etre LOURD (gros fichier).
 *    Sans worker → L'UI FREEZE pendant l'extraction
 *    Avec worker → Traitement en arriere-plan, UI fluide
 *
 *    C'est le principe du "non-blocking I/O" de Node.js.
 *
 * 3. POURQUOI un cache ?
 *
 *    Extraire 50 pages prend ~2-5 secondes.
 *    Si l'utilisateur revient sur le meme PDF, inutile de re-extraire !
 *
 *    Le cache expire apres 24h pour :
 *    - Liberer la memoire
 *    - Rafraichir si le PDF a change
 *
 * 4. POURQUOI nettoyer le texte ?
 *
 *    Les PDFs sont bizarres !
 *    - Espaces multiples partout
 *    - Sauts de ligne aleatoires
 *    - Caracteres invisibles
 *
 *    Le nettoyage rend le texte utilisable par l'IA.
 */
