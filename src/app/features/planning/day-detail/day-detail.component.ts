/**
 * day-detail.component.ts
 *
 * Composant DÉTAIL D'UNE JOURNÉE - Vue complète d'un jour du planning.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * Quand tu cliques sur un jour dans le planning, cette page s'affiche.
 * Elle montre TOUT ce qu'il y a à faire ce jour-là :
 * - Sessions d'étude prévues
 * - Exercices à compléter
 * - Documents à consulter
 * - Objectifs de la journée
 *
 * Analogie du monde réel :
 * -----------------------
 * C'est comme ouvrir ton agenda à une page spécifique.
 * Tu vois le programme de la journée avec tous les détails.
 *
 * Navigation :
 * -----------
 * URL : /planning/:dayId (ex: /planning/day-3)
 * Le dayId est récupéré via ActivatedRoute.
 *
 * Philosophie David J. Malan :
 * "Break down big tasks into small, manageable pieces."
 *
 * Chaque journée est une "pièce" du puzzle de 12 jours.
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PlanningService } from '../../../core/services/planning.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Day } from '../../../core/models/day.model';
import { Exercise } from '../../../core/models/exercise.model';

/**
 * Interface pour une session d'étude
 */
interface StudySession {
  id: string;
  title: string;
  duration: number;    // en minutes
  type: 'theory' | 'practice' | 'revision';
  completed: boolean;
  description?: string;
}

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './day-detail.component.html',
  styleUrls: ['./day-detail.component.scss']
})
export class DayDetailComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  private destroy$ = new Subject<void>();

  /**
   * Données de la journée
   */
  day: Day | null = null;

  /**
   * ID de la journée (depuis l'URL)
   */
  dayId: string = '';

  /**
   * Numéro du jour (1-12)
   */
  dayNumber: number = 0;

  /**
   * Sessions d'étude prévues
   */
  sessions: StudySession[] = [];

  /**
   * Exercices du jour
   */
  exercises: Exercise[] = [];

  /**
   * Chargement en cours
   */
  isLoading: boolean = true;

  /**
   * Erreur de chargement
   */
  error: string = '';

  /**
   * Progression de la journée (%)
   */
  dayProgress: number = 0;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planningService: PlanningService,
    private exerciseService: ExerciseService
  ) {}

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  ngOnInit(): void {
    // Récupère le dayId depuis l'URL
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.dayId = params['dayId'];
        this.loadDayData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * Charge les données de la journée
   */
  private loadDayData(): void {
    this.isLoading = true;
    this.error = '';

    // Récupère la journée depuis le service
    this.planningService.days$
      .pipe(takeUntil(this.destroy$))
      .subscribe(days => {
        const day = days.find(d => d.id === this.dayId);

        if (day) {
          this.day = day;
          this.dayNumber = parseInt(day.id.replace('day-', ''), 10);
          this.loadSessions();
          this.loadExercises();
          this.calculateProgress();
        } else {
          this.error = 'Journée non trouvée';
        }

        this.isLoading = false;
      });
  }

  /**
   * Charge les sessions d'étude
   */
  private loadSessions(): void {
    if (!this.day) return;

    // Génère des sessions basées sur le type de jour
    this.sessions = [
      {
        id: 's1',
        title: `Théorie : ${this.day.title}`,
        duration: 45,
        type: 'theory',
        completed: false,
        description: 'Lecture des documents et prise de notes'
      },
      {
        id: 's2',
        title: 'Pratique : Exercices de base',
        duration: 60,
        type: 'practice',
        completed: false,
        description: 'Application des concepts sur des exercices simples'
      },
      {
        id: 's3',
        title: 'Pratique : Exercices avancés',
        duration: 45,
        type: 'practice',
        completed: false,
        description: 'Exercices plus complexes et cas particuliers'
      },
      {
        id: 's4',
        title: 'Révision : Synthèse',
        duration: 30,
        type: 'revision',
        completed: false,
        description: 'Récapitulatif et auto-évaluation'
      }
    ];
  }

  /**
   * Charge les exercices du jour
   */
  private loadExercises(): void {
    if (!this.day) return;

    this.exerciseService.exercises$
      .pipe(takeUntil(this.destroy$))
      .subscribe(exercises => {
        // Filtre les exercices par catégorie du jour
        this.exercises = exercises.filter(e =>
          e.dayId === this.dayId || e.category === this.day?.subject
        ).slice(0, 5); // Limite à 5 exercices
      });
  }

  /**
   * Calcule la progression de la journée
   */
  private calculateProgress(): void {
    if (!this.day) {
      this.dayProgress = 0;
      return;
    }

    const totalSessions = this.sessions.length;
    const completedSessions = this.sessions.filter(s => s.completed).length;
    const totalExercises = this.exercises.length;
    const completedExercises = this.exercises.filter(e => e.status === 'completed').length;

    const totalTasks = totalSessions + totalExercises;
    const completedTasks = completedSessions + completedExercises;

    this.dayProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Marque une session comme complétée
   */
  toggleSession(session: StudySession): void {
    session.completed = !session.completed;
    this.calculateProgress();
    // TODO: Sauvegarder la progression
  }

  /**
   * Navigue vers un exercice
   */
  goToExercise(exercise: Exercise): void {
    this.router.navigate(['/exercises', exercise.id]);
  }

  /**
   * Démarre le Pomodoro pour cette journée
   */
  startPomodoro(): void {
    this.router.navigate(['/pomodoro'], {
      queryParams: { dayId: this.dayId }
    });
  }

  /**
   * Retourne au planning
   */
  backToPlanning(): void {
    this.router.navigate(['/planning']);
  }

  /**
   * Jour précédent
   */
  previousDay(): void {
    if (this.dayNumber > 1) {
      this.router.navigate(['/planning', `day-${this.dayNumber - 1}`]);
    }
  }

  /**
   * Jour suivant
   */
  nextDay(): void {
    if (this.dayNumber < 12) {
      this.router.navigate(['/planning', `day-${this.dayNumber + 1}`]);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Retourne l'icône du type de session
   */
  getSessionIcon(type: string): string {
    const icons: Record<string, string> = {
      'theory': '📖',
      'practice': '✏️',
      'revision': '🔄'
    };
    return icons[type] || '📌';
  }

  /**
   * Retourne la couleur de la catégorie
   */
  getCategoryColor(): string {
    if (!this.day) return '#64748b';

    const colors: Record<string, string> = {
      'algebre': '#3b82f6',
      'algo': '#8b5cf6',
      'java': '#10b981',
      'consolidation': '#f59e0b'
    };
    // Utilise subject ou phase comme fallback si subject est undefined
    const key = this.day.subject || this.day.phase || '';
    return colors[key] || '#64748b';
  }

  /**
   * Formate la durée
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  /**
   * Calcule la durée totale
   */
  getTotalDuration(): number {
    return this.sessions.reduce((sum, s) => sum + s.duration, 0);
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
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI une vue détaillée par jour ?
 *
 *    FOCUS :
 *    Voir les 12 jours d'un coup peut être overwhelming.
 *    Une journée à la fois = une unité gérable.
 *
 *    "How do you eat an elephant? One bite at a time."
 *
 * 2. POURQUOI des sessions structurées ?
 *
 *    ORGANISATION :
 *    - Théorie → Comprendre le concept
 *    - Pratique base → Appliquer simplement
 *    - Pratique avancée → Approfondir
 *    - Révision → Consolider
 *
 *    Ce cycle suit les principes de l'apprentissage actif.
 *
 * 3. POURQUOI la navigation précédent/suivant ?
 *
 *    FLUIDITÉ :
 *    L'utilisateur peut enchaîner les jours sans repasser
 *    par la vue globale du planning.
 *
 *    C'est comme tourner les pages d'un livre.
 *
 * 4. POURQUOI le lien vers Pomodoro ?
 *
 *    INTÉGRATION :
 *    "Je suis prêt à travailler sur ce jour"
 *    → Je lance directement une session Pomodoro.
 *
 *    L'app guide l'utilisateur vers l'action.
 */
