/**
 * exercises.component.ts
 *
 * Composant EXERCISES - Liste et gestion des exercices.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est comme un catalogue d'exercices avec des filtres avancés.
 *
 * Imagine une bibliothèque numérique où :
 * - Chaque livre = un exercice
 * - Les rayons = les catégories (Conditions, Boucles, Tableaux...)
 * - Les étiquettes = la difficulté (Facile, Moyen, Difficile...)
 * - Le statut = lu/pas lu (Terminé/À faire)
 *
 * Fonctionnalités :
 * ================
 * 1. Afficher tous les exercices
 * 2. Filtrer par type (conditions, boucles, tableaux, java)
 * 3. Filtrer par difficulté
 * 4. Filtrer par statut
 * 5. Rechercher par titre
 * 6. Naviguer vers un exercice spécifique
 *
 * Philosophie David J. Malan :
 * "The best user interfaces are the ones you don't notice."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import des services
import { ExerciseService } from '../../core/services/exercise.service';

// Import du modal de génération IA
import { ExerciseGeneratorModalComponent } from '../../shared/components/exercise-generator-modal/exercise-generator-modal.component';

// Import des modèles et fonctions utilitaires
import {
  Exercise,
  ExerciseType,
  ExerciseDifficulty,
  ExerciseStatus,
  ExerciseStats,
  getDifficultyLabel,
  getStatusLabel,
  getTypeLabel,
  getExercisesDueForReview,
  calculateCompletionPercentage
} from '../../core/models/exercise.model';

/**
 * Interface pour les options de filtre
 */
interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * @Component Decorator
 */
