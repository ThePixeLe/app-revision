/**
 * quests.component.ts
 *
 * Composant QUÊTES - Système de missions/objectifs.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page qui affiche toutes les quêtes (missions) disponibles :
 * - Quêtes quotidiennes : À refaire chaque jour (ex: "Fais 3 exercices")
 * - Quêtes hebdomadaires : Sur 7 jours (ex: "Complète 20 exercices")
 * - Quêtes principales : Liées au programme (ex: "Maîtrise les boucles")
 * - Quêtes bonus : Défis optionnels (ex: "Maintiens un streak de 7 jours")
 *
 * Analogie du monde réel :
 * -----------------------
 * Pense à un jeu RPG comme Skyrim ou World of Warcraft :
 * - Tu as un journal de quêtes
 * - Certaines sont obligatoires (histoire principale)
 * - D'autres sont optionnelles (exploration)
 * - Chaque quête donne des récompenses
 *
 * C'est la même chose ici, mais pour l'apprentissage !
 *
 * Pourquoi les quêtes sont efficaces ?
 * -----------------------------------
 * Psychologie de la gamification :
 * 1. Objectifs clairs → Tu sais exactement quoi faire
 * 2. Récompenses visibles → Motivation pour continuer
 * 3. Progression mesurable → Satisfaction du progrès
 * 4. Variété → Évite l'ennui de la répétition
 *
 * Philosophie David J. Malan :
 * "Gamification isn't about making learning a game.
 *  It's about making learning engaging."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GamificationService } from '../../core/services/gamification.service';
import { Quest, QuestType, QuestStatus } from '../../core/models/quest.model';

/**
 * Interface pour le filtrage des quêtes
 */
interface QuestFilter {
  type: QuestType | 'all';
  status: QuestStatus | 'all';
}

