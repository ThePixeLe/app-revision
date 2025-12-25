/**
 * auto-focus.directive.ts
 *
 * Directive de focus automatique sur un élément.
 *
 * Qu'est-ce qu'une Directive ?
 * ---------------------------
 * Une directive ajoute un COMPORTEMENT à un élément HTML existant.
 * Contrairement à un composant qui CRÉE un nouvel élément,
 * une directive MODIFIE un élément existant.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine un autocollant "Fragile" sur un colis :
 * - Le colis reste un colis
 * - Mais l'autocollant ajoute une instruction de comportement
 *
 * Une directive fait pareil :
 * - L'input reste un input
 * - Mais la directive ajoute le focus automatique
 *
 * Ce directive spécifiquement :
 * ----------------------------
 * Place le focus sur un élément dès qu'il apparaît.
 * Utile pour :
 * - Champs de recherche
 * - Modales avec formulaire
 * - Premier champ d'un formulaire
 *
 * Utilisation :
 * ```html
 * <input appAutoFocus placeholder="Rechercher..." />
 * <input [appAutoFocus]="shouldFocus" />
 * ```
 *
 * Philosophie David J. Malan :
 * "Save the user a click."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit, OnChanges {

  /**
   * Condition pour activer le focus
   * -------------------------------
   * - true ou absent : Focus activé
   * - false : Focus désactivé
   *
   * Permet un contrôle conditionnel :
   * ```html
   * <input [appAutoFocus]="isSearchMode" />
   * ```
   */
  @Input() appAutoFocus: boolean | '' = true;

  /**
   * Délai avant le focus (en ms)
   * ---------------------------
   * Utile quand l'élément est dans une animation.
   */
  @Input() autoFocusDelay: number = 0;

  /**
   * Sélectionner tout le texte après focus ?
   * ----------------------------------------
   * Pratique pour les champs pré-remplis.
   */
  @Input() autoFocusSelectAll: boolean = false;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  /**
   * Après l'initialisation de la vue
   * --------------------------------
   * Le meilleur moment pour focus car l'élément est rendu.
   */
  ngAfterViewInit(): void {
    this.focusIfEnabled();
  }

  /**
   * Quand les inputs changent
   * ------------------------
   * Permet de refocus dynamiquement.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appAutoFocus'] && !changes['appAutoFocus'].firstChange) {
      this.focusIfEnabled();
    }
  }

  /**
   * Focus si la condition est remplie
   */
  private focusIfEnabled(): void {
    // '' (attribut sans valeur) ou true = activé
    const isEnabled = this.appAutoFocus === '' || this.appAutoFocus === true;

    if (!isEnabled) {
      return;
    }

    if (this.autoFocusDelay > 0) {
      setTimeout(() => this.doFocus(), this.autoFocusDelay);
    } else {
      // Petit timeout pour laisser Angular finir le rendu
      setTimeout(() => this.doFocus(), 0);
    }
  }

  /**
   * Effectue le focus
   */
  private doFocus(): void {
    const element = this.elementRef.nativeElement;

    if (element && typeof element.focus === 'function') {
      element.focus();

      // Sélectionne tout le texte si demandé
      if (this.autoFocusSelectAll && element instanceof HTMLInputElement) {
        element.select();
      }
    }
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI une directive et pas du code dans le composant ?
 *
 *    RÉUTILISABILITÉ :
 *    ```typescript
 *    // Sans directive (répétitif) :
 *    @ViewChild('searchInput') searchInput!: ElementRef;
 *    ngAfterViewInit() {
 *      this.searchInput.nativeElement.focus();
 *    }
 *    // À répéter dans CHAQUE composant !
 *    ```
 *
 *    ```html
 *    <!-- Avec directive (simple) : -->
 *    <input appAutoFocus />
 *    ```
 *
 * 2. POURQUOI setTimeout(0) ?
 *
 *    CYCLE DE VIE ANGULAR :
 *    Même dans ngAfterViewInit, Angular peut ne pas avoir
 *    fini de positionner l'élément dans le DOM.
 *
 *    setTimeout(0) repousse le focus au prochain "tick",
 *    garantissant que l'élément est prêt.
 *
 * 3. POURQUOI supporter '' (chaîne vide) ?
 *
 *    ERGONOMIE HTML :
 *    En HTML, on peut écrire :
 *    - <input appAutoFocus> (attribut seul, valeur = '')
 *    - <input [appAutoFocus]="true"> (binding explicite)
 *
 *    Les deux doivent fonctionner.
 *
 * 4. POURQUOI l'option selectAll ?
 *
 *    UX DES CHAMPS PRÉ-REMPLIS :
 *    Si un champ contient déjà du texte (ex: valeur par défaut),
 *    l'utilisateur veut souvent le remplacer entièrement.
 *
 *    Auto-select = un seul clic au lieu de Ctrl+A ou triple-clic.
 *
 * Citation de Steve Krug :
 * "Don't make me think."
 *
 * L'auto-focus évite à l'utilisateur de chercher où cliquer.
 */
