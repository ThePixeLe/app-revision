/**
 * gamification.service.ts
 *
 * Service de gestion de la GAMIFICATION (quêtes et récompenses).
 *
 * Analogie du monde réel :
 * ----------------------
 * C'est comme un "maître de jeu" dans un RPG qui :
 * - Te donne des quêtes (missions à accomplir)
 * - Suit ta progression sur chaque quête
 * - Te récompense quand tu les termines
 * - Débloque de nouvelles quêtes
 *
 * Responsabilités :
 * ----------------
 * 1. Gérer toutes les quêtes (daily, weekly, main, side)
 * 2. Suivre la progression sur chaque quête
 * 3. Débloquer les quêtes selon les prérequis
 * 4. Attribuer les récompenses (XP, badges)
 * 5. Régénérer les quêtes quotidiennes/hebdomadaires
 *
 * Philosophie David J. Malan :
 * "Give students clear goals, and they'll achieve more."
 *
 * Les quêtes donnent des OBJECTIFS CLAIRS et MOTIVANTS !
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Import des modèles
import {
  Quest,
  QuestType,
  QuestStatus,
  PREDEFINED_QUESTS,
  calculateQuestProgress,
  isQuestCompleted,
  canUnlockQuest
} from '../models/quest.model';

// Import des services
import { StorageService, StorageKeys } from './storage.service';
import { ProgressService } from './progress.service';
import { ExerciseService } from './exercise.service';

/**
 * Service Injectable
 */
@Injectable({
  providedIn: 'root'
})
export class GamificationService {

  /**
   * BehaviorSubject pour toutes les quêtes
   * -------------------------------------
   */
  private questsSubject = new BehaviorSubject<Quest[]>([]);

  /**
   * Observable public des quêtes
   */
  public quests$: Observable<Quest[]> = this.questsSubject.asObservable();

  /**
   * BehaviorSubject pour les quêtes complétées récemment
   * --------------------------------------------------
   * Pour afficher des notifications "QUEST COMPLETED!"
   */
  private completedQuestsSubject = new BehaviorSubject<Quest[]>([]);

  /**
   * Observable public des quêtes complétées
   */
  public completedQuests$: Observable<Quest[]> = this.completedQuestsSubject.asObservable();

  /**
   * Constructeur
   */
  constructor(
    private storageService: StorageService,
    private progressService: ProgressService,
    private exerciseService: ExerciseService
  ) {
    // Chargement automatique des quêtes
    this.loadQuests();

    // Vérifie les quêtes toutes les 5 minutes
    setInterval(() => this.updateQuestProgress(), 5 * 60 * 1000);
  }

  // ============================================================
  // INITIALISATION ET CHARGEMENT
  // ============================================================

