/**
 * exercise-generator-modal.component.ts
 *
 * Modal pour générer des exercices avec l'IA (Ollama).
 *
 * Flow utilisateur :
 * -----------------
 * 1. Choisir le sujet (Boucles, Conditions, Java...)
 * 2. Choisir la difficulté
 * 3. Choisir le format (QCM, Pseudo-code, Debugging...)
 * 4. Options : inclure solution ? inclure indices ?
 * 5. Générer → Aperçu → Sauvegarder ou Régénérer
 *
 * Philosophie David J. Malan :
 * "The best exercises are the ones that challenge you just enough."
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ExerciseGeneratorService } from '../../../core/services/exercise-generator.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { ProgressService } from '../../../core/services/progress.service';
import { GamificationService } from '../../../core/services/gamification.service';

import {
  GenerationConfig,
  GeneratedExerciseResponse,
  GenerationStatus,
  ExerciseFormat,
  EXERCISE_FORMATS
} from '../../../core/models/generated-exercise.model';

import {
  Exercise,
  ExerciseType,
  ExerciseDifficulty
} from '../../../core/models/exercise.model';

@Component({
  selector: 'app-exercise-generator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exercise-generator-modal.component.html',
  styleUrls: ['./exercise-generator-modal.component.scss']
})
export class ExerciseGeneratorModalComponent implements OnInit, OnDestroy {

  // ============================================================
  // ÉVÉNEMENTS
  // ============================================================

  @Output() close = new EventEmitter<void>();
  @Output() exerciseSaved = new EventEmitter<Exercise>();

  // ============================================================
  // ÉTAT DU COMPOSANT
  // ============================================================

  private destroy$ = new Subject<void>();

  /** Ollama disponible ? */
  isOllamaAvailable = false;

  /** Nom du modèle Ollama */
  modelName = '';

  /** Statut de génération */
  status: GenerationStatus = 'idle';

  /** Exercice généré */
  generatedExercise: GeneratedExerciseResponse | null = null;

  /** Message d'erreur */
  errorMessage = '';

  /** Temps de génération (ms) */
  generationTime = 0;

  /** Sauvegarde en cours */
  isSaving = false;

  /** Succès de sauvegarde */
  showSuccess = false;

  // ============================================================
  // FORMULAIRE DE CONFIGURATION
  // ============================================================

  selectedType: ExerciseType = 'boucle';
  selectedDifficulty: ExerciseDifficulty = 'moyen';
  selectedFormat: ExerciseFormat = 'pseudo-code';
  includeSolution = true;
  includeHints = true;

  // ============================================================
  // DONNÉES STATIQUES
  // ============================================================

  exerciseTypes: { value: ExerciseType; label: string; icon: string }[] = [
    { value: 'boole', label: 'Algèbre de Boole', icon: '🔣' },
    { value: 'condition', label: 'Conditions', icon: '🔀' },
    { value: 'boucle', label: 'Boucles', icon: '🔁' },
    { value: 'tableau', label: 'Tableaux', icon: '📊' },
    { value: 'fonction', label: 'Fonctions', icon: '📦' },
    { value: 'java', label: 'Java', icon: '☕' }
  ];

  difficulties: { value: ExerciseDifficulty; label: string; color: string }[] = [
    { value: 'facile', label: 'Facile', color: '#10b981' },
    { value: 'moyen', label: 'Moyen', color: '#f59e0b' },
    { value: 'difficile', label: 'Difficile', color: '#f97316' },
    { value: 'expert', label: 'Expert', color: '#ef4444' }
  ];

  formats = EXERCISE_FORMATS;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private generatorService: ExerciseGeneratorService,
    private exerciseService: ExerciseService,
    private progressService: ProgressService,
    private gamificationService: GamificationService
  ) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    // Observe le statut Ollama
    this.generatorService.ollamaAvailable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(available => {
        this.isOllamaAvailable = available;
        if (available) {
          this.modelName = this.generatorService.getCurrentModel();
        }
      });

    // Observe le statut de génération
    this.generatorService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.status = status;
      });

    // Vérifie le statut Ollama au démarrage
    this.generatorService.checkOllamaStatus().subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // MÉTHODES PUBLIQUES
  // ============================================================

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.generatorService.reset();
    this.close.emit();
  }

  /**
   * Génère un exercice
   */
  async generateExercise(): Promise<void> {
    this.errorMessage = '';
    this.generatedExercise = null;

    const config: GenerationConfig = {
      type: this.selectedType,
      difficulty: this.selectedDifficulty,
      format: this.selectedFormat,
      includeSolution: this.includeSolution,
      includeHints: this.includeHints
    };

    const result = await this.generatorService.generateExercise(config);

    if (result.status === 'success' && result.exercise) {
      this.generatedExercise = result.exercise;
      this.generationTime = result.generationTime || 0;
    } else {
      this.errorMessage = result.error || 'Erreur inconnue';
    }
  }

  /**
   * Régénère un nouvel exercice avec les mêmes paramètres
   */
  regenerate(): void {
    this.generateExercise();
  }

  /**
   * Sauvegarde l'exercice généré
   */
  saveExercise(): void {
    if (!this.generatedExercise || this.isSaving) return;

    this.isSaving = true;

    const config: GenerationConfig = {
      type: this.selectedType,
      difficulty: this.selectedDifficulty,
      format: this.selectedFormat,
      includeSolution: this.includeSolution,
      includeHints: this.includeHints
    };

    // Convertit en Exercise
    const exercise = this.generatorService.convertToExercise(
      this.generatedExercise,
      config
    );

    // Ajoute via le service
    this.exerciseService.addExternalExercise(exercise).subscribe({
      next: (added) => {
        console.log('✅ Exercice IA sauvegardé:', added);

        // Ajoute XP pour avoir généré et sauvegardé
        const xp = this.calculateXP();
        this.progressService.addXP(xp, `Exercice IA: ${exercise.title}`)
          .subscribe();

        // Met à jour les quêtes
        this.gamificationService.updateQuestProgress();

        // Affiche le succès
        this.showSuccess = true;
        this.isSaving = false;

        // Émet l'événement
        this.exerciseSaved.emit(added);

        // Ferme après 1.5s
        setTimeout(() => this.closeModal(), 1500);
      },
      error: (err) => {
        console.error('❌ Erreur sauvegarde:', err);
        this.errorMessage = 'Erreur lors de la sauvegarde';
        this.isSaving = false;
      }
    });
  }

  /**
   * Retourne au formulaire
   */
  backToForm(): void {
    this.generatedExercise = null;
    this.errorMessage = '';
    this.generatorService.reset();
  }

  /**
   * Rafraîchit le statut Ollama
   */
  refreshOllamaStatus(): void {
    this.generatorService.checkOllamaStatus().subscribe();
  }

  /**
   * Calcule les XP selon la difficulté
   */
  calculateXP(): number {
    const xpMap: Record<ExerciseDifficulty, number> = {
      facile: 10,
      moyen: 25,
      difficile: 50,
      expert: 100
    };
    return xpMap[this.selectedDifficulty] || 10;
  }

  /**
   * Formate le temps de génération
   */
  formatGenerationTime(): string {
    if (this.generationTime < 1000) {
      return `${this.generationTime}ms`;
    }
    return `${(this.generationTime / 1000).toFixed(1)}s`;
  }

  /**
   * Obtient la bonne réponse du QCM
   */
  getCorrectAnswer(): string {
    if (!this.generatedExercise?.options) return '';
    const correct = this.generatedExercise.options.find(o => o.isCorrect);
    return correct?.text || '';
  }
}