@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ExerciseGeneratorModalComponent],
  templateUrl: './exercises.component.html',
  styleUrls: ['./exercises.component.scss']
})
export class ExercisesComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /**
   * Subject pour le nettoyage des subscriptions
   */
  private destroy$ = new Subject<void>();

  /**
   * Tous les exercices (non filtrés)
   */
  allExercises: Exercise[] = [];

  /**
   * Exercices filtrés (affichés)
   */
  filteredExercises: Exercise[] = [];

  /**
   * Statistiques des exercices
   */
  stats: ExerciseStats | null = null;

  /**
   * État de chargement
   */
  isLoading: boolean = true;

  /**
   * Exercices à réviser aujourd'hui
   */
  exercisesToReview: Exercise[] = [];

  // ===== FILTRES =====

  /**
   * Filtre par type d'exercice
   */
  filterType: string = 'all';

  /**
   * Filtre par difficulté
   */
  filterDifficulty: string = 'all';

  /**
   * Filtre par statut
   */
  filterStatus: string = 'all';

  /**
   * Recherche textuelle
   */
  searchQuery: string = '';

  /**
   * Tri actif
   */
  sortBy: 'title' | 'difficulty' | 'status' | 'type' = 'type';

  /**
   * Ordre de tri
   */
  sortOrder: 'asc' | 'desc' = 'asc';

  // ===== OPTIONS DE FILTRES =====

  /**
   * Options de type
   */
  typeOptions: FilterOption[] = [
    { value: 'all', label: 'Tous les types' },
    { value: 'boole', label: '🔣 Algèbre de Boole' },
    { value: 'condition', label: '🔀 Conditions' },
    { value: 'boucle', label: '🔁 Boucles' },
    { value: 'tableau', label: '📊 Tableaux' },
    { value: 'java', label: '☕ Java' }
  ];

  /**
   * Options de difficulté
   */
  difficultyOptions: FilterOption[] = [
    { value: 'all', label: 'Toutes difficultés' },
    { value: 'facile', label: '🟢 Facile' },
    { value: 'moyen', label: '🟡 Moyen' },
    { value: 'difficile', label: '🟠 Difficile' },
    { value: 'expert', label: '🔴 Expert' }
  ];

  /**
   * Options de statut
   */
  statusOptions: FilterOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'todo', label: '📋 À faire' },
    { value: 'in-progress', label: '🔄 En cours' },
    { value: 'completed', label: '✅ Terminé' },
    { value: 'reviewed', label: '🔁 Révisé' },
    { value: 'blocked', label: '🚧 Bloqué' }
  ];

  /**
   * Vue actuelle (grille ou liste)
   */
  viewMode: 'grid' | 'list' = 'grid';

  /**
   * Affiche le modal de génération IA
   */
  showGeneratorModal: boolean = false;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private exerciceService: ExerciseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  ngOnInit(): void {
    console.log('📝 Composant Exercises initialisé');

    // Vérifie les query params pour les filtres initiaux
    this.checkQueryParams();

    // Charge les exercices
    this.loadExercises();
  }

  ngOnDestroy(): void {
    console.log('📝 Composant Exercises détruit');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * Vérifier les paramètres d'URL
   * ----------------------------
   * Permet de naviguer directement vers un filtre.
   * Ex: /exercises?type=boucle
   */
  private checkQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['type']) {
          this.filterType = params['type'];
        }
        if (params['difficulty']) {
          this.filterDifficulty = params['difficulty'];
        }
        if (params['status']) {
          this.filterStatus = params['status'];
        }

        // Applique les filtres après le chargement
        if (this.allExercises.length > 0) {
          this.applyFilters();
        }
      });
  }

  /**
   * Charger les exercices
   */
  private loadExercises(): void {
    this.isLoading = true;

    this.exerciceService.exercises$
      .pipe(takeUntil(this.destroy$))
      .subscribe((exercises: Exercise[]) => {
        this.allExercises = exercises;
        this.exercisesToReview = getExercisesDueForReview(exercises);

        // Calcule les statistiques directement
        this.calculateStats(exercises);

        this.applyFilters();
        this.updateFilterCounts();
        this.isLoading = false;
      });
  }

  /**
   * Calculer les statistiques des exercices
   * ---------------------------------------
   * Génère un objet ExerciseStats à partir de la liste d'exercices.
   *
   * @param exercises - Liste des exercices
   */
  private calculateStats(exercises: Exercise[]): void {
    const completed = exercises.filter(e => e.status === 'completed' || e.status === 'reviewed');
    const inProgress = exercises.filter(e => e.status === 'in-progress');
    const todo = exercises.filter(e => e.status === 'todo');

    // Calcul des stats par difficulté (structure complète)
    const byDifficulty = {
      facile: this.getDifficultyStats(exercises, 'facile'),
      moyen: this.getDifficultyStats(exercises, 'moyen'),
      difficile: this.getDifficultyStats(exercises, 'difficile'),
      expert: this.getDifficultyStats(exercises, 'expert')
    };

    // Calcul des stats par type (structure complète)
    const byType = {
      boole: this.getTypeStats(exercises, 'boole'),
      condition: this.getTypeStats(exercises, 'condition'),
      boucle: this.getTypeStats(exercises, 'boucle'),
      tableau: this.getTypeStats(exercises, 'tableau'),
      fonction: this.getTypeStats(exercises, 'fonction'),
      java: this.getTypeStats(exercises, 'java')
    };

    this.stats = {
      total: exercises.length,
      completed: completed.length,
      inProgress: inProgress.length,
      todo: todo.length,
      byDifficulty,
      byType,
      averageScore: this.calculateAverageScore(completed),
      totalTimeSpent: this.calculateTotalTime(exercises)
    };
  }

  /**
   * Obtenir les stats pour une difficulté donnée
   */
  private getDifficultyStats(exercises: Exercise[], difficulty: ExerciseDifficulty): { total: number; completed: number; averageScore?: number } {
    const filtered = exercises.filter(e => e.difficulty === difficulty);
    const completed = filtered.filter(e => e.status === 'completed' || e.status === 'reviewed');
    return {
      total: filtered.length,
      completed: completed.length,
      averageScore: this.calculateAverageScore(completed)
    };
  }

  /**
   * Obtenir les stats pour un type donné
   */
  private getTypeStats(exercises: Exercise[], type: ExerciseType): { total: number; completed: number; averageScore?: number } {
    const filtered = exercises.filter(e => e.type === type);
    const completed = filtered.filter(e => e.status === 'completed' || e.status === 'reviewed');
    return {
      total: filtered.length,
      completed: completed.length,
      averageScore: this.calculateAverageScore(completed)
    };
  }

  /**
   * Calculer le score moyen des exercices complétés
   */
  private calculateAverageScore(completed: Exercise[]): number {
    if (completed.length === 0) return 0;
    const totalScore = completed.reduce((sum, e) => sum + (e.score || 0), 0);
    return Math.round(totalScore / completed.length);
  }

  /**
   * Calculer le temps total passé sur les exercices
   */
  private calculateTotalTime(exercises: Exercise[]): number {
    return exercises.reduce((sum, e) => sum + (e.timeSpent || 0), 0);
  }

  /**
   * Mettre à jour les compteurs de filtres
   */
  private updateFilterCounts(): void {
    // Compte par type
    this.typeOptions = this.typeOptions.map(opt => ({
      ...opt,
      count: opt.value === 'all'
        ? this.allExercises.length
        : this.allExercises.filter(e => e.type === opt.value).length
    }));

    // Compte par difficulté
    this.difficultyOptions = this.difficultyOptions.map(opt => ({
      ...opt,
      count: opt.value === 'all'
        ? this.allExercises.length
        : this.allExercises.filter(e => e.difficulty === opt.value).length
    }));

    // Compte par statut
    this.statusOptions = this.statusOptions.map(opt => ({
      ...opt,
      count: opt.value === 'all'
        ? this.allExercises.length
        : this.allExercises.filter(e => e.status === opt.value).length
    }));
  }

  // ============================================================
  // FILTRAGE ET TRI
  // ============================================================

  /**
   * Appliquer tous les filtres
   * -------------------------
   *
   * Pipeline de filtrage :
   * 1. Filtre par type
   * 2. Filtre par difficulté
   * 3. Filtre par statut
   * 4. Filtre par recherche
   * 5. Tri
   */
  applyFilters(): void {
    let result = [...this.allExercises];

    // Filtre par type
    if (this.filterType !== 'all') {
      result = result.filter(e => e.type === this.filterType);
    }

    // Filtre par difficulté
    if (this.filterDifficulty !== 'all') {
      result = result.filter(e => e.difficulty === this.filterDifficulty);
    }

    // Filtre par statut
    if (this.filterStatus !== 'all') {
      result = result.filter(e => e.status === this.filterStatus);
    }

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      );
    }

    // Tri
    result = this.sortExercises(result);

    this.filteredExercises = result;
  }

  /**
   * Trier les exercices
   */
  private sortExercises(exercises: Exercise[]): Exercise[] {
    return exercises.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'difficulty':
          const diffOrder = { facile: 1, moyen: 2, difficile: 3, expert: 4 };
          comparison = (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
          break;
        case 'status':
          const statusOrder = { todo: 1, 'in-progress': 2, blocked: 3, completed: 4, reviewed: 5, failed: 6 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        case 'type':
          const typeOrder: { [key: string]: number } = { boole: 1, condition: 2, boucle: 3, tableau: 4, fonction: 5, java: 6 };
          comparison = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Changer le filtre de type
   */
  onTypeChange(value: string): void {
    this.filterType = value;
    this.applyFilters();
    this.updateUrl();
  }

  /**
   * Changer le filtre de difficulté
   */
  onDifficultyChange(value: string): void {
    this.filterDifficulty = value;
    this.applyFilters();
    this.updateUrl();
  }

  /**
   * Changer le filtre de statut
   */
  onStatusChange(value: string): void {
    this.filterStatus = value;
    this.applyFilters();
    this.updateUrl();
  }

  /**
   * Changer la recherche
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Changer le tri
   */
  onSortChange(sortBy: 'title' | 'difficulty' | 'status' | 'type'): void {
    if (this.sortBy === sortBy) {
      // Toggle l'ordre si même tri
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  /**
   * Basculer le mode de vue
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filterType = 'all';
    this.filterDifficulty = 'all';
    this.filterStatus = 'all';
    this.searchQuery = '';
    this.sortBy = 'type';
    this.sortOrder = 'asc';
    this.applyFilters();
    this.updateUrl();
  }

  /**
   * Mettre à jour l'URL avec les filtres
   */
  private updateUrl(): void {
    const queryParams: any = {};

    if (this.filterType !== 'all') {
      queryParams.type = this.filterType;
    }
    if (this.filterDifficulty !== 'all') {
      queryParams.difficulty = this.filterDifficulty;
    }
    if (this.filterStatus !== 'all') {
      queryParams.status = this.filterStatus;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  /**
   * Naviguer vers un exercice
   */
  navigateToExercise(exercise: Exercise): void {
    console.log(`📝 Navigation vers exercice: ${exercise.title}`);
    this.router.navigate(['/exercises', exercise.id]);
  }

  /**
   * Naviguer vers la page de révision
   */
  goToReview(): void {
    this.router.navigate(['/revision']);
  }

  // ============================================================
  // MÉTHODES D'AFFICHAGE
  // ============================================================

  /**
   * Obtenir le label de difficulté
   */
  getDifficultyLabel(difficulty: ExerciseDifficulty): string {
    return getDifficultyLabel(difficulty);
  }

  /**
   * Obtenir le label de statut
   */
  getStatusLabel(status: ExerciseStatus): string {
    return getStatusLabel(status);
  }

  /**
   * Obtenir le label de type
   */
  getTypeLabel(type: ExerciseType): string {
    return getTypeLabel(type);
  }

  /**
   * Obtenir la couleur de difficulté
   */
  getDifficultyColor(difficulty: ExerciseDifficulty): string {
    const colors: { [key in ExerciseDifficulty]: string } = {
      facile: 'green',
      moyen: 'yellow',
      difficile: 'orange',
      expert: 'red'
    };
    return colors[difficulty];
  }

  /**
   * Obtenir la couleur de statut
   */
  getStatusColor(status: ExerciseStatus): string {
    const colors: { [key in ExerciseStatus]: string } = {
      'todo': 'gray',
      'in-progress': 'blue',
      'completed': 'green',
      'reviewed': 'purple',
      'blocked': 'orange',
      'failed': 'red'
    };
    return colors[status];
  }

  /**
   * Obtenir l'icône de type
   */
  getTypeIcon(type: ExerciseType): string {
    const icons: { [key in ExerciseType]: string } = {
      boole: '🔣',
      condition: '🔀',
      boucle: '🔁',
      tableau: '📊',
      fonction: '📦',
      java: '☕'
    };
    return icons[type];
  }

  /**
   * Formater le temps passé
   */
  formatTime(seconds: number): string {
    if (seconds === 0) return '-';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  /**
   * Calculer le pourcentage de complétion
   */
  getCompletionPercentage(): number {
    return calculateCompletionPercentage(this.allExercises);
  }

  /**
   * Vérifier si des filtres sont actifs
   */
  hasActiveFilters(): boolean {
    return this.filterType !== 'all' ||
           this.filterDifficulty !== 'all' ||
           this.filterStatus !== 'all' ||
           this.searchQuery.trim() !== '';
  }

  /**
   * Obtenir le nombre de filtres actifs
   */
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filterType !== 'all') count++;
    if (this.filterDifficulty !== 'all') count++;
    if (this.filterStatus !== 'all') count++;
    if (this.searchQuery.trim()) count++;
    return count;
  }

  /**
   * Vérifier si un exercice est à réviser
   */
  isExerciseDueForReview(exercise: Exercise): boolean {
    return this.exercisesToReview.some(e => e.id === exercise.id);
  }

  // ============================================================
  // GÉNÉRATEUR IA
  // ============================================================

  /**
   * Ouvrir le modal de génération IA
   */
  openGeneratorModal(): void {
    this.showGeneratorModal = true;
    console.log('🤖 Ouverture du générateur IA');
  }

  /**
   * Fermer le modal de génération IA
   */
  closeGeneratorModal(): void {
    this.showGeneratorModal = false;
    console.log('🤖 Fermeture du générateur IA');
  }

  /**
   * Callback quand un exercice est généré et sauvegardé
   * L'exercice sera automatiquement ajouté via le service
   */
  onExerciseGenerated(exercise: Exercise): void {
    console.log('✅ Exercice IA sauvegardé:', exercise.title);
    // Le service met à jour automatiquement la liste
    // On ferme juste le modal (déjà fait par le composant après délai)
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI des filtres multiples ?
 *
 *    L'utilisateur doit pouvoir trouver rapidement ce qu'il cherche.
 *
 *    Scénarios d'utilisation :
 *    - "Je veux faire un exercice facile sur les boucles"
 *    - "Quels exercices ai-je déjà terminés ?"
 *    - "Montrez-moi les exercices bloqués pour les revoir"
 *
 *    Sans filtres : scroll de 50+ exercices = frustration
 *    Avec filtres : 3 clics = trouvé
 *
 * 2. POURQUOI persister les filtres dans l'URL ?
 *
 *    - Partage : "Voici les exercices sur les tableaux" → copier l'URL
 *    - Navigation : Retour en arrière → retrouve les mêmes filtres
 *    - Bookmark : Sauvegarder une recherche favorite
 *
 *    C'est le pattern "URL as State" utilisé par Google, Amazon, etc.
 *
 * 3. POURQUOI deux modes de vue (grille/liste) ?
 *
 *    Préférences personnelles :
 *    - Grille : Vue d'ensemble, repérage visuel rapide
 *    - Liste : Détails, comparaison, scan vertical
 *
 *    Laisser le choix = meilleure UX
 *
 * 4. POURQUOI mettre en avant les exercices à réviser ?
 *
 *    Révision espacée = clé de la mémorisation.
 *
 *    Si on ne rappelle pas à l'utilisateur de réviser,
 *    il oubliera ~80% de ce qu'il a appris en 24h !
 *
 *    C'est comme un rappel de rendez-vous médical :
 *    Important, donc visible.
 *
 * Citation de Steve Jobs :
 * "Design is not just what it looks like and feels like.
 *  Design is how it works."
 *
 * Ce composant est conçu pour FONCTIONNER efficacement,
 * pas juste pour être joli.
 */
