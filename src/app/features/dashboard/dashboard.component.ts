/**
 * dashboard.component.ts
 *
 * Composant DASHBOARD - Vue d'ensemble de la progression.
 *
 * Qu'est-ce que le Dashboard ?
 * ---------------------------
 * C'est la page d'accueil de l'application, le "cockpit" de ton apprentissage.
 * En un coup d'œil, tu vois TOUT ce qui est important :
 *
 * - Ton niveau et XP actuels
 * - Ton streak (jours consécutifs)
 * - Ta progression par sujet
 * - Les quêtes du jour
 * - La prochaine session du planning
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine le tableau de bord d'une voiture :
 * - Vitesse (= ton niveau actuel)
 * - Jauge essence (= XP vers le prochain niveau)
 * - Compteur kilométrique (= total d'exercices faits)
 * - Témoins d'alerte (= quêtes et révisions à faire)
 *
 * Tout est visible d'un seul regard !
 *
 * Philosophie David J. Malan :
 * "Show, don't tell."
 *
 * Au lieu de dire "Tu progresses bien",
 * on MONTRE la barre de progression qui monte.
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

// Import des services
import { ProgressService } from '../../core/services/progress.service';
import { PlanningService } from '../../core/services/planning.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { GamificationService } from '../../core/services/gamification.service';
import { PomodoroService } from '../../core/services/pomodoro.service';

// Import des modèles
import { Progress, calculateTotalXPForLevel } from '../../core/models/progress.model';
import { Day } from '../../core/models/day.model';
import { Quest } from '../../core/models/quest.model';
import { Badge } from '../../core/models/badge.model';

/**
 * STATISTIQUES DU DASHBOARD
 * -------------------------
 * Interface pour regrouper les stats affichées.
 */
interface DashboardStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  levelProgress: number;
  streak: number;
  longestStreak: number;
  totalExercises: number;
  completedExercises: number;
  exerciseProgress: number;
  totalHours: number;
  pomodorosToday: number;
}

/**
 * CARTE DE SUJET
 * -------------
 * Représente la progression sur un sujet.
 */
interface SubjectCard {
  id: string;
  name: string;
  icon: string;
  color: string;
  percentage: number;
  exercisesCompleted: number;
  exercisesTotal: number;
}

