/**
 * notification.service.ts
 *
 * Service de gestion des NOTIFICATIONS système.
 *
 * Qu'est-ce qu'une notification ?
 * ------------------------------
 * C'est un message qui s'affiche sur ton Mac, même si l'app n'est pas au premier plan.
 *
 * Exemples :
 * - "⏰ Pomodoro terminé ! Prends une pause de 5 minutes"
 * - "🎉 Badge débloqué : Maître des Boucles !"
 * - "📅 Rappel : Session de l'après-midi dans 15 minutes"
 *
 * Analogie du monde réel :
 * ----------------------
 * C'est comme un assistant personnel qui te tape sur l'épaule
 * pour te rappeler quelque chose d'important.
 *
 * API utilisée : Web Notifications API
 * -----------------------------------
 * C'est un standard web supporté par tous les navigateurs modernes.
 * Sur macOS, les notifications apparaissent dans le Notification Center.
 *
 * Responsabilités de ce service :
 * ------------------------------
 * 1. Demander la permission d'envoyer des notifications
 * 2. Envoyer des notifications système
 * 3. Jouer des sons (optionnel)
 * 4. Gérer les clics sur les notifications
 *
 * Philosophie David J. Malan :
 * "Good software respects user attention."
 *
 * On n'abuse PAS des notifications !
 * Seulement pour les choses VRAIMENT importantes.
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Type de notification
 */
export type NotificationType =
  | 'success'   // Succès (badge débloqué, quête terminée)
  | 'info'      // Information (rappel, suggestion)
  | 'warning'   // Avertissement (deadline proche)
  | 'error';    // Erreur (rare, mais au cas où)

/**
 * Options de notification
 */
export interface NotificationOptions {
  title: string;          // Titre de la notification
  body: string;           // Contenu du message
  type?: NotificationType; // Type (affecte l'icône)
  icon?: string;          // URL d'une icône personnalisée
  badge?: string;         // Petite icône de badge
  tag?: string;           // Tag pour grouper les notifications
  requireInteraction?: boolean; // La notif reste jusqu'au clic
  silent?: boolean;       // Pas de son
  vibrate?: number[];     // Pattern de vibration (mobile)
  actions?: NotificationAction[]; // Boutons d'action
  data?: any;             // Données personnalisées
}

/**
 * Action de notification (boutons)
 */
export interface NotificationAction {
  action: string;  // Identifiant de l'action
  title: string;   // Texte du bouton
  icon?: string;   // Icône du bouton
}

/**
 * Paramètres de notification
 */
export interface NotificationSettings {
  enabled: boolean;           // Notifications activées/désactivées
  sound: boolean;             // Jouer un son
  desktop: boolean;           // Notifications desktop
  frequency: 'all' | 'important' | 'none'; // Fréquence
}

