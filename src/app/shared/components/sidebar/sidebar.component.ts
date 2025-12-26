/**
 * sidebar.component.ts
 *
 * Composant SIDEBAR - Menu de navigation latéral.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est le menu vertical à gauche qui permet d'accéder
 * aux différentes sections de l'application.
 *
 * Fonctions de la sidebar :
 * 1. Navigation entre les pages principales
 * 2. Affichage de la progression
 * 3. Indicateurs visuels pour la page active
 *
 * Pattern utilisé : Responsive Sidebar
 * - Desktop : Toujours visible
 * - Mobile : Cachée, s'ouvre avec le bouton burger
 *
 * Philosophie David J. Malan :
 * "Every click should take the user somewhere meaningful."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Interface pour les items du menu
 */
interface NavItem {
  path: string;
  icon: string;
  label: string;
  badge?: string;
}

/**
 * @Component Decorator
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!--
      Structure de la sidebar :
      =========================
      [Navigation principale]
      [Separator]
      [Navigation secondaire]
      [Footer avec version]
    -->

    <!-- Overlay pour mobile (ferme la sidebar quand on clique dessus) -->
    <div
      class="sidebar-overlay"
      [class.visible]="isOpen"
      (click)="closeSidebar()">
    </div>

    <aside class="sidebar" [class.open]="isOpen">
      <!-- Navigation principale -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li *ngFor="let item of mainNavItems" class="nav-item">
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              class="nav-link"
              (click)="onNavClick()">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
              <span *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Séparateur -->
      <div class="nav-separator"></div>

      <!-- Navigation secondaire -->
      <nav class="sidebar-nav secondary">
        <ul class="nav-list">
          <li *ngFor="let item of secondaryNavItems" class="nav-item">
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              class="nav-link"
              (click)="onNavClick()">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Footer -->
      <footer class="sidebar-footer">
        <span class="version">Study Tracker Pro v{{ appVersion }}</span>
        <span class="author">By H1m0t3p3</span>
      </footer>
    </aside>
  `,
  styles: [`
    /**
     * Styles de la sidebar
     * Utilise les variables CSS globales pour le thème
     */

    /* Overlay mobile */
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: var(--overlay-bg);
      z-index: 199;
      opacity: 0;
      transition: opacity 0.3s;

      &.visible {
        opacity: 1;
      }

      @media (max-width: 768px) {
        display: block;
        pointer-events: none;

        &.visible {
          pointer-events: auto;
        }
      }
    }

    /* Sidebar container */
    .sidebar {
      position: fixed;
      top: 57px; /* Hauteur de la navbar */
      left: 0;
      bottom: 0;
      width: 250px;
      background: var(--bg-card);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: 200;
      overflow-y: auto;
      transition: transform 0.3s ease, background-color 0.3s, border-color 0.3s;

      @media (max-width: 768px) {
        transform: translateX(-100%);

        &.open {
          transform: translateX(0);
        }
      }
    }

    /* Navigation */
    .sidebar-nav {
      padding: 1rem;

      &.secondary {
        margin-top: auto;
        padding-top: 22rem;
      }
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        text-decoration: none;
        color: var(--text-secondary);
        transition: all 0.2s;

        &:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        &.active {
          background: var(--color-primary);
          color: white;

          .nav-icon {
            transform: scale(1.1);
          }
        }
      }

      .nav-icon {
        font-size: 1.25rem;
        transition: transform 0.2s;
      }

      .nav-label {
        font-size: 0.875rem;
        font-weight: 500;
      }

      .nav-badge {
        margin-left: auto;
        padding: 0.125rem 0.5rem;
        background: var(--color-danger);
        color: white;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    /* Séparateur */
    .nav-separator {
      height: 1px;
      background: var(--border-color);
      margin: 0.5rem 1rem;
    }

    /* Footer */
    .sidebar-footer {
      margin-top: auto;
      padding: 1rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .version {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .author {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
  `]
})
export class SidebarComponent {

  /**
   * Version de l'application
   */
  readonly appVersion = '1.1.1';

  /**
   * La sidebar est-elle ouverte ? (mobile)
   */
  @Input() isOpen: boolean = false;

  /**
   * Événement émis pour fermer la sidebar
   */
  @Output() close = new EventEmitter<void>();

  /**
   * Items de navigation principale
   */
  mainNavItems: NavItem[] = [
    { path: '/dashboard', icon: '🏠', label: 'Tableau de bord' },
    { path: '/planning', icon: '📅', label: 'Planning' },
    { path: '/exercises', icon: '✏️', label: 'Exercices' },
    { path: '/revision', icon: '📚', label: 'Révision' },
    { path: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
    { path: '/quests', icon: '🎯', label: 'Quêtes' },
    { path: '/resources', icon: '📄', label: 'Ressources' },
    { path: '/notes', icon: '📝', label: 'Notes' }
  ];

  /**
   * Items de navigation secondaire
   */
  secondaryNavItems: NavItem[] = [
    { path: '/profile', icon: '👤', label: 'Profil' },
    { path: '/settings', icon: '⚙️', label: 'Paramètres' }
  ];

  /**
   * Fermer la sidebar
   */
  closeSidebar(): void {
    this.close.emit();
  }

  /**
   * Gérer le clic sur un lien
   */
  onNavClick(): void {
    // Sur mobile, ferme la sidebar après navigation
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }
}
