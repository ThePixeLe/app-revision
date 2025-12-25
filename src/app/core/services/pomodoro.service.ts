/**
 * pomodoro.service.ts
 *
 * Service de gestion du TIMER POMODORO.
 *
 * Qu'est-ce que la technique Pomodoro ?
 * ------------------------------------
 * Créée par Francesco Cirillo dans les années 1980.
 *
 * Principe simple :
 * 1. Travaille 25 minutes (focus total)
 * 2. Pause de 5 minutes (repos)
 * 3. Répète 4 fois
 * 4. Grande pause de 15-30 minutes
 *
 * Pourquoi ça marche ?
 * -------------------
 * - Évite la fatigue mentale
 * - Maintient la concentration
 * - Crée un sentiment d'urgence productive
 * - Permet de mesurer le temps de travail
 *
 * Analogie du monde réel :
 * ----------------------
 * C'est comme courir un marathon :
 * Tu ne cours pas 42km d'un coup !
 * Tu découpes en petites étapes, avec des pauses.
 *
 * Philosophie David J. Malan :
 * "Take breaks. Your brain needs them."
 *
 * Responsabilités de ce service :
 * ------------------------------
 * 1. Gérer le timer (25 min travail, 5 min pause)
 * 2. Notifier quand le temps est écoulé
 * 3. Suivre les statistiques (combien de Pomodoros faits)
 * 4. Sauvegarder l'historique
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

// Import des services
import { StorageService, StorageKeys } from './storage.service';
import { ProgressService } from './progress.service';

/**
 * État du Pomodoro
 */
export type PomodoroState = 'idle' | 'working' | 'short-break' | 'long-break' | 'paused';

/**
 * Configuration du Pomodoro
 */
export interface PomodoroConfig {
  workDuration: number;      // Durée de travail (en secondes) - Par défaut: 25 min = 1500s
  shortBreakDuration: number; // Pause courte (en secondes) - Par défaut: 5 min = 300s
  longBreakDuration: number;  // Pause longue (en secondes) - Par défaut: 15 min = 900s
  pomodorosBeforeLongBreak: number; // Nombre de Pomodoros avant pause longue - Par défaut: 4
  autoStartBreaks: boolean;   // Démarrer automatiquement les pauses
  autoStartPomodoros: boolean; // Démarrer automatiquement les Pomodoros après pause
}

/**
 * Session Pomodoro (pour historique)
 */
export interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // en secondes
  completed: boolean;
  interrupted: boolean;
  type: 'work' | 'short-break' | 'long-break';
  notes?: string;
}

/**
 * Statistiques Pomodoro
 */
export interface PomodoroStats {
  today: {
    completed: number;
    totalWorkTime: number; // en minutes
    totalBreakTime: number;
  };
  thisWeek: {
    completed: number;
    totalWorkTime: number;
  };
  allTime: {
    completed: number;
    totalWorkTime: number;
    averagePerDay: number;
  };
}

/**
 * Service Injectable
 */
@Injectable({
  providedIn: 'root'
})
export class PomodoroService {

  /**
   * Configuration par défaut
   */
  private readonly DEFAULT_CONFIG: PomodoroConfig = {
    workDuration: 25 * 60,        // 25 minutes en secondes
    shortBreakDuration: 5 * 60,   // 5 minutes
    longBreakDuration: 15 * 60,   // 15 minutes
    pomodorosBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false
  };

  /**
   * État actuel du Pomodoro
   */
  private stateSubject = new BehaviorSubject<PomodoroState>('idle');
  public state$: Observable<PomodoroState> = this.stateSubject.asObservable();

  /**
   * Temps restant (en secondes)
   */
  private timeRemainingSubject = new BehaviorSubject<number>(0);
  public timeRemaining$: Observable<number> = this.timeRemainingSubject.asObservable();

  /**
   * Nombre de Pomodoros complétés dans la session actuelle
   */
  private completedPomodorosSubject = new BehaviorSubject<number>(0);
  public completedPomodoros$: Observable<number> = this.completedPomodorosSubject.asObservable();

  /**
   * Configuration actuelle
   */
  private configSubject = new BehaviorSubject<PomodoroConfig>(this.DEFAULT_CONFIG);
  public config$: Observable<PomodoroConfig> = this.configSubject.asObservable();

  /**
   * Subscription du timer
   */
  private timerSubscription?: Subscription;

