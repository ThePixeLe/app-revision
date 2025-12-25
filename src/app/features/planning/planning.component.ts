/**
 * planning.component.ts
 *
 * Composant PLANNING - Vue d'ensemble des 12 jours d'apprentissage.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est comme un AGENDA visuel de tes 12 jours de formation.
 *
 * Imagine un calendrier mural où :
 * - Chaque case = un jour
 * - Les cases colorées = jours terminés
 * - La case avec un cercle = jour actuel
 * - Les cases grises = jours à venir
 *
 * Structure de la page :
 * =====================
 * 1. Header avec progression globale
 * 2. Barre de progression visuelle (12 points)
 * 3. Grille des 4 phases (Algèbre, Algo, Java, Consolidation)
 * 4. Cartes détaillées pour chaque jour
 * 5. Statistiques de session
 *
 * Philosophie David J. Malan :
 * "The best programs are written so that computing machines
 *  can perform them quickly and so that humans can understand
 *  them clearly."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import des services
import { PlanningService, PlanningStats } from '../../core/services/planning.service';
import { Day, Session } from '../../core/models/day.model';

/**
 * Interface pour les cartes de phase
 * ----------------------------------
 * Représente une phase avec ses métadonnées d'affichage.
 */
interface PhaseCard {
  id: 'algebre' | 'algo' | 'java' | 'consolidation';
  name: string;
  icon: string;
  color: string;
  description: string;
  days: Day[];
  progress: number;
}

/**
 * @Component Decorator
 */
