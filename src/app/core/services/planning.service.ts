/**
 * planning.service.ts
 *
 * Service de gestion du PLANNING des 12 jours d'apprentissage.
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine un agenda personnel intelligent qui :
 * - Connaît ton programme complet (12 jours)
 * - Te dit où tu en es aujourd'hui
 * - Te rappelle ce qu'il faut faire
 * - Suit ta progression jour après jour
 *
 * C'est ton GUIDE personnel pour les 12 jours !
 *
 * Responsabilités de ce service :
 * ------------------------------
 * 1. Charger le planning des 12 jours
 * 2. Identifier le jour actuel
 * 3. Suivre la progression de chaque jour
 * 4. Gérer les sessions (matin, après-midi, soir)
 * 5. Calculer les statistiques de progression
 *
 * Philosophie David J. Malan :
 * "Break big problems into smaller, manageable pieces."
 *
 * Le programme de 12 jours = GROS problème
 * Chaque jour = problème moyen
 * Chaque session = petit problème
 * Chaque exercice = micro-problème
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Import des modèles
import { Day, Session } from '../models/day.model';

// Import du service de stockage
import { StorageService, StorageKeys } from './storage.service';

/**
 * Interface pour les statistiques du planning
 * ------------------------------------------
 */
export interface PlanningStats {
  totalDays: number;              // Nombre total de jours (12)
  completedDays: number;          // Jours terminés
  currentDay: number;             // Jour actuel (1-12)
  daysRemaining: number;          // Jours restants
  overallProgress: number;        // Progression globale (0-100%)

  // Stats par phase
  byPhase: {
    algebre: { completed: number; total: number; percentage: number };
    algo: { completed: number; total: number; percentage: number };
    java: { completed: number; total: number; percentage: number };
    consolidation: { completed: number; total: number; percentage: number };
  };

  // Stats par type de session
  bySessions: {
    morning: { completed: number; total: number };
    afternoon: { completed: number; total: number };
    evening: { completed: number; total: number };
  };
}

/**
 * Service Injectable
 * -----------------
 */
@Injectable({
  providedIn: 'root'
})
export class PlanningService {

  /**
   * BehaviorSubject pour les jours du planning
   * -----------------------------------------
   *
   * Qu'est-ce qu'un BehaviorSubject ?
   * ---------------------------------
   * C'est comme une "boîte aux lettres" qui :
   * 1. Contient TOUJOURS une valeur (jamais vide)
   * 2. Émet cette valeur à tout nouveau subscriber
   * 3. Permet de mettre à jour la valeur (.next())
   *
   * Analogie :
   * Tu t'abonnes à une newsletter. Dès ton inscription,
   * tu reçois le DERNIER numéro. Puis tu reçois tous les suivants.
   *
   * Pourquoi BehaviorSubject et pas simple Subject ?
   * - BehaviorSubject : A toujours une valeur → Pas de "undefined" surprise
   * - Subject : Peut être vide → Nécessite des vérifications partout
   *
   * Le "private" signifie : seul ce service peut faire .next()
   * Les autres ne peuvent que s'abonner (lecture seule via l'Observable public)
   */
  private daysSubject = new BehaviorSubject<Day[]>([]);

  /**
   * Observable public des jours
   * --------------------------
   * C'est ce que les composants vont utiliser pour s'abonner.
   *
   * Exemple dans un composant :
   * ```typescript
   * this.planningService.days$.subscribe(days => {
   *   console.log('Jours du planning:', days);
   * });
   * ```
   *
   * Le "$" à la fin est une CONVENTION Angular/RxJS :
   * Ça signifie "ceci est un Observable" (flux de données dans le temps)
   */
  public days$: Observable<Day[]> = this.daysSubject.asObservable();

  /**
   * BehaviorSubject pour le jour actuel
   * ----------------------------------
   */
  private currentDaySubject = new BehaviorSubject<Day | null>(null);

  /**
   * Observable public du jour actuel
   */
  public currentDay$: Observable<Day | null> = this.currentDaySubject.asObservable();

  /**
   * BehaviorSubject pour l'indice du jour (1-12)
   * ------------------------------------------
   */
  private currentDayIndexSubject = new BehaviorSubject<number>(1);

  /**
   * Observable public de l'indice
   */
  public currentDayIndex$: Observable<number> = this.currentDayIndexSubject.asObservable();

  /**
   * Constructeur
   * -----------
   * Injection de dépendances :
   * Angular va automatiquement créer/fournir le StorageService
   *
   * @param storageService - Service de stockage injecté
   */
  constructor(
    private storageService: StorageService
  ) {
    // Au démarrage du service, on charge le planning
    this.loadPlanning();
  }