  /**
   * Session en cours
   */
  private currentSession?: PomodoroSession;

  /**
   * Historique des sessions
   */
  private sessionsSubject = new BehaviorSubject<PomodoroSession[]>([]);
  public sessions$: Observable<PomodoroSession[]> = this.sessionsSubject.asObservable();

  /**
   * Constructeur
   */
  constructor(
    private storageService: StorageService,
    private progressService: ProgressService
  ) {
    // Charge la configuration et l'historique
    this.loadConfig();
    this.loadSessions();
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * CHARGER LA CONFIGURATION
   */
  private loadConfig(): void {
    this.storageService.get<PomodoroConfig>('pomodoro_config')
      .subscribe({
        next: (config) => {
          if (config) {
            this.configSubject.next(config);
          }
        }
      });
  }

  /**
   * CHARGER L'HISTORIQUE DES SESSIONS
   */
  private loadSessions(): void {
    this.storageService.get<PomodoroSession[]>(StorageKeys.POMODORO_SESSIONS)
      .subscribe({
        next: (sessions) => {
          if (sessions) {
            this.sessionsSubject.next(sessions);
          }
        }
      });
  }

  /**
   * SAUVEGARDER LA CONFIGURATION
   */
  private saveConfig(config: PomodoroConfig): void {
    this.storageService.set('pomodoro_config', config).subscribe();
  }

  /**
   * SAUVEGARDER LES SESSIONS
   */
  private saveSessions(sessions: PomodoroSession[]): void {
    this.storageService.set(StorageKeys.POMODORO_SESSIONS, sessions).subscribe();
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - CONTRÔLE DU TIMER
  // ============================================================

  /**
   * DÉMARRER UN POMODORO
   * -------------------
   * Lance une session de travail de 25 minutes.
   *
   * Exemple :
   * ```typescript
   * this.pomodoroService.startPomodoro();
   * ```
   */
  startPomodoro(): void {
    const config = this.configSubject.value;

    console.log('▶️ Pomodoro démarré - 25 minutes de focus !');

    this.stateSubject.next('working');
    this.timeRemainingSubject.next(config.workDuration);

    // Crée une nouvelle session
    this.currentSession = {
      id: `pomodoro-${Date.now()}`,
      startTime: new Date(),
      duration: config.workDuration,
      completed: false,
      interrupted: false,
      type: 'work'
    };

    this.startTimer();
  }

  /**
   * DÉMARRER UNE PAUSE COURTE
   * ------------------------
   * Lance une pause de 5 minutes.
   */
  startShortBreak(): void {
    const config = this.configSubject.value;

    console.log('☕ Pause courte - 5 minutes de repos');

    this.stateSubject.next('short-break');
    this.timeRemainingSubject.next(config.shortBreakDuration);

    this.currentSession = {
      id: `break-${Date.now()}`,
      startTime: new Date(),
      duration: config.shortBreakDuration,
      completed: false,
      interrupted: false,
      type: 'short-break'
    };

    this.startTimer();
  }

  /**
   * DÉMARRER UNE PAUSE LONGUE
   * ------------------------
   * Lance une pause de 15 minutes.
   */
  startLongBreak(): void {
    const config = this.configSubject.value;

    console.log('🌴 Pause longue - 15 minutes de repos bien mérité !');

    this.stateSubject.next('long-break');
    this.timeRemainingSubject.next(config.longBreakDuration);

    this.currentSession = {
      id: `long-break-${Date.now()}`,
      startTime: new Date(),
      duration: config.longBreakDuration,
      completed: false,
      interrupted: false,
      type: 'long-break'
    };

    this.startTimer();
  }

  /**
   * METTRE EN PAUSE
   * --------------
   */
  pause(): void {
    if (this.stateSubject.value === 'idle') return;

    console.log('⏸️ Pomodoro en pause');
    this.stateSubject.next('paused');
    this.stopTimer();
  }

  /**
   * REPRENDRE
   * --------
   */
  resume(): void {
    if (this.stateSubject.value !== 'paused') return;

    console.log('▶️ Reprise du Pomodoro');

    // Restaure l'état précédent
    const sessions = this.sessionsSubject.value;
    const lastSession = sessions[sessions.length - 1];

    if (lastSession) {
      if (lastSession.type === 'work') {
        this.stateSubject.next('working');
      } else if (lastSession.type === 'short-break') {
        this.stateSubject.next('short-break');
      } else {
        this.stateSubject.next('long-break');
      }
    }

    this.startTimer();
  }

  /**
   * ARRÊTER / RÉINITIALISER
   * ----------------------
   */
  stop(): void {
    console.log('⏹️ Pomodoro arrêté');

    // Marque la session comme interrompue
    if (this.currentSession) {
      this.currentSession.interrupted = true;
      this.currentSession.endTime = new Date();
      this.saveSession(this.currentSession);
    }

    this.stateSubject.next('idle');
    this.timeRemainingSubject.next(0);
    this.stopTimer();
    this.currentSession = undefined;
  }

  /**
   * PASSER AU SUIVANT
   * ----------------
   * Termine la session en cours et passe à la suivante.
   */
  skip(): void {
    console.log('⏭️ Passage au suivant');

    this.stop();
    this.handleSessionComplete();
  }

  // ============================================================
  // MÉTHODES PRIVÉES - GESTION DU TIMER
  // ============================================================

  /**
   * DÉMARRER LE TIMER
   * ----------------
   * Utilise RxJS interval pour décompter chaque seconde.
   */
  private startTimer(): void {
    // Arrête le timer précédent s'il existe
    this.stopTimer();

    // Crée un nouveau timer qui émet chaque seconde
    this.timerSubscription = interval(1000).subscribe(() => {
      const timeRemaining = this.timeRemainingSubject.value;

      if (timeRemaining > 0) {
        // Décrémente le temps
        this.timeRemainingSubject.next(timeRemaining - 1);
      } else {
        // Temps écoulé !
        this.handleTimerComplete();
      }
    });
  }

  /**
   * ARRÊTER LE TIMER
   */
  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  /**
   * GÉRER LA FIN DU TIMER
   * --------------------
   * Appelé quand le temps arrive à 0.
   */
  private handleTimerComplete(): void {
    this.stopTimer();

    const state = this.stateSubject.value;

    console.log('⏰ Timer terminé !');

    // Marque la session comme complétée
    if (this.currentSession) {
      this.currentSession.completed = true;
      this.currentSession.endTime = new Date();
      this.saveSession(this.currentSession);
    }

    // Si c'était un Pomodoro de travail
    if (state === 'working') {
      const completed = this.completedPomodorosSubject.value + 1;
      this.completedPomodorosSubject.next(completed);

      // Ajoute de l'XP pour le Pomodoro
      this.progressService.addXP(5, 'Pomodoro complété').subscribe();

      console.log(`✅ Pomodoro ${completed} terminé !`);
    }

    this.handleSessionComplete();
  }

  /**
   * GÉRER LA FIN D'UNE SESSION
   * -------------------------
   * Décide quoi faire ensuite (pause courte, longue, ou travail).
   */
  private handleSessionComplete(): void {
    const state = this.stateSubject.value;
    const config = this.configSubject.value;
    const completed = this.completedPomodorosSubject.value;

    // Si on était en travail
    if (state === 'working') {
      // Après 4 Pomodoros → pause longue
      if (completed % config.pomodorosBeforeLongBreak === 0) {
        if (config.autoStartBreaks) {
          this.startLongBreak();
        } else {
          this.stateSubject.next('idle');
          console.log('💡 Prêt pour une pause longue !');
        }
      } else {
        // Sinon → pause courte
        if (config.autoStartBreaks) {
          this.startShortBreak();
        } else {
          this.stateSubject.next('idle');
          console.log('💡 Prêt pour une pause courte !');
        }
      }
    }
    // Si on était en pause
    else if (state === 'short-break' || state === 'long-break') {
      if (config.autoStartPomodoros) {
        this.startPomodoro();
      } else {
        this.stateSubject.next('idle');
        console.log('💡 Prêt pour un nouveau Pomodoro !');
      }
    }
  }

  /**
   * SAUVEGARDER UNE SESSION
   */
  private saveSession(session: PomodoroSession): void {
    const sessions = this.sessionsSubject.value;
    const updatedSessions = [...sessions, session];

    this.sessionsSubject.next(updatedSessions);
    this.saveSessions(updatedSessions);
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - CONFIGURATION
  // ============================================================

  /**
   * METTRE À JOUR LA CONFIGURATION
   */
  updateConfig(config: Partial<PomodoroConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };

    this.configSubject.next(newConfig);
    this.saveConfig(newConfig);

    console.log('⚙️ Configuration Pomodoro mise à jour');
  }

  /**
   * METTRE À JOUR LES PARAMÈTRES (alias pour updateConfig)
   */
  updateSettings(settings: Partial<PomodoroConfig>): void {
    this.updateConfig(settings);
  }

  /**
   * RÉINITIALISER LA CONFIGURATION
   */
  resetConfig(): void {
    this.configSubject.next(this.DEFAULT_CONFIG);
    this.saveConfig(this.DEFAULT_CONFIG);
    console.log('🔄 Configuration réinitialisée');
  }

  // ============================================================
  // MÉTHODES PUBLIQUES - STATISTIQUES
  // ============================================================

  /**
   * OBTENIR LES STATISTIQUES
   */
  getStats(): Observable<PomodoroStats> {
    return this.sessions$.pipe(
      map(sessions => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Sessions complétées de type "work"
        const workSessions = sessions.filter(s => s.type === 'work' && s.completed);

        // Aujourd'hui
        const todaySessions = workSessions.filter(s =>
          new Date(s.startTime) >= today
        );
        const todayBreaks = sessions.filter(s =>
          (s.type === 'short-break' || s.type === 'long-break') &&
          s.completed &&
          new Date(s.startTime) >= today
        );

        // Cette semaine
        const weekSessions = workSessions.filter(s =>
          new Date(s.startTime) >= weekAgo
        );

        // Calculs
        const todayWorkTime = todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
        const todayBreakTime = todayBreaks.reduce((sum, s) => sum + s.duration, 0) / 60;
        const weekWorkTime = weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60;
        const allTimeWorkTime = workSessions.reduce((sum, s) => sum + s.duration, 0) / 60;

        // Nombre de jours uniques avec des sessions
        const uniqueDays = new Set(
          workSessions.map(s => new Date(s.startTime).toDateString())
        ).size;
        const averagePerDay = uniqueDays > 0 ? workSessions.length / uniqueDays : 0;

        return {
          today: {
            completed: todaySessions.length,
            totalWorkTime: Math.round(todayWorkTime),
            totalBreakTime: Math.round(todayBreakTime)
          },
          thisWeek: {
            completed: weekSessions.length,
            totalWorkTime: Math.round(weekWorkTime)
          },
          allTime: {
            completed: workSessions.length,
            totalWorkTime: Math.round(allTimeWorkTime),
            averagePerDay: Math.round(averagePerDay * 10) / 10
          }
        };
      })
    );
  }

  /**
   * OBTENIR L'HISTORIQUE
   */
  getHistory(days: number = 7): Observable<PomodoroSession[]> {
    return this.sessions$.pipe(
      map(sessions => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return sessions.filter(s => new Date(s.startTime) >= cutoff);
      })
    );
  }

