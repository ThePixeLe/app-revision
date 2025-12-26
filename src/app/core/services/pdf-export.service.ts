/**
 * pdf-export.service.ts
 *
 * Service pour EXPORTER les notes et resumes en PDF.
 *
 * Utilise jsPDF pour generer des PDFs professionnels.
 *
 * Analogie du monde reel :
 * ----------------------
 * C'est comme une imprimerie personnelle !
 * Tu lui donnes tes notes, elle cree un beau document PDF
 * pret a imprimer ou partager.
 *
 * Fonctionnalites :
 * ----------------
 * 1. Export de resumes PDF
 * 2. Export de notes personnelles
 * 3. Themes personnalisables (clair, sombre, pro)
 * 4. Table des matieres automatique
 * 5. Numerotation des pages
 *
 * Philosophie David J. Malan :
 * "Make the output as polished as the input was thoughtful."
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import jsPDF from 'jspdf';

import {
  PDFExportConfig,
  PDFExportResult,
  PDFDocument,
  PDFSection,
  ThemeConfig,
  TOCEntry,
  PDF_THEMES,
  DEFAULT_EXPORT_CONFIG,
  PAGE_DIMENSIONS,
  DEFAULT_MARGINS,
  generateFilename,
  getThemeConfig
} from '../models/pdf-export.model';

import { PDFSummary, IMPORTANCE_CONFIG } from '../models/pdf-summary.model';
import { Note } from '../models/note.model';

/**
 * Couleurs pour les niveaux d'importance
 */
const IMPORTANCE_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6'
};

@Injectable({
  providedIn: 'root'
})
export class PDFExportService {

  // ============================================================
  // PROPRIETES
  // ============================================================

  /** Configuration par defaut */
  private defaultConfig = DEFAULT_EXPORT_CONFIG;

  /** Marges en mm */
  private margins = DEFAULT_MARGINS;

  // ============================================================
  // METHODES PUBLIQUES
  // ============================================================

  /**
   * EXPORTER UN RESUME EN PDF
   * ------------------------
   * Genere un PDF a partir d'un resume de document.
   *
   * @param summary Le resume a exporter
   * @param config Configuration optionnelle
   * @returns Observable avec le resultat
   */
  exportSummary(
    summary: PDFSummary,
    config?: Partial<PDFExportConfig>
  ): Observable<PDFExportResult> {
    const startTime = Date.now();

    const exportConfig: PDFExportConfig = {
      ...this.defaultConfig,
      title: summary.pdfTitle || 'Resume',
      ...config
    };

    return from(this.generateSummaryPDF(summary, exportConfig)).pipe(
      map(blob => ({
        success: true,
        blob,
        filename: generateFilename(exportConfig.title),
        pageCount: this.estimatePageCount(summary),
        fileSize: blob.size,
        generationTime: Date.now() - startTime
      })),
      catchError(error => {
        console.error('❌ PDF Export Error:', error);
        return of({
          success: false,
          error: error.message || 'Erreur lors de l\'export PDF'
        });
      })
    );
  }

  /**
   * EXPORTER DES NOTES EN PDF
   * ------------------------
   * Genere un PDF a partir d'une liste de notes.
   *
   * @param notes Les notes a exporter
   * @param config Configuration optionnelle
   * @returns Observable avec le resultat
   */
  exportNotes(
    notes: Note[],
    config?: Partial<PDFExportConfig>
  ): Observable<PDFExportResult> {
    const startTime = Date.now();

    const exportConfig: PDFExportConfig = {
      ...this.defaultConfig,
      title: config?.title || 'Mes Notes',
      ...config
    };

    return from(this.generateNotesPDF(notes, exportConfig)).pipe(
      map(blob => ({
        success: true,
        blob,
        filename: generateFilename(exportConfig.title),
        pageCount: notes.length,
        fileSize: blob.size,
        generationTime: Date.now() - startTime
      })),
      catchError(error => {
        console.error('❌ PDF Export Error:', error);
        return of({
          success: false,
          error: error.message || 'Erreur lors de l\'export PDF'
        });
      })
    );
  }