@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss']
})
export class PlanningComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /**
   * Subject pour le nettoyage des subscriptions
   * ------------------------------------------
   *
   * Pourquoi cette technique ?
   * -------------------------
   * Quand un composant Angular est détruit (navigation vers une autre page),
   * il faut "désabonner" toutes les subscriptions RxJS.
   *
   * Sinon : MEMORY LEAK (fuite mémoire) !
   * Les subscriptions continuent d'écouter même après la destruction.
   *
   * Comment ça marche :
   * 1. On crée un Subject "destroy$"
   * 2. On utilise .pipe(takeUntil(this.destroy$)) sur chaque subscription
   * 3. Dans ngOnDestroy(), on fait destroy$.next() → toutes les subs se ferment !
   *
   * C'est le pattern recommandé par Angular pour gérer les subscriptions.
   */
  private destroy$ = new Subject<void>();

  /**
   * Tous les jours du planning
   */
  days: Day[] = [];

  /**
   * Le jour actuel (celui sur lequel l'utilisateur travaille)
   */
  currentDay: Day | null = null;

  /**
   * Index du jour actuel (1-12)
   */
  currentDayIndex: number = 1;

  /**
   * Statistiques du planning
   */
  stats: PlanningStats | null = null;

  /**
   * Cartes des phases pour l'affichage
   */
  phaseCards: PhaseCard[] = [];

  /**
   * État de chargement
   */
  isLoading: boolean = true;

  /**
   * Jour sélectionné pour voir les détails
   */
  selectedDay: Day | null = null;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  /**
   * Constructeur avec injection de dépendances
   * -----------------------------------------
   *
   * Qu'est-ce que l'injection de dépendances ?
   * -----------------------------------------
   * Au lieu de créer les services nous-mêmes (new PlanningService()),
   * Angular les "injecte" automatiquement.
   *
   * Avantages :
   * 1. Le composant ne connaît pas les détails de création du service
   * 2. On peut facilement remplacer le service pour les tests
   * 3. Le service est partagé (singleton) → même données partout
   *
   * Analogie :
   * Tu veux du café. Tu ne construis pas une machine à café,
   * tu demandes à quelqu'un (le système d'injection) de t'en servir.
   */
  constructor(
    private planningService: PlanningService,
    private router: Router
  ) {}

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  /**
   * ngOnInit - Appelé après la création du composant
   * ------------------------------------------------
   *
   * C'est ici qu'on fait les initialisations :
   * - Charger les données
   * - S'abonner aux Observables
   * - Configurer les éléments dynamiques
   *
   * Pourquoi pas dans le constructeur ?
   * ----------------------------------
   * Le constructeur doit être rapide et simple.
   * Les opérations asynchrones (chargement de données) vont dans ngOnInit.
   *
   * C'est une convention Angular pour séparer :
   * - Injection (constructeur)
   * - Initialisation (ngOnInit)
   */
  ngOnInit(): void {
    console.log('📅 Composant Planning initialisé');

    // Charge les données
    this.loadPlanningData();
  }

  /**
   * ngOnDestroy - Appelé avant la destruction du composant
   * -----------------------------------------------------
   *
   * C'est ici qu'on nettoie :
   * - Ferme les subscriptions
   * - Libère les ressources
   *
   * Le destroy$.next() déclenche la fermeture de toutes
   * les subscriptions qui utilisent takeUntil(this.destroy$).
   */
  ngOnDestroy(): void {
    console.log('📅 Composant Planning détruit');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * CHARGER LES DONNÉES DU PLANNING
   * -------------------------------
   *
   * Cette méthode orchestre le chargement de toutes les données :
   * 1. Liste des jours
   * 2. Jour actuel
   * 3. Statistiques
   *
   * Chaque subscription utilise takeUntil pour le nettoyage automatique.
   */
  private loadPlanningData(): void {
    this.isLoading = true;

    // Subscription 1 : Tous les jours
    this.planningService.days$
      .pipe(takeUntil(this.destroy$))
      .subscribe(days => {
        this.days = days;
        this.buildPhaseCards();

        // Une fois les jours chargés, on peut désactiver le loading
        if (days.length > 0) {
          this.isLoading = false;
        }
      });

    // Subscription 2 : Jour actuel
    this.planningService.currentDay$
      .pipe(takeUntil(this.destroy$))
      .subscribe(day => {
        this.currentDay = day;
      });

    // Subscription 3 : Index du jour actuel
    this.planningService.currentDayIndex$
      .pipe(takeUntil(this.destroy$))
      .subscribe(index => {
        this.currentDayIndex = index;
      });

    // Subscription 4 : Statistiques
    this.planningService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  /**
   * CONSTRUIRE LES CARTES DE PHASE
   * -----------------------------
   *
   * Transforme les données brutes en structure adaptée à l'affichage.
   *
   * Pourquoi cette transformation ?
   * ------------------------------
   * Les données du service sont orientées "stockage" (efficace, compact).
   * L'affichage a besoin de données orientées "présentation" (enrichies).
   *
   * Cette méthode fait le pont entre les deux.
   */
  private buildPhaseCards(): void {
    // Définition des métadonnées de chaque phase
    const phasesMetadata: Omit<PhaseCard, 'days' | 'progress'>[] = [
      {
        id: 'algebre',
        name: 'Algèbre de Boole',
        icon: '🔢',
        color: 'purple',
        description: 'Tables de vérité, opérateurs logiques, Karnaugh'
      },
      {
        id: 'algo',
        name: 'Algorithmique',
        icon: '🧩',
        color: 'blue',
        description: 'Conditions, boucles, tableaux, conception'
      },
      {
        id: 'java',
        name: 'Java',
        icon: '☕',
        color: 'orange',
        description: 'Syntaxe, structures, programmation orientée objet'
      },
      {
        id: 'consolidation',
        name: 'Consolidation',
        icon: '🎯',
        color: 'green',
        description: 'Révision, projet final, auto-évaluation'
      }
    ];

    // Construction des cartes avec les données réelles
    this.phaseCards = phasesMetadata.map(meta => {
      const phaseDays = this.days.filter(d => d.phase === meta.id);
      const completedDays = phaseDays.filter(d => d.completed).length;
      const progress = phaseDays.length > 0
        ? Math.round((completedDays / phaseDays.length) * 100)
        : 0;

      return {
        ...meta,
        days: phaseDays,
        progress
      };
    });
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  /**
   * NAVIGUER VERS UN JOUR SPÉCIFIQUE
   * --------------------------------
   *
   * @param day - Le jour vers lequel naviguer
   */
  navigateToDay(day: Day): void {
    console.log(`🚀 Navigation vers ${day.title}`);
    this.router.navigate(['/planning', day.id]);
  }

  /**
   * CONTINUER LE JOUR ACTUEL
   * -----------------------
   *
   * Raccourci pour reprendre là où on s'est arrêté.
   */
  continueCurrentDay(): void {
    if (this.currentDay) {
      this.navigateToDay(this.currentDay);
    }
  }

  /**
   * SÉLECTIONNER UN JOUR POUR APERÇU
   * --------------------------------
   *
   * Affiche les détails d'un jour sans naviguer.
   *
   * @param day - Le jour à prévisualiser
   */
  selectDay(day: Day): void {
    this.selectedDay = this.selectedDay?.id === day.id ? null : day;
  }

  /**
   * FERMER L'APERÇU
   * ---------------
   */
  closePreview(): void {
    this.selectedDay = null;
  }

  // ============================================================
  // MÉTHODES D'AFFICHAGE
  // ============================================================

  /**
   * OBTENIR LE NUMÉRO D'UN JOUR
   * --------------------------
   *
   * Extrait le numéro du jour depuis son ID.
   * "day-3" → 3
   *
   * @param day - Le jour
   * @returns Le numéro (1-12)
   */
  getDayNumber(day: Day): number {
    // Le format est "day-X", on extrait X
    const match = day.id.match(/day-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * VÉRIFIER SI UN JOUR EST LE JOUR ACTUEL
   * -------------------------------------
   *
   * @param day - Le jour à vérifier
   * @returns true si c'est le jour actuel
   */
  isCurrentDay(day: Day): boolean {
    return this.currentDay?.id === day.id;
  }

  /**
   * VÉRIFIER SI UN JOUR EST ACCESSIBLE
   * ----------------------------------
   *
   * Un jour est accessible si :
   * 1. C'est le jour actuel, OU
   * 2. Les jours précédents sont terminés
   *
   * Ceci empêche de "sauter" des jours.
   *
   * @param day - Le jour à vérifier
   * @returns true si le jour est accessible
   */
  isDayAccessible(day: Day): boolean {
    const dayNumber = this.getDayNumber(day);

    // Le jour 1 est toujours accessible
    if (dayNumber === 1) return true;

    // Un jour terminé est toujours accessible (pour relecture)
    if (day.completed) return true;

    // Sinon, vérifie que le jour précédent est terminé
    const previousDay = this.days.find(d =>
      this.getDayNumber(d) === dayNumber - 1
    );

    return previousDay?.completed === true;
  }

  /**
   * FORMATER LA DATE D'UN JOUR
   * -------------------------
   *
   * Convertit une date en format lisible.
   *
   * @param date - La date à formater
   * @returns "25 décembre" par exemple
   */
  formatDate(date: Date): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long'
    };
    return d.toLocaleDateString('fr-FR', options);
  }

  /**
   * FORMATER LA DURÉE TOTALE D'UN JOUR
   * ----------------------------------
   *
   * Calcule la durée totale de toutes les sessions d'un jour.
   *
   * @param day - Le jour
   * @returns "4h30" par exemple
   */
  formatDayDuration(day: Day): string {
    const totalMinutes = day.sessions.reduce(
      (sum, session) => sum + session.duration, 0
    );
    return this.formatMinutes(totalMinutes);
  }

  /**
   * FORMATER DES MINUTES EN HEURES
   * -----------------------------
   *
   * @param minutes - Nombre de minutes
   * @returns "2h30" par exemple
   */
  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  }

  /**
   * OBTENIR L'ICÔNE DE PÉRIODE
   * -------------------------
   *
   * @param period - 'matin' | 'apres-midi' | 'soir'
   * @returns Emoji correspondant
   */
  getPeriodIcon(period: string): string {
    switch (period) {
      case 'matin': return '🌅';
      case 'apres-midi': return '☀️';
      case 'soir': return '🌙';
      default: return '📅';
    }
  }

  /**
   * OBTENIR LE LABEL DE PÉRIODE
   * --------------------------
   *
   * @param period - 'matin' | 'apres-midi' | 'soir'
   * @returns Label en français
   */
  getPeriodLabel(period: string): string {
    switch (period) {
      case 'matin': return 'Matin';
      case 'apres-midi': return 'Après-midi';
      case 'soir': return 'Soir';
      default: return period;
    }
  }

  /**
   * OBTENIR LA PROGRESSION D'UN JOUR
   * --------------------------------
   *
   * Calcule le pourcentage de sessions terminées.
   *
   * @param day - Le jour
   * @returns Pourcentage (0-100)
   */
  getDayProgress(day: Day): number {
    if (day.sessions.length === 0) return 0;

    const completedSessions = day.sessions.filter(s => s.completed).length;
    return Math.round((completedSessions / day.sessions.length) * 100);
  }

  /**
   * OBTENIR LE STATUT D'UN JOUR
   * --------------------------
   *
   * @param day - Le jour
   * @returns 'completed' | 'current' | 'locked' | 'available'
   */
  getDayStatus(day: Day): string {
    if (day.completed) return 'completed';
    if (this.isCurrentDay(day)) return 'current';
    if (!this.isDayAccessible(day)) return 'locked';
    return 'available';
  }

  /**
   * GÉNÉRER LES INDICATEURS DE PROGRESSION
   * -------------------------------------
   *
   * Crée un tableau de 12 éléments pour la barre de progression.
   *
   * @returns Tableau avec le statut de chaque jour
   */
  getProgressIndicators(): { dayNumber: number; status: string }[] {
    return this.days.map((day, index) => ({
      dayNumber: index + 1,
      status: this.getDayStatus(day)
    }));
  }

  /**
   * CALCULER LES XP TOTAUX GAGNÉS
   * ----------------------------
   *
   * @returns Total des XP de tous les jours
   */
  getTotalXpEarned(): number {
    return this.days.reduce((sum, day) => sum + day.xpEarned, 0);
  }

  /**
   * OBTENIR LE TEMPS TOTAL ESTIMÉ RESTANT
   * ------------------------------------
   *
   * Calcule le temps restant pour terminer le programme.
   *
   * @returns Temps en minutes
   */
  getRemainingTime(): number {
    return this.days
      .filter(day => !day.completed)
      .reduce((sum, day) =>
        sum + day.sessions.reduce((s, session) => s + session.duration, 0), 0
      );
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI une interface PhaseCard ?
 *
 *    Le service fournit des "Day[]" bruts.
 *    Mais pour l'affichage, on a besoin de :
 *    - Regrouper par phase
 *    - Ajouter des métadonnées (icône, couleur, description)
 *    - Calculer la progression par phase
 *
 *    PhaseCard est un "View Model" : un modèle adapté à la VUE.
 *    C'est le pattern MVVM (Model-View-ViewModel).
 *
 * 2. POURQUOI vérifier isDayAccessible() ?
 *
 *    C'est de la "progressive disclosure" (révélation progressive).
 *
 *    Imagine un jeu vidéo :
 *    - Tu ne peux pas aller au niveau 5 sans finir le niveau 4
 *    - Ça évite de se perdre
 *    - Ça donne un sentiment de progression
 *
 *    Pareil pour l'apprentissage !
 *    Finir le Jour 1 "débloque" le Jour 2.
 *
 * 3. POURQUOI autant de méthodes de formatage ?
 *
 *    Séparation des responsabilités (SRP - Single Responsibility Principle).
 *
 *    Chaque méthode fait UNE chose :
 *    - formatDate() → formate une date
 *    - formatMinutes() → formate des minutes
 *    - getPeriodIcon() → retourne une icône
 *
 *    Avantages :
 *    - Facile à tester
 *    - Facile à réutiliser
 *    - Facile à modifier
 *
 * 4. POURQUOI utiliser buildPhaseCards() ?
 *
 *    On transforme les données pour l'affichage une seule fois.
 *
 *    Alternative mauvaise :
 *    ```html
 *    <div *ngFor="let day of days.filter(d => d.phase === 'algo')">
 *    ```
 *    ↑ Ce filter() s'exécuterait à CHAQUE cycle de détection de changement !
 *
 *    Alternative bonne :
 *    ```typescript
 *    this.phaseCards = this.buildPhaseCards();
 *    ```
 *    ↑ Le calcul est fait UNE fois, puis on utilise le résultat.
 *
 *    C'est une optimisation de performance importante.
 *
 * Citation de Edsger Dijkstra :
 * "Simplicity is prerequisite for reliability."
 *
 * Ce composant est conçu pour être simple à comprendre
 * et fiable dans son fonctionnement.
 */
