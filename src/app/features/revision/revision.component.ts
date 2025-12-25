/**
 * revision.component.ts
 *
 * Composant RÉVISION - Système de révision espacée.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page dédiée à la révision des exercices déjà terminés,
 * utilisant la technique de la RÉPÉTITION ESPACÉE.
 *
 * Qu'est-ce que la répétition espacée ?
 * ------------------------------------
 * C'est une technique d'apprentissage scientifiquement prouvée
 * basée sur la "courbe de l'oubli" d'Hermann Ebbinghaus (1885).
 *
 * Principe :
 * - Tu apprends quelque chose aujourd'hui
 * - Sans révision, tu oublies ~70% en 24h
 * - Mais si tu révises à J+1, J+3, J+7, J+30...
 * - L'information passe en MÉMOIRE LONG TERME
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine que tu verses de l'eau dans un seau percé.
 * - Sans rien faire : l'eau s'échappe (oubli)
 * - En rebouchant régulièrement : le seau se remplit (mémorisation)
 *
 * Les intervalles de révision "rebouchent" les trous de la mémoire !
 *
 * Algorithme utilisé :
 * -------------------
 * Basé sur SM-2 (SuperMemo 2), simplifié :
 * - Première révision : J+1 (lendemain)
 * - Deuxième révision : J+3 (3 jours après)
 * - Troisième révision : J+7 (1 semaine après)
 * - Quatrième révision : J+14 (2 semaines après)
 *
 * Si tu échoues à une révision, l'intervalle se réduit.
 * Si tu réussis, l'intervalle augmente.
 *
 * Philosophie David J. Malan :
 * "The goal of learning is not just to pass the exam,
 *  but to retain knowledge for a lifetime."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ExerciseService } from '../../core/services/exercise.service';
import { ProgressService } from '../../core/services/progress.service';
import { Exercise } from '../../core/models/exercise.model';

/**
 * Interface pour un exercice à réviser
 */
interface RevisionItem {
  exercise: Exercise;
  dueDate: Date;
  interval: number;       // Intervalle actuel en jours
  repetitions: number;    // Nombre de répétitions réussies
  easeFactor: number;     // Facteur de facilité (SM-2)
  isOverdue: boolean;     // En retard ?
}

/**
 * Interface pour les statistiques de révision
 */
interface RevisionStats {
  dueToday: number;
  dueThisWeek: number;
  totalReviewed: number;
  retentionRate: number;  // Taux de rétention (%)
}

