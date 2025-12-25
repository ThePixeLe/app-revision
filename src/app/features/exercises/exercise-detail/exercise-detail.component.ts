/**
 * exercise-detail.component.ts
 *
 * Composant DÉTAIL D'UN EXERCICE - Vue complète pour travailler sur un exercice.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page où tu travailles réellement sur un exercice :
 * - Énoncé complet de l'exercice
 * - Zone pour écrire ta solution (pseudo-code ou Java)
 * - Timer pour mesurer le temps passé
 * - Historique des tentatives
 * - Bouton pour marquer comme terminé
 *
 * Analogie du monde réel :
 * -----------------------
 * C'est comme une feuille d'examen :
 * - En haut : la question
 * - En dessous : l'espace pour répondre
 * - En bas : le bouton "Rendre ma copie"
 *
 * Navigation :
 * -----------
 * URL : /exercises/:id (ex: /exercises/ex-cond-01)
 * L'ID est récupéré via ActivatedRoute.
 *
 * Philosophie David J. Malan :
 * "Practice doesn't make perfect. Practice makes permanent."
 *
 * C'est ici que la pratique se passe !
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ExerciseService } from '../../../core/services/exercise.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Exercise, ExerciseStatus } from '../../../core/models/exercise.model';

/**
 * Interface pour une tentative
 */
