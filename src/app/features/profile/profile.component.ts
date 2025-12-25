/**
 * profile.component.ts
 *
 * Composant PROFIL - Page de profil utilisateur.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page qui affiche toutes les informations
 * sur la progression de l'utilisateur :
 * - Niveau et XP
 * - Badges débloqués
 * - Statistiques détaillées
 * - Historique d'activité
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine ton profil LinkedIn ou ton CV.
 * Il résume tes accomplissements et compétences.
 * Ce profil fait pareil, mais pour ton apprentissage !
 *
 * Pourquoi un profil dans une app d'apprentissage ?
 * ------------------------------------------------
 * 1. Motivation : Voir sa progression motive à continuer
 * 2. Gamification : Les badges créent un sentiment d'accomplissement
 * 3. Réflexion : Visualiser son parcours aide à prendre du recul
 *
 * Philosophie David J. Malan :
 * "Learning is a journey. Track your progress to see how far you've come."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProgressService } from '../../core/services/progress.service';
import { GamificationService } from '../../core/services/gamification.service';
import { Badge } from '../../core/models/badge.model';

/**
 * Interface pour les statistiques affichées
 * ----------------------------------------
 * Regroupe les données de progression pour l'affichage.
 */
interface ProfileStats {
  totalExercises: number;
  completedExercises: number;
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
}

/**
 * Interface pour l'historique d'activité
 */
interface ActivityItem {
  date: Date;
  type: 'exercise' | 'badge' | 'level' | 'streak';
  description: string;
  xpGained?: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS RÉACTIVES
  // ============================================================

  /**
   * Subject pour le nettoyage des subscriptions
   * ------------------------------------------
   * Pattern "takeUntil" pour éviter les fuites mémoire.
   *
   * POURQUOI ?
   * Quand on s'abonne à un Observable, la subscription reste active
   * même si le composant est détruit. Ça peut causer :
   * - Fuites mémoire
   * - Comportements inattendus
   * - Erreurs "component destroyed"
   *
   * destroy$ est un "signal d'arrêt" qu'on envoie dans ngOnDestroy.
   */
  private destroy$ = new Subject<void>();

  /**
   * Niveau actuel de l'utilisateur
   */
  level: number = 1;

  /**
   * XP actuels
   */
  currentXP: number = 0;

  /**
   * XP nécessaires pour le prochain niveau
   */
  xpForNextLevel: number = 100;

  /**
   * Pourcentage de progression vers le prochain niveau
   */
  levelProgress: number = 0;

  /**
   * Streak actuel (jours consécutifs)
   */
  streak: number = 0;

  /**
   * Liste des badges (débloqués et verrouillés)
   */
  badges: Badge[] = [];

  /**
   * Nombre de badges débloqués
   */
  unlockedBadgesCount: number = 0;

  /**
   * Statistiques globales
   */
  stats: ProfileStats = {
    totalExercises: 100,
    completedExercises: 0,
    totalHours: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageScore: 0
  };

  /**
   * Historique d'activité récent
   */
  recentActivity: ActivityItem[] = [];

  /**
   * Titre du niveau (ex: "Apprenti", "Développeur")
   */
  levelTitle: string = 'Débutant';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  /**
   * Injection des services nécessaires
   * ---------------------------------
   * - ProgressService : Pour les XP, niveau, streak
   * - GamificationService : Pour les badges et quêtes
   */
  constructor(
    private progressService: ProgressService,
    private gamificationService: GamificationService
  ) {}

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  /**
   * ngOnInit - Initialisation du composant
   * -------------------------------------
   * S'abonne aux données de progression et charge les badges.
   */
  ngOnInit(): void {
    this.subscribeToProgress();
    this.loadBadges();
    this.loadStats();
    this.loadRecentActivity();
  }

  /**
   * ngOnDestroy - Nettoyage
   * ----------------------
   * Envoie le signal d'arrêt pour nettoyer les subscriptions.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // MÉTHODES PRIVÉES
  // ============================================================

  /**
   * S'abonne aux données de progression
   * -----------------------------------
   * Utilise le pattern takeUntil pour le nettoyage automatique.
   */
  private subscribeToProgress(): void {
    // S'abonne au niveau
    this.progressService.level$
      .pipe(takeUntil(this.destroy$))
      .subscribe(level => {
        this.level = level;
        this.updateLevelTitle();
      });

    // S'abonne aux XP
    this.progressService.xp$
      .pipe(takeUntil(this.destroy$))
      .subscribe(xp => {
        this.currentXP = xp;
        this.calculateLevelProgress();
      });

    // S'abonne au streak
    this.progressService.streak$
      .pipe(takeUntil(this.destroy$))
      .subscribe(streak => {
        this.streak = streak;
        this.stats.currentStreak = streak;
      });
  }

  /**
   * Charge les badges depuis le service
   */
  private loadBadges(): void {
    this.gamificationService.badges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(badges => {
        this.badges = badges;
        this.unlockedBadgesCount = badges.filter(b => b.unlocked).length;
      });
  }

