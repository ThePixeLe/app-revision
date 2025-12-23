/**
 * calendar-sync.service.ts
 *
 * Service de SYNCHRONISATION avec Apple Calendar.
 *
 * Note importante sur les limitations web :
 * ----------------------------------------
 * Une application web (Angular dans le navigateur) NE PEUT PAS
 * directement accéder à Apple Calendar pour des raisons de sécurité.
 *
 * Solutions disponibles :
 * ----------------------
 * 1. Export iCal (.ics) - L'utilisateur télécharge un fichier
 * 2. CalDAV API - Nécessite un serveur backend
 * 3. Electron - Transforme l'app en app native (hors scope)
 *
 * Ce service implémente la solution #1 : EXPORT iCal
 *
 * Comment ça marche ?
 * ------------------
 * 1. On génère un fichier .ics (format standard des calendriers)
 * 2. L'utilisateur le télécharge
 * 3. Il double-clique dessus → ça s'ouvre dans Calendar.app
 * 4. Il peut choisir d'importer les événements
 *
 * Analogie du monde réel :
 * ----------------------
 * C'est comme exporter tes contacts depuis ton téléphone
 * vers un fichier vCard (.vcf), puis l'importer ailleurs.
 *
 * Philosophie David J. Malan :
 * "Use standards. They exist for a reason."
 *
 * iCalendar (.ics) est un STANDARD mondial (RFC 5545)
 * supporté par TOUS les systèmes de calendrier :
 * - Apple Calendar
 * - Google Calendar
 * - Outlook
 * - Etc.
 *
 * Responsabilités de ce service :
 * ------------------------------
 * 1. Générer des fichiers .ics depuis le planning
 * 2. Permettre le téléchargement
 * 3. Suivre quels événements ont été exportés
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

// Import des modèles
import { Day, Session } from '../models/day.model';

// Import des services
import { PlanningService } from './planning.service';

/**
 * Événement calendrier
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  url?: string;
  alarm?: number; // Minutes avant l'événement
}

/**
 * Service Injectable
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarSyncService {

  /**
   * Constructeur
   */
  constructor(
    private planningService: PlanningService
  ) {}

  // ============================================================
  // GÉNÉRATION D'ÉVÉNEMENTS DEPUIS LE PLANNING
  // ============================================================

  /**
   * CONVERTIR LE PLANNING EN ÉVÉNEMENTS
   * ----------------------------------
   * Transforme tous les jours et sessions en événements calendrier.
   *
   * @returns Observable d'événements
   */
  generateEventsFromPlanning(): Observable<CalendarEvent[]> {
    return this.planningService.getAllDays().pipe(
      map(days => {
        const events: CalendarEvent[] = [];

        days.forEach(day => {
          // Crée un événement pour chaque session
          day.sessions.forEach(session => {
            const event = this.sessionToEvent(day, session);
            events.push(event);
          });
        });

        return events;
      })
    );
  }

  /**
   * CONVERTIR UNE SESSION EN ÉVÉNEMENT
   * ---------------------------------
   * Transforme une session du planning en événement calendrier.
   */
  private sessionToEvent(day: Day, session: Session): CalendarEvent {
    // Détermine l'heure de début selon la période
    const startDate = new Date(day.date);

    switch (session.period) {
      case 'matin':
        startDate.setHours(9, 0, 0, 0); // 9h00
        break;
      case 'apres-midi':
        startDate.setHours(14, 0, 0, 0); // 14h00
        break;
      case 'soir':
        startDate.setHours(17, 0, 0, 0); // 17h00
        break;
    }

    // Calcule l'heure de fin (durée en minutes)
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + session.duration);

    // Construit la description
    const description = [
      `📚 Sujets : ${session.topics.join(', ')}`,
      session.documents.length > 0 ? `📄 Documents : ${session.documents.join(', ')}` : '',
      session.exercises.length > 0 ? `✏️ Exercices : ${session.exercises.length}` : ''
    ].filter(Boolean).join('\n');

    return {
      id: session.id,
      title: `${day.title} - ${this.getPeriodLabel(session.period)}`,
      description,
      startDate,
      endDate,
      alarm: 15 // Rappel 15 minutes avant
    };
  }

  /**
   * OBTENIR LE LABEL DE LA PÉRIODE
   */
  private getPeriodLabel(period: 'matin' | 'apres-midi' | 'soir'): string {
    switch (period) {
      case 'matin': return 'Matin';
      case 'apres-midi': return 'Après-midi';
      case 'soir': return 'Soir';
    }
  }

  // ============================================================
  // GÉNÉRATION DE FICHIERS iCAL (.ics)
  // ============================================================

  /**
   * GÉNÉRER UN FICHIER iCAL
   * ----------------------
   * Crée le contenu d'un fichier .ics au format standard RFC 5545.
   *
   * @param events - Liste d'événements
   * @returns Contenu du fichier .ics (string)
   *
   * Format iCalendar :
   * -----------------
   * BEGIN:VCALENDAR
   * VERSION:2.0
   * PRODID:-//Study Tracker Pro//NONSGML v1.0//EN
   * BEGIN:VEVENT
   * UID:unique-id@studytracker.com
   * DTSTAMP:20241223T120000Z
   * DTSTART:20241225T090000
   * DTEND:20241225T113000
   * SUMMARY:Algèbre de Boole - Matin
   * DESCRIPTION:...
   * END:VEVENT
   * END:VCALENDAR
   */
  generateICalContent(events: CalendarEvent[]): string {
    // En-tête du fichier iCal
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Study Tracker Pro//NONSGML v1.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Study Tracker - Programme 12 jours',
      'X-WR-TIMEZONE:Europe/Paris',
      'X-WR-CALDESC:Planning d\'apprentissage Algèbre de Boole, Algo et Java'
    ].join('\r\n');

    // Ajoute chaque événement
    events.forEach(event => {
      ical += '\r\n' + this.eventToICalEvent(event);
    });

    // Fin du fichier
    ical += '\r\nEND:VCALENDAR';

    return ical;
  }

  /**
   * CONVERTIR UN ÉVÉNEMENT EN FORMAT iCAL
   * ------------------------------------
   */
  private eventToICalEvent(event: CalendarEvent): string {
    // Génère un UID unique (nécessaire pour iCal)
    const uid = `${event.id}@studytracker.com`;

    // Formate les dates en format iCal (YYYYMMDDTHHmmss)
    const dtStart = this.formatDateForICal(event.startDate);
    const dtEnd = this.formatDateForICal(event.endDate);
    const dtStamp = this.formatDateForICal(new Date());

    // Échappe les caractères spéciaux dans le texte
    const summary = this.escapeICalText(event.title);
    const description = this.escapeICalText(event.description);

    // Construit l'événement
    const lines = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0'
    ];

    // Ajoute l'alarme (rappel) si défini
    if (event.alarm) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${summary}`);
      lines.push(`TRIGGER:-PT${event.alarm}M`); // PT15M = 15 minutes avant
      lines.push('END:VALARM');
    }

    // Ajoute l'URL si définie
    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    lines.push('END:VEVENT');

    return lines.join('\r\n');
  }

  /**
   * FORMATER UNE DATE POUR iCAL
   * --------------------------
   * Format : YYYYMMDDTHHmmss
   * Exemple : 20241225T090000 = 25 décembre 2024, 9h00
   */
  private formatDateForICal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  /**
   * ÉCHAPPER LES CARACTÈRES SPÉCIAUX
   * -------------------------------
   * Dans iCal, certains caractères doivent être échappés.
   */
  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')   // Backslash → \\
      .replace(/;/g, '\\;')     // Point-virgule → \;
      .replace(/,/g, '\\,')     // Virgule → \,
      .replace(/\n/g, '\\n');   // Nouvelle ligne → \n
  }

  // ============================================================
  // TÉLÉCHARGEMENT
  // ============================================================

  /**
   * TÉLÉCHARGER LE PLANNING COMPLET
   * ------------------------------
   * Génère et télécharge un fichier .ics avec tout le planning.
   *
   * Exemple d'utilisation (dans un composant) :
   * ```typescript
   * exportToCalendar() {
   *   this.calendarSyncService.downloadPlanningAsICal();
   * }
   * ```
   */
  downloadPlanningAsICal(): void {
    console.log('📥 Export du planning vers iCal...');

    this.generateEventsFromPlanning().subscribe(events => {
      const icalContent = this.generateICalContent(events);
      this.downloadFile(icalContent, 'study-tracker-planning.ics', 'text/calendar');

      console.log(`✅ ${events.length} événements exportés !`);
    });
  }

  /**
   * TÉLÉCHARGER UN JOUR SPÉCIFIQUE
   * -----------------------------
   */
  downloadDayAsICal(dayId: string): void {
    this.planningService.getDayById(dayId).subscribe(day => {
      if (!day) {
        console.error('Jour non trouvé');
        return;
      }

      const events = day.sessions.map(session =>
        this.sessionToEvent(day, session)
      );

      const icalContent = this.generateICalContent(events);
      const filename = `study-tracker-${dayId}.ics`;

      this.downloadFile(icalContent, filename, 'text/calendar');

      console.log(`✅ Jour "${day.title}" exporté !`);
    });
  }

  /**
   * TÉLÉCHARGER UN FICHIER
   * ---------------------
   * Fonction utilitaire pour déclencher le téléchargement d'un fichier.
   *
   * Comment ça marche ?
   * ------------------
   * 1. Crée un Blob (Binary Large Object) avec le contenu
   * 2. Crée une URL temporaire vers ce Blob
   * 3. Crée un élément <a> invisible avec cette URL
   * 4. Simule un clic sur ce lien → téléchargement !
   * 5. Nettoie l'URL temporaire
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    // Crée un Blob avec le contenu
    const blob = new Blob([content], { type: mimeType });

    // Crée une URL temporaire
    const url = window.URL.createObjectURL(blob);

    // Crée un lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Ajoute le lien au DOM (nécessaire pour certains navigateurs)
    document.body.appendChild(link);

    // Simule un clic
    link.click();

    // Nettoie
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log(`📥 Fichier téléchargé : ${filename}`);
  }

  // ============================================================
  // IMPORT (FUTURE FEATURE)
  // ============================================================

  /**
   * IMPORTER DEPUIS UN FICHIER iCAL
   * ------------------------------
   * Note : Cette fonctionnalité nécessiterait un parser iCal.
   * Pour l'instant, c'est juste une structure pour le futur.
   *
   * @param icalContent - Contenu d'un fichier .ics
   * @returns Liste d'événements parsés
   */
  parseICalContent(icalContent: string): CalendarEvent[] {
    // TODO: Implémenter un parser iCal
    // Bibliothèque recommandée : ical.js
    console.warn('⚠️ Import iCal pas encore implémenté');
    return [];
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * GÉNÉRER UN LIEN webcal://
   * ------------------------
   * webcal:// permet de s'abonner à un calendrier en ligne.
   *
   * Note : Nécessite un serveur pour héberger le fichier .ics
   * Hors scope pour une app localhost.
   */
  generateWebcalUrl(icsUrl: string): string {
    return icsUrl.replace(/^https?:/, 'webcal:');
  }

  /**
   * OBTENIR DES INSTRUCTIONS D'IMPORT
   * --------------------------------
   * Retourne un guide pour l'utilisateur.
   */
  getImportInstructions(): string {
    return `
