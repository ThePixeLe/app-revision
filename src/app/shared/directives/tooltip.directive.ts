/**
 * tooltip.directive.ts
 *
 * Directive de TOOLTIP (info-bulle).
 *
 * Qu'est-ce qu'un tooltip ?
 * ------------------------
 * Un petit message qui apparaît au survol d'un élément,
 * donnant des informations supplémentaires.
 *
 * Analogie du monde réel :
 * -----------------------
 * Comme les petites étiquettes "?" dans les formulaires
 * qui donnent plus d'infos quand on passe la souris dessus.
 *
 * Cas d'utilisation :
 * ------------------
 * - Expliquer une icône
 * - Donner plus de détails sur un élément tronqué
 * - Afficher le nom complet d'une abréviation
 * - Aider l'utilisateur sans encombrer l'interface
 *
 * Utilisation :
 * ```html
 * <button appTooltip="Sauvegarder les modifications">💾</button>
 * <span [appTooltip]="exercise.title" tooltipPosition="bottom">...</span>
 * ```
 *
 * Philosophie David J. Malan :
 * "Show, don't tell... but tell when asked."
 *
 * Le tooltip = info disponible QUAND on la cherche, pas avant.
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import {
  Directive,
  ElementRef,
  Input,
  HostListener,
  Renderer2,
  OnDestroy
} from '@angular/core';

/**
 * Positions possibles du tooltip
 */
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {

  /**
   * Texte du tooltip
   */
  @Input() appTooltip: string = '';

  /**
   * Position du tooltip
   */
  @Input() tooltipPosition: TooltipPosition = 'top';

  /**
   * Délai avant affichage (en ms)
   * ----------------------------
   * Évite les tooltips qui clignotent au passage rapide.
   */
  @Input() tooltipDelay: number = 300;

  /**
   * Désactiver le tooltip
   */
  @Input() tooltipDisabled: boolean = false;

  /**
   * Élément du tooltip dans le DOM
   */
  private tooltipElement: HTMLElement | null = null;

  /**
   * Timer pour le délai
   */
  private showTimeout: any = null;

  /**
   * Styles CSS du tooltip (injectés une seule fois)
   */
  private static stylesInjected = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {
    this.injectStyles();
  }

  /**
   * Nettoyage
   */
  ngOnDestroy(): void {
    this.hideTooltip();
  }

  /**
   * Au survol : affiche le tooltip
   */
  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.tooltipDisabled || !this.appTooltip) {
      return;
    }

    // Délai avant affichage
    this.showTimeout = setTimeout(() => {
      this.showTooltip();
    }, this.tooltipDelay);
  }

  /**
   * À la sortie : cache le tooltip
   */
  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hideTooltip();
  }

  /**
   * Au focus (accessibilité)
   */
  @HostListener('focus')
  onFocus(): void {
    if (this.tooltipDisabled || !this.appTooltip) {
      return;
    }
    this.showTooltip();
  }

  /**
   * À la perte de focus
   */
  @HostListener('blur')
  onBlur(): void {
    this.hideTooltip();
  }

  /**
   * Affiche le tooltip
   */
  private showTooltip(): void {
    if (this.tooltipElement) {
      return; // Déjà affiché
    }

    // Crée l'élément tooltip
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'app-tooltip');
    this.renderer.addClass(this.tooltipElement, `app-tooltip--${this.tooltipPosition}`);

    // Ajoute le texte
    const text = this.renderer.createText(this.appTooltip);
    this.renderer.appendChild(this.tooltipElement, text);

    // Ajoute au body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Positionne le tooltip
    this.positionTooltip();

    // Animation d'entrée
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.addClass(this.tooltipElement, 'app-tooltip--visible');
      }
    }, 10);
  }

  /**
   * Cache le tooltip
   */
  private hideTooltip(): void {
    // Annule le timer si en cours
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    // Supprime l'élément
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  /**
   * Positionne le tooltip
   */
  private positionTooltip(): void {
    if (!this.tooltipElement) {
      return;
    }

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    let top: number;
    let left: number;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;

      case 'bottom':
        top = hostRect.bottom + 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;

      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - 8;
        break;

      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + 8;
        break;

      default:
        top = hostRect.top - tooltipRect.height - 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
    }

    // Ajuste pour rester dans la fenêtre
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  /**
   * Injecte les styles CSS (une seule fois)
   */
  private injectStyles(): void {
    if (TooltipDirective.stylesInjected) {
      return;
    }

    const styles = `
      .app-tooltip {
        position: fixed;
        z-index: 10000;
        padding: 0.5rem 0.75rem;
        background: #1e293b;
        color: #f8fafc;
        font-size: 0.8125rem;
        font-weight: 500;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        word-wrap: break-word;
        pointer-events: none;
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 150ms ease, transform 150ms ease;
      }

      .app-tooltip--visible {
        opacity: 1;
        transform: scale(1);
      }

      .app-tooltip::after {
        content: '';
        position: absolute;
        border: 6px solid transparent;
      }

      .app-tooltip--top::after {
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: #1e293b;
      }

      .app-tooltip--bottom::after {
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: #1e293b;
      }

      .app-tooltip--left::after {
        top: 50%;
        left: 100%;
        transform: translateY(-50%);
        border-left-color: #1e293b;
      }

      .app-tooltip--right::after {
        top: 50%;
        right: 100%;
        transform: translateY(-50%);
        border-right-color: #1e293b;
      }
    `;

    const styleElement = this.renderer.createElement('style');
    this.renderer.appendChild(styleElement, this.renderer.createText(styles));
    this.renderer.appendChild(document.head, styleElement);

    TooltipDirective.stylesInjected = true;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un délai avant affichage ?
 *
 *    ÉVITER LE "FLASH" :
 *    Quand on déplace la souris rapidement sur plusieurs éléments,
 *    des tooltips qui clignotent = distraction.
 *
 *    Un délai de 300ms filtre les survols accidentels.
 *
 * 2. POURQUOI ajouter au body plutôt qu'à l'élément parent ?
 *
 *    OVERFLOW :
 *    Si le parent a `overflow: hidden`, un tooltip enfant
 *    serait coupé aux bords du parent.
 *
 *    En ajoutant au body avec `position: fixed`,
 *    le tooltip est TOUJOURS visible.
 *
 * 3. POURQUOI getBoundingClientRect() ?
 *
 *    POSITIONNEMENT PRÉCIS :
 *    Cette méthode retourne la position et la taille
 *    d'un élément PAR RAPPORT AU VIEWPORT.
 *
 *    Parfait pour le positionnement avec `position: fixed`.
 *
 * 4. POURQUOI supporter focus/blur ?
 *
 *    ACCESSIBILITÉ :
 *    Les utilisateurs de clavier (tab navigation)
 *    ne peuvent pas "survoler" avec la souris.
 *
 *    Le focus déclenche le tooltip pour eux.
 *
 * 5. POURQUOI injecter les styles dynamiquement ?
 *
 *    STANDALONE :
 *    La directive est autonome, pas besoin d'ajouter
 *    manuellement du CSS dans styles.scss.
 *
 *    Elle "s'auto-suffit".
 *
 * Citation de Don Norman :
 * "Good design is actually a lot harder to notice than poor design,
 *  in part because good designs fit our needs so well that the design
 *  is invisible."
 *
 * Un bon tooltip = invisible jusqu'à ce qu'on en ait besoin.
 */