  /**
   * TELECHARGER LE PDF
   * -----------------
   * Declenche le telechargement du PDF genere.
   * Accepte soit un PDFExportResult, soit directement un Blob et un filename.
   */
  downloadPDF(blobOrResult: Blob | PDFExportResult, filename?: string): void {
    let blob: Blob;
    let downloadFilename: string;

    // Detecte si c'est un PDFExportResult ou un Blob direct
    if (blobOrResult instanceof Blob) {
      blob = blobOrResult;
      downloadFilename = filename || 'document.pdf';
    } else {
      // C'est un PDFExportResult
      if (!blobOrResult.success || !blobOrResult.blob || !blobOrResult.filename) {
        console.error('❌ Cannot download: Invalid PDF result');
        return;
      }
      blob = blobOrResult.blob;
      downloadFilename = blobOrResult.filename;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Nettoyer l'URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * GENERER UNE PREVIEW
   * ------------------
   * Cree une URL pour previsualisr le PDF.
   */
  generatePreviewUrl(result: PDFExportResult): string | null {
    if (!result.success || !result.blob) return null;
    return URL.createObjectURL(result.blob);
  }

  // ============================================================
  // METHODES PRIVEES - GENERATION PDF
  // ============================================================

  /**
   * Genere le PDF d'un resume
   */
  private async generateSummaryPDF(
    summary: PDFSummary,
    config: PDFExportConfig
  ): Promise<Blob> {
    const theme = getThemeConfig(config.theme);
    const pageSize = PAGE_DIMENSIONS[config.pageFormat];

    // Creer le document PDF
    const doc = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.pageFormat
    });

    let yPos = this.margins.top;
    const contentWidth = pageSize.width - this.margins.left - this.margins.right;

    // === PAGE DE TITRE ===
    yPos = this.addTitlePage(doc, config, theme, pageSize);

    // === TABLE DES MATIERES ===
    if (config.includeTableOfContents) {
      doc.addPage();
      yPos = this.addTableOfContents(doc, summary, config, theme);
    }

    // === RESUME ===
    if (config.includeSummary && summary.summary) {
      doc.addPage();
      yPos = this.margins.top;

      yPos = this.addSectionTitle(doc, 'Resume', yPos, theme, contentWidth);
      yPos = this.addParagraph(doc, summary.summary, yPos, theme, contentWidth);
    }

    // === POINTS CLES ===
    if (config.includeKeyPoints && summary.keyPoints.length > 0) {
      yPos = this.checkPageBreak(doc, yPos, 60, pageSize);

      yPos = this.addSectionTitle(doc, 'Points Cles', yPos, theme, contentWidth);

      for (const point of summary.keyPoints) {
        yPos = this.checkPageBreak(doc, yPos, 15, pageSize);
        yPos = this.addKeyPoint(doc, point, yPos, theme, contentWidth);
      }
    }

    // === CONCEPTS PRINCIPAUX ===
    if (config.includeConcepts && summary.mainConcepts.length > 0) {
      yPos = this.checkPageBreak(doc, yPos, 60, pageSize);

      yPos = this.addSectionTitle(doc, 'Concepts Principaux', yPos, theme, contentWidth);

      for (const concept of summary.mainConcepts) {
        yPos = this.checkPageBreak(doc, yPos, 30, pageSize);
        yPos = this.addConcept(doc, concept, yPos, theme, contentWidth);
      }
    }

    // === EXERCICES SUGGERES ===
    if (config.includeExercises && summary.suggestedExercises.length > 0) {
      yPos = this.checkPageBreak(doc, yPos, 60, pageSize);

      yPos = this.addSectionTitle(doc, 'Exercices Suggeres', yPos, theme, contentWidth);

      for (const exercise of summary.suggestedExercises) {
        yPos = this.checkPageBreak(doc, yPos, 25, pageSize);
        yPos = this.addExercise(doc, exercise, yPos, theme, contentWidth);
      }
    }

    // === NUMEROS DE PAGE ===
    if (config.includePageNumbers) {
      this.addPageNumbers(doc, theme, pageSize);
    }

    // Retourner le PDF en Blob
    return doc.output('blob');
  }

