/**
 * theme.service.ts
 *
 * Service de gestion du thème (Light/Dark mode).
 *
 * Fonctionnalités :
 * - Toggle entre light et dark mode
 * - Sauvegarde de la préférence dans localStorage
 * - Détection de la préférence système (prefers-color-scheme)
 * - Application du thème via une classe CSS sur le body
 *
 * Philosophie David J. Malan :
 * "Good software respects user preferences."
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /** Clé localStorage pour sauvegarder le thème */
  private readonly STORAGE_KEY = 'study-tracker-theme';

  /** Subject pour le thème actuel */
  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());

  /** Observable du thème actuel */
  theme$: Observable<Theme> = this.themeSubject.asObservable();

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor() {
    // Applique le thème initial au chargement
    this.applyTheme(this.themeSubject.value);

    // Écoute les changements de préférence système
    this.listenToSystemPreference();

    console.log(`🎨 ThemeService initialisé: ${this.themeSubject.value} mode`);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Retourne le thème actuel
   */
  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Vérifie si le mode sombre est actif
   */
  get isDarkMode(): boolean {
    return this.themeSubject.value === 'dark';
  }

  // ============================================================
  // MÉTHODES PUBLIQUES
  // ============================================================

  /**
   * Change le thème
   */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
    console.log(`🎨 Thème changé: ${theme}`);
  }

  /**
   * Bascule entre light et dark
   */
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  // ============================================================
  // MÉTHODES PRIVÉES
  // ============================================================

  /**
   * Obtient le thème initial
   * Priorité : localStorage > préférence système > dark (défaut)
   */
  private getInitialTheme(): Theme {
    // 1. Vérifie localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    // 2. Vérifie la préférence système
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }

    // 3. Défaut : dark
    return 'dark';
  }

  /**
   * Applique le thème au DOM
   */
  private applyTheme(theme: Theme): void {
    if (typeof document !== 'undefined') {
      const body = document.body;

      // Retire les classes existantes
      body.classList.remove('theme-light', 'theme-dark');

      // Ajoute la nouvelle classe
      body.classList.add(`theme-${theme}`);

      // Met à jour le meta theme-color pour mobile
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
      }
    }
  }

  /**
   * Sauvegarde le thème dans localStorage
   */
  private saveTheme(theme: Theme): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  /**
   * Écoute les changements de préférence système
   */
  private listenToSystemPreference(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      mediaQuery.addEventListener('change', (e) => {
        // Ne change que si l'utilisateur n'a pas de préférence sauvegardée
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) {
          const newTheme: Theme = e.matches ? 'dark' : 'light';
          this.setTheme(newTheme);
          console.log(`🎨 Préférence système détectée: ${newTheme}`);
        }
      });
    }
  }
}
