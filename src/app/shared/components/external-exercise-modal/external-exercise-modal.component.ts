/**
 * external-exercise-modal.component.ts
 *
 * Modal pour enregistrer un exercice fait sur un site externe.
 *
 * Analogie du monde réel :
 * ----------------------
 * C'est comme un carnet de bord où tu notes ce que tu as appris
 * en dehors de la classe. Le prof te donne des points quand même !
 *
 * Fonctionnalités :
 * ----------------
 * - Sélection du site externe (TMC MOOC.fi, GeeksforGeeks, etc.)
 * - Choix du type d'exercice (Java, Algo, Boole)
 * - Choix de la difficulté
 * - Notes personnelles optionnelles
 * - Validation et ajout à la progression
 *
 * Philosophie David J. Malan :
 * "Learning happens everywhere, not just in the classroom."
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ExerciseService } from '../../../core/services/exercise.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { ProgressService } from '../../../core/services/progress.service';
import {
  EXTERNAL_SITES,
  ExerciseType,
  ExerciseDifficulty,
  createExternalExercise
} from '../../../core/models/exercise.model';

@Component({
  selector: 'app-external-exercise-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './external-exercise-modal.component.html',
  styleUrls: ['./external-exercise-modal.component.scss']
})
export class ExternalExerciseModalComponent {

  // ============================================================
  // ÉVÉNEMENTS
  // ============================================================

  @Output() close = new EventEmitter<void>();
  @Output() exerciseAdded = new EventEmitter<void>();

  // ============================================================
  // DONNÉES DU FORMULAIRE
  // ============================================================

  /** Site externe sélectionné */
  selectedSiteId: string = '';

  /** Titre de l'exercice */
  exerciseTitle: string = '';

  /** Type d'exercice */
  exerciseType: ExerciseType = 'java';

  /** Difficulté */
  exerciseDifficulty: ExerciseDifficulty = 'moyen';

  /** Notes personnelles */
  exerciseNotes: string = '';

  /** Score auto-évalué (optionnel) */
  exerciseScore: number | null = null;

  // ============================================================
  // DONNÉES STATIQUES
  // ============================================================

  /** Liste des sites externes disponibles */
  externalSites = EXTERNAL_SITES;

  /** Types d'exercices disponibles */
  exerciseTypes: { value: ExerciseType; label: string }[] = [
    { value: 'java', label: '☕ Java' },
    { value: 'boole', label: '🔣 Algèbre de Boole' },
    { value: 'condition', label: '🔀 Conditions' },
    { value: 'boucle', label: '🔁 Boucles' },
    { value: 'tableau', label: '📊 Tableaux' },
    { value: 'fonction', label: '📦 Fonctions' }
  ];

  /** Niveaux de difficulté */
  difficulties: { value: ExerciseDifficulty; label: string }[] = [
    { value: 'facile', label: '🟢 Facile' },
    { value: 'moyen', label: '🟡 Moyen' },
    { value: 'difficile', label: '🟠 Difficile' },
    { value: 'expert', label: '🔴 Expert' }
  ];

  /** État de soumission */
  isSubmitting: boolean = false;

  /** Message de succès */
  showSuccess: boolean = false;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private exerciseService: ExerciseService,
    private gamificationService: GamificationService,
    private progressService: ProgressService
  ) {}

  // ============================================================
  // MÉTHODES
  // ============================================================

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    return !!(
      this.selectedSiteId &&
      this.exerciseTitle.trim() &&
      this.exerciseType &&
      this.exerciseDifficulty
    );
  }

  /**
   * Met à jour le type d'exercice selon le site sélectionné
   */
  onSiteChange(): void {
    const site = EXTERNAL_SITES.find(s => s.id === this.selectedSiteId);
    if (site) {
      this.exerciseType = site.category;
    }
  }

  /**
   * Soumet le formulaire et ajoute l'exercice
   */
  submitExercise(): void {
    if (!this.isFormValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // Crée l'exercice externe
    const exercise = createExternalExercise(this.selectedSiteId, {
      title: this.exerciseTitle.trim(),
      type: this.exerciseType,
      difficulty: this.exerciseDifficulty,
      notes: this.exerciseNotes.trim() || undefined,
      score: this.exerciseScore || undefined
    });

    // Ajoute l'exercice via le service
    this.exerciseService.addExternalExercise(exercise).subscribe({
      next: (addedExercise) => {
        console.log('✅ Exercice externe ajouté:', addedExercise);

        // Ajoute les XP via le ProgressService
        const xpGained = this.calculateXP();
        this.progressService.addXP(xpGained, `Exercice externe: ${this.exerciseTitle}`)
          .subscribe(() => {
            console.log(`🎮 +${xpGained} XP gagnés !`);
          });

        // Met à jour la progression des quêtes
        // Les exercices externes comptent pour les quêtes daily/weekly
        this.gamificationService.updateQuestProgress();

        // Affiche le succès
        this.showSuccess = true;
        this.isSubmitting = false;

        // Émet l'événement
        this.exerciseAdded.emit();

        // Ferme après 1.5 secondes
        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },
      error: (err) => {
        console.error('❌ Erreur lors de l\'ajout:', err);
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Calcule les XP gagnés selon la difficulté
   *
   * Public car utilisé dans le template pour afficher les XP gagnés.
   */
  calculateXP(): number {
    const xpMap: Record<ExerciseDifficulty, number> = {
      'facile': 10,
      'moyen': 25,
      'difficile': 50,
      'expert': 100
    };
    return xpMap[this.exerciseDifficulty] || 10;
  }

  /**
   * Obtient le site sélectionné
   */
  getSelectedSite() {
    return EXTERNAL_SITES.find(s => s.id === this.selectedSiteId);
  }
}
