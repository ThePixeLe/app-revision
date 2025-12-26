/**
 * exercise-extractor-modal.component.ts
 *
 * Modal pour extraire des exercices depuis un PDF.
 *
 * Flow utilisateur :
 * -----------------
 * 1. Ouvrir le modal depuis une ressource PDF
 * 2. Extraire le texte du PDF
 * 3. IA detecte les exercices dans le texte
 * 4. Utilisateur selectionne les exercices a importer
 * 5. Exercices ajoutes a la liste avec type auto-detecte
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PDFExtractionService } from '../../../core/services/pdf-extraction.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { ProgressService } from '../../../core/services/progress.service';
import { ExerciseType, ExerciseDifficulty } from '../../../core/models/exercise.model';
import { HttpClient } from '@angular/common/http';

/**
 * Interface pour un exercice detecte
 */
interface DetectedExercise {
  id: string;
  title: string;
  description: string;
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  selected: boolean;
  content: string;
}

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
  selector: 'app-exercise-extractor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exercise-extractor-modal.component.html',
  styleUrls: ['./exercise-extractor-modal.component.scss']
})
export class ExerciseExtractorModalComponent implements OnInit, OnDestroy {

  // ============================================================
  // ENTREES/SORTIES
  // ============================================================

  @Input() resource!: PDFResource;
  @Output() close = new EventEmitter<void>();
  @Output() exercisesSaved = new EventEmitter<number>();

  // ============================================================
  // ETAT DU COMPOSANT
  // ============================================================

  private destroy$ = new Subject<void>();

  /** Statut actuel */
  status: 'idle' | 'extracting' | 'analyzing' | 'ready' | 'saving' | 'error' = 'idle';

  /** Message d'erreur */
  errorMessage = '';

  /** Exercices detectes */
  detectedExercises: DetectedExercise[] = [];

  /** Texte extrait du PDF */
  extractedText = '';

  /** Progression */
  progress = 0;

  /** Nombre d'exercices selectionnes */
  get selectedCount(): number {
    return this.detectedExercises.filter(e => e.selected).length;
  }

  // ============================================================
  // MAPPING DES TYPES
  // ============================================================

  typeLabels: Record<ExerciseType, string> = {
    'boole': 'Algebre de Boole',
    'condition': 'Conditions',
    'boucle': 'Boucles',
    'tableau': 'Tableaux',
    'fonction': 'Fonctions',
    'java': 'Java'
  };

  typeColors: Record<ExerciseType, string> = {
    'boole': '#3b82f6',
    'condition': '#8b5cf6',
    'boucle': '#10b981',
    'tableau': '#f59e0b',
    'fonction': '#06b6d4',
    'java': '#f97316'
  };

  difficultyLabels: Record<ExerciseDifficulty, string> = {
    'facile': 'Facile',
    'moyen': 'Moyen',
    'difficile': 'Difficile',
    'expert': 'Expert'
  };

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private extractionService: PDFExtractionService,
    private exerciseService: ExerciseService,
    private progressService: ProgressService,
    private http: HttpClient
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    // Commence l'extraction automatiquement
    this.startExtraction();
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
   * Demarre l'extraction et l'analyse
   */
  async startExtraction(): Promise<void> {
    this.status = 'extracting';
    this.errorMessage = '';
    this.progress = 10;

    try {
      // Etape 1 : Extraire le texte du PDF
      const result = await this.extractionService.extractText(this.resource.path);

      if (!result.success) {
        throw new Error(result.error || 'Echec de l\'extraction');
      }

      this.extractedText = result.text;
      this.progress = 40;

      // Etape 2 : Analyser avec l'IA pour detecter les exercices
      this.status = 'analyzing';
      await this.analyzeWithAI(result.text);

      this.progress = 100;
      this.status = 'ready';

    } catch (error: any) {
      console.error('Extraction error:', error);
      this.errorMessage = error.message || 'Erreur lors de l\'extraction';
      this.status = 'error';
    }
  }

