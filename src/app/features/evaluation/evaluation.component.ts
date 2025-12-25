/**
 * evaluation.component.ts
 *
 * Composant AUTO-ÉVALUATION - Bilan de compréhension par chapitre.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page où tu peux t'auto-évaluer après chaque chapitre :
 * - Note sur 10 pour ta compréhension
 * - Ce que tu maîtrises bien ✅
 * - Ce qui reste à revoir ⚠️
 * - Questions pour le formateur 💬
 *
 * Pourquoi l'auto-évaluation est importante ?
 * ------------------------------------------
 * Métacognition : "Penser à sa propre pensée"
 *
 * Savoir ce qu'on sait ET ce qu'on ne sait pas
 * est CRUCIAL pour un apprentissage efficace.
 *
 * Sans auto-évaluation :
 * - Tu penses maîtriser un sujet → Surprise à l'examen
 * - Tu ne sais pas quoi réviser en priorité
 *
 * Avec auto-évaluation :
 * - Tu identifies tes lacunes tôt
 * - Tu concentres tes efforts au bon endroit
 * - Tu arrives préparé à l'examen
 *
 * Structure d'une évaluation :
 * ---------------------------
 * 1. Chapitre/Sujet évalué
 * 2. Note globale (1-10)
 * 3. Points maîtrisés (liste)
 * 4. Points à revoir (liste)
 * 5. Questions à poser au formateur
 * 6. Date de l'évaluation
 *
 * Philosophie David J. Malan :
 * "The most successful students are those who know what they don't know."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { StorageService } from '../../core/services/storage.service';
import { ProgressService } from '../../core/services/progress.service';

/**
 * Interface pour une auto-évaluation
 */
interface Evaluation {
  id: string;
  chapterId: string;
  chapterName: string;
  category: 'algebre' | 'algo' | 'java';
  score: number;              // Note sur 10
  mastered: string[];         // Points maîtrisés
  toReview: string[];         // Points à revoir
  questionsForTeacher: string[]; // Questions pour le formateur
  notes: string;              // Notes personnelles
  evaluatedAt: Date;
  updatedAt?: Date;
}

/**
 * Interface pour un chapitre à évaluer
 */
