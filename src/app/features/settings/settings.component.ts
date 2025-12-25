/**
 * settings.component.ts
 *
 * Composant PARAMÈTRES - Configuration de l'application.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page où l'utilisateur peut personnaliser son expérience :
 * - Durées du Pomodoro (travail, pause courte, pause longue)
 * - Notifications (activer/désactiver, sons)
 * - Thème (clair/sombre) - futur
 * - Export/Import des données
 * - Réinitialisation de la progression
 *
 * Analogie du monde réel :
 * -----------------------
 * C'est comme le menu "Préférences" de n'importe quel logiciel.
 * Tu ajustes le comportement de l'app selon TES besoins.
 *
 * Exemple concret :
 * Si tu préfères des sessions de 50 minutes au lieu de 25,
 * c'est ici que tu changes ça.
 *
 * Architecture des paramètres :
 * ---------------------------
 * Les paramètres sont stockés dans le StorageService (IndexedDB).
 * Ça permet de les conserver entre les sessions.
 *
 * Philosophie David J. Malan :
 * "A good application adapts to the user, not the other way around."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { StorageService } from '../../core/services/storage.service';
import { NotificationService } from '../../core/services/notification.service';
import { PomodoroService } from '../../core/services/pomodoro.service';

/**
 * Interface pour les paramètres Pomodoro
 * -------------------------------------
 * Durées en minutes pour chaque type de session.
 */
interface PomodoroSettings {
  workDuration: number;      // Durée de travail (défaut: 25 min)
  shortBreakDuration: number; // Pause courte (défaut: 5 min)
  longBreakDuration: number;  // Pause longue (défaut: 15 min)
  sessionsBeforeLongBreak: number; // Nombre de sessions avant pause longue
}

/**
 * Interface pour les paramètres de notification
 */
interface NotificationSettings {
  enabled: boolean;           // Notifications activées ?
  sound: boolean;             // Son activé ?
  soundVolume: number;        // Volume (0-100)
  reminderEnabled: boolean;   // Rappels quotidiens ?
  reminderTime: string;       // Heure du rappel (HH:mm)
}

/**
 * Interface pour tous les paramètres
 */
interface AppSettings {
  pomodoro: PomodoroSettings;
  notifications: NotificationSettings;
  theme: 'dark' | 'light';
  language: 'fr' | 'en';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  // ============================================================
  // ÉTAT DES PARAMÈTRES
  // ============================================================

