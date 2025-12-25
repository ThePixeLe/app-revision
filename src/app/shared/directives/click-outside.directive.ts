/**
 * click-outside.directive.ts
 *
 * Directive de détection de clic EN DEHORS d'un élément.
 *
 * Qu'est-ce que ce directive fait ?
 * --------------------------------
 * Émet un événement quand l'utilisateur clique n'importe où
 * SAUF sur l'élément ou ses enfants.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine une bulle de conversation (tooltip) :
 * - Tu cliques dessus → Elle reste ouverte
 * - Tu cliques ailleurs → Elle se ferme
 *
 * Cette directive implémente exactement ça.
 *
 * Cas d'utilisation :
 * ------------------
 * - Fermer un dropdown quand on clique ailleurs
 * - Fermer une modale en cliquant sur l'overlay
 * - Désélectionner un élément quand on clique ailleurs
 * - Fermer un menu mobile
 *
 * Utilisation :
 * ```html
 * <div class="dropdown" (appClickOutside)="closeDropdown()">
 *   <!-- Contenu du dropdown -->
 * </div>
 * ```
 *
 * Philosophie David J. Malan :
 * "Intuitive behavior is invisible behavior."
 *
 * Les utilisateurs s'ATTENDENT à ce qu'un clic dehors ferme les choses.
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  OnDestroy
} from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements OnDestroy {

  /**
   * Événement émis lors d'un clic extérieur
   * --------------------------------------
   * L'événement contient l'objet MouseEvent original.
   */
  @Output() appClickOutside = new EventEmitter<MouseEvent>();

  /**
   * Activer/désactiver la détection
   * -------------------------------
   * Utile pour temporairement ignorer les clics.
   */
  @Input() clickOutsideEnabled: boolean = true;

  /**
   * Délai avant d'activer la détection (en ms)
   * -----------------------------------------
   * Évite de détecter le clic qui a ouvert l'élément.
   */
  @Input() clickOutsideDelay: number = 100;

  /**
   * Sélecteurs CSS à exclure
   * -----------------------
   * Les clics sur ces éléments ne déclenchent pas l'événement.
   * Utile pour les boutons qui ouvrent le dropdown.
   *
   * @example
   * ```html
   * <div (appClickOutside)="close()" [clickOutsideExclude]="'.toggle-btn'">
   * ```
   */
  @Input() clickOutsideExclude: string = '';

  /**
   * Timestamp de création
   * --------------------
   * Pour implémenter le délai.
   */
  private createdAt: number;

  constructor(private elementRef: ElementRef<HTMLElement>) {
    this.createdAt = Date.now();
  }

  /**
   * Nettoyage
   */
  ngOnDestroy(): void {
    // Rien à nettoyer car on utilise @HostListener
    // qui se désinscrit automatiquement
  }

  /**
   * Écoute les clics sur le document
   * --------------------------------
   * @HostListener écoute au niveau du DOCUMENT,
   * pas seulement sur l'élément.
   */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    // Vérifie si la détection est activée
    if (!this.clickOutsideEnabled) {
      return;
    }

    // Vérifie le délai (évite les faux positifs au montage)
    if (Date.now() - this.createdAt < this.clickOutsideDelay) {
      return;
    }

    const target = event.target as HTMLElement;

    // Vérifie si le clic est SUR l'élément ou ses enfants
    if (this.elementRef.nativeElement.contains(target)) {
      return; // Clic à l'intérieur, on ignore
    }

    // Vérifie les exclusions
    if (this.isExcluded(target)) {
      return; // Clic sur un élément exclu, on ignore
    }

    // C'est un clic extérieur !
    this.appClickOutside.emit(event);
  }

  /**
   * Vérifie si l'élément cliqué est exclu
   */
  private isExcluded(target: HTMLElement): boolean {
    if (!this.clickOutsideExclude) {
      return false;
    }

    // Parse les sélecteurs (séparés par des virgules)
    const selectors = this.clickOutsideExclude
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    // Vérifie chaque sélecteur
    for (const selector of selectors) {
      try {
        // L'élément correspond au sélecteur ?
        if (target.matches(selector)) {
          return true;
        }
        // Ou un de ses parents ?
        if (target.closest(selector)) {
          return true;
        }
      } catch {
        // Sélecteur invalide, on ignore
        console.warn(`ClickOutsideDirective: Invalid selector "${selector}"`);
      }
    }

    return false;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI @HostListener('document:click') ?
 *
 *    PORTÉE DE L'ÉCOUTE :
 *    - @HostListener('click') → Écoute l'élément SEULEMENT
 *    - @HostListener('document:click') → Écoute TOUT le document
 *
 *    Pour détecter un clic "ailleurs", il faut écouter partout !
 *
 * 2. POURQUOI un délai au démarrage ?
 *
 *    PROBLÈME DU CLIC D'OUVERTURE :
 *    ```html
 *    <button (click)="isOpen = true">Ouvrir</button>
 *    <div *ngIf="isOpen" (appClickOutside)="isOpen = false">
 *      Menu
 *    </div>
 *    ```
 *
 *    Sans délai :
 *    1. Clic sur le bouton → isOpen = true
 *    2. Le div apparaît avec la directive
 *    3. La directive détecte le clic (encore en cours !) → isOpen = false
 *    4. Le menu ne s'ouvre jamais !
 *
 *    Avec délai : La directive ignore les 100 premières ms.
 *
 * 3. POURQUOI contains() plutôt que === ?
 *
 *    ENFANTS :
 *    ```html
 *    <div appClickOutside>
 *      <button>Bouton</button>  <!-- Clic ici = à l'intérieur ! -->
 *    </div>
 *    ```
 *
 *    contains() vérifie si l'élément cliqué est l'élément LUI-MÊME
 *    OU un de ses descendants.
 *
 * 4. POURQUOI l'option d'exclusion ?
 *
 *    BOUTON TOGGLE :
 *    Le bouton qui ouvre le menu est souvent EN DEHORS du menu.
 *    Sans exclusion, cliquer sur le bouton pour fermer le menu
 *    déclencherait deux événements (toggle + clickOutside).
 *
 *    L'exclusion permet d'ignorer le bouton toggle.
 *
 * Citation de Luke Wroblewski :
 * "Obvious always wins."
 *
 * Un clic dehors qui ferme = comportement évident et attendu.
 */