  /**
   * EFFACER L'HISTORIQUE
   */
  clearHistory(): void {
    this.sessionsSubject.next([]);
    this.saveSessions([]);
    console.log('🗑️ Historique Pomodoro effacé');
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI la technique Pomodoro est-elle si efficace ?
 *
 *    Recherches en neurosciences (Ultradian Rhythms) :
 *    Le cerveau fonctionne par cycles de ~90 minutes.
 *    Après 25-30 min de concentration intense, l'efficacité diminue.
 *
 *    Une pause de 5 min :
 *    - Recharge le cerveau
 *    - Permet la consolidation (mémoire)
 *    - Évite le burnout
 *
 * 2. POURQUOI 25 minutes précisément ?
 *
 *    C'est un sweet spot psychologique :
 *    - Assez court pour ne pas procrastiner ("C'est juste 25 min !")
 *    - Assez long pour entrer en flow (concentration profonde)
 *    - Crée un sentiment d'urgence productive
 *
 * 3. POURQUOI une pause longue après 4 Pomodoros ?
 *
 *    Après 2h de travail intensif (4 × 25 min + 3 × 5 min),
 *    le cerveau a BESOIN d'une vraie pause.
 *
 *    15-30 minutes permettent :
 *    - Digestion mentale de ce qui a été appris
 *    - Récupération physique et mentale
 *    - Préparation pour la prochaine session
 *
 * Citation de Francesco Cirillo (créateur de la technique) :
 * "The Pomodoro Technique teaches you to work WITH time, instead of struggling AGAINST it."
 *
 * Le temps n'est pas ton ennemi, c'est ton allié !
 *
 * Prochaine étape : NotificationService !
 */
