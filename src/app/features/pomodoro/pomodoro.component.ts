/**
 * pomodoro.component.ts
 *
 * Composant POMODORO - Timer de productivité.
 *
 * Qu'est-ce que la technique Pomodoro ?
 * ------------------------------------
 * Créée par Francesco Cirillo dans les années 1980.
 * "Pomodoro" = "tomate" en italien (il utilisait un minuteur de cuisine en forme de tomate).
 *
 * Le principe est simple mais PUISSANT :
 *
 * 1. 🍅 Travaille 25 minutes (focus total, pas de distractions)
 * 2. ☕ Pause 5 minutes (lève-toi, étire-toi, respire)
 * 3. 🔄 Répète 4 fois
 * 4. 🌴 Pause longue 15-30 minutes (tu l'as bien mérité !)
 *
 * Pourquoi ça marche ?
 * -------------------
 * 1. Urgence productive : "Plus que 10 minutes !" → tu te concentres
 * 2. Évite le burnout : Pauses régulières = cerveau reposé
 * 3. Mesurable : "J'ai fait 6 Pomodoros aujourd'hui" → satisfaction
 * 4. Brises la procrastination : "C'est juste 25 minutes" → tu commences
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine un sprinter qui court un marathon :
 * - Il ne sprinte pas 42 km d'un coup (impossible !)
 * - Il alterne sprint et repos
 * - Chaque sprint est INTENSE mais court
 *
 * Le Pomodoro = sprint intellectuel de 25 minutes.
 *
 * Philosophie David J. Malan :
 * "Work smarter, not harder. Take breaks. Your brain needs them."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import des services
import { PomodoroService, PomodoroState, PomodoroConfig, PomodoroStats } from '../../core/services/pomodoro.service';
import { ProgressService } from '../../core/services/progress.service';
import { NotificationService } from '../../core/services/notification.service';

/**
 * @Component Decorator
 */