  /**
   * Analyse le texte avec l'IA pour detecter les exercices
   */
  private async analyzeWithAI(text: string): Promise<void> {
    const OLLAMA_URL = 'http://localhost:11434/api/generate';

    // Detecte le type probable depuis la categorie du PDF
    const pdfType = this.detectTypeFromCategory(this.resource.category || '');

    const prompt = `Tu es un assistant pedagogique expert. Analyse ce texte extrait d'un PDF de cours et detecte TOUS les exercices presents.

TEXTE DU PDF:
${text.substring(0, 8000)}

REGLES:
1. Detecte chaque exercice separement
2. Pour chaque exercice, fournis: titre, description, type, difficulte
3. Types disponibles: boole (algebre de boole), condition (if/else), boucle (for/while), tableau, fonction, java
4. Difficultes: facile, moyen, difficile, expert
5. Le type probable du document est: ${pdfType}
6. Reponds UNIQUEMENT en JSON valide

JSON ATTENDU:
{
  "exercises": [
    {
      "title": "Titre de l'exercice",
      "description": "Description courte",
      "type": "boole|condition|boucle|tableau|fonction|java",
      "difficulty": "facile|moyen|difficile|expert",
      "content": "Enonce complet de l'exercice"
    }
  ]
}`;

    try {
      const response = await firstValueFrom(
        this.http.post<any>(OLLAMA_URL, {
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 4000
          }
        })
      );

      this.progress = 80;

      // Parse la reponse
      const responseText = response.response || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const exercises = parsed.exercises || [];

        this.detectedExercises = exercises.map((ex: any, index: number) => ({
          id: `ex-${Date.now()}-${index}`,
          title: ex.title || `Exercice ${index + 1}`,
          description: ex.description || '',
          type: this.validateType(ex.type) || pdfType,
          difficulty: this.validateDifficulty(ex.difficulty) || 'moyen',
          content: ex.content || '',
          selected: true
        }));
      }

    } catch (error: any) {
      console.warn('Ollama not available, using fallback detection');
      // Fallback: detection basique par mots-cles
      this.detectExercisesFallback(text, pdfType);
    }
  }

  /**
   * Detection de secours sans IA
   */
  private detectExercisesFallback(text: string, defaultType: ExerciseType): void {
    const exercisePatterns = [
      /exercice\s*(\d+|[IVX]+)\s*[:\-]?\s*([^\n]+)/gi,
      /ex\s*(\d+)\s*[:\-]?\s*([^\n]+)/gi,
      /question\s*(\d+)\s*[:\-]?\s*([^\n]+)/gi,
      /probleme\s*(\d+)\s*[:\-]?\s*([^\n]+)/gi
    ];

    const detected: DetectedExercise[] = [];
    let index = 0;

    for (const pattern of exercisePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const title = match[2]?.trim() || `Exercice ${match[1]}`;
        const startIndex = match.index;
        const content = text.substring(startIndex, startIndex + 500);

        detected.push({
          id: `ex-${Date.now()}-${index++}`,
          title: title.substring(0, 100),
          description: content.substring(0, 200) + '...',
          type: defaultType,
          difficulty: 'moyen',
          content: content,
          selected: true
        });
      }
    }

    this.detectedExercises = detected;
  }

  /**
   * Detecte le type depuis la categorie du PDF
   */
  private detectTypeFromCategory(category: string): ExerciseType {
    const cat = category.toLowerCase();
    if (cat.includes('java')) return 'java';
    if (cat.includes('algo')) return 'boucle'; // Algo = probablement boucles/conditions
    if (cat.includes('boole') || cat.includes('algebre')) return 'boole';
    if (cat.includes('condition')) return 'condition';
    if (cat.includes('boucle') || cat.includes('loop')) return 'boucle';
    if (cat.includes('tableau') || cat.includes('array')) return 'tableau';
    if (cat.includes('fonction') || cat.includes('function')) return 'fonction';
    if (cat.includes('poo') || cat.includes('objet')) return 'java';
    return 'boucle';
  }

  /**
   * Valide le type
   */
  private validateType(type: string): ExerciseType | null {
    const valid: ExerciseType[] = ['boole', 'condition', 'boucle', 'tableau', 'fonction', 'java'];
    return valid.includes(type as ExerciseType) ? type as ExerciseType : null;
  }

  /**
   * Valide la difficulte
   */
  private validateDifficulty(diff: string): ExerciseDifficulty | null {
    const valid: ExerciseDifficulty[] = ['facile', 'moyen', 'difficile', 'expert'];
    return valid.includes(diff as ExerciseDifficulty) ? diff as ExerciseDifficulty : null;
  }

  /**
   * Toggle selection d'un exercice
   */
  toggleExercise(exercise: DetectedExercise): void {
    exercise.selected = !exercise.selected;
  }

  /**
   * Selectionne tous les exercices
   */
  selectAll(): void {
    this.detectedExercises.forEach(e => e.selected = true);
  }

  /**
   * Deselectionne tous les exercices
   */
  deselectAll(): void {
    this.detectedExercises.forEach(e => e.selected = false);
  }

  /**
   * Sauvegarde les exercices selectionnes
   */
  async saveExercises(): Promise<void> {
    const selected = this.detectedExercises.filter(e => e.selected);
    if (selected.length === 0) return;

    this.status = 'saving';

    try {
      for (const ex of selected) {
        await firstValueFrom(this.exerciseService.addPDFExercise({
          title: ex.title,
          description: ex.description,
          type: ex.type,
          difficulty: ex.difficulty,
          pdfTitle: this.resource.title,
          pdfId: this.resource.id
        }));
      }

      // Ajouter XP
      this.progressService.addXP(selected.length * 5, `${selected.length} exercices importes`).subscribe();

      this.exercisesSaved.emit(selected.length);

      // Fermer apres 1s
      setTimeout(() => this.closeModal(), 1000);

    } catch (error: any) {
      console.error('Save error:', error);
      this.errorMessage = 'Erreur lors de la sauvegarde';
      this.status = 'error';
    }
  }

  /**
   * Recommence l'extraction
   */
  retry(): void {
    this.detectedExercises = [];
    this.errorMessage = '';
    this.startExtraction();
  }
}