  /**
   * Paramètres actuels de l'application
   * ----------------------------------
   * Ces valeurs sont liées au formulaire avec [(ngModel)].
   * Quand l'utilisateur modifie un champ, la valeur ici change.
   */
  settings: AppSettings = {
    pomodoro: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4
    },
    notifications: {
      enabled: true,
      sound: true,
      soundVolume: 80,
      reminderEnabled: false,
      reminderTime: '09:00'
    },
    theme: 'dark',
    language: 'fr'
  };

  /**
   * États UI
   */
  isSaving: boolean = false;
  showResetConfirm: boolean = false;
  showExportModal: boolean = false;
  lastSaved: Date | null = null;

  /**
   * Message de feedback
   */
  feedbackMessage: string = '';
  feedbackType: 'success' | 'error' | 'info' = 'info';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService,
    private pomodoroService: PomodoroService
  ) {}

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  /**
   * ngOnInit - Charge les paramètres sauvegardés
   */
  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  // ============================================================
  // CHARGEMENT / SAUVEGARDE
  // ============================================================

  /**
   * Charge les paramètres depuis le stockage
   * ----------------------------------------
   * Si aucun paramètre n'existe, on garde les valeurs par défaut.
   */
  async loadSettings(): Promise<void> {
    try {
      const saved = await this.storageService.get<AppSettings>('app-settings');
      if (saved) {
        // Fusion avec les valeurs par défaut (au cas où de nouveaux champs ont été ajoutés)
        this.settings = { ...this.settings, ...saved };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      this.showFeedback('Erreur lors du chargement des paramètres', 'error');
    }
  }

  /**
   * Sauvegarde les paramètres
   * ------------------------
   * Appelé automatiquement quand un paramètre change.
   */
  async saveSettings(): Promise<void> {
    this.isSaving = true;

    try {
      await this.storageService.set('app-settings', this.settings);
      this.lastSaved = new Date();
      this.showFeedback('Paramètres sauvegardés !', 'success');

      // Applique les changements Pomodoro
      this.applyPomodoroSettings();

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      this.showFeedback('Erreur lors de la sauvegarde', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Applique les paramètres Pomodoro au service
   * -------------------------------------------
   * Convertit les minutes (interface utilisateur) en secondes (service).
   */
  private applyPomodoroSettings(): void {
    this.pomodoroService.updateSettings({
      // Conversion minutes → secondes (le service travaille en secondes)
      workDuration: this.settings.pomodoro.workDuration * 60,
      shortBreakDuration: this.settings.pomodoro.shortBreakDuration * 60,
      longBreakDuration: this.settings.pomodoro.longBreakDuration * 60
    });
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Réinitialise les paramètres aux valeurs par défaut
   */
  async resetToDefaults(): Promise<void> {
    this.settings = {
      pomodoro: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4
      },
      notifications: {
        enabled: true,
        sound: true,
        soundVolume: 80,
        reminderEnabled: false,
        reminderTime: '09:00'
      },
      theme: 'dark',
      language: 'fr'
    };

    await this.saveSettings();
    this.showResetConfirm = false;
    this.showFeedback('Paramètres réinitialisés', 'info');
  }

  /**
   * Exporte toutes les données en JSON
   * ----------------------------------
   * Permet à l'utilisateur de sauvegarder sa progression.
   */
  async exportData(): Promise<void> {
    try {
      // Récupère toutes les données
      const allData = await this.storageService.exportAll();

      // Crée un blob JSON
      const blob = new Blob([JSON.stringify(allData, null, 2)], {
        type: 'application/json'
      });

      // Crée un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `study-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      this.showFeedback('Données exportées avec succès !', 'success');

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      this.showFeedback('Erreur lors de l\'export', 'error');
    }
  }

  /**
   * Importe des données depuis un fichier JSON
   */
  async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      await this.storageService.importAll(data);
      await this.loadSettings();

      this.showFeedback('Données importées avec succès !', 'success');

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      this.showFeedback('Fichier invalide ou erreur d\'import', 'error');
    }

    // Reset le champ file
    input.value = '';
  }

  /**
   * Réinitialise TOUTE la progression
   * ---------------------------------
   * ATTENTION: Action irréversible !
   */
  async resetAllProgress(): Promise<void> {
    if (!confirm('Es-tu SÛR de vouloir réinitialiser TOUTE ta progression ? Cette action est IRRÉVERSIBLE !')) {
      return;
    }

    try {
      await this.storageService.clear();
      this.showFeedback('Progression réinitialisée. Recharge la page.', 'info');

      // Recharge après 2 secondes
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      this.showFeedback('Erreur lors de la réinitialisation', 'error');
    }
  }

  /**
   * Teste les notifications
   */
  testNotification(): void {
    this.notificationService.showNotification(
      'Test de notification',
      'Si tu vois ce message, les notifications fonctionnent ! 🎉',
      this.settings.notifications.sound
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Affiche un message de feedback temporaire
   */
  private showFeedback(message: string, type: 'success' | 'error' | 'info'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;

    // Efface après 3 secondes
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 3000);
  }

  /**
   * Formate une durée en texte lisible
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI des valeurs par défaut bien choisies ?
 *
 *    La technique Pomodoro standard = 25/5/15 minutes.
 *    On utilise ces valeurs car elles sont ÉPROUVÉES.
 *
 *    Principe UX : "Good defaults"
 *    L'app devrait fonctionner parfaitement sans aucune config.
 *    Les paramètres sont pour ceux qui veulent PERSONNALISER.
 *
 * 2. POURQUOI l'export/import ?
 *
 *    PROBLÈME : Les données sont stockées localement (IndexedDB).
 *    Si l'utilisateur change de navigateur ou formate son PC,
 *    il perd tout !
 *
 *    SOLUTION : Export JSON = sauvegarde portable.
 *    Import = restauration sur n'importe quel appareil.
 *
 * 3. POURQUOI le double confirm pour reset ?
 *
 *    C'est une action DESTRUCTIVE et IRRÉVERSIBLE.
 *
 *    Pattern UX : "Progressive disclosure of danger"
 *    - Premier bouton caché dans une section "Danger zone"
 *    - Confirmation explicite avec texte d'avertissement
 *    - Délai avant action (évite les clics accidentels)
 *
 * 4. POURQUOI async/await plutôt que .then() ?
 *
 *    Lisibilité :
 *
 *    AVEC .then() :
 *    storage.get('settings')
 *      .then(settings => {
 *        this.settings = settings;
 *        return storage.get('other');
 *      })
 *      .then(other => { ... })
 *      .catch(error => { ... });
 *
 *    AVEC async/await :
 *    const settings = await storage.get('settings');
 *    const other = await storage.get('other');
 *
 *    Le code async/await se lit comme du code synchrone !
 *
 * 5. POURQUOI la fusion avec les valeurs par défaut ?
 *
 *    { ...this.settings, ...saved }
 *
 *    PROBLÈME : On ajoute un nouveau paramètre dans la v2.
 *    Les utilisateurs de la v1 n'ont pas ce paramètre sauvegardé.
 *
 *    SOLUTION : On prend les valeurs sauvegardées,
 *    mais on garde les défauts pour les champs manquants.
 *
 *    C'est la RÉTROCOMPATIBILITÉ.
 *
 * Citation de Alan Kay :
 * "Simple things should be simple, complex things should be possible."
 */