/**
 * Service Injectable
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  /**
   * Permission des notifications
   * ---------------------------
   * "default" : Pas encore demandé
   * "granted" : Autorisé ✅
   * "denied" : Refusé ❌
   */
  private permissionSubject = new BehaviorSubject<NotificationPermission>('default');
  public permission$: Observable<NotificationPermission> = this.permissionSubject.asObservable();

  /**
   * Paramètres des notifications
   */
  private settingsSubject = new BehaviorSubject<NotificationSettings>({
    enabled: true,
    sound: true,
    desktop: true,
    frequency: 'all'
  });
  public settings$: Observable<NotificationSettings> = this.settingsSubject.asObservable();

  /**
   * Constructeur
   */
  constructor() {
    // Vérifie si les notifications sont supportées
    if (!('Notification' in window)) {
      console.warn('⚠️ Les notifications ne sont pas supportées par ce navigateur');
    } else {
      // Récupère la permission actuelle
      this.permissionSubject.next(Notification.permission);
    }

    // Charge les paramètres sauvegardés
    this.loadSettings();
  }

  // ============================================================
  // GESTION DE LA PERMISSION
  // ============================================================

  /**
   * DEMANDER LA PERMISSION
   * ---------------------
   * Affiche un popup natif du navigateur pour demander l'autorisation.
   *
   * Important : Cette méthode DOIT être appelée suite à une action utilisateur
   * (clic sur un bouton), sinon le navigateur la bloquera !
   *
   * @returns Promise<boolean> - true si autorisé, false sinon
   *
   * Exemple :
   * ```typescript
   * // Dans un composant, sur un clic de bouton
   * async enableNotifications() {
   *   const granted = await this.notificationService.requestPermission();
   *   if (granted) {
   *     console.log('Notifications activées !');
   *   } else {
   *     console.log('Notifications refusées');
   *   }
   * }
   * ```
   */
  async requestPermission(): Promise<boolean> {
    // Vérifie si les notifications sont supportées
    if (!('Notification' in window)) {
      console.error('❌ Notifications non supportées');
      return false;
    }

    // Si déjà autorisé, retourne true
    if (Notification.permission === 'granted') {
      return true;
    }

    // Si déjà refusé, retourne false
    if (Notification.permission === 'denied') {
      console.warn('⚠️ Notifications refusées par l\'utilisateur');
      return false;
    }

    try {
      // Demande la permission
      const permission = await Notification.requestPermission();

      this.permissionSubject.next(permission);

      if (permission === 'granted') {
        console.log('✅ Notifications autorisées !');
        return true;
      } else {
        console.log('❌ Notifications refusées');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  /**
   * VÉRIFIER SI LES NOTIFICATIONS SONT AUTORISÉES
   */
  isGranted(): boolean {
    return Notification.permission === 'granted';
  }

  // ============================================================
  // ENVOI DE NOTIFICATIONS
  // ============================================================

  /**
   * ENVOYER UNE NOTIFICATION
   * -----------------------
   * Affiche une notification système.
   *
   * @param options - Options de la notification
   * @returns L'objet Notification créé (ou null si échoué)
   *
   * Exemples d'utilisation :
   * ```typescript
   * // Notification simple
   * this.notificationService.notify({
   *   title: 'Pomodoro terminé !',
   *   body: 'Prends une pause de 5 minutes 😊'
   * });
   *
   * // Notification avec type
   * this.notificationService.notify({
   *   title: 'Badge débloqué !',
   *   body: 'Tu as obtenu : Maître des Boucles 🏆',
   *   type: 'success'
   * });
   *
   * // Notification avec son désactivé
   * this.notificationService.notify({
   *   title: 'Rappel',
   *   body: 'N\'oublie pas de faire tes révisions',
   *   type: 'info',
   *   silent: true
   * });
   * ```
   */
  notify(options: NotificationOptions): Notification | null {
    // Vérifie les paramètres
    const settings = this.settingsSubject.value;

    if (!settings.enabled || !settings.desktop) {
      console.log('🔕 Notifications désactivées dans les paramètres');
      return null;
    }

    // Vérifie la fréquence
    if (settings.frequency === 'none') {
      return null;
    }

    if (settings.frequency === 'important' && options.type !== 'success' && options.type !== 'warning') {
      return null;
    }

    // Vérifie la permission
    if (!this.isGranted()) {
      console.warn('⚠️ Permission de notification non accordée');
      return null;
    }

    try {
      // Prépare les options de la notification
      const notificationOptions: NotificationOptions = {
        title: options.title,
        body: options.body,
        icon: options.icon || this.getIconForType(options.type),
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || !settings.sound,
        vibrate: options.vibrate,
        data: options.data
      };

      // Crée la notification
      const notification = new Notification(options.title, notificationOptions);

      // Gère le clic sur la notification
      notification.onclick = (event) => {
        event.preventDefault(); // Empêche le comportement par défaut
        window.focus(); // Ramène l'app au premier plan
        notification.close(); // Ferme la notification

        // Callback personnalisé si fourni
        if (options.data?.onClick) {
          options.data.onClick();
        }
      };

      // Auto-fermeture après 5 secondes (si pas requireInteraction)
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      console.log('🔔 Notification envoyée:', options.title);
      return notification;

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
      return null;
    }
  }

  /**
   * OBTENIR L'ICÔNE SELON LE TYPE
   * ----------------------------
   * Retourne l'emoji approprié selon le type de notification.
   */
  private getIconForType(type?: NotificationType): string {
    // En production, tu utiliserais de vraies images
    // Pour l'instant, on utilise des emojis
    switch (type) {
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '🔔';
    }
  }

  // ============================================================
  // NOTIFICATIONS PRÉDÉFINIES
  // ============================================================

  /**
   * NOTIFICATION : POMODORO TERMINÉ
   */
  notifyPomodoroComplete(isBreak: boolean = false): void {
    if (isBreak) {
      this.notify({
        title: '⏰ Pause terminée !',
        body: 'Prêt pour un nouveau Pomodoro ? 💪',
        type: 'info',
        requireInteraction: true
      });
    } else {
      this.notify({
        title: '⏰ Pomodoro terminé !',
        body: 'Bravo ! Prends une pause de 5 minutes 😊',
        type: 'success',
        requireInteraction: true
      });
    }
  }

  /**
   * NOTIFICATION : BADGE DÉBLOQUÉ
   */
  notifyBadgeUnlocked(badgeName: string, xpReward: number): void {
    this.notify({
      title: '🏆 Badge débloqué !',
      body: `${badgeName} (+${xpReward} XP)`,
      type: 'success',
      requireInteraction: true
    });
  }

  /**
   * NOTIFICATION : QUÊTE COMPLÉTÉE
   */
  notifyQuestCompleted(questTitle: string, xpReward: number): void {
    this.notify({
      title: '🎯 Quête terminée !',
      body: `${questTitle} (+${xpReward} XP)`,
      type: 'success',
      requireInteraction: true
    });
  }

  /**
   * NOTIFICATION : LEVEL UP
   */
  notifyLevelUp(newLevel: number): void {
    this.notify({
      title: '🎉 LEVEL UP !',
      body: `Tu es maintenant niveau ${newLevel} ! Continue comme ça ! 🚀`,
      type: 'success',
      requireInteraction: true
    });
  }

  /**
   * NOTIFICATION : STREAK BRISÉ
   */
  notifyStreakBroken(lastStreak: number): void {
    this.notify({
      title: '💔 Streak brisé',
      body: `Tu avais un streak de ${lastStreak} jours. Recommence dès aujourd'hui !`,
      type: 'warning'
    });
  }

  /**
   * NOTIFICATION : RAPPEL SESSION
   */
  notifySessionReminder(sessionTitle: string, minutesUntil: number): void {
    this.notify({
      title: '📅 Rappel',
      body: `"${sessionTitle}" commence dans ${minutesUntil} minutes`,
      type: 'info'
    });
  }

  /**
   * NOTIFICATION : RÉVISION DUE
   */
  notifyReviewDue(exerciseCount: number): void {
    this.notify({
      title: '📚 Révisions',
      body: `${exerciseCount} exercice(s) à réviser aujourd'hui`,
      type: 'info'
    });
  }

  /**
   * NOTIFICATION : OBJECTIF QUOTIDIEN ATTEINT
   */
  notifyDailyGoalAchieved(): void {
    this.notify({
      title: '🎯 Objectif atteint !',
      body: 'Félicitations ! Tu as atteint ton objectif quotidien ! 🎊',
      type: 'success'
    });
  }

  // ============================================================
  // GESTION DES PARAMÈTRES
  // ============================================================

  /**
   * CHARGER LES PARAMÈTRES
   */
  private loadSettings(): void {
    const saved = localStorage.getItem('notification_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.settingsSubject.next(settings);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de notification');
      }
    }
  }

  /**
   * SAUVEGARDER LES PARAMÈTRES
   */
  private saveSettings(settings: NotificationSettings): void {
    localStorage.setItem('notification_settings', JSON.stringify(settings));
  }

  /**
   * METTRE À JOUR LES PARAMÈTRES
   */
  updateSettings(settings: Partial<NotificationSettings>): void {
    const current = this.settingsSubject.value;
    const updated = { ...current, ...settings };

    this.settingsSubject.next(updated);
    this.saveSettings(updated);

    console.log('⚙️ Paramètres de notification mis à jour');
  }

  /**
   * ACTIVER/DÉSACTIVER LES NOTIFICATIONS
   */
  setEnabled(enabled: boolean): void {
    this.updateSettings({ enabled });
  }

  /**
   * ACTIVER/DÉSACTIVER LE SON
   */
  setSoundEnabled(enabled: boolean): void {
    this.updateSettings({ sound: enabled });
  }

  /**
   * DÉFINIR LA FRÉQUENCE
   */
  setFrequency(frequency: 'all' | 'important' | 'none'): void {
    this.updateSettings({ frequency });
  }

  // ============================================================
  // NOTIFICATIONS PROGRAMMÉES
  // ============================================================

  /**
   * PROGRAMMER UNE NOTIFICATION
   * --------------------------
   * Envoie une notification après un certain délai.
   *
   * @param options - Options de la notification
   * @param delayMs - Délai en millisecondes
   * @returns ID du timeout (pour annulation)
   *
   * Exemple :
   * ```typescript
   * // Notification dans 5 minutes
   * const id = this.notificationService.scheduleNotification({
   *   title: 'Rappel',
   *   body: 'Il est temps de faire une pause !'
   * }, 5 * 60 * 1000);
   * ```
   */
  scheduleNotification(options: NotificationOptions, delayMs: number): number {
    const timeoutId = window.setTimeout(() => {
      this.notify(options);
    }, delayMs);

    console.log(`⏰ Notification programmée dans ${delayMs / 1000}s`);
    return timeoutId;
  }

  /**
   * ANNULER UNE NOTIFICATION PROGRAMMÉE
   */
  cancelScheduledNotification(timeoutId: number): void {
    window.clearTimeout(timeoutId);
    console.log('❌ Notification programmée annulée');
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * TESTER UNE NOTIFICATION
   * ----------------------
   * Envoie une notification de test pour vérifier que tout fonctionne.
   */
  async testNotification(): Promise<void> {
    // Demande la permission si nécessaire
    if (!this.isGranted()) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.error('Permission refusée');
        return;
      }
    }

    // Envoie une notification de test
    this.notify({
      title: '🧪 Notification de test',
      body: 'Si tu vois ce message, les notifications fonctionnent ! ✅',
      type: 'info'
    });
  }

  /**
   * AFFICHER UNE NOTIFICATION (méthode simplifiée)
   * ---------------------------------------------
   * @param title - Titre de la notification
   * @param body - Corps du message
   * @param playSound - Jouer un son (optionnel)
   */
  showNotification(title: string, body: string, playSound: boolean = true): void {
    this.notify({
      title,
      body,
      type: 'info',
      silent: !playSound
    });
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI les notifications sont-elles importantes ?
 *
 *    Psychologie de l'attention :
 *    On est facilement distrait (réseaux sociaux, messages, etc.)
 *
 *    Les notifications bien utilisées RAMÈNENT l'attention
 *    au bon endroit (ton apprentissage).
 *
 * 2. POURQUOI ne pas abuser des notifications ?
 *
 *    Notification fatigue : Trop de notifications → on les ignore toutes
 *
 *    Règle d'or :
 *    - Seulement pour les VRAIES interruptions (Pomodoro fini)
 *    - Seulement pour les VRAIES victoires (badge, level up)
 *    - Jamais pour des trucs insignifiants
 *
 * 3. POURQUOI laisser l'utilisateur configurer ?
 *
 *    Respect de l'autonomie (Self-Determination Theory) :
 *    L'utilisateur doit CONTRÔLER son expérience.
 *
 *    Certains aiment beaucoup de notifications,
 *    d'autres préfèrent le silence total.
 *
 *    Les deux sont OK !
 *
 * Citation de Don Norman (The Design of Everyday Things) :
 * "Good design is actually a lot harder to notice than poor design,
 *  in part because good designs fit our needs so well that
 *  the design is invisible."
 *
 * Les bonnes notifications sont INVISIBLES :
 * Tu ne les remarques pas comme "notifications",
 * juste comme des rappels utiles qui arrivent au bon moment.
 *
 * Dernier service : CalendarSyncService !
 */