  /**
   * CHARGER LES QUÊTES
   * -----------------
   * Charge depuis le stockage ou crée les quêtes par défaut.
   */
  private loadQuests(): void {
    console.log('🎯 Chargement des quêtes...');

    this.storageService.get<Quest[]>(StorageKeys.QUESTS)
      .subscribe({
        next: (savedQuests) => {
          if (savedQuests && savedQuests.length > 0) {
            console.log('✅ Quêtes trouvées:', savedQuests.length);
            this.questsSubject.next(savedQuests);
            this.updateQuestProgress();
          } else {
            console.log('📝 Création des quêtes par défaut...');
            this.createDefaultQuests();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des quêtes:', error);
          this.createDefaultQuests();
        }
      });
  }

  /**
   * CRÉER LES QUÊTES PAR DÉFAUT
   * --------------------------
   * Génère toutes les quêtes du programme.
   */
  private createDefaultQuests(): void {
    const now = new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin de journée

    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(23, 59, 59, 999);

    // Initialise toutes les quêtes prédéfinies
    const quests: Quest[] = PREDEFINED_QUESTS.map(quest => ({
      ...quest,
      status: quest.status || 'available',
      objective: {
        ...quest.objective!,
        current: 0
      },
      // Définit les deadlines pour daily/weekly
      deadline: quest.type === 'daily' ? today :
                quest.type === 'weekly' ? nextSunday :
                undefined,
      createdAt: now,
      updatedAt: now
    } as Quest));

    this.questsSubject.next(quests);
    this.saveQuests(quests).subscribe({
      next: () => {
        console.log('✅ Quêtes créées et sauvegardées !');
        this.updateQuestProgress();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la sauvegarde des quêtes:', error);
      }
    });
  }

  /**
   * SAUVEGARDER LES QUÊTES
   */
  private saveQuests(quests: Quest[]): Observable<Quest[]> {
    return this.storageService.set(StorageKeys.QUESTS, quests);
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - LECTURE
  // ============================================================

  /**
   * OBTENIR TOUTES LES QUÊTES
   * ------------------------
   */
  getAllQuests(): Observable<Quest[]> {
    return this.quests$;
  }

  /**
   * OBTENIR UNE QUÊTE PAR SON ID
   * ---------------------------
   */
  getQuestById(questId: string): Observable<Quest | undefined> {
    return this.quests$.pipe(
      map(quests => quests.find(q => q.id === questId))
    );
  }

  /**
   * OBTENIR LES QUÊTES PAR TYPE
   * --------------------------
   * @param type - Type de quête (daily, weekly, main, side)
   */
  getQuestsByType(type: QuestType): Observable<Quest[]> {
    return this.quests$.pipe(
      map(quests => quests.filter(q => q.type === type))
    );
  }

  /**
   * OBTENIR LES QUÊTES PAR STATUT
   * ----------------------------
   */
  getQuestsByStatus(status: QuestStatus): Observable<Quest[]> {
    return this.quests$.pipe(
      map(quests => quests.filter(q => q.status === status))
    );
  }

  /**
   * OBTENIR LES QUÊTES ACTIVES
   * -------------------------
   * Quêtes disponibles et en cours.
   */
  getActiveQuests(): Observable<Quest[]> {
    return this.quests$.pipe(
      map(quests => quests.filter(
        q => q.status === 'available' || q.status === 'in-progress'
      ))
    );
  }

  /**
   * OBTENIR LES QUÊTES QUOTIDIENNES
   * ------------------------------
   */
  getDailyQuests(): Observable<Quest[]> {
    return this.getQuestsByType('daily');
  }

  /**
   * OBTENIR LES QUÊTES HEBDOMADAIRES
   * -------------------------------
   */
  getWeeklyQuests(): Observable<Quest[]> {
    return this.getQuestsByType('weekly');
  }

  /**
   * OBTENIR LES QUÊTES PRINCIPALES
   * -----------------------------
   */
  getMainQuests(): Observable<Quest[]> {
    return this.getQuestsByType('main');
  }

  /**
   * OBTENIR LES QUÊTES SECONDAIRES
   * -----------------------------
   */
  getSideQuests(): Observable<Quest[]> {
    return this.getQuestsByType('side');
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - PROGRESSION
  // ============================================================

  /**
   * METTRE À JOUR LA PROGRESSION DES QUÊTES
   * --------------------------------------
   * Recalcule la progression de toutes les quêtes actives
   * en fonction des stats actuelles.
   *
   * Cette méthode est appelée :
   * - Toutes les 5 minutes automatiquement
   * - Après avoir terminé un exercice
   * - Après avoir fait un Pomodoro
   * - Manuellement si besoin
   */
  updateQuestProgress(): void {
    const quests = this.questsSubject.value;

    // Combine toutes les stats nécessaires
    this.exerciseService.getStats().subscribe(exerciseStats => {
      this.progressService.progress$.subscribe(progress => {
        if (!progress) return;

        const updatedQuests = quests.map(quest => {
          // Skip les quêtes déjà complétées ou verrouillées
          if (quest.status === 'completed' || quest.status === 'locked') {
            return quest;
          }

          // Met à jour la progression selon le type d'objectif
          let newCurrent = quest.objective.current;

          switch (quest.objective.type) {
            case 'exercises':
              newCurrent = exerciseStats.completed;
              break;

            case 'pomodoros':
              newCurrent = progress.stats.pomodoroSessions;
              break;

            case 'streak':
              newCurrent = progress.streak;
              break;

            case 'score':
              newCurrent = exerciseStats.averageScore;
              break;

            case 'time':
              newCurrent = progress.stats.totalHours;
              break;

            case 'subject':
              if (quest.objective.subject) {
                const subjectProgress = progress.stats.bySubject[
                  quest.objective.subject as keyof typeof progress.stats.bySubject
                ];
                newCurrent = subjectProgress?.percentage || 0;
              }
              break;
          }

          // Vérifie si la quête est complétée
          const updatedQuest = {
            ...quest,
            objective: {
              ...quest.objective,
              current: newCurrent
            },
            updatedAt: new Date()
          };

          // Si la quête vient d'être complétée
          if (isQuestCompleted(updatedQuest) && quest.status !== 'completed') {
            return this.completeQuestInternal(updatedQuest);
          }

          // Si en progression, change le statut
          if (newCurrent > 0 && quest.status === 'available') {
            return {
              ...updatedQuest,
              status: 'in-progress' as QuestStatus,
              startedAt: new Date()
            };
          }

          return updatedQuest;
        });

        // Vérifie les quêtes à débloquer
        const finalQuests = this.checkQuestUnlocks(updatedQuests, progress.level);

        this.questsSubject.next(finalQuests);
        this.saveQuests(finalQuests).subscribe();
      });
    });
  }

  /**
   * COMPLÉTER UNE QUÊTE (interne)
   * ----------------------------
   * Appelé automatiquement quand une quête atteint son objectif.
   */
  private completeQuestInternal(quest: Quest): Quest {
    console.log(`🎉 Quête complétée : ${quest.title}`);

    // Ajoute l'XP de la quête
    this.progressService.addXP(quest.rewards.xp, `Quête: ${quest.title}`)
      .subscribe();

    // Débloque le badge associé (si applicable)
    if (quest.rewards.badge) {
      console.log(`🏆 Badge débloqué via quête : ${quest.rewards.badge}`);
      // Le badge sera débloqué par le ProgressService lors du prochain check
      this.progressService.checkBadgeUnlocks();
    }

    // Débloque la quête suivante (si applicable)
    if (quest.nextQuest) {
      this.unlockQuest(quest.nextQuest);
    }

    // Ajoute à la liste des quêtes récemment complétées
    const completed = this.completedQuestsSubject.value;
    this.completedQuestsSubject.next([...completed, quest]);

    // Retourne la quête mise à jour
    return {
      ...quest,
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * VÉRIFIER LES QUÊTES À DÉBLOQUER
   * ------------------------------
   * Vérifie les prérequis et débloque les quêtes disponibles.
   */
  private checkQuestUnlocks(quests: Quest[], userLevel: number): Quest[] {
    // Liste des quêtes déjà complétées
    const completedQuestIds = quests
      .filter(q => q.status === 'completed')
      .map(q => q.id);

    return quests.map(quest => {
      // Si déjà débloquée, skip
      if (quest.status !== 'locked') return quest;

      // Vérifie si peut être débloquée
      if (canUnlockQuest(quest, completedQuestIds, userLevel)) {
        console.log(`🔓 Quête débloquée : ${quest.title}`);
        return {
          ...quest,
          status: 'available',
          updatedAt: new Date()
        };
      }

      return quest;
    });
  }

  /**
   * DÉBLOQUER UNE QUÊTE MANUELLEMENT
   * -------------------------------
   * Utile pour débloquer la quête suivante dans une chaîne.
   */
  private unlockQuest(questId: string): void {
    const quests = this.questsSubject.value;

    const updatedQuests = quests.map(q => {
      if (q.id === questId && q.status === 'locked') {
        console.log(`🔓 Quête débloquée : ${q.title}`);
        return {
          ...q,
          status: 'available' as QuestStatus,
          updatedAt: new Date()
        };
      }
      return q;
    });

    this.questsSubject.next(updatedQuests);
    this.saveQuests(updatedQuests).subscribe();
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - GESTION QUOTIDIENNE/HEBDOMADAIRE
  // ============================================================

  /**
   * RÉGÉNÉRER LES QUÊTES QUOTIDIENNES
   * --------------------------------
   * Appelé chaque jour à minuit (ou au démarrage de l'app).
   *
   * - Complète les quêtes daily expirées
   * - Réinitialise les compteurs
   * - Crée de nouvelles quêtes daily
   */
  regenerateDailyQuests(): Observable<Quest[]> {
    console.log('🔄 Régénération des quêtes quotidiennes...');

    const quests = this.questsSubject.value;
    const now = new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const updatedQuests = quests.map(quest => {
      // Seulement les quêtes daily
      if (quest.type !== 'daily') return quest;

      // Réinitialise la progression
      return {
        ...quest,
        status: 'available' as QuestStatus,
        objective: {
          ...quest.objective,
          current: 0
        },
        deadline: today,
        startedAt: undefined,
        completedAt: undefined,
        updatedAt: now
      };
    });

    this.questsSubject.next(updatedQuests);
    return this.saveQuests(updatedQuests).pipe(
      tap(() => console.log('✅ Quêtes quotidiennes régénérées !'))
    );
  }

  /**
   * RÉGÉNÉRER LES QUÊTES HEBDOMADAIRES
   * ---------------------------------
   * Appelé chaque dimanche à minuit.
   */
  regenerateWeeklyQuests(): Observable<Quest[]> {
    console.log('🔄 Régénération des quêtes hebdomadaires...');

    const quests = this.questsSubject.value;
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(23, 59, 59, 999);

    const updatedQuests = quests.map(quest => {
      if (quest.type !== 'weekly') return quest;

      return {
        ...quest,
        status: 'available' as QuestStatus,
        objective: {
          ...quest.objective,
          current: 0
        },
        deadline: nextSunday,
        startedAt: undefined,
        completedAt: undefined,
        updatedAt: now
      };
    });

    this.questsSubject.next(updatedQuests);
    return this.saveQuests(updatedQuests).pipe(
      tap(() => console.log('✅ Quêtes hebdomadaires régénérées !'))
    );
  }

  /**
   * VÉRIFIER ET RÉGÉNÉRER LES QUÊTES SI NÉCESSAIRE
   * ---------------------------------------------
   * Appelé au démarrage de l'app.
   */
  checkAndRegenerateQuests(): void {
    const now = new Date();
    const lastCheck = localStorage.getItem('last_quest_check');

    if (lastCheck) {
      const lastCheckDate = new Date(lastCheck);

      // Si on est un nouveau jour
      if (lastCheckDate.getDate() !== now.getDate()) {
        this.regenerateDailyQuests().subscribe();
      }

      // Si on est dimanche et que la dernière vérif n'était pas dimanche
      if (now.getDay() === 0 && lastCheckDate.getDay() !== 0) {
        this.regenerateWeeklyQuests().subscribe();
      }
    }

    localStorage.setItem('last_quest_check', now.toISOString());
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - STATISTIQUES
  // ============================================================

  /**
   * OBTENIR LES STATISTIQUES DES QUÊTES
   * ----------------------------------
   */
  getQuestStats(): Observable<{
    total: number;
    completed: number;
    inProgress: number;
    available: number;
    locked: number;
    byType: {
      daily: { completed: number; total: number };
      weekly: { completed: number; total: number };
      main: { completed: number; total: number };
      side: { completed: number; total: number };
    };
  }> {
    return this.quests$.pipe(
      map(quests => {
        const total = quests.length;
        const completed = quests.filter(q => q.status === 'completed').length;
        const inProgress = quests.filter(q => q.status === 'in-progress').length;
        const available = quests.filter(q => q.status === 'available').length;
        const locked = quests.filter(q => q.status === 'locked').length;

        const types: QuestType[] = ['daily', 'weekly', 'main', 'side'];
        const byType = types.reduce((acc, type) => {
          const typeQuests = quests.filter(q => q.type === type);
          acc[type] = {
            completed: typeQuests.filter(q => q.status === 'completed').length,
            total: typeQuests.length
          };
          return acc;
        }, {} as any);

        return {
          total,
          completed,
          inProgress,
          available,
          locked,
          byType
        };
      })
    );
  }

  /**
   * RÉINITIALISER LES QUÊTES
   * -----------------------
   * ⚠️ ATTENTION : Supprime toutes les quêtes !
   */
  resetQuests(): Observable<void> {
    console.warn('⚠️ RESET : Réinitialisation des quêtes !');

    return this.storageService.remove(StorageKeys.QUESTS).pipe(
      tap(() => {
        this.createDefaultQuests();
        console.log('✅ Quêtes réinitialisées !');
      })
    );
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI des quêtes quotidiennes ET hebdomadaires ?
 *
 *    Daily : Crée une HABITUDE (tous les jours)
 *    Weekly : Donne des OBJECTIFS plus ambitieux (une semaine pour y arriver)
 *
 *    Psychologie : Les petits objectifs quotidiens maintiennent la motivation,
 *    les gros objectifs hebdomadaires donnent un sens à long terme.
 *
 * 2. POURQUOI régénérer automatiquement ?
 *
 *    Fresh start effect : Recommencer à zéro chaque jour/semaine
 *    crée un sentiment de "nouveau départ".
 *
 *    "Aujourd'hui c'est un nouveau jour, je peux faire mieux !"
 *
 * 3. POURQUOI des chaînes de quêtes (quest.nextQuest) ?
 *
 *    Progression narrative !
 *    Comme dans un jeu : Quête 1 → Quête 2 → Quête 3 → Boss Final
 *
 *    Ça raconte une HISTOIRE, pas juste une checklist.
 *
 * Citation de Jesse Schell (game designer) :
 * "A game is a problem-solving activity, approached with a playful attitude."
 *
 * Les quêtes = problèmes à résoudre
 * Gamification = attitude ludique
 * Apprentissage = résultat !
 *
 * Prochaine étape : PomodoroService (timer) !
 */