📅 Comment importer dans Apple Calendar :

1. Cliquez sur "Exporter vers Calendar" ci-dessous
2. Un fichier .ics sera téléchargé
3. Double-cliquez sur le fichier téléchargé
4. Calendar.app s'ouvrira automatiquement
5. Choisissez le calendrier de destination
6. Cliquez sur "Ajouter"

✅ Tous les événements seront ajoutés à votre calendrier !

💡 Astuce : Vous pouvez aussi glisser-déposer le fichier .ics
directement dans Calendar.app.
    `.trim();
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI utiliser le format iCal (.ics) ?
 *
 *    Principe d'interopérabilité :
 *    Un standard universel fonctionne PARTOUT.
 *
 *    iCalendar (RFC 5545) est supporté par :
 *    - Apple Calendar
 *    - Google Calendar
 *    - Microsoft Outlook
 *    - Tous les calendriers modernes
 *
 *    Un seul format, compatibilité universelle !
 *
 * 2. POURQUOI ne pas faire une vraie synchronisation bidirectionnelle ?
 *
 *    Limitations techniques :
 *    - Une app web ne peut pas accéder directement à Calendar.app
 *    - Nécessiterait un serveur backend + API CalDAV
 *    - Complexité énorme pour un bénéfice limité
 *
 *    Solution pragmatique :
 *    Export .ics = 80% du bénéfice, 5% de la complexité
 *
 * 3. POURQUOI ajouter des alarmes (rappels) aux événements ?
 *
 *    Psychologie de la mémoire prospective :
 *    On oublie facilement ce qu'on doit faire dans le futur.
 *
 *    Un rappel 15 min avant :
 *    - Te prépare mentalement
 *    - Te donne le temps de terminer ce que tu fais
 *    - Réduit la charge cognitive ("plus besoin d'y penser")
 *
 * Citation de David Allen (Getting Things Done) :
 * "Your mind is for having ideas, not holding them."
 *
 * Ton cerveau ne devrait PAS stocker ton planning.
 * C'est le job de Calendar.app !
 *
 * Libère ta RAM mentale pour l'apprentissage 🧠
 *
 