@Component({
  selector: 'app-revision',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './revision.component.html',
  styleUrls: ['./revision.component.scss']
})
export class RevisionComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  private destroy$ = new Subject<void>();

  /**
   * Exercices à réviser aujourd'hui
   */
  todayRevisions: RevisionItem[] = [];

  /**
   * Exercices à réviser cette semaine
   */
  weekRevisions: RevisionItem[] = [];

  /**
   * Exercice actuellement en révision
   */
  currentRevision: RevisionItem | null = null;

  /**
   * Index de l'exercice en cours dans la session
   */
  currentIndex: number = 0;

  /**
   * Mode de révision actif
   */
  isReviewMode: boolean = false;

  /**
   * Afficher la réponse ?
   */
  showAnswer: boolean = false;

  /**
   * Statistiques
   */
  stats: RevisionStats = {
    dueToday: 0,
    dueThisWeek: 0,
    totalReviewed: 0,
    retentionRate: 0
  };

  /**
   * Onglet actif
   */
  activeTab: 'today' | 'week' | 'all' = 'today';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private exerciseService: ExerciseService,
    private progressService: ProgressService
  ) {}

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  ngOnInit(): void {
    this.loadRevisions();
    this.calculateStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * Charge les exercices à réviser
   */
  private loadRevisions(): void {
    // Récupère les exercices complétés qui ont des dates de révision
    this.exerciseService.exercises$
      .pipe(takeUntil(this.destroy$))
      .subscribe(exercises => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Filtre les exercices à réviser
        const completedExercises = exercises.filter(e => e.status === 'reviewed' || e.status === 'completed');

        // Crée les items de révision (simulation avec dates)
        const revisionItems: RevisionItem[] = completedExercises.map(exercise => {
          // Calcule la prochaine date de révision basée sur le nombre de révisions
          const repetitions = exercise.revisionCount || 0;
          const interval = this.calculateInterval(repetitions);
          const lastReview = exercise.lastReviewDate || exercise.completedAt || new Date();
          const dueDate = new Date(lastReview);
          dueDate.setDate(dueDate.getDate() + interval);

          return {
            exercise,
            dueDate,
            interval,
            repetitions,
            easeFactor: 2.5, // Valeur par défaut SM-2
            isOverdue: dueDate < today
          };
        });

        // Filtre pour aujourd'hui
        this.todayRevisions = revisionItems.filter(item =>
          item.dueDate <= today || item.isOverdue
        );

        // Filtre pour cette semaine
        this.weekRevisions = revisionItems.filter(item =>
          item.dueDate > today && item.dueDate <= weekEnd
        );

        this.calculateStats();
      });
  }

  /**
   * Calcule l'intervalle de révision selon SM-2
   */
  private calculateInterval(repetitions: number): number {
    const intervals = [1, 3, 7, 14, 30, 60];
    return intervals[Math.min(repetitions, intervals.length - 1)];
  }

  /**
   * Calcule les statistiques
   * -----------------------
   * Récupère les vraies stats depuis le service.
   */
  private calculateStats(): void {
    // Récupère les stats de révision depuis le service
    this.exerciseService.getRevisionStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(revisionStats => {
        this.stats = {
          dueToday: this.todayRevisions.length,
          dueThisWeek: this.weekRevisions.length,
          totalReviewed: revisionStats.totalReviewed,
          retentionRate: revisionStats.retentionRate
        };
      });
  }

  // ============================================================
  // MODE RÉVISION
  // ============================================================

  /**
   * Démarre une session de révision
   */
  startReviewSession(): void {
    if (this.todayRevisions.length === 0) return;

    this.isReviewMode = true;
    this.currentIndex = 0;
    this.currentRevision = this.todayRevisions[0];
    this.showAnswer = false;
  }

  /**
   * Révèle la réponse
   */
  revealAnswer(): void {
    this.showAnswer = true;
  }

  /**
   * Note la révision et passe à la suivante
   * ---------------------------------------
   * Implémente l'algorithme SM-2 pour la répétition espacée.
   *
   * @param quality Note de 0 à 5 (SM-2)
   *   - 0 : Aucun souvenir
   *   - 1 : Mauvaise réponse, mais reconnu
   *   - 2 : Mauvaise réponse, mais facile à rappeler
   *   - 3 : Bonne réponse avec difficulté
   *   - 4 : Bonne réponse avec hésitation
   *   - 5 : Réponse parfaite
   */
  rateRevision(quality: number): void {
    if (!this.currentRevision) return;

    // Enregistre la révision avec l'algorithme SM-2
    // Cela met à jour : revisionCount, easeFactor, interval, nextReviewDate
    this.exerciseService.recordRevision(
      this.currentRevision.exercise.id,
      quality
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedExercise) => {
          if (updatedExercise) {
            console.log(`✅ Révision enregistrée: ${updatedExercise.title}`);
            console.log(`   Prochaine révision: ${updatedExercise.nextReviewDate}`);
          }

          // Passe à la révision suivante
          this.moveToNextRevision();
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'enregistrement:', error);
          // Continue quand même à la prochaine révision
          this.moveToNextRevision();
        }
      });
  }

  /**
   * Passe à la révision suivante
   */
  private moveToNextRevision(): void {
    this.currentIndex++;

    if (this.currentIndex < this.todayRevisions.length) {
      this.currentRevision = this.todayRevisions[this.currentIndex];
      this.showAnswer = false;
    } else {
      // Session terminée
      this.endReviewSession();
    }
  }

  /**
   * Termine la session de révision
   */
  endReviewSession(): void {
    this.isReviewMode = false;
    this.currentRevision = null;
    this.showAnswer = false;

    // Recharge les données
    this.loadRevisions();
  }

  /**
   * Quitte le mode révision
   */
  exitReviewMode(): void {
    if (confirm('Es-tu sûr de vouloir quitter ? Ta progression sera sauvegardée.')) {
      this.endReviewSession();
    }
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  /**
   * Change l'onglet actif
   */
  setActiveTab(tab: 'today' | 'week' | 'all'): void {
    this.activeTab = tab;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Formate la date de révision
   */
  formatDueDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(date);

    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} jours de retard`;
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    return `Dans ${diffDays} jours`;
  }

  /**
   * Retourne la couleur selon l'urgence
   */
  getUrgencyColor(item: RevisionItem): string {
    if (item.isOverdue) return '#ef4444'; // Rouge
    const now = new Date();
    const diffHours = (item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return '#f59e0b'; // Orange
    return '#10b981'; // Vert
  }

  /**
   * Retourne l'icône du type d'exercice
   */
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'condition': '🔀',
      'loop': '🔄',
      'array': '📊',
      'function': '📦',
      'java': '☕'
    };
    return icons[type] || '📝';
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
 * 1. POURQUOI la répétition espacée ?
 *
 *    La SCIENCE de la mémoire :
 *
 *    Sans révision :
 *    100% ──────╮
 *               │
 *               ╰──────── 30% (après 24h)
 *
 *    Avec révision espacée :
 *    100% ──────╮
 *               │  ╭── 95%
 *               ╰──╯
 *                    ╭── 90%
 *                  ──╯
 *
 *    Chaque révision "relève" la courbe !
 *
 * 2. POURQUOI les intervalles 1-3-7-14-30 ?
 *
 *    C'est basé sur l'algorithme SM-2 de SuperMemo.
 *
 *    L'idée : réviser JUSTE AVANT d'oublier.
 *    - Trop tôt : perte de temps
 *    - Trop tard : il faut réapprendre
 *
 *    Ces intervalles sont optimaux pour la plupart des gens.
 *
 * 3. POURQUOI noter la qualité de la révision ?
 *
 *    Adaptation personnalisée :
 *    - Note 5 (parfait) → Intervalle augmente
 *    - Note 3 (correct) → Intervalle maintenu
 *    - Note 1 (échec) → Intervalle réduit
 *
 *    L'algorithme s'adapte à TON niveau de maîtrise.
 *
 * 4. POURQUOI montrer les "en retard" ?
 *
 *    Responsabilisation :
 *    Les exercices en retard sont surlignés en rouge.
 *    C'est un rappel visuel : "Tu dois réviser ça !"
 *
 *    Mais c'est aussi BIENVEILLANT :
 *    Tu peux rattraper ton retard à tout moment.
 *
 * 5. POURQUOI un "mode révision" séparé ?
 *
 *    FOCUS :
 *    En mode révision, tu n'as QUE l'exercice devant toi.
 *    Pas de distractions, pas de navigation.
 *
 *    C'est comme les flashcards physiques :
 *    Une carte à la fois, concentration maximale.
 *
 * Citation de Hermann Ebbinghaus :
 * "With any considerable number of repetitions,
 *  a suitable distribution of them over a space of time
 *  is decidedly more advantageous than the massing of them
 *  at a single time."
 *
 * En français : Mieux vaut réviser un peu chaque jour
 * que tout d'un coup la veille de l'examen !
 */