interface Chapter {
  id: string;
  name: string;
  category: 'algebre' | 'algo' | 'java';
  topics: string[];           // Sujets du chapitre
  hasEvaluation: boolean;     // Déjà évalué ?
  lastScore?: number;
}

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  private destroy$ = new Subject<void>();

  /**
   * Chapitres disponibles pour évaluation
   */
  chapters: Chapter[] = [];

  /**
   * Évaluations existantes
   */
  evaluations: Evaluation[] = [];

  /**
   * Mode édition actif
   */
  isEditMode: boolean = false;

  /**
   * Chapitre en cours d'évaluation
   */
  currentChapter: Chapter | null = null;

  /**
   * Évaluation en cours d'édition
   */
  currentEvaluation: Evaluation | null = null;

  /**
   * Formulaire d'évaluation
   */
  evaluationForm = {
    score: 5,
    mastered: [] as string[],
    toReview: [] as string[],
    questionsForTeacher: [''],
    notes: ''
  };

  /**
   * Nouvel item à ajouter (pour les listes)
   */
  newMasteredItem: string = '';
  newToReviewItem: string = '';

  /**
   * Onglet actif
   */
  activeTab: 'all' | 'algebre' | 'algo' | 'java' = 'all';

  /**
   * Statistiques
   */
  stats = {
    averageScore: 0,
    totalEvaluations: 0,
    chaptersToReview: 0
  };

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private storageService: StorageService,
    private progressService: ProgressService
  ) {}

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  ngOnInit(): void {
    this.loadChapters();
    this.loadEvaluations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * Charge les chapitres disponibles
   */
  private loadChapters(): void {
    this.chapters = [
      // Algèbre de Boole
      {
        id: 'alg-01',
        name: 'Tables de vérité',
        category: 'algebre',
        topics: ['ET, OU, NON', 'Tables de vérité complètes', 'Expressions booléennes'],
        hasEvaluation: false
      },
      {
        id: 'alg-02',
        name: 'Simplification & Karnaugh',
        category: 'algebre',
        topics: ['Théorèmes de De Morgan', 'Tableaux de Karnaugh', 'Simplification'],
        hasEvaluation: false
      },

      // Algorithmique
      {
        id: 'algo-01',
        name: 'Introduction aux algorithmes',
        category: 'algo',
        topics: ['Définition', 'Pseudo-code', 'Organigrammes', 'Variables'],
        hasEvaluation: false
      },
      {
        id: 'algo-02',
        name: 'Structures conditionnelles',
        category: 'algo',
        topics: ['Si...Alors...Sinon', 'Conditions imbriquées', 'Selon...Cas'],
        hasEvaluation: false
      },
      {
        id: 'algo-03',
        name: 'Boucles',
        category: 'algo',
        topics: ['Pour', 'Tant que', 'Répéter...Jusqu\'à', 'Boucles imbriquées'],
        hasEvaluation: false
      },
      {
        id: 'algo-04',
        name: 'Tableaux',
        category: 'algo',
        topics: ['Déclaration', 'Parcours', 'Recherche', 'Tri simple'],
        hasEvaluation: false
      },

      // Java
      {
        id: 'java-01',
        name: 'Bases de Java',
        category: 'java',
        topics: ['JDK, JRE, JVM', 'Compilation', 'Hello World', 'main()'],
        hasEvaluation: false
      },
      {
        id: 'java-02',
        name: 'Syntaxe Java',
        category: 'java',
        topics: ['Variables et types', 'Opérateurs', 'Conversion de types'],
        hasEvaluation: false
      },
      {
        id: 'java-03',
        name: 'Structures de contrôle Java',
        category: 'java',
        topics: ['if/else', 'switch', 'for', 'while', 'do-while'],
        hasEvaluation: false
      },
      {
        id: 'java-04',
        name: 'Tableaux Java',
        category: 'java',
        topics: ['Déclaration', 'Initialisation', 'Parcours', 'Arrays class'],
        hasEvaluation: false
      }
    ];
  }

  /**
   * Charge les évaluations sauvegardées
   */
  private async loadEvaluations(): Promise<void> {
    try {
      const saved = await firstValueFrom(this.storageService.get<Evaluation[]>('evaluations'));
      if (saved) {
        this.evaluations = saved;

        // Met à jour les chapitres avec les évaluations existantes
        this.evaluations.forEach(ev => {
          const chapter = this.chapters.find(c => c.id === ev.chapterId);
          if (chapter) {
            chapter.hasEvaluation = true;
            chapter.lastScore = ev.score;
          }
        });

        this.calculateStats();
      }
    } catch (error) {
      console.error('Erreur chargement évaluations:', error);
    }
  }

  /**
   * Calcule les statistiques
   */
  private calculateStats(): void {
    if (this.evaluations.length === 0) {
      this.stats = { averageScore: 0, totalEvaluations: 0, chaptersToReview: 0 };
      return;
    }

    const total = this.evaluations.reduce((sum, ev) => sum + ev.score, 0);
    this.stats = {
      averageScore: Math.round((total / this.evaluations.length) * 10) / 10,
      totalEvaluations: this.evaluations.length,
      chaptersToReview: this.evaluations.filter(ev => ev.score < 6).length
    };
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Commence une nouvelle évaluation
   */
  startEvaluation(chapter: Chapter): void {
    this.currentChapter = chapter;
    this.isEditMode = true;

    // Vérifie si une évaluation existe déjà
    const existing = this.evaluations.find(e => e.chapterId === chapter.id);

    if (existing) {
      // Charge l'évaluation existante
      this.evaluationForm = {
        score: existing.score,
        mastered: [...existing.mastered],
        toReview: [...existing.toReview],
        questionsForTeacher: [...existing.questionsForTeacher],
        notes: existing.notes
      };
      this.currentEvaluation = existing;
    } else {
      // Nouvelle évaluation avec les topics comme suggestions
      this.evaluationForm = {
        score: 5,
        mastered: [],
        toReview: [],
        questionsForTeacher: [''],
        notes: ''
      };
      this.currentEvaluation = null;
    }
  }

  /**
   * Sauvegarde l'évaluation
   */
  async saveEvaluation(): Promise<void> {
    if (!this.currentChapter) return;

    const evaluation: Evaluation = {
      id: this.currentEvaluation?.id || `eval-${Date.now()}`,
      chapterId: this.currentChapter.id,
      chapterName: this.currentChapter.name,
      category: this.currentChapter.category,
      score: this.evaluationForm.score,
      mastered: this.evaluationForm.mastered.filter(m => m.trim()),
      toReview: this.evaluationForm.toReview.filter(r => r.trim()),
      questionsForTeacher: this.evaluationForm.questionsForTeacher.filter(q => q.trim()),
      notes: this.evaluationForm.notes,
      evaluatedAt: this.currentEvaluation?.evaluatedAt || new Date(),
      updatedAt: new Date()
    };

    // Met à jour ou ajoute l'évaluation
    const index = this.evaluations.findIndex(e => e.id === evaluation.id);
    if (index >= 0) {
      this.evaluations[index] = evaluation;
    } else {
      this.evaluations.push(evaluation);
    }

    // Sauvegarde
    await this.storageService.set('evaluations', this.evaluations);

    // Met à jour le chapitre
    const chapter = this.chapters.find(c => c.id === evaluation.chapterId);
    if (chapter) {
      chapter.hasEvaluation = true;
      chapter.lastScore = evaluation.score;
    }

    // Ajoute des XP
    this.progressService.addXP(30, 'Évaluation complétée');

    this.calculateStats();
    this.cancelEdit();
  }

  /**
   * Annule l'édition
   */
  cancelEdit(): void {
    this.isEditMode = false;
    this.currentChapter = null;
    this.currentEvaluation = null;
  }

  /**
   * Change l'onglet
   */
  setActiveTab(tab: 'all' | 'algebre' | 'algo' | 'java'): void {
    this.activeTab = tab;
  }

  // ============================================================
  // GESTION DES LISTES
  // ============================================================

  /**
   * Ajoute un item "maîtrisé"
   */
  addMasteredItem(): void {
    if (this.newMasteredItem.trim()) {
      this.evaluationForm.mastered.push(this.newMasteredItem.trim());
      this.newMasteredItem = '';
    }
  }

  /**
   * Supprime un item "maîtrisé"
   */
  removeMasteredItem(index: number): void {
    this.evaluationForm.mastered.splice(index, 1);
  }

  /**
   * Ajoute un item "à revoir"
   */
  addToReviewItem(): void {
    if (this.newToReviewItem.trim()) {
      this.evaluationForm.toReview.push(this.newToReviewItem.trim());
      this.newToReviewItem = '';
    }
  }

  /**
   * Supprime un item "à revoir"
   */
  removeToReviewItem(index: number): void {
    this.evaluationForm.toReview.splice(index, 1);
  }

  /**
   * Ajoute un champ question
   */
  addQuestionField(): void {
    this.evaluationForm.questionsForTeacher.push('');
  }

  /**
   * Supprime un champ question
   */
  removeQuestionField(index: number): void {
    if (this.evaluationForm.questionsForTeacher.length > 1) {
      this.evaluationForm.questionsForTeacher.splice(index, 1);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Filtre les chapitres par catégorie
   */
  getFilteredChapters(): Chapter[] {
    if (this.activeTab === 'all') {
      return this.chapters;
    }
    return this.chapters.filter(c => c.category === this.activeTab);
  }

  /**
   * Retourne la couleur de la catégorie
   */
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'algebre': '#3b82f6',
      'algo': '#8b5cf6',
      'java': '#10b981'
    };
    return colors[category] || '#64748b';
  }

  /**
   * Retourne l'icône de la catégorie
   */
  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'algebre': '🔵',
      'algo': '🟣',
      'java': '🟢'
    };
    return icons[category] || '📚';
  }

  /**
   * Retourne la classe CSS pour la note
   */
  getScoreClass(score: number): string {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'average';
    return 'needs-work';
  }

  /**
   * Track by pour ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI l'auto-évaluation ?
 *
 *    MÉTACOGNITION :
 *    C'est la capacité à réfléchir sur sa propre pensée.
 *
 *    Les meilleurs étudiants savent :
 *    - Ce qu'ils maîtrisent (confiance)
 *    - Ce qu'ils ne maîtrisent pas (humilité)
 *    - Comment ils apprennent le mieux (stratégie)
 *
 * 2. POURQUOI une note sur 10 ?
 *
 *    Échelle intuitive :
 *    - 1-3 : "Je ne comprends pas du tout"
 *    - 4-5 : "Je comprends les bases mais j'hésite"
 *    - 6-7 : "Je maîtrise avec quelques hésitations"
 *    - 8-9 : "Je maîtrise bien"
 *    - 10 : "Je pourrais l'expliquer à quelqu'un"
 *
 * 3. POURQUOI "Points maîtrisés" ET "Points à revoir" ?
 *
 *    Double perspective :
 *    - Positif : Ce que tu sais faire → Confiance
 *    - À améliorer : Ce qui reste → Direction
 *
 *    Les deux sont essentiels pour progresser.
 *
 * 4. POURQUOI "Questions pour le formateur" ?
 *
 *    PROACTIVITÉ :
 *    Les meilleures questions viennent PENDANT l'apprentissage,
 *    pas juste avant l'examen.
 *
 *    Cette section encourage à noter les questions
 *    AU MOMENT où elles surgissent.
 *
 * 5. POURQUOI sauvegarder les évaluations ?
 *
 *    HISTORIQUE :
 *    - Voir son évolution au fil du temps
 *    - Identifier les patterns (sujets difficiles)
 *    - Se rappeler de ce qu'on a travaillé
 *
 * Citation de Socrate :
 * "Je sais que je ne sais rien."
 *
 * L'auto-évaluation, c'est apprendre à SAVOIR ce qu'on ne sait pas.
 */