/**
 * @Component Decorator
 * -------------------
 * Configure le composant Angular.
 *
 * standalone: true → Pas besoin de NgModule (Angular 17+)
 * imports: [] → Modules/composants utilisés dans le template
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,    // *ngIf, *ngFor, pipes (date, number, etc.)
    RouterModule     // routerLink, routerLinkActive
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS OBSERVABLES
  // ============================================================

  /**
   * Subject pour le nettoyage des subscriptions
   * ------------------------------------------
   * Pourquoi ?
   * Quand le composant est détruit (navigation vers une autre page),
   * on doit arrêter d'écouter les Observables pour éviter les memory leaks.
   *
   * Pattern : takeUntil(destroy$)
   */
  private destroy$ = new Subject<void>();

  /**
   * Progression actuelle
   */
  progress$!: Observable<Progress | null>;

  /**
   * Statistiques calculées
   */
  stats: DashboardStats = {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    levelProgress: 0,
    streak: 0,
    longestStreak: 0,
    totalExercises: 0,
    completedExercises: 0,
    exerciseProgress: 0,
    totalHours: 0,
    pomodorosToday: 0
  };

  /**
   * Cartes de progression par sujet
   */
  subjectCards: SubjectCard[] = [];

  /**
   * Quêtes actives (daily + weekly)
   */
  activeQuests: Quest[] = [];

  /**
   * Badges récemment débloqués
   */
  recentBadges: Badge[] = [];

  /**
   * Journée courante du planning
   */
  currentDay: Day | null = null;

  /**
   * Prochaine journée à faire
   */
  nextDay: Day | null = null;

  /**
   * Exercices à réviser aujourd'hui
   */
  exercisesToReview: number = 0;

  /**
   * Message de bienvenue personnalisé
   */
  welcomeMessage: string = '';

  /**
   * Heure actuelle pour le message d'accueil
   */
  currentTime: Date = new Date();

  /**
   * État de chargement
   */
  isLoading: boolean = true;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  /**
   * Injection des services
   * ---------------------
   * Angular injecte automatiquement les services déclarés ici.
   * C'est le pattern "Dependency Injection" (DI).
   *
   * Avantages :
   * - Testabilité : On peut injecter des mocks pour les tests
   * - Découplage : Le composant ne crée pas ses dépendances
   * - Singleton : Les services sont partagés dans toute l'app
   */
  constructor(
    private progressService: ProgressService,
    private planningService: PlanningService,
    private exerciseService: ExerciseService,
    private gamificationService: GamificationService,
    private pomodoroService: PomodoroService
  ) {}

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  /**
   * ngOnInit
   * --------
   * Appelé une fois après la création du composant.
   *
   * C'est ici qu'on :
   * - S'abonne aux Observables
   * - Charge les données initiales
   * - Initialise l'état
   *
   * Pourquoi pas dans le constructeur ?
   * → Le constructeur doit rester simple (injection seulement)
   * → ngOnInit garantit que le composant est prêt
   */
  ngOnInit(): void {
    console.log('📊 Dashboard initialisé');

    // Génère le message de bienvenue
    this.generateWelcomeMessage();

    // Charge toutes les données
    this.loadDashboardData();

    // Met à jour l'heure toutes les minutes
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  /**
   * ngOnDestroy
   * ----------
   * Appelé juste avant la destruction du composant.
   *
   * C'est ici qu'on :
   * - Annule les subscriptions
   * - Nettoie les timers
   * - Libère les ressources
   *
   * TRÈS IMPORTANT pour éviter les memory leaks !
   */
  ngOnDestroy(): void {
    console.log('📊 Dashboard détruit');

    // Émet une valeur pour arrêter toutes les subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * CHARGER TOUTES LES DONNÉES DU DASHBOARD
   * --------------------------------------
   * Récupère et combine les données de tous les services.
   */
  private loadDashboardData(): void {
    this.isLoading = true;

    // Combine plusieurs Observables en un seul
    combineLatest([
      this.progressService.getProgress(),
      this.planningService.getAllDays(),
      this.exerciseService.getStats(),
      this.gamificationService.getActiveQuests(),
      this.pomodoroService.getStats()
    ]).pipe(
      // Arrête la subscription quand le composant est détruit
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([progress, days, exerciseStats, quests, pomodoroStats]) => {
        // Met à jour les statistiques
        if (progress) {
          this.updateStats(progress, exerciseStats, pomodoroStats);
          this.updateSubjectCards(progress);
        }

        // Met à jour le planning
        this.updatePlanningInfo(days);

        // Met à jour les quêtes
        this.activeQuests = quests.slice(0, 5); // Max 5 quêtes affichées

        // Chargement terminé
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement du dashboard:', error);
        this.isLoading = false;
      }
    });

    // Charge les badges récents
    this.loadRecentBadges();

    // Charge les exercices à réviser
    this.loadExercisesToReview();
  }

  /**
   * METTRE À JOUR LES STATISTIQUES
   * -----------------------------
   */
  private updateStats(progress: Progress, exerciseStats: any, pomodoroStats: any): void {
    const xpForNextLevel = calculateTotalXPForLevel(progress.level + 1);
    const xpForCurrentLevel = calculateTotalXPForLevel(progress.level);
    const xpInLevel = progress.xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    this.stats = {
      level: progress.level,
      xp: progress.xp,
      xpToNextLevel: xpForNextLevel - progress.xp,
      levelProgress: Math.round((xpInLevel / xpNeeded) * 100),
      streak: progress.streak,
      longestStreak: progress.longestStreak,
      totalExercises: exerciseStats.total,
      completedExercises: exerciseStats.completed,
      exerciseProgress: Math.round((exerciseStats.completed / exerciseStats.total) * 100) || 0,
      totalHours: Math.round(progress.stats.totalHours * 10) / 10,
      pomodorosToday: pomodoroStats.today.completed
    };
  }

  /**
   * METTRE À JOUR LES CARTES DE SUJETS
   * ---------------------------------
   */
  private updateSubjectCards(progress: Progress): void {
    const subjects = progress.stats.bySubject;

    this.subjectCards = [
      {
        id: 'boole',
        name: 'Algèbre de Boole',
        icon: '🔣',
        color: 'purple',
        percentage: subjects.boole?.percentage || 0,
        exercisesCompleted: subjects.boole?.exercisesCompleted || 0,
        exercisesTotal: subjects.boole?.exercisesTotal || 0
      },
      {
        id: 'conditions',
        name: 'Conditions',
        icon: '🔀',
        color: 'blue',
        percentage: subjects.conditions?.percentage || 0,
        exercisesCompleted: subjects.conditions?.exercisesCompleted || 0,
        exercisesTotal: subjects.conditions?.exercisesTotal || 0
      },
      {
        id: 'boucles',
        name: 'Boucles',
        icon: '🔁',
        color: 'green',
        percentage: subjects.boucles?.percentage || 0,
        exercisesCompleted: subjects.boucles?.exercisesCompleted || 0,
        exercisesTotal: subjects.boucles?.exercisesTotal || 0
      },
      {
        id: 'tableaux',
        name: 'Tableaux',
        icon: '📊',
        color: 'orange',
        percentage: subjects.tableaux?.percentage || 0,
        exercisesCompleted: subjects.tableaux?.exercisesCompleted || 0,
        exercisesTotal: subjects.tableaux?.exercisesTotal || 0
      },
      {
        id: 'java',
        name: 'Java',
        icon: '☕',
        color: 'red',
        percentage: subjects.java?.percentage || 0,
        exercisesCompleted: subjects.java?.exercisesCompleted || 0,
        exercisesTotal: subjects.java?.exercisesTotal || 0
      }
    ];
  }

  /**
   * METTRE À JOUR LES INFOS DU PLANNING
   * ----------------------------------
   */
  private updatePlanningInfo(days: Day[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Trouve la journée courante (en cours)
    this.currentDay = days.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime() && day.status === 'in-progress';
    }) || null;

    // Trouve la prochaine journée à faire
    this.nextDay = days.find(day => day.status === 'todo') || null;
  }

  /**
   * CHARGER LES BADGES RÉCENTS
   * -------------------------
   */
  private loadRecentBadges(): void {
    this.progressService.getUnlockedBadges()
      .pipe(takeUntil(this.destroy$))
      .subscribe(badges => {
        // Trie par date de déblocage (plus récent en premier)
        this.recentBadges = badges
          .filter(b => b.unlockedAt)
          .sort((a, b) => {
            const dateA = new Date(a.unlockedAt!).getTime();
            const dateB = new Date(b.unlockedAt!).getTime();
            return dateB - dateA;
          })
          .slice(0, 3); // Max 3 badges affichés
      });
  }

  /**
   * CHARGER LES EXERCICES À RÉVISER
   * ------------------------------
   */
  private loadExercisesToReview(): void {
    this.exerciseService.getExercisesDueForReview()
      .pipe(takeUntil(this.destroy$))
      .subscribe(exercises => {
        this.exercisesToReview = exercises.length;
      });
  }

  // ============================================================
  // MÉTHODES D'AFFICHAGE
  // ============================================================

  /**
   * GÉNÉRER LE MESSAGE DE BIENVENUE
   * ------------------------------
   * Message personnalisé selon l'heure de la journée.
   */
  private generateWelcomeMessage(): void {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      this.welcomeMessage = 'Bonjour ! Prêt pour une matinée productive ?';
    } else if (hour >= 12 && hour < 14) {
      this.welcomeMessage = 'Bon appétit ! Une petite session après le déjeuner ?';
    } else if (hour >= 14 && hour < 18) {
      this.welcomeMessage = 'Bon après-midi ! Continue sur ta lancée !';
    } else if (hour >= 18 && hour < 22) {
      this.welcomeMessage = 'Bonsoir ! Encore quelques exercices avant de te reposer ?';
    } else {
      this.welcomeMessage = 'Tu travailles tard ! Pense à te reposer aussi.';
    }
  }

  /**
   * OBTENIR LE NIVEAU SUIVANT
   * ------------------------
   */
  getNextLevel(): number {
    return this.stats.level + 1;
  }

  /**
   * OBTENIR LE TITRE DU NIVEAU
   * -------------------------
   * Retourne un titre fun basé sur le niveau.
   */
  getLevelTitle(): string {
    const level = this.stats.level;

    if (level <= 5) return 'Apprenti';
    if (level <= 10) return 'Débutant';
    if (level <= 15) return 'Intermédiaire';
    if (level <= 20) return 'Avancé';
    if (level <= 25) return 'Expert';
    if (level <= 30) return 'Maître';
    return 'Légende';
  }

  /**
   * OBTENIR LA COULEUR DU STREAK
   * ---------------------------
   * Plus le streak est long, plus la couleur est chaude.
   */
  getStreakColor(): string {
    const streak = this.stats.streak;

    if (streak === 0) return 'gray';
    if (streak < 3) return 'orange';
    if (streak < 7) return 'yellow';
    if (streak < 14) return 'green';
    if (streak < 30) return 'blue';
    return 'purple'; // 30+ jours = légende !
  }

  /**
   * FORMATER LA DURÉE EN HEURES/MINUTES
   * ----------------------------------
   */
  formatDuration(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  /**
   * OBTENIR LE POURCENTAGE DE PROGRESSION D'UNE QUÊTE
   * ------------------------------------------------
   */
  getQuestProgress(quest: Quest): number {
    if (!quest.objective) return 0;
    return Math.min(100, Math.round((quest.objective.current / quest.objective.target) * 100));
  }

  /**
   * OBTENIR L'ICÔNE D'UN SUJET
   * -------------------------
   */
  getSubjectIcon(subjectId: string): string {
    const icons: { [key: string]: string } = {
      boole: '🔣',
      conditions: '🔀',
      boucles: '🔁',
      tableaux: '📊',
      java: '☕'
    };
    return icons[subjectId] || '📚';
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un Dashboard ?
 *
 *    Psychologie de la visualisation :
 *    Les humains comprennent mieux les IMAGES que les CHIFFRES.
 *
 *    "Niveau 5" est moins parlant qu'une barre de progression
 *    qui monte visuellement.
 *
 *    Le Dashboard transforme les données en HISTOIRE VISUELLE.
 *
 * 2. POURQUOI le pattern takeUntil(destroy$) ?
 *
 *    Memory leaks = le fléau des apps JavaScript.
 *
 *    Sans nettoyage des subscriptions :
 *    - Le composant est détruit
 *    - MAIS les Observables continuent d'émettre
 *    - MAIS les callbacks sont toujours référencés
 *    - = Mémoire jamais libérée = app qui ralentit
 *
 *    Avec takeUntil :
 *    - On émet sur destroy$ quand le composant meurt
 *    - Toutes les subscriptions s'arrêtent automatiquement
 *    - = Mémoire libérée = app fluide
 *
 * 3. POURQUOI combineLatest ?
 *
 *    On a besoin de 5 sources de données :
 *    - Progression
 *    - Planning
 *    - Exercices
 *    - Quêtes
 *    - Pomodoro
 *
 *    Sans combineLatest : 5 subscriptions séparées, 5 mises à jour
 *    Avec combineLatest : 1 subscription, toutes les données ensemble
 *
 *    Plus simple, plus efficace, plus maintenable.
 *
 * 4. POURQUOI le message de bienvenue personnalisé ?
 *
 *    Touch humain dans une app technique.
 *
 *    "Bonsoir !" à 20h est plus chaleureux que "Bienvenue".
 *    Ça crée une connexion émotionnelle avec l'utilisateur.
 *
 *    Small details, big impact.
 *
 * Citation de Dieter Rams (designer Apple) :
 * "Good design is as little design as possible."
 *
 * Le Dashboard doit être SIMPLE.
 * Pas 50 métriques, mais les 5-10 qui comptent vraiment.
 *
 * Moins c'est plus. Focus sur l'essentiel.
 */
