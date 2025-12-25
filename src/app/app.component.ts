/**
 * app.component.ts
 *
 * Composant racine de l'application - Layout principal.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est le "conteneur" de toute l'application.
 * Tous les autres composants s'affichent À L'INTÉRIEUR de celui-ci.
 *
 * Structure du layout :
 * ====================
 *
 * ┌─────────────────────────────────────────┐
 * │              NAVBAR                      │
 * ├──────────┬──────────────────────────────┤
 * │          │                              │
 * │ SIDEBAR  │       ROUTER OUTLET          │
 * │          │   (Contenu dynamique)        │
 * │          │                              │
 * └──────────┴──────────────────────────────┘
 *
 * Le <router-outlet> est l'endroit où Angular
 * va "injecter" les pages selon la route active.
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine un cadre photo. Le cadre ne change jamais (navbar, sidebar).
 * Mais la photo à l'intérieur change (router-outlet).
 *
 * Philosophie David J. Malan :
 * "A well-structured application is like a well-organized library.
 *  Everything has its place, and navigation is intuitive."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

// Import des composants shared
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ChatbotComponent } from './shared/components/chatbot/chatbot.component';

// Import des services pour l'initialisation
import { ProgressService } from './core/services/progress.service';
import { StorageService } from './core/services/storage.service';

/**
 * @Component Decorator
 * -------------------
 *
 * Le decorator @Component définit les métadonnées du composant :
 * - selector : La balise HTML utilisée (<app-root>)
 * - standalone : Ce composant n'a pas besoin d'être déclaré dans un module
 * - imports : Les modules/composants utilisés dans le template
 * - templateUrl : Chemin vers le fichier HTML
 * - styleUrls : Chemin vers le(s) fichier(s) CSS/SCSS
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    ChatbotComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  /**
   * Titre de l'application
   * ---------------------
   * Utilisé dans le <title> de la page.
   */
  title = 'App Révision - Formation Algorithmique';

  /**
   * État de la sidebar (pour mobile)
   * --------------------------------
   * Sur mobile, la sidebar est cachée par défaut.
   * On la toggle avec le bouton burger de la navbar.
   */
  isSidebarOpen = false;

  /**
   * Constructeur avec injection de dépendances
   * -----------------------------------------
   *
   * Les services sont injectés ici mais pas forcément utilisés directement.
   * L'injection les initialise (appelle leur constructeur).
   *
   * C'est le pattern "Eager Initialization" :
   * Les services sont prêts dès le démarrage de l'app.
   */
  constructor(
    private progressService: ProgressService,
    private storageService: StorageService
  ) {
    console.log('🚀 Application démarrée !');
  }

  /**
   * ngOnInit - Initialisation du composant
   * -------------------------------------
   */
  ngOnInit(): void {
    // Le streak est automatiquement vérifié lors du chargement de la progression
    // dans le ProgressService (méthode loadProgress)
    console.log('📱 Layout principal initialisé');
  }

  /**
   * Toggle la sidebar (pour mobile)
   * -------------------------------
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Ferme la sidebar
   * ----------------
   */
  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un layout global ?
 *
 *    DRY Principle : Don't Repeat Yourself
 *
 *    Sans layout global :
 *    - Chaque page doit inclure la navbar
 *    - Chaque page doit inclure la sidebar
 *    - Modification = changer TOUTES les pages
 *
 *    Avec layout global :
 *    - Navbar et sidebar sont définis UNE fois
 *    - Les pages ne contiennent que leur contenu
 *    - Modification = UN seul fichier
 *
 * 2. POURQUOI le <router-outlet> ?
 *
 *    C'est le "point d'insertion" dynamique d'Angular.
 *
 *    Selon l'URL :
 *    - /dashboard → Insère DashboardComponent
 *    - /exercises → Insère ExercisesComponent
 *    - /pomodoro → Insère PomodoroComponent
 *
 *    Le layout (navbar, sidebar) reste FIXE.
 *    Seul le contenu central change.
 *
 * 3. POURQUOI injecter les services ici ?
 *
 *    "Eager Loading" des services critiques.
 *
 *    Certains services doivent être prêts IMMÉDIATEMENT :
 *    - ProgressService → Charge le streak, les XP
 *    - StorageService → Initialise IndexedDB
 *
 *    En les injectant dans AppComponent (le premier à charger),
 *    on garantit qu'ils sont disponibles partout.
 *
 * 4. POURQUOI gérer l'état de la sidebar ici ?
 *
 *    C'est un état "global" au layout.
 *
 *    La navbar a le bouton pour ouvrir.
 *    La sidebar doit savoir si elle est ouverte.
 *    AppComponent est leur parent commun → il gère l'état.
 *
 *    C'est le pattern "Lifting State Up" de React,
 *    applicable aussi en Angular.
 *
 * Citation de David J. Malan :
 * "If you can't explain it simply, you don't understand it well enough."
 *
 * Ce composant est simple : un conteneur avec un layout fixe
 * et un espace pour le contenu dynamique.
 */
