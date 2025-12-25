/**
 * navbar.component.ts
 *
 * Composant NAVBAR - Barre de navigation supérieure.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la barre horizontale en haut de l'écran qui reste visible partout.
 *
 * Fonctions de la navbar :
 * 1. Logo et nom de l'application
 * 2. Bouton pour ouvrir/fermer la sidebar (mobile)
 * 3. Affichage rapide du niveau/XP
 * 4. Bouton de profil
 *
 * Philosophie David J. Malan :
 * "Navigation should be intuitive. Users shouldn't have to think about it."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProgressService } from '../../../core/services/progress.service';

/**
 * @Component Decorator
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!--
      Structure de la navbar :
      ========================
      [Logo + Titre] [Spacer] [Stats] [Menu Burger (mobile)] [Profil]
    -->
    <nav class="navbar">
      <!-- Logo et titre -->
      <div class="navbar-brand">
        <a routerLink="/dashboard" class="brand-link">
          <span class="brand-icon">🎓</span>
          <span class="brand-text">App Révision</span>
        </a>
      </div>

      <!-- Bouton menu (mobile) -->
      <button
        class="menu-toggle"
        (click)="toggleSidebar()"
        aria-label="Toggle menu">
        <span class="menu-icon">☰</span>
      </button>

      <!-- Stats rapides -->
      <div class="navbar-stats">
        <div class="stat-badge level-badge">
          <span class="stat-icon">⭐</span>
          <span class="stat-value">Niv. {{ level }}</span>
        </div>

        <div class="stat-badge xp-badge">
          <span class="stat-icon">✨</span>
          <span class="stat-value">{{ xp }} XP</span>
        </div>

        <div class="stat-badge streak-badge" *ngIf="streak > 0">
          <span class="stat-icon">🔥</span>
          <span class="stat-value">{{ streak }}j</span>
        </div>
      </div>

      <!-- Profil -->
      <a routerLink="/profile" class="profile-btn" aria-label="Profil">
        <span class="profile-icon">👤</span>
      </a>
    </nav>
  `,
  styles: [`
    /**
     * Styles de la navbar
     * Utilise les variables CSS globales pour le thème
     */
    .navbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
      transition: background-color 0.3s, border-color 0.3s;
    }

    /* Logo et titre */
    .navbar-brand {
      .brand-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: var(--text-primary);
        font-weight: 700;
        font-size: 1.125rem;
        transition: opacity 0.2s;

        &:hover {
          opacity: 0.9;
        }
      }

      .brand-icon {
        font-size: 1.5rem;
      }

      .brand-text {
        @media (max-width: 768px) {
          display: none;
        }
      }
    }

    /* Bouton menu mobile */
    .menu-toggle {
      display: none;
      padding: 0.5rem;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 1.5rem;
      cursor: pointer;
      transition: background 0.2s;
      border-radius: 0.5rem;

      &:hover {
        background: var(--bg-card-hover);
      }

      @media (max-width: 768px) {
        display: flex;
        margin-left: auto;
      }
    }

    /* Stats rapides */
    .navbar-stats {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-left: auto;

      @media (max-width: 768px) {
        display: none;
      }
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      background: var(--bg-card-hover);
      border-radius: 9999px;
      font-size: 0.875rem;

      .stat-icon {
        font-size: 0.875rem;
      }

      .stat-value {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .level-badge {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }

    .xp-badge {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
    }

    .streak-badge {
      background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
    }

    /* Bouton profil */
    .profile-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--bg-card-hover);
      border-radius: 50%;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-input);
        transform: scale(1.05);
      }

      .profile-icon {
        font-size: 1.25rem;
      }

      @media (max-width: 768px) {
        display: none;
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {

  /**
   * Événement émis pour toggler la sidebar
   */
  @Output() sidebarToggle = new EventEmitter<void>();

  /**
   * Subject pour le nettoyage
   */
  private destroy$ = new Subject<void>();

  /**
   * Niveau actuel
   */
  level: number = 1;

  /**
   * XP actuels
   */
  xp: number = 0;

  /**
   * Streak actuel
   */
  streak: number = 0;

  constructor(private progressService: ProgressService) {}

  ngOnInit(): void {
    // S'abonne au niveau
    this.progressService.level$
      .pipe(takeUntil(this.destroy$))
      .subscribe(level => this.level = level);

    // S'abonne aux XP
    this.progressService.xp$
      .pipe(takeUntil(this.destroy$))
      .subscribe(xp => this.xp = xp);

    // S'abonne au streak
    this.progressService.streak$
      .pipe(takeUntil(this.destroy$))
      .subscribe(streak => this.streak = streak);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle la sidebar (pour mobile)
   */
  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }
}