@Component({
  selector: 'app-pomodoro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pomodoro.component.html',
  styleUrls: ['./pomodoro.component.scss']
})
export class PomodoroComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /**
   * Subject pour le nettoyage des subscriptions
   */
  private destroy$ = new Subject<void>();

  /**
   * État actuel du Pomodoro
   */
  state: PomodoroState = 'idle';

  /**
   * Temps restant en secondes
   */
  timeRemaining: number = 0;

  /**
   * Configuration du Pomodoro
   */
  config: PomodoroConfig = {
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    pomodorosBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false
  };

  /**
   * Nombre de Pomodoros complétés dans la session
   */
  completedPomodoros: number = 0;

  /**
   * Statistiques
   */
  stats: PomodoroStats | null = null;

  /**
   * Angle de progression pour le cercle SVG
   * (0 à 360 degrés)
   */
  progressAngle: number = 360;

  /**
   * Affichage du panneau de configuration
   */
  showSettings: boolean = false;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private pomodoroService: PomodoroService,
    private progressService: ProgressService,
    private notificationService: NotificationService
  ) {}

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  ngOnInit(): void {
    console.log('🍅 Composant Pomodoro initialisé');

    // S'abonne à l'état du Pomodoro
    this.pomodoroService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.state = state;
        this.updateProgressAngle();
      });

    // S'abonne au temps restant
    this.pomodoroService.timeRemaining$
      .pipe(takeUntil(this.destroy$))
      .subscribe(time => {
        this.timeRemaining = time;
        this.updateProgressAngle();
      });

    // S'abonne aux Pomodoros complétés
    this.pomodoroService.completedPomodoros$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.completedPomodoros = count;
      });

    // S'abonne à la configuration
    this.pomodoroService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.config = config;
      });

    // Charge les statistiques
    this.loadStats();
  }

  ngOnDestroy(): void {
    console.log('🍅 Composant Pomodoro détruit');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * CHARGER LES STATISTIQUES
   */
  private loadStats(): void {
    this.pomodoroService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  // ============================================================
  // CONTRÔLES DU TIMER
  // ============================================================

  /**
   * DÉMARRER UN POMODORO
   * -------------------
   * Lance une session de travail de 25 minutes.
   */
  startPomodoro(): void {
    console.log('▶️ Démarrage du Pomodoro');
    this.pomodoroService.startPomodoro();

    // Demande la permission de notification si pas encore fait
    this.notificationService.requestPermission();
  }

  /**
   * DÉMARRER UNE PAUSE COURTE
   * ------------------------
   * Lance une pause de 5 minutes.
   */
  startShortBreak(): void {
    console.log('☕ Démarrage pause courte');
    this.pomodoroService.startShortBreak();
  }

  /**
   * DÉMARRER UNE PAUSE LONGUE
   * ------------------------
   * Lance une pause de 15 minutes.
   */
  startLongBreak(): void {
    console.log('🌴 Démarrage pause longue');
    this.pomodoroService.startLongBreak();
  }

  /**
   * METTRE EN PAUSE / REPRENDRE
   * --------------------------
   */
  togglePause(): void {
    if (this.state === 'paused') {
      console.log('▶️ Reprise');
      this.pomodoroService.resume();
    } else {
      console.log('⏸️ Pause');
      this.pomodoroService.pause();
    }
  }

  /**
   * ARRÊTER / RÉINITIALISER
   * ----------------------
   */
  stop(): void {
    console.log('⏹️ Arrêt');
    this.pomodoroService.stop();
  }

  /**
   * PASSER AU SUIVANT
   * ----------------
   */
  skip(): void {
    console.log('⏭️ Skip');
    this.pomodoroService.skip();
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  /**
   * AFFICHER/MASQUER LES PARAMÈTRES
   */
  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  /**
   * METTRE À JOUR LA DURÉE DE TRAVAIL
   * --------------------------------
   * @param minutes - Durée en minutes (15-60)
   */
  updateWorkDuration(minutes: number): void {
    const clamped = Math.min(60, Math.max(15, minutes));
    this.pomodoroService.updateConfig({ workDuration: clamped * 60 });
  }

  /**
   * METTRE À JOUR LA DURÉE DE PAUSE COURTE
   * -------------------------------------
   * @param minutes - Durée en minutes (3-15)
   */
  updateShortBreakDuration(minutes: number): void {
    const clamped = Math.min(15, Math.max(3, minutes));
    this.pomodoroService.updateConfig({ shortBreakDuration: clamped * 60 });
  }

  /**
   * METTRE À JOUR LA DURÉE DE PAUSE LONGUE
   * -------------------------------------
   * @param minutes - Durée en minutes (10-45)
   */
  updateLongBreakDuration(minutes: number): void {
    const clamped = Math.min(45, Math.max(10, minutes));
    this.pomodoroService.updateConfig({ longBreakDuration: clamped * 60 });
  }

  /**
   * TOGGLE AUTO-START PAUSES
   */
  toggleAutoStartBreaks(): void {
    this.pomodoroService.updateConfig({
      autoStartBreaks: !this.config.autoStartBreaks
    });
  }

  /**
   * TOGGLE AUTO-START POMODOROS
   */
  toggleAutoStartPomodoros(): void {
    this.pomodoroService.updateConfig({
      autoStartPomodoros: !this.config.autoStartPomodoros
    });
  }

  /**
   * RÉINITIALISER LA CONFIGURATION
   */
  resetConfig(): void {
    this.pomodoroService.resetConfig();
  }

  // ============================================================
  // MÉTHODES D'AFFICHAGE
  // ============================================================

  /**
   * FORMATER LE TEMPS
   * ----------------
   * Convertit les secondes en format MM:SS.
   *
   * @param totalSeconds - Temps en secondes
   * @returns Format "25:00", "05:32", etc.
   *
   * Exemple :
   * - 1500 secondes → "25:00"
   * - 332 secondes → "05:32"
   */
  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // padStart ajoute des zéros devant si nécessaire
    // "5" → "05", "25" → "25"
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * OBTENIR LE LABEL DE L'ÉTAT
   * -------------------------
   */
  getStateLabel(): string {
    switch (this.state) {
      case 'idle': return 'Prêt';
      case 'working': return 'Focus';
      case 'short-break': return 'Pause courte';
      case 'long-break': return 'Pause longue';
      case 'paused': return 'En pause';
      default: return '';
    }
  }

  /**
   * OBTENIR LA COULEUR SELON L'ÉTAT
   * ------------------------------
   */
  getStateColor(): string {
    switch (this.state) {
      case 'working': return 'red';
      case 'short-break': return 'green';
      case 'long-break': return 'blue';
      case 'paused': return 'yellow';
      default: return 'gray';
    }
  }

  /**
   * METTRE À JOUR L'ANGLE DE PROGRESSION
   * -----------------------------------
   * Calcule l'angle pour le cercle de progression SVG.
   *
   * - 360° = temps plein
   * - 0° = temps écoulé
   */
  private updateProgressAngle(): void {
    let totalDuration: number;

    switch (this.state) {
      case 'working':
        totalDuration = this.config.workDuration;
        break;
      case 'short-break':
        totalDuration = this.config.shortBreakDuration;
        break;
      case 'long-break':
        totalDuration = this.config.longBreakDuration;
        break;
      default:
        totalDuration = this.config.workDuration;
    }

    // Calcule le pourcentage restant
    const percentage = totalDuration > 0 ? this.timeRemaining / totalDuration : 1;

    // Convertit en angle (0 à 360)
    this.progressAngle = percentage * 360;
  }

  /**
   * OBTENIR LE STYLE DU CERCLE DE PROGRESSION
   * ----------------------------------------
   * Retourne le gradient conique pour le cercle SVG.
   */
  getProgressStyle(): string {
    const color = this.getProgressColor();
    const angle = this.progressAngle;

    return `conic-gradient(${color} ${angle}deg, transparent ${angle}deg)`;
  }

  /**
   * OBTENIR LA COULEUR DE PROGRESSION
   */
  private getProgressColor(): string {
    switch (this.state) {
      case 'working': return '#ef4444'; // Rouge
      case 'short-break': return '#22c55e'; // Vert
      case 'long-break': return '#3b82f6'; // Bleu
      case 'paused': return '#eab308'; // Jaune
      default: return '#6366f1'; // Indigo
    }
  }

  /**
   * VÉRIFIER SI LE TIMER EST ACTIF
   */
  isActive(): boolean {
    return this.state === 'working' ||
           this.state === 'short-break' ||
           this.state === 'long-break';
  }

  /**
   * OBTENIR LE MESSAGE MOTIVANT
   * --------------------------
   * Affiche un message selon l'état et la progression.
   */
  getMotivationalMessage(): string {
    if (this.state === 'idle') {
      if (this.completedPomodoros === 0) {
        return "Prêt à commencer ? Lance ton premier Pomodoro !";
      }
      return `${this.completedPomodoros} Pomodoro${this.completedPomodoros > 1 ? 's' : ''} terminé${this.completedPomodoros > 1 ? 's' : ''} ! Continue !`;
    }

    if (this.state === 'working') {
      const minutes = Math.floor(this.timeRemaining / 60);
      if (minutes > 20) return "C'est parti ! Focus total.";
      if (minutes > 10) return "Tu es dans le flow. Continue !";
      if (minutes > 5) return "Plus que quelques minutes !";
      return "Sprint final ! Tu y es presque !";
    }

    if (this.state === 'short-break') {
      return "Pause bien méritée ! Étire-toi, respire.";
    }

    if (this.state === 'long-break') {
      return "Grande pause ! Prends l'air, hydrate-toi.";
    }

    if (this.state === 'paused') {
      return "Timer en pause. Prêt quand tu l'es !";
    }

    return "";
  }

  /**
   * OBTENIR LES INDICATEURS DE POMODORO
   * ----------------------------------
   * Retourne un tableau pour afficher les 4 cercles de Pomodoro.
   */
  getPomodoroIndicators(): boolean[] {
    const indicators: boolean[] = [];
    const cyclePosition = this.completedPomodoros % 4;

    for (let i = 0; i < 4; i++) {
      indicators.push(i < cyclePosition);
    }

    return indicators;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI 25 minutes précisément ?
 *
 *    C'est un "sweet spot" psychologique :
 *
 *    - Trop court (10 min) → Pas le temps d'entrer en "flow"
 *    - Trop long (45 min) → Fatigue cognitive, attention qui décroît
 *    - 25 minutes → Juste assez pour être productif sans s'épuiser
 *
 *    Recherche : L'attention humaine décline après ~20-30 minutes.
 *    (Source : "The Pomodoro Technique" de Francesco Cirillo)
 *
 * 2. POURQUOI des pauses régulières ?
 *
 *    Le cerveau a besoin de "digérer" l'information.
 *
 *    Pendant la pause :
 *    - La mémoire à court terme → mémoire à long terme (consolidation)
 *    - Le cortex préfrontal se repose (c'est lui qui gère l'attention)
 *    - Le mode "réseau par défaut" s'active (créativité, connexions)
 *
 *    "Rest is not the opposite of work; it's the foundation."
 *
 * 3. POURQUOI un cercle de progression ?
 *
 *    Feedback visuel = Motivation.
 *
 *    Voir le cercle se vider crée :
 *    - Urgence : "Il reste peu de temps !"
 *    - Satisfaction : "J'ai presque fini !"
 *    - Gamification : C'est comme une barre de vie dans un jeu
 *
 * 4. POURQUOI 4 Pomodoros avant la pause longue ?
 *
 *    4 × 25 min = 100 minutes ≈ 1h40 de travail intense.
 *
 *    C'est le maximum recommandé avant une vraie pause.
 *    Au-delà, l'efficacité chute drastiquement.
 *
 *    La pause longue (15-30 min) permet une vraie récupération.
 *
 * Citation de Francesco Cirillo :
 * "The Pomodoro Technique teaches you to work WITH time,
 *  instead of struggling AGAINST it."
 *
 * Le temps n'est pas ton ennemi. C'est ton allié.
 * Chaque Pomodoro est une petite victoire. 🍅
 */