@Component({
  selector: 'app-quests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quests.component.html',
  styleUrls: ['./quests.component.scss']
})
export class QuestsComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /**
   * Subject pour le nettoyage des subscriptions
   */
  private destroy$ = new Subject<void>();

  /**
   * Toutes les quêtes
   */
  allQuests: Quest[] = [];

  /**
   * Quêtes filtrées (affichées)
   */
  filteredQuests: Quest[] = [];

  /**
   * Filtres actuels
   */
  currentFilter: QuestFilter = {
    type: 'all',
    status: 'all'
  };

  /**
   * Quête sélectionnée (pour le panneau de détails)
   */
  selectedQuest: Quest | null = null;

  /**
   * Statistiques des quêtes
   */
  stats = {
    totalQuests: 0,
    completedQuests: 0,
    availableQuests: 0,
    totalXPEarned: 0
  };

  /**
   * Onglet actif (daily, weekly, main, side)
   */
  activeTab: QuestType | 'all' = 'all';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private gamificationService: GamificationService) {}

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  ngOnInit(): void {
    this.loadQuests();
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
   * Charge les quêtes depuis le service
   */
  private loadQuests(): void {
    this.gamificationService.quests$
      .pipe(takeUntil(this.destroy$))
      .subscribe(quests => {
        this.allQuests = quests;
        this.applyFilters();
        this.calculateStats();
      });
  }

  /**
   * Calcule les statistiques
   */
  private calculateStats(): void {
    this.stats = {
      totalQuests: this.allQuests.length,
      completedQuests: this.allQuests.filter(q => q.status === 'completed').length,
      availableQuests: this.allQuests.filter(q => q.status === 'available' || q.status === 'in-progress').length,
      totalXPEarned: this.allQuests
        .filter(q => q.status === 'completed')
        .reduce((sum, q) => sum + q.rewards.xp, 0)
    };
  }

  // ============================================================
  // FILTRAGE
  // ============================================================

  /**
   * Change l'onglet actif (type de quête)
   */
  setActiveTab(tab: QuestType | 'all'): void {
    this.activeTab = tab;
    this.currentFilter.type = tab;
    this.applyFilters();
  }

  /**
   * Filtre par statut
   */
  filterByStatus(status: QuestStatus | 'all'): void {
    this.currentFilter.status = status;
    this.applyFilters();
  }

  /**
   * Applique les filtres actuels
   */
  private applyFilters(): void {
    this.filteredQuests = this.allQuests.filter(quest => {
      // Filtre par type
      if (this.currentFilter.type !== 'all' && quest.type !== this.currentFilter.type) {
        return false;
      }

      // Filtre par statut
      if (this.currentFilter.status !== 'all' && quest.status !== this.currentFilter.status) {
        return false;
      }

      return true;
    });

    // Tri : in-progress > available > completed > locked
    this.filteredQuests.sort((a, b) => {
      const statusOrder: Record<QuestStatus, number> = {
        'in-progress': 0,
        'available': 1,
        'completed': 2,
        'locked': 3
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Sélectionne une quête pour voir les détails
   */
  selectQuest(quest: Quest): void {
    this.selectedQuest = quest;
  }

  /**
   * Ferme le panneau de détails
   */
  closeDetails(): void {
    this.selectedQuest = null;
  }

  /**
   * Commence une quête
   */
  startQuest(quest: Quest): void {
    if (quest.status === 'available') {
      this.gamificationService.startQuest(quest.id);
    }
  }

  /**
   * Réclame la récompense d'une quête complétée
   */
  claimReward(quest: Quest): void {
    if (quest.status === 'completed') {
      this.gamificationService.claimQuestReward(quest.id);
    }
  }

  // ============================================================
  // HELPERS (pour le template)
  // ============================================================

  /**
   * Retourne l'icône pour un type de quête
   */
  getTypeIcon(type: QuestType): string {
    const icons: Record<QuestType, string> = {
      'daily': '📅',
      'weekly': '📆',
      'main': '⭐',
      'side': '🎁'
    };
    return icons[type];
  }

  /**
   * Retourne le label pour un type de quête
   */
  getTypeLabel(type: QuestType): string {
    const labels: Record<QuestType, string> = {
      'daily': 'Quotidienne',
      'weekly': 'Hebdomadaire',
      'main': 'Principale',
      'side': 'Bonus'
    };
    return labels[type];
  }

  /**
   * Retourne la couleur pour un type de quête
   */
  getTypeColor(type: QuestType): string {
    const colors: Record<QuestType, string> = {
      'daily': '#3b82f6',   // Bleu
      'weekly': '#8b5cf6',  // Violet
      'main': '#f59e0b',    // Orange
      'side': '#10b981'     // Vert
    };
    return colors[type];
  }

  /**
   * Retourne l'icône pour un statut
   */
  getStatusIcon(status: QuestStatus): string {
    const icons: Record<QuestStatus, string> = {
      'locked': '🔒',
      'available': '▶️',
      'in-progress': '⏳',
      'completed': '✅'
    };
    return icons[status];
  }

  /**
   * Calcule le pourcentage de progression d'une quête
   */
  getProgress(quest: Quest): number {
    if (quest.objective.target === 0) return 0;
    return Math.min(100, (quest.objective.current / quest.objective.target) * 100);
  }

  /**
   * Formate le texte de progression
   */
  getProgressText(quest: Quest): string {
    const unit = quest.objective.unit || '';
    return `${quest.objective.current}/${quest.objective.target} ${unit}`;
  }

  /**
   * Formate la date limite
   */
  formatDeadline(date: Date | undefined): string {
    if (!date) return 'Pas de limite';

    const now = new Date();
    const deadline = new Date(date);
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return 'Expirée';
    if (diffHours < 1) return 'Moins d\'une heure';
    if (diffHours < 24) return `${diffHours}h restantes`;
    if (diffDays === 1) return 'Demain';
    return `${diffDays} jours restants`;
  }

  /**
   * Génère les étoiles de difficulté
   */
  getDifficultyStars(difficulty: number): string {
    return '⭐'.repeat(Math.min(5, Math.max(1, difficulty)));
  }

  /**
   * Compte les quêtes par type
   */
  countByType(type: QuestType): number {
    return this.allQuests.filter(q => q.type === type && q.status !== 'locked').length;
  }

  /**
   * Vérifie si une quête peut être commencée
   */
  canStart(quest: Quest): boolean {
    return quest.status === 'available';
  }

  /**
   * Vérifie si la récompense peut être réclamée
   */
  canClaim(quest: Quest): boolean {
    return quest.status === 'completed' && !quest.completedAt;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI différents types de quêtes ?
 *
 *    Variété = Engagement :
 *
 *    - DAILY : Petits objectifs atteignables chaque jour
 *      → Crée une habitude, maintient le streak
 *
 *    - WEEKLY : Objectifs plus ambitieux sur 7 jours
 *      → Permet de s'organiser, récompense l'effort soutenu
 *
 *    - MAIN : Jalons du programme d'apprentissage
 *      → Structure le parcours, montre la progression globale
 *
 *    - SIDE : Défis bonus pour les plus motivés
 *      → Récompense l'exploration, évite l'ennui
 *
 * 2. POURQUOI les quêtes sont triées par statut ?
 *
 *    Priorisation visuelle :
 *    1. En cours (in-progress) → Ce sur quoi tu travailles
 *    2. Disponibles (available) → Ce que tu peux commencer
 *    3. Complétées (completed) → Tes accomplissements
 *    4. Verrouillées (locked) → Ce qui viendra plus tard
 *
 *    L'utilisateur voit d'abord ce qui est ACTIONNABLE.
 *
 * 3. POURQUOI un système de filtres ?
 *
 *    Flexibilité de la vue :
 *    - "Je veux voir mes quêtes quotidiennes"
 *    - "Montre-moi ce que j'ai complété"
 *    - "Quelles quêtes sont disponibles ?"
 *
 *    Chaque utilisateur a des besoins différents à différents moments.
 *
 * 4. POURQUOI afficher la difficulté en étoiles ?
 *
 *    Système universel :
 *    - 1 étoile = Facile (même un débutant peut le faire)
 *    - 3 étoiles = Moyen (demande un peu d'effort)
 *    - 5 étoiles = Très difficile (défi pour les experts)
 *
 *    Les étoiles sont comprises instantanément,
 *    contrairement à "Difficulté : 3.5/5".
 *
 * 5. POURQUOI le panneau de détails ?
 *
 *    Information à la demande :
 *    - La liste montre l'essentiel (titre, progression)
 *    - Le panneau montre les détails (description, récompenses)
 *
 *    C'est le pattern "Progressive Disclosure" :
 *    On ne surcharge pas l'utilisateur d'informations.
 *
 * Citation de Jesse Schell (The Art of Game Design) :
 * "Quests give players a reason to care about the game world."
 *
 * Les quêtes donnent aux étudiants une raison de s'investir
 * dans leur apprentissage.
 */