  /**
   * Charge les statistiques
   */
  private loadStats(): void {
    // TODO: Récupérer depuis le service de progression
    this.stats = {
      totalExercises: 100,
      completedExercises: 15,
      totalHours: 8.5,
      currentStreak: this.streak,
      longestStreak: 5,
      averageScore: 7.5
    };
  }

  /**
   * Charge l'historique d'activité récent
   */
  private loadRecentActivity(): void {
    // TODO: Récupérer depuis le service
    this.recentActivity = [
      {
        date: new Date(),
        type: 'exercise',
        description: 'Exercice "Tables de vérité" terminé',
        xpGained: 50
      },
      {
        date: new Date(Date.now() - 86400000),
        type: 'badge',
        description: 'Badge "Premier pas" débloqué',
        xpGained: 100
      },
      {
        date: new Date(Date.now() - 172800000),
        type: 'level',
        description: 'Niveau 2 atteint !',
        xpGained: 0
      }
    ];
  }

  /**
   * Met à jour le titre du niveau
   * ----------------------------
   * Chaque niveau a un titre qui donne un sentiment de progression.
   */
  private updateLevelTitle(): void {
    const titles: Record<number, string> = {
      1: 'Débutant',
      2: 'Apprenti',
      3: 'Initié',
      4: 'Praticien',
      5: 'Confirmé',
      6: 'Expert',
      7: 'Maître',
      8: 'Grand Maître',
      9: 'Légende',
      10: 'Transcendant'
    };

    this.levelTitle = titles[this.level] || 'Transcendant';
  }

  /**
   * Calcule le pourcentage de progression vers le prochain niveau
   */
  private calculateLevelProgress(): void {
    // Formule : XP nécessaires = niveau * 100
    const xpForCurrentLevel = (this.level - 1) * 100;
    this.xpForNextLevel = this.level * 100;

    const xpInCurrentLevel = this.currentXP - xpForCurrentLevel;
    const xpNeeded = this.xpForNextLevel - xpForCurrentLevel;

    this.levelProgress = Math.min(100, (xpInCurrentLevel / xpNeeded) * 100);
  }

  // ============================================================
  // MÉTHODES PUBLIQUES (pour le template)
  // ============================================================

  /**
   * Retourne l'icône appropriée pour un type d'activité
   */
  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'exercise': '✏️',
      'badge': '🏆',
      'level': '⬆️',
      'streak': '🔥'
    };
    return icons[type] || '📌';
  }

  /**
   * Formate une date relative (il y a X jours)
   */
  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  }

  /**
   * Calcule le pourcentage de complétion des exercices
   */
  getCompletionPercentage(): number {
    if (this.stats.totalExercises === 0) return 0;
    return Math.round((this.stats.completedExercises / this.stats.totalExercises) * 100);
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI afficher le niveau et les XP ?
 *
 *    C'est de la GAMIFICATION.
 *
 *    Psychologie : Le cerveau humain adore :
 *    - Les barres de progression (sentiment d'accomplissement)
 *    - Les niveaux (objectifs clairs)
 *    - Les récompenses (badges)
 *
 *    Sans gamification :
 *    "J'ai fait 15 exercices" → Bof, et alors ?
 *
 *    Avec gamification :
 *    "Je suis niveau 3 avec 350 XP !" → Plus motivant !
 *
 * 2. POURQUOI des titres de niveau ?
 *
 *    "Niveau 5" est abstrait.
 *    "Expert" est concret et valorisant.
 *
 *    Les titres créent une IDENTITÉ.
 *    Tu n'es plus "un étudiant de niveau 5",
 *    tu es "un Expert en algorithmique".
 *
 * 3. POURQUOI l'historique d'activité ?
 *
 *    C'est le "journal de bord" de l'apprentissage.
 *
 *    Avantages :
 *    - Voir d'où on vient (motivation)
 *    - Identifier les patterns (quand travaille-t-on le mieux ?)
 *    - Célébrer les victoires passées
 *
 * 4. POURQUOI le pattern takeUntil ?
 *
 *    PROBLÈME CLASSIQUE :
 *    Tu t'abonnes à un Observable dans ngOnInit.
 *    Tu navigues vers une autre page.
 *    Le composant est détruit... mais la subscription reste active !
 *
 *    CONSÉQUENCES :
 *    - Fuite mémoire (l'observable continue d'émettre)
 *    - Erreurs (mise à jour d'un composant détruit)
 *    - Comportements bizarres
 *
 *    SOLUTION : takeUntil(destroy$)
 *    Quand destroy$ émet (dans ngOnDestroy),
 *    toutes les subscriptions s'arrêtent automatiquement.
 *
 * Citation de Simon Sinek :
 * "Progress is more important than perfection."
 *
 * Ce profil montre le PROGRÈS, pas la perfection.
 */