  // ============================================================
  // INITIALISATION ET CHARGEMENT
  // ============================================================

  /**
   * CHARGER LE PLANNING
   * ------------------
   * Charge les données depuis le stockage ou crée un nouveau planning.
   *
   * Cette méthode est appelée automatiquement au démarrage du service.
   */
  private loadPlanning(): void {
    console.log('📅 Chargement du planning...');

    // On essaie de récupérer le planning sauvegardé
    this.storageService.get<Day[]>(StorageKeys.PLANNING_DAYS)
      .subscribe({
        next: (savedDays) => {
          if (savedDays && savedDays.length > 0) {
            // Planning trouvé dans le storage
            console.log('✅ Planning trouvé:', savedDays.length, 'jours');

            // On met à jour le BehaviorSubject
            // Tous les subscribers seront automatiquement notifiés !
            this.daysSubject.next(savedDays);

            // On identifie le jour actuel
            this.identifyCurrentDay();
          } else {
            // Pas de planning sauvegardé, on en crée un nouveau
            console.log('📝 Création d\'un nouveau planning...');
            this.createDefaultPlanning();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement du planning:', error);
          // En cas d'erreur, on crée un planning par défaut
          this.createDefaultPlanning();
        }
      });
  }

  /**
   * CRÉER LE PLANNING PAR DÉFAUT
   * ---------------------------
   * Génère le planning des 12 jours avec toutes les sessions.
   *
   * Ce planning est basé sur l'emploi du temps que tu as défini :
   * - Phase 1 : Algèbre de Boole (2 jours)
   * - Phase 2 : Algorithmique (4 jours)
   * - Phase 3 : Java (4 jours)
   * - Phase 4 : Consolidation (2 jours)
   */
  private createDefaultPlanning(): void {
    // Date de début : 25 décembre 2024
    const startDate = new Date('2024-12-25');

    // Tableau qui contiendra tous les jours
    const days: Day[] = [];

    // ===== PHASE 1 : ALGÈBRE DE BOOLE (2 jours) =====

    // Jour 1 : 25 décembre
    days.push(this.createDay(
      'day-1',
      startDate,
      'algebre',
      'Algèbre de Boole - Partie 1',
      [
        'Maîtriser les tables de vérité (AND, OR, NOT, XOR)',
        'Comprendre les lois fondamentales (commutativité, associativité)',
        'Faire 10 simplifications simples'
      ],
      [
        this.createSession('day-1-morning', 'day-1', 'matin', 150,
          ['Tables de vérité', 'Opérateurs de base'],
          ['Algo 03 - Algorithmes Introduction.pdf'],
          []
        ),
        this.createSession('day-1-afternoon', 'day-1', 'apres-midi', 120,
          ['Lois fondamentales', 'Théorèmes de De Morgan'],
          ['Algo 03 - Algorithmes Introduction.pdf'],
          []
        )
      ],
      1
    ));

    // Jour 2 : 26 décembre
    days.push(this.createDay(
      'day-2',
      this.addDays(startDate, 1),
      'algebre',
      'Algèbre de Boole - Partie 2',
      [
        'Maîtriser les tableaux de Karnaugh',
        'Simplifier des fonctions booléennes',
        'Quiz d\'auto-évaluation'
      ],
      [
        this.createSession('day-2-morning', 'day-2', 'matin', 150,
          ['Tableaux de Karnaugh', 'Simplification'],
          ['Algo 03 - Algorithmes Introduction.pdf'],
          []
        ),
        this.createSession('day-2-afternoon', 'day-2', 'apres-midi', 90,
          ['Révision générale', 'Quiz'],
          [],
          []
        )
      ],
      2
    ));

    // ===== PHASE 2 : ALGORITHMIQUE (4 jours) =====

    // Jour 3 : 27 décembre - Conditions
    days.push(this.createDay(
      'day-3',
      this.addDays(startDate, 2),
      'algo',
      'Algorithmique - Structures conditionnelles',
      [
        'Maîtriser les structures SI...ALORS...SINON',
        'Faire les exercices CONDITIONS (Ex 1-6)'
      ],
      [
        this.createSession('day-3-morning', 'day-3', 'matin', 150,
          ['Structures alternatives', 'Exercices 1-3'],
          ['Algo 03 - Algorithmes Introduction.pdf', 'exercice_algo_lesConditions_Mad_V1.0.0.pdf'],
          ['ex-cond-1', 'ex-cond-2', 'ex-cond-3']
        ),
        this.createSession('day-3-afternoon', 'day-3', 'apres-midi', 120,
          ['Exercices 4-6'],
          ['exercice_algo_lesConditions_Mad_V1.0.0.pdf'],
          ['ex-cond-4', 'ex-cond-5', 'ex-cond-6']
        )
      ],
      3
    ));

    // Jour 4 : 28 décembre - Boucles
    days.push(this.createDay(
      'day-4',
      this.addDays(startDate, 3),
      'algo',
      'Algorithmique - Structures répétitives',
      [
        'Maîtriser TANT QUE, FAIRE...JUSQU\'À, POUR',
        'Faire les exercices BOUCLES (Ex 1-7)'
      ],
      [
        this.createSession('day-4-morning', 'day-4', 'matin', 150,
          ['Structures répétitives', 'Exercices 1-4'],
          ['Algo 03 - Algorithmes Introduction.pdf', 'exercice_algo_les boucles_mad_v1.0.0.pdf'],
          ['ex-boucle-1', 'ex-boucle-2', 'ex-boucle-3', 'ex-boucle-4']
        ),
        this.createSession('day-4-afternoon', 'day-4', 'apres-midi', 120,
          ['Exercices 5-7'],
          ['exercice_algo_les boucles_mad_v1.0.0.pdf'],
          ['ex-boucle-5', 'ex-boucle-6', 'ex-boucle-7']
        )
      ],
      4
    ));

    // Jour 5 : 29 décembre - Conception
    days.push(this.createDay(
      'day-5',
      this.addDays(startDate, 4),
      'algo',
      'Algorithmique - Conception descendante',
      [
        'Comprendre la démarche de construction',
        'Exercice guidé : compression de phrase'
      ],
      [
        this.createSession('day-5-morning', 'day-5', 'matin', 150,
          ['Premiers algorithmes', 'Variables locales/globales'],
          ['Algo A2 - Algorithmes simples - AFPA.pdf'],
          ['ex-boucle-8', 'ex-boucle-9']
        ),
        this.createSession('day-5-afternoon', 'day-5', 'apres-midi', 120,
          ['Conception descendante', 'Jeux d\'essai'],
          ['Algo A2 - Algorithmes simples - AFPA.pdf'],
          []
        )
      ],
      5
    ));

    // Jour 6 : 30 décembre - Tableaux
    days.push(this.createDay(
      'day-6',
      this.addDays(startDate, 5),
      'algo',
      'Algorithmique - Tableaux et structures',
      [
        'Maîtriser les tableaux',
        'Faire les exercices TABLEAUX (Ex 1-9)'
      ],
      [
        this.createSession('day-6-morning', 'day-6', 'matin', 120,
          ['Structures de données', 'Exercices 1-5'],
          ['Algo A2 - Algorithmes simples - AFPA.pdf', 'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf'],
          ['ex-tableau-1', 'ex-tableau-2', 'ex-tableau-3', 'ex-tableau-4', 'ex-tableau-5']
        ),
        this.createSession('day-6-afternoon', 'day-6', 'apres-midi', 120,
          ['Exercices 6-9'],
          ['exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf'],
          ['ex-tableau-6', 'ex-tableau-7', 'ex-tableau-8', 'ex-tableau-9']
        )
      ],
      6
    ));

    // ===== PHASE 3 : JAVA (4 jours) =====

    // Jour 7 : 31 décembre - Bases Java
    days.push(this.createDay(
      'day-7',
      this.addDays(startDate, 6),
      'java',
      'Java - Installation et bases',
      [
        'Installer et configurer Java + VS Code',
        'Maîtriser variables et types',
        'Premier Hello World'
      ],
      [
        this.createSession('day-7-morning', 'day-7', 'matin', 150,
          ['Installation JDK', 'Structure d\'un programme Java', 'Variables et types'],
          ['Java 01 - Bases Java - MD v1.0.0.pdf', 'Java 02 - Base Syntaxe - MD v1.0.0.pdf'],
          []
        ),
        this.createSession('day-7-afternoon', 'day-7', 'apres-midi', 120,
          ['Opérateurs', 'Exercices simples'],
          ['Java 02 - Base Syntaxe - MD v1.0.0.pdf'],
          []
        )
      ],
      7
    ));

    // Jour 8 : 1er janvier - Conditions en Java
    days.push(this.createDay(
      'day-8',
      this.addDays(startDate, 7),
      'java',
      'Java - Structures conditionnelles',
      [
        'Maîtriser if/else et switch/case',
        'Coder les exercices CONDITIONS en Java'
      ],
      [
        this.createSession('day-8-morning', 'day-8', 'matin', 150,
          ['if/else', 'switch/case', 'Scanner', 'Exercices 1-3'],
          ['Java 02 - Base Syntaxe - MD v1.0.0.pdf', 'Java 03 - Scanner - MD v1.0.0.pdf'],
          ['ex-java-cond-1', 'ex-java-cond-2', 'ex-java-cond-3']
        ),
        this.createSession('day-8-afternoon', 'day-8', 'apres-midi', 120,
          ['Exercices 4-6'],
          ['exercice_algo_lesConditions_Mad_V1.0.0.pdf'],
          ['ex-java-cond-4', 'ex-java-cond-5', 'ex-java-cond-6']
        )
      ],
      8
    ));

    // Jour 9 : 2 janvier - Boucles en Java
    days.push(this.createDay(
      'day-9',
      this.addDays(startDate, 8),
      'java',
      'Java - Boucles',
      [
        'Maîtriser while, do-while, for',
        'Coder les exercices BOUCLES en Java'
      ],
      [
        this.createSession('day-9-morning', 'day-9', 'matin', 150,
          ['while, do-while, for', 'Exercices 1-4'],
          ['Java 02 - Base Syntaxe - MD v1.0.0.pdf'],
          ['ex-java-boucle-1', 'ex-java-boucle-2', 'ex-java-boucle-3', 'ex-java-boucle-4']
        ),
        this.createSession('day-9-afternoon', 'day-9', 'apres-midi', 120,
          ['Exercices 5-8'],
          ['exercice_algo_les boucles_mad_v1.0.0.pdf'],
          ['ex-java-boucle-5', 'ex-java-boucle-6', 'ex-java-boucle-7', 'ex-java-boucle-8']
        )
      ],
      9
    ));

    // Jour 10 : 3 janvier - Tableaux en Java
    days.push(this.createDay(
      'day-10',
      this.addDays(startDate, 9),
      'java',
      'Java - Tableaux',
      [
        'Maîtriser les tableaux en Java',
        'Coder les exercices TABLEAUX en Java'
      ],
      [
        this.createSession('day-10-morning', 'day-10', 'matin', 150,
          ['Tableaux en Java', 'Classe Arrays', 'Exercices 1-4'],
          ['Java 02 - Base Syntaxe - MD v1.0.0.pdf', 'Java 10 - Programmation_Java_Tableaux.pdf'],
          ['ex-java-tableau-1', 'ex-java-tableau-2', 'ex-java-tableau-3', 'ex-java-tableau-4']
        ),
        this.createSession('day-10-afternoon', 'day-10', 'apres-midi', 120,
          ['Exercices 5-9'],
          ['Java 11 - Exercice Tableau en java MA.pdf'],
          ['ex-java-tableau-5', 'ex-java-tableau-6', 'ex-java-tableau-7', 'ex-java-tableau-8', 'ex-java-tableau-9']
        )
      ],
      10
    ));

    // ===== PHASE 4 : CONSOLIDATION (2 jours) =====

    // Jour 11 : 4 janvier - Révisions
    days.push(this.createDay(
      'day-11',
      this.addDays(startDate, 10),
      'consolidation',
      'Consolidation - Révisions',
      [
        'Réviser Algèbre de Boole + Algo',
        'Refaire 3-4 programmes Java complets'
      ],
      [
        this.createSession('day-11-morning', 'day-11', 'matin', 120,
          ['Révision Algèbre + Algo', 'Refaire exercices clés'],
          [],
          []
        ),
        this.createSession('day-11-afternoon', 'day-11', 'apres-midi', 120,
          ['Révision Java', 'Refaire programmes complets'],
          [],
          []
        )
      ],
      11
    ));

    // Jour 12 : 4 janvier - Projet final
    days.push(this.createDay(
      'day-12',
      this.addDays(startDate, 11),
      'consolidation',
      'Consolidation - Projet final',
      [
        'Créer un programme Java complet',
        'Bilan personnel et auto-évaluation finale'
      ],
      [
        this.createSession('day-12-morning', 'day-12', 'matin', 150,
          ['Mini-projet : Calculatrice / Gestion de notes'],
          [],
          []
        ),
        this.createSession('day-12-afternoon', 'day-12', 'apres-midi', 90,
          ['Bilan personnel', 'Auto-évaluation finale', 'Préparation reprise'],
          [],
          []
        )
      ],
      12
    ));

    // On sauvegarde le planning créé
    this.daysSubject.next(days);
    this.savePlanning(days).subscribe({
      next: () => {
        console.log('✅ Planning par défaut créé et sauvegardé !');
        this.identifyCurrentDay();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la sauvegarde du planning:', error);
      }
    });
  }

  /**
   * Créer un objet Day
   * -----------------
   * Fonction helper pour simplifier la création des jours.
   */
  private createDay(
    id: string,
    date: Date,
    phase: 'algebre' | 'algo' | 'java' | 'consolidation',
    title: string,
    objectives: string[],
    sessions: Session[],
    dayNumber: number
  ): Day {
    return {
      id,
      date,
      phase,
      title,
      objectives,
      sessions,
      completed: false,
      xpEarned: 0,
      notes: ''
    };
  }

  /**
   * Créer un objet Session
   * ---------------------
   * Fonction helper pour simplifier la création des sessions.
   */
  private createSession(
    id: string,
    dayId: string,
    period: 'matin' | 'apres-midi' | 'soir',
    duration: number,
    topics: string[],
    documents: string[],
    exercises: string[]
  ): Session {
    return {
      id,
      dayId,
      period,
      duration,
      topics,
      documents,
      exercises,
      completed: false,
      pomodoroCount: 0
    };
  }

  /**
   * Ajouter des jours à une date
   * ---------------------------
   * Fonction helper pour manipuler les dates.
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // ... (À suivre dans le prochain artifact : méthodes publiques)

  /**
   * IDENTIFIER LE JOUR ACTUEL
   * ------------------------
   * Détermine quel jour du planning on est aujourd'hui.
   */
  private identifyCurrentDay(): void {
    const days = this.daysSubject.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialise l'heure pour comparer juste les dates

    // Trouve le jour correspondant à aujourd'hui
    let currentDay = days.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });

