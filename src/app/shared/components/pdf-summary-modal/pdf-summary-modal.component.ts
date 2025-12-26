/**
 * pdf-summary-modal.component.ts
 *
 * Modal pour generer des resumes de PDF avec l'IA (Ollama).
 *
 * Flow utilisateur :
 * -----------------
 * 1. Choisir la longueur du resume (Court, Moyen, Complet)
 * 2. Activer/desactiver les options (concepts, exercices)
 * 3. Generer → Extraction texte → Resume IA
 * 4. Apercu → Sauvegarder ou Regenerer
 *
 * Philosophie David J. Malan :
 * "Good summaries help you focus on what matters."
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PDFExtractionService } from '../../../core/services/pdf-extraction.service';
import { PDFSummarizationService } from '../../../core/services/pdf-summarization.service';
import { SummaryStorageService } from '../../../core/services/summary-storage.service';
import { NotesService } from '../../../core/services/notes.service';
import { ProgressService } from '../../../core/services/progress.service';

import {
  PDFSummary,
  SummaryLength,
  SummaryStatus,
  SummaryGenerationConfig,
  SUMMARY_LENGTH_CONFIG,
  IMPORTANCE_CONFIG
} from '../../../core/models/pdf-summary.model';

import { createNote } from '../../../core/models/note.model';

/**
 * Interface pour la ressource PDF
 */
interface PDFResource {
  id: string;
  title: string;
  path: string;
  category?: string;
}

@Component({
  selector: 'app-pdf-summary-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-summary-modal.component.html',
  styleUrls: ['./pdf-summary-modal.component.scss']
})
export class PDFSummaryModalComponent implements OnInit, OnDestroy {

  // ============================================================
  // ENTREES/SORTIES
  // ============================================================

  @Input() resource!: PDFResource;
  @Output() close = new EventEmitter<void>();
  @Output() summarySaved = new EventEmitter<PDFSummary>();

  // ============================================================
  // ETAT DU COMPOSANT
  // ============================================================

  private destroy$ = new Subject<void>();

  /** Ollama disponible ? */
  isOllamaAvailable = false;

  /** Statut actuel */
  status: SummaryStatus = 'pending';

  /** Resume genere */
  summary: PDFSummary | null = null;

  /** Resume existant ? */
  existingSummary: PDFSummary | null = null;

  /** Message d'erreur */
  errorMessage = '';

  /** Temps de generation (ms) */
  generationTime = 0;

  /** Progression de l'extraction (0-100) */
  extractionProgress = 0;

  /** Sauvegarde en cours */
  isSaving = false;

  /** Succes affiche */
  showSuccess = false;

  // ============================================================
  // FORMULAIRE DE CONFIGURATION
  // ============================================================

  selectedLength: SummaryLength = 'medium';
  includeConcepts = true;
  includeExercises = true;

  // ============================================================
  // DONNEES STATIQUES
  // ============================================================

  lengthOptions = Object.entries(SUMMARY_LENGTH_CONFIG).map(([key, config]) => ({
    value: key as SummaryLength,
    label: config.label,
    emoji: config.emoji,
    description: config.description,
    pointCount: config.pointCount
  }));

  importanceLevels = IMPORTANCE_CONFIG;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private extractionService: PDFExtractionService,
    private summarizationService: PDFSummarizationService,
    private summaryStorageService: SummaryStorageService,
    private notesService: NotesService,
    private progressService: ProgressService
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    // Verifier Ollama
    this.checkOllama();

    // Verifier si un resume existe deja
    this.checkExistingSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // METHODES PUBLIQUES
  // ============================================================

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Genere un nouveau resume
   */
  async generateSummary(): Promise<void> {
    this.errorMessage = '';
    this.summary = null;

    try {
      // Etape 1 : Extraction du texte
      this.status = 'extracting';
      this.extractionProgress = 10;

      const extractionResult = await this.extractionService.extractText(this.resource.path);

      if (!extractionResult.success) {
        throw new Error(extractionResult.error || 'Echec de l\'extraction du PDF');
      }

      this.extractionProgress = 50;

      // Mettre en cache
      this.summaryStorageService.cacheExtractedText(
        this.resource.id,
        extractionResult.text,
        extractionResult.pageCount
      );

      this.extractionProgress = 100;

      // Etape 2 : Generation du resume
      this.status = 'summarizing';

      const config: SummaryGenerationConfig = {
        pdfId: this.resource.id,
        pdfPath: this.resource.path,
        length: this.selectedLength,
        includeKeyPoints: true,
        includeConcepts: this.includeConcepts,
        includeExercises: this.includeExercises
      };

      const result = await this.summarizationService.summarizePDF(config, extractionResult.text);

      if (result.status === 'success' && result.summary) {
        // Completer les infos manquantes
        result.summary.pdfTitle = this.resource.title;
        result.summary.pdfFilename = this.resource.path.split('/').pop();
        result.summary.category = (this.resource.category || 'general') as any;
        result.summary.pageCount = extractionResult.pageCount;
        result.summary.extractedText = extractionResult.text;

        this.summary = result.summary;
        this.generationTime = result.generationTime || 0;
        this.status = 'completed';
      } else {
        throw new Error(result.error || 'Echec de la generation du resume');
      }

    } catch (error: any) {
      console.error('❌ Summary generation error:', error);
      this.errorMessage = error.message || 'Une erreur est survenue';
      this.status = 'error';
    }
  }