interface Attempt {
  id: string;
  date: Date;
  timeSpent: number;    // en secondes
  solution: string;
  status: 'success' | 'partial' | 'failed';
  notes?: string;
}

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.scss']
})
export class ExerciseDetailComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  private destroy$ = new Subject<void>();

  /**
   * L'exercice affiché
   */
  exercise: Exercise | null = null;

  /**
   * ID de l'exercice (depuis l'URL)
   */
  exerciseId: string = '';

  /**
   * Chargement en cours
   */
  isLoading: boolean = true;

  /**
   * Erreur de chargement
   */
  error: string = '';

  /**
   * Solution en cours de rédaction
   */
  currentSolution: string = '';

  /**
   * Notes personnelles
   */
  personalNotes: string = '';

  /**
   * Timer actif
   */
  timerRunning: boolean = false;

  /**
   * Temps écoulé (en secondes)
   */
  elapsedTime: number = 0;

  /**
   * Afficher l'indice
   */
  showHint: boolean = false;

  /**
   * Afficher la solution de référence
   */
  showReferenceSolution: boolean = false;

  /**
   * Historique des tentatives
   */
  attempts: Attempt[] = [];

  /**
   * Onglet actif (pseudo-code ou Java)
   */
  activeTab: 'pseudo' | 'java' = 'pseudo';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private exerciseService: ExerciseService,
    private progressService: ProgressService
  ) {}

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  ngOnInit(): void {
    // Récupère l'ID depuis l'URL
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.exerciseId = params['id'];
        this.loadExercise();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Sauvegarde automatique avant de quitter
    if (this.currentSolution) {
      this.saveDraft();
    }
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * Charge l'exercice depuis le service
   */
  private loadExercise(): void {
    this.isLoading = true;
    this.error = '';

    this.exerciseService.exercises$
      .pipe(takeUntil(this.destroy$))
      .subscribe(exercises => {
        const exercise = exercises.find(e => e.id === this.exerciseId);

        if (exercise) {
          this.exercise = exercise;
          this.loadAttempts();
          this.loadDraft();

          // Passe automatiquement en "in-progress" si c'était "todo"
          if (exercise.status === 'todo') {
            this.updateStatus('in-progress');
          }
        } else {
          this.error = 'Exercice non trouvé';
        }

        this.isLoading = false;
      });
  }

  /**
   * Charge l'historique des tentatives
   */
  private loadAttempts(): void {
    // TODO: Charger depuis le storage
    this.attempts = [];
  }

  /**
   * Charge le brouillon sauvegardé
   */
  private loadDraft(): void {
    const draft = localStorage.getItem(`draft-${this.exerciseId}`);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        this.currentSolution = data.solution || '';
        this.personalNotes = data.notes || '';
        this.elapsedTime = data.elapsedTime || 0;
      } catch {
        // Ignore les erreurs de parsing
      }
    }
  }

  /**
   * Sauvegarde le brouillon
   */
  private saveDraft(): void {
    const draft = {
      solution: this.currentSolution,
      notes: this.personalNotes,
      elapsedTime: this.elapsedTime,
      savedAt: new Date()
    };
    localStorage.setItem(`draft-${this.exerciseId}`, JSON.stringify(draft));
  }

  // ============================================================
  // TIMER
  // ============================================================

  /**
   * Démarre le timer
   */
  startTimer(): void {
    if (this.timerRunning) return;

    this.timerRunning = true;

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.timerRunning) {
          this.elapsedTime++;
          // Sauvegarde toutes les 30 secondes
          if (this.elapsedTime % 30 === 0) {
            this.saveDraft();
          }
        }
      });
  }

  /**
   * Met en pause le timer
   */
  pauseTimer(): void {
    this.timerRunning = false;
    this.saveDraft();
  }

  /**
   * Remet le timer à zéro
   */
  resetTimer(): void {
    this.elapsedTime = 0;
    this.timerRunning = false;
  }

  /**
   * Formate le temps écoulé
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Met à jour le statut de l'exercice
   */
  private updateStatus(status: ExerciseStatus): void {
    if (this.exercise) {
      this.exerciseService.updateExercise(this.exercise.id, { status });
    }
  }

  /**
   * Marque l'exercice comme terminé
   */
  markAsCompleted(): void {
    if (!this.exercise) return;

    // Crée une tentative
    const attempt: Attempt = {
      id: `attempt-${Date.now()}`,
      date: new Date(),
      timeSpent: this.elapsedTime,
      solution: this.currentSolution,
      status: 'success',
      notes: this.personalNotes
    };

    this.attempts.push(attempt);

    // Met à jour le statut
    this.updateStatus('completed');

    // Ajoute des XP
    const xpGained = this.calculateXP();
    this.progressService.addXP(xpGained, `Exercice "${this.exercise.title}" terminé`);

    // Sauvegarde
    this.saveDraft();

    // Pause le timer
    this.pauseTimer();

    // Notification de succès
    alert(`Bravo ! Tu as gagné ${xpGained} XP !`);
  }

  /**
   * Calcule les XP gagnés selon la difficulté
   */
  private calculateXP(): number {
    if (!this.exercise) return 0;

    const baseXP = 20;
    // Convertit la difficulté en multiplicateur numérique
    const difficultyMultipliers: Record<string, number> = {
      'facile': 1,
      'moyen': 2,
      'difficile': 3,
      'expert': 4
    };
    const difficultyBonus = (difficultyMultipliers[this.exercise.difficulty] || 1) * 10;
    const timeBonus = this.elapsedTime < 600 ? 10 : 0; // Bonus si < 10 min

    return baseXP + difficultyBonus + timeBonus;
  }

  /**
   * Marque pour révision
   */
  markForReview(): void {
    if (this.exercise) {
      this.updateStatus('reviewed');
      this.router.navigate(['/exercises']);
    }
  }

  /**
   * Affiche/masque l'indice
   */
  toggleHint(): void {
    this.showHint = !this.showHint;
  }

  /**
   * Affiche/masque la solution de référence
   */
  toggleReferenceSolution(): void {
    if (!this.showReferenceSolution) {
      // Avertissement avant de montrer la solution
      if (!confirm('Es-tu sûr de vouloir voir la solution ? Essaie d\'abord par toi-même !')) {
        return;
      }
    }
    this.showReferenceSolution = !this.showReferenceSolution;
  }

  /**
   * Change l'onglet actif
   */
  setActiveTab(tab: 'pseudo' | 'java'): void {
    this.activeTab = tab;
  }

  /**
   * Retourne à la liste des exercices
   */
  backToExercises(): void {
    this.saveDraft();
    this.router.navigate(['/exercises']);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Retourne l'icône du type d'exercice
   */
  getTypeIcon(): string {
    if (!this.exercise) return '📝';

    const icons: Record<string, string> = {
      'condition': '🔀',
      'loop': '🔄',
      'array': '📊',
      'function': '📦',
      'java': '☕'
    };
    return icons[this.exercise.type] || '📝';
  }

  /**
   * Retourne la couleur de la catégorie
   */
  getCategoryColor(): string {
    if (!this.exercise) return '#64748b';

    const colors: Record<string, string> = {
      'algebre': '#3b82f6',
      'algo': '#8b5cf6',
      'java': '#10b981'
    };
    // Utilise category ou type comme fallback si category est undefined
    const key = this.exercise.category || this.exercise.type || '';
    return colors[key] || '#64748b';
  }

  /**
   * Retourne le label du statut
   */
  getStatusLabel(): string {
    if (!this.exercise) return '';

    const labels: Record<string, string> = {
      'todo': 'À faire',
      'in-progress': 'En cours',
      'completed': 'Terminé',
      'reviewed': 'Révisé'
    };
    return labels[this.exercise.status] || '';
  }

  /**
   * Retourne le nombre d'étoiles selon la difficulté
   */
  getDifficultyStars(difficulty: string): number {
    const stars: Record<string, number> = {
      'facile': 1,
      'moyen': 2,
      'difficile': 3,
      'expert': 4
    };
    return stars[difficulty] || 1;
  }

  /**
   * Vérifie si un indice est disponible
   */
  hasHint(): boolean {
    return !!(this.exercise?.notes);
  }

  /**
   * Retourne l'indice (utilise les notes comme fallback)
   */
  getHint(): string {
    return this.exercise?.notes || '';
  }

  /**
   * Retourne la solution de référence
   */
  getReferenceSolution(): string {
    return this.exercise?.solution?.pseudoCode ||
           this.exercise?.solution?.javaCode ||
           'Solution non disponible pour le moment.';
  }

  /**
   * Retourne le placeholder pour l'éditeur de code
   */
  getEditorPlaceholder(): string {
    if (this.activeTab === 'pseudo') {
      return 'Ecris ton pseudo-code ici...\n\nExemple:\nDEBUT\n  Lire nombre\n  Si nombre > 0 Alors\n    Afficher "Positif"\n  Sinon\n    Afficher "Negatif ou nul"\n  FinSi\nFIN';
    } else {
      return '// Ecris ton code Java ici...\n\npublic class Solution {\n  public static void main(String[] args) {\n    // Ton code\n  }\n}';
    }
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un timer ?
 *
 *    CONSCIENCE DU TEMPS :
 *    Savoir combien de temps tu passes sur un exercice aide à :
 *    - Identifier les exercices difficiles
 *    - Améliorer ta vitesse au fil du temps
 *    - Gérer ton temps en examen
 *
 * 2. POURQUOI le brouillon auto-sauvegardé ?
 *
 *    PROTECTION :
 *    Tu fermes accidentellement l'onglet ? Pas de problème.
 *    Ton travail est sauvegardé toutes les 30 secondes.
 *
 *    C'est comme Google Docs qui sauvegarde en temps réel.
 *
 * 3. POURQUOI demander confirmation pour la solution ?
 *
 *    APPRENTISSAGE ACTIF :
 *    Voir la solution trop tôt empêche d'apprendre.
 *    Le message "Essaie d'abord !" encourage la persévérance.
 *
 * 4. POURQUOI le passage automatique à "in-progress" ?
 *
 *    TRACKING AUTOMATIQUE :
 *    Tu ouvres un exercice = tu commences à y travailler.
 *    Pas besoin de cliquer sur un bouton "Commencer".
 *
 * 5. POURQUOI des XP variables selon la difficulté ?
 *
 *    ÉQUITÉ :
 *    Un exercice facile = 30 XP
 *    Un exercice difficile = 50 XP
 *
 *    Ça récompense l'effort proportionnellement.
 */