  /**
   * Genere le PDF de notes
   */
  private async generateNotesPDF(
    notes: Note[],
    config: PDFExportConfig
  ): Promise<Blob> {
    const theme = getThemeConfig(config.theme);
    const pageSize = PAGE_DIMENSIONS[config.pageFormat];

    const doc = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.pageFormat
    });

    const contentWidth = pageSize.width - this.margins.left - this.margins.right;

    // === PAGE DE TITRE ===
    let yPos = this.addTitlePage(doc, config, theme, pageSize);

    // === NOTES ===
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];

      if (i > 0) {
        doc.addPage();
      } else {
        doc.addPage();
      }

      yPos = this.margins.top;

      // Titre de la note
      yPos = this.addNoteTitle(doc, note, yPos, theme, contentWidth);

      // Contenu (converti depuis Markdown simplifie)
      yPos = this.addMarkdownContent(doc, note.content, yPos, theme, contentWidth, pageSize);

      // Tags
      if (note.tags && note.tags.length > 0) {
        yPos = this.checkPageBreak(doc, yPos, 15, pageSize);
        yPos = this.addTags(doc, note.tags, yPos, theme);
      }
    }

    // === NUMEROS DE PAGE ===
    if (config.includePageNumbers) {
      this.addPageNumbers(doc, theme, pageSize);
    }

    return doc.output('blob');
  }

  // ============================================================
  // METHODES PRIVEES - ELEMENTS DU PDF
  // ============================================================

  /**
   * Ajoute la page de titre
   */
  private addTitlePage(
    doc: jsPDF,
    config: PDFExportConfig,
    theme: ThemeConfig,
    pageSize: { width: number; height: number }
  ): number {
    const centerX = pageSize.width / 2;
    let yPos = pageSize.height / 3;

    // Titre principal
    doc.setFontSize(28);
    doc.setTextColor(theme.headingColor);
    doc.setFont('helvetica', 'bold');
    doc.text(config.title, centerX, yPos, { align: 'center' });

    yPos += 15;

    // Sous-titre
    if (config.subtitle) {
      doc.setFontSize(14);
      doc.setTextColor(theme.textSecondary);
      doc.setFont('helvetica', 'normal');
      doc.text(config.subtitle, centerX, yPos, { align: 'center' });
      yPos += 10;
    }

    // Ligne decorative
    yPos += 10;
    doc.setDrawColor(config.accentColor);
    doc.setLineWidth(0.5);
    doc.line(centerX - 30, yPos, centerX + 30, yPos);

    // Date
    if (config.includeDate) {
      yPos = pageSize.height - 40;
      doc.setFontSize(10);
      doc.setTextColor(theme.textSecondary);
      const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Genere le ${date}`, centerX, yPos, { align: 'center' });
    }

    // Logo/Watermark
    if (config.includeLogo) {
      yPos = pageSize.height - 25;
      doc.setFontSize(8);
      doc.setTextColor(theme.textSecondary);
      doc.text('Study Tracker Pro', centerX, yPos, { align: 'center' });
    }

    return yPos;
  }

  /**
   * Ajoute la table des matieres
   */
  private addTableOfContents(
    doc: jsPDF,
    summary: PDFSummary,
    config: PDFExportConfig,
    theme: ThemeConfig
  ): number {
    let yPos = this.margins.top;
    const contentWidth = 170;

    // Titre
    doc.setFontSize(18);
    doc.setTextColor(theme.headingColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Table des Matieres', this.margins.left, yPos);

    yPos += 15;

    // Entrees
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const entries: { title: string; page: number }[] = [];

    if (config.includeSummary && summary.summary) {
      entries.push({ title: 'Resume', page: 3 });
    }
    if (config.includeKeyPoints && summary.keyPoints.length > 0) {
      entries.push({ title: 'Points Cles', page: 3 });
    }
    if (config.includeConcepts && summary.mainConcepts.length > 0) {
      entries.push({ title: 'Concepts Principaux', page: 4 });
    }
    if (config.includeExercises && summary.suggestedExercises.length > 0) {
      entries.push({ title: 'Exercices Suggeres', page: 5 });
    }

    for (const entry of entries) {
      doc.setTextColor(theme.textColor);
      doc.text(entry.title, this.margins.left, yPos);

      // Points de conduite
      const titleWidth = doc.getTextWidth(entry.title);
      const pageNumWidth = doc.getTextWidth(entry.page.toString());
      const dotsWidth = contentWidth - titleWidth - pageNumWidth - 10;
      const dots = '.'.repeat(Math.floor(dotsWidth / 1.5));

      doc.setTextColor(theme.textSecondary);
      doc.text(dots, this.margins.left + titleWidth + 5, yPos);

      doc.setTextColor(theme.textColor);
      doc.text(entry.page.toString(), this.margins.left + contentWidth, yPos, { align: 'right' });

      yPos += 8;
    }

    return yPos;
  }

  /**
   * Ajoute un titre de section
   */
  private addSectionTitle(
    doc: jsPDF,
    title: string,
    yPos: number,
    theme: ThemeConfig,
    contentWidth: number
  ): number {
    yPos += 5;

    doc.setFontSize(16);
    doc.setTextColor(theme.headingColor);
    doc.setFont('helvetica', 'bold');
    doc.text(title, this.margins.left, yPos);

    // Ligne sous le titre
    yPos += 3;
    doc.setDrawColor(theme.accentColor);
    doc.setLineWidth(0.3);
    doc.line(this.margins.left, yPos, this.margins.left + 50, yPos);

    return yPos + 10;
  }

  /**
   * Ajoute un paragraphe de texte
   */
  private addParagraph(
    doc: jsPDF,
    text: string,
    yPos: number,
    theme: ThemeConfig,
    contentWidth: number
  ): number {
    doc.setFontSize(11);
    doc.setTextColor(theme.textColor);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, this.margins.left, yPos);

    return yPos + (lines.length * 5) + 5;
  }

  /**
   * Ajoute un point cle
   */
  private addKeyPoint(
    doc: jsPDF,
    point: { text: string; importance: string },
    yPos: number,
    theme: ThemeConfig,
    contentWidth: number
  ): number {
    // Indicateur d'importance
    const color = IMPORTANCE_COLORS[point.importance] || theme.accentColor;
    doc.setFillColor(color);
    doc.circle(this.margins.left + 3, yPos - 1, 2, 'F');

    // Texte
    doc.setFontSize(10);
    doc.setTextColor(theme.textColor);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(point.text, contentWidth - 15);
    doc.text(lines, this.margins.left + 10, yPos);

    return yPos + (lines.length * 5) + 3;
  }

  /**
   * Ajoute un concept
   */
  private addConcept(
    doc: jsPDF,
    concept: { title: string; description: string },
    yPos: number,
    theme: ThemeConfig,
    contentWidth: number
  ): number {
    // Titre du concept
    doc.setFontSize(12);
    doc.setTextColor(theme.headingColor);
    doc.setFont('helvetica', 'bold');
    doc.text(concept.title, this.margins.left, yPos);

    yPos += 6;

    // Description
    doc.setFontSize(10);
    doc.setTextColor(theme.textColor);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(concept.description, contentWidth);
    doc.text(lines, this.margins.left, yPos);

    return yPos + (lines.length * 4.5) + 8;
  }

  /**
   * Ajoute un exercice
   */
  private addExercise(
    doc: jsPDF,
    exercise: { title: string; description: string; difficulty: string },
    yPos: number,
    theme: ThemeConfig,
    contentWidth: number
  ): number {
    // Badge difficulte
    const diffColors: Record<string, string> = {
      facile: '#10b981',
      moyen: '#f59e0b',
      difficile: '#ef4444'
    };
    const diffColor = diffColors[exercise.difficulty] || theme.accentColor;

    doc.setFillColor(diffColor);
    doc.roundedRect(this.margins.left, yPos - 4, 20, 6, 1, 1, 'F');

    doc.setFontSize(7);
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.text(exercise.difficulty.toUpperCase(), this.margins.left + 10, yPos, { align: 'center' });

    // Titre
    doc.setFontSize(11);
    doc.setTextColor(theme.headingColor);
    doc.setFont('helvetica', 'bold');
    doc.text(exercise.title, this.margins.left + 25, yPos);

    yPos += 6;

    // Description
    doc.setFontSize(10);
    doc.setTextColor(theme.textColor);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(exercise.description, contentWidth - 25);
    doc.text(lines, this.margins.left, yPos);

    return yPos + (lines.length * 4.5) + 5;
  }

  /**
   * Ajoute le titre d'une note
   */
  private addNoteTitle(
    doc: jsPDF,
    note: Note,
    yPos: number,
    theme: ThemeConfig,
    contentWidth: number
  ): number {
    // Titre
    doc.setFontSize(18);
    doc.setTextColor(theme.headingColor);
    doc.setFont('helvetica', 'bold');
    doc.text(note.title, this.margins.left, yPos);

    yPos += 5;

    // Ligne
    doc.setDrawColor(theme.accentColor);
    doc.setLineWidth(0.5);
    doc.line(this.margins.left, yPos, this.margins.left + contentWidth, yPos);

    yPos += 8;

    // Metadonnees
    doc.setFontSize(9);
    doc.setTextColor(theme.textSecondary);
    doc.setFont('helvetica', 'italic');

    const date = new Date(note.updatedAt).toLocaleDateString('fr-FR');
    doc.text(`Modifie le ${date}`, this.margins.left, yPos);

    return yPos + 10;
  }

  /**
   * Ajoute le contenu Markdown simplifie
   */
  private addMarkdownContent(
    doc: jsPDF,
    content: string,
    yPos: number,
    theme: ThemeConfig,
    contentWidth: number,
    pageSize: { width: number; height: number }
  ): number {
    const lines = content.split('\n');

    for (const line of lines) {
      yPos = this.checkPageBreak(doc, yPos, 10, pageSize);

      // Titres
      if (line.startsWith('### ')) {
        doc.setFontSize(12);
        doc.setTextColor(theme.headingColor);
        doc.setFont('helvetica', 'bold');
        doc.text(line.substring(4), this.margins.left, yPos);
        yPos += 7;
      } else if (line.startsWith('## ')) {
        doc.setFontSize(14);
        doc.setTextColor(theme.headingColor);
        doc.setFont('helvetica', 'bold');
        doc.text(line.substring(3), this.margins.left, yPos);
        yPos += 8;
      } else if (line.startsWith('# ')) {
        doc.setFontSize(16);
        doc.setTextColor(theme.headingColor);
        doc.setFont('helvetica', 'bold');
        doc.text(line.substring(2), this.margins.left, yPos);
        yPos += 9;
      }
      // Listes
      else if (line.startsWith('- ')) {
        doc.setFontSize(10);
        doc.setTextColor(theme.textColor);
        doc.setFont('helvetica', 'normal');
        doc.text('•  ' + line.substring(2), this.margins.left + 5, yPos);
        yPos += 5;
      }
      // Texte normal
      else if (line.trim()) {
        doc.setFontSize(10);
        doc.setTextColor(theme.textColor);
        doc.setFont('helvetica', 'normal');

        // Gerer le gras **text**
        let processedLine = line.replace(/\*\*(.+?)\*\*/g, '$1');

        const splitLines = doc.splitTextToSize(processedLine, contentWidth);
        doc.text(splitLines, this.margins.left, yPos);
        yPos += splitLines.length * 5;
      }
      // Ligne vide
      else {
        yPos += 3;
      }
    }

    return yPos;
  }

  /**
   * Ajoute les tags
   */
  private addTags(
    doc: jsPDF,
    tags: string[],
    yPos: number,
    theme: ThemeConfig
  ): number {
    let xPos = this.margins.left;

    for (const tag of tags) {
      const tagWidth = doc.getTextWidth(tag) + 6;

      // Fond du tag
      doc.setFillColor(theme.accentColor);
      doc.roundedRect(xPos, yPos - 4, tagWidth, 6, 1, 1, 'F');

      // Texte du tag
      doc.setFontSize(8);
      doc.setTextColor('#ffffff');
      doc.text(tag, xPos + 3, yPos);

      xPos += tagWidth + 3;
    }

    return yPos + 10;
  }

  /**
   * Ajoute les numeros de page
   */
  private addPageNumbers(
    doc: jsPDF,
    theme: ThemeConfig,
    pageSize: { width: number; height: number }
  ): void {
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(theme.textSecondary);
      doc.text(
        `${i} / ${totalPages}`,
        pageSize.width / 2,
        pageSize.height - 10,
        { align: 'center' }
      );
    }
  }

  /**
   * Verifie si un saut de page est necessaire
   */
  private checkPageBreak(
    doc: jsPDF,
    yPos: number,
    neededHeight: number,
    pageSize: { width: number; height: number }
  ): number {
    if (yPos + neededHeight > pageSize.height - this.margins.bottom) {
      doc.addPage();
      return this.margins.top;
    }
    return yPos;
  }

  /**
   * Estime le nombre de pages
   */
  private estimatePageCount(summary: PDFSummary): number {
    let pages = 2; // Titre + TOC

    if (summary.summary) pages += Math.ceil(summary.summary.length / 2000);
    if (summary.keyPoints) pages += Math.ceil(summary.keyPoints.length / 10);
    if (summary.mainConcepts) pages += Math.ceil(summary.mainConcepts.length / 5);
    if (summary.suggestedExercises) pages += Math.ceil(summary.suggestedExercises.length / 8);

    return Math.max(pages, 3);
  }
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI jsPDF plutot que d'autres librairies ?
 *
 *    jsPDF est :
 *    - 100% client-side (pas de serveur)
 *    - Leger (~200KB)
 *    - Bien documente
 *    - Compatible avec tous les navigateurs modernes
 *
 *    Alternative : pdfmake (plus puissant mais plus lourd)
 *
 * 2. POURQUOI les themes ?
 *
 *    Un PDF "light" economise l'encre pour l'impression.
 *    Un PDF "dark" est plus confortable a lire sur ecran.
 *    Un PDF "professional" est pret pour un contexte formel.
 *
 *    C'est comme avoir plusieurs tenues pour differentes occasions !
 *
 * 3. POURQUOI une table des matieres ?
 *
 *    Pour un document > 3 pages, la TOC est ESSENTIELLE.
 *    Elle permet de :
 *    - Voir la structure d'un coup d'oeil
 *    - Naviguer rapidement vers une section
 *    - Estimer le contenu avant de lire
 *
 * 4. POURQUOI les numeros de page "X / Y" ?
 *
 *    Le format "3 / 10" donne plus d'information que juste "3".
 *    L'utilisateur sait immediatement :
 *    - Ou il en est (page 3)
 *    - Combien il reste (7 pages)
 *    - La taille totale du document
 *
 *    C'est une question de UX, meme dans un PDF !
 */