  /**
   * Utilise le resume existant
   */
  useExistingSummary(): void {
    if (this.existingSummary) {
      this.summary = this.existingSummary;
      this.status = 'completed';
    }
  }

  /**
   * Regenere le resume
   */
  regenerate(): void {
    this.summary = null;
    this.status = 'pending';
  }

  /**
   * Sauvegarde le resume
   */
  async saveSummary(): Promise<void> {
    if (!this.summary) return;

    this.isSaving = true;

    try {
      // Sauvegarder dans IndexedDB
      await this.summaryStorageService.saveSummary(this.summary).toPromise();

      // Ajouter XP
      this.progressService.addXP(15, 'Resume PDF genere').subscribe();

      this.showSuccess = true;
      this.summarySaved.emit(this.summary);

      // Fermer apres 1.5s
      setTimeout(() => {
        this.closeModal();
      }, 1500);

    } catch (error) {
      console.error('❌ Failed to save summary:', error);
      this.errorMessage = 'Erreur lors de la sauvegarde';
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Sauvegarde comme note
   */
  async saveAsNote(): Promise<void> {
    if (!this.summary) return;

    try {
      // Construire le contenu markdown
      let content = `# ${this.summary.pdfTitle}\n\n`;
      content += `## Resume\n${this.summary.summary}\n\n`;

      if (this.summary.keyPoints.length > 0) {
        content += `## Points Cles\n`;
        this.summary.keyPoints.forEach(kp => {
          const emoji = IMPORTANCE_CONFIG[kp.importance].emoji;
          content += `- ${emoji} ${kp.text}\n`;
        });
        content += '\n';
      }

      if (this.summary.mainConcepts.length > 0) {
        content += `## Concepts Principaux\n`;
        this.summary.mainConcepts.forEach(mc => {
          content += `### ${mc.title}\n${mc.description}\n\n`;
        });
      }

      // Creer la note
      const note = createNote({
        title: `Resume: ${this.summary.pdfTitle}`,
        content,
        type: 'summary',
        pdfId: this.summary.pdfId,
        summaryId: this.summary.id,
        category: this.summary.category,
        tags: ['resume', 'ia', this.summary.category]
      });

      await this.notesService.createNote(note).toPromise();

      // Ajouter XP bonus
      this.progressService.addXP(5, 'Note creee depuis resume').subscribe();

      alert('Note creee avec succes !');

    } catch (error) {
      console.error('❌ Failed to save as note:', error);
      this.errorMessage = 'Erreur lors de la creation de la note';
    }
  }

  // ============================================================
  // METHODES PRIVEES
  // ============================================================

  /**
   * Verifier la disponibilite d'Ollama
   */
  private async checkOllama(): Promise<void> {
    this.isOllamaAvailable = await this.summarizationService.checkOllamaStatus();
  }

  /**
   * Verifier si un resume existe deja
   */
  private checkExistingSummary(): void {
    this.summaryStorageService.getSummaryByPdf(this.resource.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(existing => {
        this.existingSummary = existing;
      });
  }

  // ============================================================
  // HELPERS POUR LE TEMPLATE
  // ============================================================

  /**
   * Formater le temps en secondes
   */
  formatTime(ms: number): string {
    return (ms / 1000).toFixed(1) + 's';
  }

  /**
   * Obtenir la couleur d'importance
   */
  getImportanceColor(importance: string): string {
    return IMPORTANCE_CONFIG[importance as keyof typeof IMPORTANCE_CONFIG]?.color || '#6b7280';
  }
}