    // Si pas de correspondance exacte, prend le jour en cours ou le premier
    if (!currentDay) {
      // Cherche le premier jour non terminé
      currentDay = days.find(day => !day.completed) || days[0];
    }

    if (currentDay) {
      const dayIndex = days.findIndex(d => d.id === currentDay!.id) + 1;
      console.log(`📍 Jour actuel : Jour ${dayIndex} - ${currentDay.title}`);

      this.currentDaySubject.next(currentDay);
      this.currentDayIndexSubject.next(dayIndex);
    }
  }

  /**
   * SAUVEGARDER LE PLANNING
   * ----------------------
   */
  private savePlanning(days: Day[]): Observable<Day[]> {
    return this.storageService.set(StorageKeys.PLANNING_DAYS, days);
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - GESTION DES JOURS
  // ============================================================

  /**
   * OBTENIR UN JOUR PAR SON NUMÉRO (1-12)
   * -------------------------------------
   * Plus pratique que par ID pour l'utilisateur.
   *
   * @param dayNumber - Numéro du jour (1 à 12)
   * @returns Observable du jour correspondant
   *
   * Exemple :
   * ```typescript
   * this.planningService.getDayByNumber(3).subscribe(day => {
   *   console.log('Jour 3:', day?.title);
   * });
   * ```
   */
  getDayByNumber(dayNumber: number): Observable<Day | undefined> {
    return this.days$.pipe(
      // On récupère le jour à l'index (dayNumber - 1)
      // Car les tableaux commencent à 0, mais on compte les jours à partir de 1
      map(days => days[dayNumber - 1])
    );
  }

  /**
   * OBTENIR LES JOURS PAR PHASE
   * --------------------------
   * Filtre les jours selon la phase (algèbre, algo, java, consolidation).
   *
   * @param phase - La phase à filtrer
   * @returns Observable des jours de cette phase
   *
   * Exemple :
   * ```typescript
   * this.planningService.getDaysByPhase('algo').subscribe(days => {
   *   console.log('Jours d\'algo:', days.length); // 4 jours
   * });
   * ```
   */
  getDaysByPhase(phase: 'algebre' | 'algo' | 'java' | 'consolidation'): Observable<Day[]> {
    return this.days$.pipe(
      map(days => days.filter(day => day.phase === phase))
    );
  }

  /**
   * OBTENIR LES JOURS TERMINÉS
   * -------------------------
   * Retourne uniquement les jours marqués comme "completed".
   *
   * @returns Observable des jours terminés
   */
  getCompletedDays(): Observable<Day[]> {
    return this.days$.pipe(
      map(days => days.filter(day => day.completed))
    );
  }

  /**
   * OBTENIR TOUS LES JOURS
   * ---------------------
   * Retourne la liste complète des 12 jours.
   *
   * @returns Observable de tous les jours
   */
  getAllDays(): Observable<Day[]> {
    return this.days$;
  }

  /**
   * OBTENIR UN JOUR PAR SON ID
   * -------------------------
   * Recherche un jour spécifique par son identifiant.
   *
   * @param dayId - ID du jour (ex: "day-1", "day-5")
   * @returns Observable du jour ou undefined
   */
  getDayById(dayId: string): Observable<Day | undefined> {
    return this.days$.pipe(
      map(days => days.find(day => day.id === dayId))
    );
  }

  /**
   * OBTENIR LES JOURS EN COURS / À FAIRE
   * -----------------------------------
   * Retourne les jours non terminés.
   *
   * @returns Observable des jours restants
   */
  getRemainingDays(): Observable<Day[]> {
    return this.days$.pipe(
      map(days => days.filter(day => !day.completed))
    );
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - GESTION DES SESSIONS
  // ============================================================

  /**
   * OBTENIR UNE SESSION PAR SON ID
   * -----------------------------
   * Trouve une session dans tous les jours du planning.
   *
   * @param sessionId - ID de la session
   * @returns Observable de la session (ou undefined si non trouvée)
   */
  getSessionById(sessionId: string): Observable<Session | undefined> {
    return this.days$.pipe(
      map(days => {
        // On parcourt tous les jours
        for (const day of days) {
          // On cherche la session dans ce jour
          const session = day.sessions.find(s => s.id === sessionId);
          if (session) return session;
        }
        return undefined;
      })
    );
  }

  /**
   * OBTENIR TOUTES LES SESSIONS D'UN JOUR
   * ------------------------------------
   *
   * @param dayId - ID du jour
   * @returns Observable des sessions de ce jour
   */
  getSessionsByDay(dayId: string): Observable<Session[]> {
    return this.getDayById(dayId).pipe(
      map(day => day?.sessions || [])
    );
  }

  /**
   * OBTENIR LA SESSION EN COURS (si applicable)
   * ------------------------------------------
   * Détermine quelle session devrait être en cours selon l'heure actuelle.
   *
   * Logique :
   * - 6h-12h → session du matin
   * - 12h-18h → session de l'après-midi
   * - 18h-23h → session du soir
   * - Sinon → null (repos !)
   *
   * @returns Observable de la session en cours
   */
  getCurrentSession(): Observable<Session | null> {
    return combineLatest([
      this.currentDay$,
      this.getCurrentPeriod()
    ]).pipe(
      map(([currentDay, period]) => {
        if (!currentDay || !period) return null;

        // Trouve la session correspondant à la période actuelle
        return currentDay.sessions.find(s => s.period === period) || null;
      })
    );
  }

  /**
   * OBTENIR LA PÉRIODE ACTUELLE
   * --------------------------
   * Détermine la période selon l'heure.
   *
   * @returns Observable de la période ('matin' | 'apres-midi' | 'soir' | null)
   */
  private getCurrentPeriod(): Observable<'matin' | 'apres-midi' | 'soir' | null> {
    return new Observable(observer => {
      const hour = new Date().getHours();

      let period: 'matin' | 'apres-midi' | 'soir' | null = null;

      if (hour >= 6 && hour < 12) {
        period = 'matin';
      } else if (hour >= 12 && hour < 18) {
        period = 'apres-midi';
      } else if (hour >= 18 && hour < 23) {
        period = 'soir';
      }

      observer.next(period);
      observer.complete();
    });
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - MISE À JOUR
  // ============================================================

  /**
   * MARQUER UN JOUR COMME TERMINÉ
   * ----------------------------
   * Met à jour le statut d'un jour et sauvegarde.
   *
   * @param dayId - ID du jour
   * @param xpEarned - XP gagnés pour ce jour (optionnel)
   * @returns Observable confirmant la mise à jour
   *
   * Exemple :
   * ```typescript
   * this.planningService.markDayAsCompleted('day-1', 150)
   *   .subscribe(() => console.log('Jour 1 terminé !'));
   * ```
   */
  markDayAsCompleted(dayId: string, xpEarned: number = 100): Observable<Day[]> {
    const days = this.daysSubject.value;

    // Trouve le jour et le marque comme terminé
    const updatedDays = days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          completed: true,
          xpEarned: xpEarned,
          // Marque aussi toutes les sessions comme terminées
          sessions: day.sessions.map(session => ({
            ...session,
            completed: true
          }))
        };
      }
      return day;
    });

    // Met à jour le BehaviorSubject
    this.daysSubject.next(updatedDays);

    // Sauvegarde et retourne
    return this.savePlanning(updatedDays).pipe(
      tap(() => {
        console.log(`✅ Jour ${dayId} marqué comme terminé !`);
        // Réévalue le jour actuel
        this.identifyCurrentDay();
      })
    );
  }

  /**
   * MARQUER UNE SESSION COMME TERMINÉE
   * ---------------------------------
   *
   * @param sessionId - ID de la session
   * @param pomodoroCount - Nombre de Pomodoros effectués
   * @returns Observable confirmant la mise à jour
   */
  markSessionAsCompleted(sessionId: string, pomodoroCount: number = 0): Observable<Day[]> {
    const days = this.daysSubject.value;

    const updatedDays = days.map(day => ({
      ...day,
      sessions: day.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            completed: true,
            pomodoroCount,
            endTime: new Date()
          };
        }
        return session;
      })
    }));

    // Vérifie si toutes les sessions du jour sont terminées
    const updatedDaysWithCompletion = updatedDays.map(day => {
      const allSessionsCompleted = day.sessions.every(s => s.completed);
      if (allSessionsCompleted && !day.completed) {
        console.log(`🎉 Toutes les sessions du jour ${day.id} sont terminées !`);
      }
      return day;
    });

    this.daysSubject.next(updatedDaysWithCompletion);
    return this.savePlanning(updatedDaysWithCompletion).pipe(
      tap(() => console.log(`✅ Session ${sessionId} terminée !`))
    );
  }

  /**
   * DÉMARRER UNE SESSION
   * -------------------
   * Enregistre l'heure de début.
   *
   * @param sessionId - ID de la session
   * @returns Observable confirmant la mise à jour
   */
  startSession(sessionId: string): Observable<Day[]> {
    const days = this.daysSubject.value;

    const updatedDays = days.map(day => ({
      ...day,
      sessions: day.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            startTime: new Date()
          };
        }
        return session;
      })
    }));

    this.daysSubject.next(updatedDays);
    return this.savePlanning(updatedDays).pipe(
      tap(() => console.log(`▶️ Session ${sessionId} démarrée !`))
    );
  }

  /**
   * AJOUTER UNE NOTE À UN JOUR
   * -------------------------
   *
   * @param dayId - ID du jour
   * @param notes - Les notes à ajouter
   * @returns Observable confirmant la mise à jour
   */
  addNotesToDay(dayId: string, notes: string): Observable<Day[]> {
    const days = this.daysSubject.value;

    const updatedDays = days.map(day => {
      if (day.id === dayId) {
        return { ...day, notes };
      }
      return day;
    });

    this.daysSubject.next(updatedDays);
    return this.savePlanning(updatedDays).pipe(
      tap(() => console.log(`📝 Notes ajoutées au jour ${dayId}`))
    );
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - STATISTIQUES
  // ============================================================

  /**
   * OBTENIR LES STATISTIQUES DU PLANNING
   * -----------------------------------
   * Calcule toutes les stats de progression.
   *
   * @returns Observable des statistiques
   *
   * Exemple :
   * ```typescript
   * this.planningService.getStats().subscribe(stats => {
   *   console.log(`Tu as terminé ${stats.completedDays}/${stats.totalDays} jours`);
   *   console.log(`Progression : ${stats.overallProgress}%`);
   * });
   * ```
   */
  getStats(): Observable<PlanningStats> {
    return this.days$.pipe(
      map(days => {
        const totalDays = days.length;
        const completedDays = days.filter(d => d.completed).length;
        const currentDayIndex = this.currentDayIndexSubject.value;
        const daysRemaining = totalDays - completedDays;
        const overallProgress = Math.round((completedDays / totalDays) * 100);

        // Stats par phase
        const byPhase = {
          algebre: this.calculatePhaseStats(days, 'algebre'),
          algo: this.calculatePhaseStats(days, 'algo'),
          java: this.calculatePhaseStats(days, 'java'),
          consolidation: this.calculatePhaseStats(days, 'consolidation')
        };

        // Stats par type de session
        const bySessions = this.calculateSessionStats(days);

        return {
          totalDays,
          completedDays,
          currentDay: currentDayIndex,
          daysRemaining,
          overallProgress,
          byPhase,
          bySessions
        };
      })
    );
  }

  /**
   * CALCULER LES STATS D'UNE PHASE
   * -----------------------------
   * Helper pour getStats().
   */
  private calculatePhaseStats(
    days: Day[],
    phase: 'algebre' | 'algo' | 'java' | 'consolidation'
  ): { completed: number; total: number; percentage: number } {
    const phaseDays = days.filter(d => d.phase === phase);
    const total = phaseDays.length;
    const completed = phaseDays.filter(d => d.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  /**
   * CALCULER LES STATS PAR TYPE DE SESSION
   * -------------------------------------
   * Helper pour getStats().
   */
  private calculateSessionStats(days: Day[]): {
    morning: { completed: number; total: number };
    afternoon: { completed: number; total: number };
    evening: { completed: number; total: number };
  } {
    let morningCompleted = 0, morningTotal = 0;
    let afternoonCompleted = 0, afternoonTotal = 0;
    let eveningCompleted = 0, eveningTotal = 0;

    days.forEach(day => {
      day.sessions.forEach(session => {
        if (session.period === 'matin') {
          morningTotal++;
          if (session.completed) morningCompleted++;
        } else if (session.period === 'apres-midi') {
          afternoonTotal++;
          if (session.completed) afternoonCompleted++;
        } else if (session.period === 'soir') {
          eveningTotal++;
          if (session.completed) eveningCompleted++;
        }
      });
    });

    return {
      morning: { completed: morningCompleted, total: morningTotal },
      afternoon: { completed: afternoonCompleted, total: afternoonTotal },
      evening: { completed: eveningCompleted, total: eveningTotal }
    };
  }

  /**
   * OBTENIR LE TEMPS TOTAL PASSÉ
   * ---------------------------
   * Calcule le temps total (en minutes) passé sur le programme.
   *
   * @returns Observable du temps total en minutes
   */
  getTotalTimeSpent(): Observable<number> {
    return this.days$.pipe(
      map(days => {
        let totalMinutes = 0;

        days.forEach(day => {
          day.sessions.forEach(session => {
            if (session.startTime && session.endTime) {
              // Calcule la différence en minutes
              const diff = session.endTime.getTime() - session.startTime.getTime();
              totalMinutes += Math.floor(diff / (1000 * 60));
            } else if (session.completed) {
              // Si complété mais pas de temps précis, utilise la durée estimée
              totalMinutes += session.duration;
            }
          });
        });

        return totalMinutes;
      })
    );
  }

  /**
   * RÉINITIALISER LE PLANNING
   * ------------------------
   * ⚠️ ATTENTION : Supprime toute la progression !
   *
   * Utile pour :
   * - Recommencer à zéro
   * - Tests
   * - Réinitialisation après erreur
   *
   * @returns Observable confirmant la réinitialisation
   */
  resetPlanning(): Observable<void> {
    console.warn('⚠️ RESET : Réinitialisation du planning !');

    // Supprime le planning sauvegardé
    return this.storageService.remove(StorageKeys.PLANNING_DAYS).pipe(
      tap(() => {
        // Recrée un planning vierge
        this.createDefaultPlanning();
        console.log('✅ Planning réinitialisé !');
      })
    );
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI utiliser des Observables partout ?
 *
 *    Parce que les données CHANGENT dans le temps !
 *
 *    Imagine : tu termines un exercice.
 *    → La session change (completed = true)
 *    → Le jour change (peut-être completed = true aussi)
 *    → Les stats changent (progression +1%)
 *    → L'UI doit se mettre à jour automatiquement
 *
 *    Avec les Observables, c'est AUTOMATIQUE :
 *    Les composants s'abonnent → ils reçoivent les mises à jour → l'UI se refresh
 *
 *    C'est le principe de "Reactive Programming" (programmation réactive).
 *
 * 2. POURQUOI séparer les méthodes privées et publiques ?
 *
 *    Principe d'encapsulation (OOP - Programmation Orientée Objet) :
 *
 *    Public = Interface, ce que les autres peuvent utiliser
 *    Private = Implémentation, comment ça marche à l'intérieur
 *
 *    Analogie : Une voiture
 *    - Public : Volant, pédales, levier de vitesse
 *    - Private : Moteur, transmission, système de freinage
 *
 *    Tu n'as pas besoin de comprendre le moteur pour conduire !
 *    De même, les composants n'ont pas besoin de savoir comment
 *    le planning est stocké, juste comment l'utiliser.
 *
 * 3. POURQUOI autant de méthodes helper ?
 *
 *    DRY Principle : Don't Repeat Yourself
 *
 *    Si on calcule les stats de phase à plusieurs endroits,
 *    et qu'on change la formule un jour → il faut changer PARTOUT !
 *
 *    Avec un helper :
 *    - Un seul endroit à modifier
 *    - Code plus lisible
 *    - Moins de bugs
 *
 * 4. POURQUOI BehaviorSubject au lieu de simple variable ?
 *
 *    Variable normale : days = [...]
 *    → Les composants ne savent PAS quand ça change
 *    → Il faut les notifier manuellement
 *    → Complexe et source d'erreurs
 *
 *    BehaviorSubject : daysSubject.next([...])
 *    → Tous les subscribers sont notifiés AUTOMATIQUEMENT
 *    → Pattern Observer en action
 *    → Simple et fiable
 *
 * Citation de Martin Fowler (expert en architecture logicielle) :
 * "Any fool can write code that a computer can understand.
 *  Good programmers write code that humans can understand."
 *
 * Ce service est conçu pour être :
 * - Facile à comprendre (méthodes bien nommées, commentées)
 * - Facile à utiliser (interface publique claire)
 * - Facile à maintenir (logique séparée en petites fonctions)
 *
 * C'est ça, du "clean code" à la David J. Malan !
 */
