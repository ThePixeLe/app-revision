/**
 * pdf-export-modal.component.ts
 *
 * Modal pour configurer et exporter des PDF.
 *
 * Flow utilisateur :
 * -----------------
 * 1. Configurer les options (contenu, theme, format)
 * 2. Voir l'apercu en temps reel
 * 3. Telecharger le PDF
 *
 * Philosophie David J. Malan :
 * "Give users control, but with sensible defaults."
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { PDFExportService } from '../../../core/services/pdf-export.service';
import { ProgressService } from '../../../core/services/progress.service';

import {
  PDFExportConfig,
  PDFTheme,
  PageFormat,
  PageOrientation,
  PDF_THEMES,
  DEFAULT_EXPORT_CONFIG,
  formatFileSize
} from '../../../core/models/pdf-export.model';

import { PDFSummary } from '../../../core/models/pdf-summary.model';
import { Note } from '../../../core/models/note.model';

@Component({
  selector: 'app-pdf-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-export-modal.component.html',
  styleUrls: ['./pdf-export-modal.component.scss']
})
export class PDFExportModalComponent implements OnInit, OnDestroy {

  // ============================================================
  // ENTREES/SORTIES
  // ============================================================

  @Input() summary: PDFSummary | null = null;
  @Input() notes: Note[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() exported = new EventEmitter<void>();

  // ============================================================
  // ETAT DU COMPOSANT
  // ============================================================

  private destroy$ = new Subject<void>();
  private configChange$ = new Subject<void>();

  /** Configuration d'export */
  config: PDFExportConfig = { ...DEFAULT_EXPORT_CONFIG };

  /** Etat d'export */
  isExporting = false;
  exportError = '';
  exportSuccess = false;

  /** Statistiques */
  estimatedPages = 1;
  estimatedSize = '~50 KB';

  // ============================================================
  // OPTIONS UI
  // ============================================================

  themeOptions: { value: PDFTheme; label: string; color: string }[] = [
    { value: 'light', label: 'Clair', color: '#ffffff' },
    { value: 'dark', label: 'Sombre', color: '#1f2937' },
    { value: 'professional', label: 'Professionnel', color: '#0ea5e9' },
    { value: 'minimal', label: 'Minimaliste', color: '#fafafa' }
  ];

  formatOptions: { value: PageFormat; label: string }[] = [
    { value: 'a4', label: 'A4 (210 x 297 mm)' },
    { value: 'letter', label: 'Letter (8.5 x 11 in)' },
    { value: 'a5', label: 'A5 (148 x 210 mm)' }
  ];

  orientationOptions: { value: PageOrientation; label: string; icon: string }[] = [
    { value: 'portrait', label: 'Portrait', icon: '📄' },
    { value: 'landscape', label: 'Paysage', icon: '📃' }
  ];

  fontSizeOptions = [9, 10, 11, 12, 14];

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private pdfExportService: PDFExportService,
    private progressService: ProgressService
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    this.initConfig();
    this.setupConfigWatcher();
    this.updateEstimates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialise la configuration
   */
  private initConfig(): void {
    // Titre par defaut base sur le resume
    if (this.summary) {
      this.config.title = `Resume: ${this.summary.pdfTitle}`;
    } else if (this.notes.length > 0) {
      this.config.title = this.notes.length === 1
        ? this.notes[0].title
        : `${this.notes.length} Notes`;
    }
  }

  /**
   * Observe les changements de config
   */
  private setupConfigWatcher(): void {
    this.configChange$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateEstimates();
      });
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Met a jour la config
   */
  onConfigChange(): void {
    this.configChange$.next();
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Exporte le PDF
   */
  async exportPDF(): Promise<void> {
    this.isExporting = true;
    this.exportError = '';

    try {
      let result;

      if (this.summary) {
        // Export d'un resume
        result = await firstValueFrom(this.pdfExportService.exportSummary(this.summary, this.config));
      } else if (this.notes.length > 0) {
        // Export de notes
        result = await firstValueFrom(this.pdfExportService.exportNotes(this.notes, this.config));
      } else {
        throw new Error('Aucun contenu a exporter');
      }

      // Verifier le resultat
      if (!result.success || !result.blob) {
        throw new Error(result.error || 'Erreur lors de la generation du PDF');
      }

      // Telecharger
      const filename = this.generateFilename();
      this.pdfExportService.downloadPDF(result.blob, filename);

      // Ajouter XP
      this.progressService.addXP(10, 'PDF exporte').subscribe();

      this.exportSuccess = true;
      this.exported.emit();

      // Fermer apres 1.5s
      setTimeout(() => {
        this.closeModal();
      }, 1500);

    } catch (error: any) {
      console.error('Export PDF error:', error);
      this.exportError = error.message || 'Erreur lors de l\'export';
    } finally {
      this.isExporting = false;
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Estime le nombre de pages et la taille
   */
  private updateEstimates(): void {
    let contentLength = 0;

    if (this.summary) {
      if (this.config.includeSummary) {
        contentLength += this.summary.summary?.length || 0;
      }
      if (this.config.includeKeyPoints) {
        contentLength += this.summary.keyPoints?.length * 100 || 0;
      }
      if (this.config.includeConcepts) {
        contentLength += this.summary.mainConcepts?.length * 200 || 0;
      }
      if (this.config.includeExercises) {
        contentLength += this.summary.suggestedExercises?.length * 150 || 0;
      }
    }

    if (this.notes.length > 0 && this.config.includeNotes) {
      this.notes.forEach(note => {
        contentLength += note.content?.length || 0;
      });
    }

    // TOC ajoute ~0.5 page
    if (this.config.includeTableOfContents) {
      contentLength += 500;
    }

    // Estimation: ~3000 caracteres par page A4
    const charsPerPage = this.config.orientation === 'landscape' ? 4000 : 3000;
    this.estimatedPages = Math.max(1, Math.ceil(contentLength / charsPerPage));

    // Estimation taille: ~30KB par page
    const estimatedBytes = this.estimatedPages * 30 * 1024;
    this.estimatedSize = formatFileSize(estimatedBytes);
  }

  /**
   * Genere le nom de fichier
   */
  private generateFilename(): string {
    const date = new Date().toISOString().split('T')[0];
    const sanitizedTitle = this.config.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${sanitizedTitle}-${date}.pdf`;
  }

  /**
   * Obtient la couleur du theme
   */
  getThemeColor(theme: PDFTheme): string {
    return PDF_THEMES[theme]?.accentColor || '#3b82f6';
  }

  /**
   * Verifie si le contenu est disponible
   */
  hasContent(): boolean {
    return !!(this.summary || this.notes.length > 0);
  }

  /**
   * Compte le contenu selectionne
   */
  getSelectedContentCount(): number {
    let count = 0;

    if (this.summary) {
      if (this.config.includeSummary) count++;
      if (this.config.includeKeyPoints && this.summary.keyPoints?.length) count++;
      if (this.config.includeConcepts && this.summary.mainConcepts?.length) count++;
      if (this.config.includeExercises && this.summary.suggestedExercises?.length) count++;
    }

    if (this.config.includeNotes && this.notes.length > 0) count++;

    return count;
  }
}
