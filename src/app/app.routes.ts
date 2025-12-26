/**
 * app.routes.ts
 *
 * Configuration du ROUTAGE de l'application.
 *
 * Qu'est-ce que le routage ?
 * -------------------------
 * Le routage permet de naviguer entre différentes "pages" de l'application
 * SANS recharger la page entière (Single Page Application - SPA).
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine un livre avec une table des matières :
 * - "/" → Page d'accueil (couverture)
 * - "/dashboard" → Tableau de bord (chapitre 1)
 * - "/planning" → Planning (chapitre 2)
 * - etc.
 *
 * Le router Angular est comme ton doigt qui navigue entre les chapitres
 * INSTANTANÉMENT, sans fermer et rouvrir le livre.
 *
 * Architecture des routes :
 * ------------------------
 * /                    → Redirige vers /dashboard
 * /dashboard           → Vue d'ensemble de la progression
 * /planning            → Planning des 12 jours
 * /planning/:dayId     → Détail d'une journée
 * /exercises           → Liste des exercices
 * /exercises/:id       → Détail d'un exercice
 * /pomodoro            → Timer Pomodoro
 * /profile             → Profil et badges
 * /settings            → Paramètres
 *
 * Lazy Loading :
 * -------------
 * Les modules sont chargés "à la demande" (lazy loading).
 * Ça signifie que le code du Planning n'est téléchargé que
 * quand tu vas sur /planning.
 *
 * Avantages :
 * - Chargement initial plus rapide
 * - Économie de bande passante
 * - Meilleure expérience utilisateur
 *
 * Philosophie David J. Malan :
 * "Make it work, make it right, make it fast."
 *
 * Le lazy loading = "make it fast" !
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Routes } from '@angular/router';

/**
 * CONFIGURATION DES ROUTES
 * -----------------------
 * Chaque route est un objet avec :
 * - path : L'URL (ex: "dashboard")
 * - loadComponent : Le composant à charger (lazy loading)
 * - title : Titre de la page (affiché dans l'onglet du navigateur)
 * - data : Données supplémentaires (optionnel)
 *
 * Pourquoi loadComponent plutôt que component ?
 * ---------------------------------------------
 * - component : Charge le composant IMMÉDIATEMENT au démarrage
 * - loadComponent : Charge le composant QUAND on navigue vers la route
 *
 * Avec loadComponent, le bundle initial est plus petit = app plus rapide !
 */
export const routes: Routes = [
  // ============================================================
  // ROUTE PAR DÉFAUT
  // ============================================================

  /**
   * Route racine "/"
   * ---------------
   * Redirige automatiquement vers le dashboard.
   *
   * pathMatch: 'full' signifie que l'URL doit être EXACTEMENT "/"
   * Sans ça, "/dashboard" serait aussi redirigé (car commence par "").
   */
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // ============================================================
  // ROUTES PRINCIPALES
  // ============================================================

  /**
   * DASHBOARD
   * ---------
   * Vue d'ensemble de la progression.
   *
   * Affiche :
   * - Niveau et XP actuels
   * - Streak en cours
   * - Statistiques par sujet
   * - Quêtes du jour
   * - Prochaine session du planning
   */
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    title: 'Dashboard | Study Tracker Pro',
    data: {
      icon: 'dashboard',
      label: 'Dashboard'
    }
  },

  /**
   * PLANNING
   * --------
   * Planning des 12 jours d'apprentissage.
   *
   * Affiche :
   * - Vue calendrier
   * - Liste des journées
   * - Progression globale
   */
  {
    path: 'planning',
    loadComponent: () =>
      import('./features/planning/planning.component')
        .then(m => m.PlanningComponent),
    title: 'Planning | Study Tracker Pro',
    data: {
      icon: 'calendar_today',
      label: 'Planning'
    }
  },

  /**
   * DÉTAIL D'UNE JOURNÉE
   * -------------------
   * Vue détaillée d'une journée spécifique.
   *
   * :dayId = Paramètre dynamique (ex: "day-1", "day-5")
   *
   * Affiche :
   * - Sessions de la journée
   * - Exercices à faire
   * - Documents à consulter
   */
  {
    path: 'planning/:dayId',
    loadComponent: () =>
      import('./features/planning/day-detail/day-detail.component')
        .then(m => m.DayDetailComponent),
    title: 'Journée | Study Tracker Pro'
  },

  /**
   * EXERCICES
   * ---------
   * Liste de tous les exercices.
   *
   * Affiche :
   * - Filtres par type, difficulté, statut
   * - Liste des exercices
   * - Statistiques
   */
  {
    path: 'exercises',
    loadComponent: () =>
      import('./features/exercises/exercises.component')
        .then(m => m.ExercisesComponent),
    title: 'Exercices | Study Tracker Pro',
    data: {
      icon: 'assignment',
      label: 'Exercices'
    }
  },

  /**
   * DÉTAIL D'UN EXERCICE
   * -------------------
   * Vue détaillée d'un exercice spécifique.
   *
   * Affiche :
   * - Énoncé complet
   * - Zone de solution (pseudo-code + Java)
   * - Historique des tentatives
   */
  {
    path: 'exercises/:id',
    loadComponent: () =>
      import('./features/exercises/exercise-detail/exercise-detail.component')
        .then(m => m.ExerciseDetailComponent),
    title: 'Exercice | Study Tracker Pro'
  },

  /**
   * POMODORO
   * --------
   * Timer Pomodoro pour les sessions de travail.
   *
   * Affiche :
   * - Timer circulaire (25/5/15 min)
   * - Contrôles (play, pause, skip)
   * - Statistiques du jour
   */
  {
    path: 'pomodoro',
    loadComponent: () =>
      import('./features/pomodoro/pomodoro.component')
        .then(m => m.PomodoroComponent),
    title: 'Pomodoro | Study Tracker Pro',
    data: {
      icon: 'timer',
      label: 'Pomodoro'
    }
  },

  /**
   * PROFIL
   * ------
   * Profil utilisateur et badges.
   *
   * Affiche :
   * - Niveau et XP
   * - Tous les badges (débloqués et verrouillés)
   * - Statistiques détaillées
   * - Historique d'activité
   */
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component')
        .then(m => m.ProfileComponent),
    title: 'Profil | Study Tracker Pro',
    data: {
      icon: 'person',
      label: 'Profil'
    }
  },

  /**
   * RÉVISIONS
   * ---------
   * Exercices à réviser (révision espacée).
   *
   * Affiche :
   * - Exercices à revoir aujourd'hui
   * - Historique de révision
   * - Statistiques de rétention
   */
  {
    path: 'revision',
    loadComponent: () =>
      import('./features/revision/revision.component')
        .then(m => m.RevisionComponent),
    title: 'Révisions | Study Tracker Pro',
    data: {
      icon: 'replay',
      label: 'Révisions'
    }
  },

  /**
   * QUÊTES
   * ------
   * Toutes les quêtes (daily, weekly, main).
   *
   * Affiche :
   * - Quêtes quotidiennes
   * - Quêtes hebdomadaires
   * - Quêtes principales
   * - Progression sur chaque quête
   */
  {
    path: 'quests',
    loadComponent: () =>
      import('./features/quests/quests.component')
        .then(m => m.QuestsComponent),
    title: 'Quêtes | Study Tracker Pro',
    data: {
      icon: 'emoji_events',
      label: 'Quêtes'
    }
  },

  /**
   * RESSOURCES
   * ----------
   * Accès aux PDFs et documents.
   *
   * Affiche :
   * - Liste des documents
   * - Fiches de révision
   * - Liens utiles
   */
  {
    path: 'resources',
    loadComponent: () =>
      import('./features/resources/resources.component')
        .then(m => m.ResourcesComponent),
    title: 'Ressources | Study Tracker Pro',
    data: {
      icon: 'folder',
      label: 'Ressources'
    }
  },

  /**
   * NOTES
   * -----
   * Gestion des notes personnelles.
   *
   * Affiche :
   * - Notes personnelles
   * - Résumés générés par IA
   * - Flashcards
   * - Éditeur Markdown
   */
  {
    path: 'notes',
    loadComponent: () =>
      import('./features/notes/notes.component')
        .then(m => m.NotesComponent),
    title: 'Notes | Study Tracker Pro',
    data: {
      icon: 'note',
      label: 'Notes'
    }
  },

  /**
   * PARAMÈTRES
   * ----------
   * Configuration de l'application.
   *
   * Affiche :
   * - Paramètres Pomodoro (durées)
   * - Notifications
   * - Thème (clair/sombre)
   * - Export/Import des données
   */
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component')
        .then(m => m.SettingsComponent),
    title: 'Paramètres | Study Tracker Pro',
    data: {
      icon: 'settings',
      label: 'Paramètres'
    }
  },

  /**
   * PARAMÈTRES DU PLANNING
   * ----------------------
   * Configuration avancée du planning.
   *
   * Affiche :
   * - Changement de date de début
   * - Création de nouveaux plannings depuis templates
   * - Export/Import du planning
   */
  {
    path: 'settings/planning',
    loadComponent: () =>
      import('./features/settings/planning-settings.component')
        .then(m => m.PlanningSettingsComponent),
    title: 'Planning | Paramètres | Study Tracker Pro'
  },

  // ============================================================
  // ROUTE 404 (PAGE NON TROUVÉE)
  // ============================================================

  /**
   * Page 404
   * --------
   * Attrape toutes les URLs non reconnues.
   *
   * Le "**" est un wildcard qui matche N'IMPORTE QUELLE URL.
   * IMPORTANT : Doit être en DERNIER car le router teste les routes dans l'ordre !
   *
   * Pourquoi ne pas juste rediriger vers le dashboard ?
   * → Informer l'utilisateur qu'il a fait une erreur d'URL
   * → Permettre de signaler des liens cassés
   */
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component')
        .then(m => m.NotFoundComponent),
    title: 'Page non trouvée | Study Tracker Pro'
  }
];

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI le lazy loading est-il important ?
 *
 *    Imagine que tu télécharges TOUT le code de l'app au démarrage :
 *    - Dashboard : 50 KB
 *    - Planning : 100 KB
 *    - Exercises : 150 KB
 *    - Pomodoro : 30 KB
 *    - Profile : 40 KB
 *    - etc.
 *    = TOTAL : 400+ KB à télécharger AVANT de voir quoi que ce soit
 *
 *    Avec lazy loading :
 *    - Démarrage : Dashboard (50 KB) seulement
 *    - Les autres modules sont chargés QUAND tu en as besoin
 *
 *    Résultat : App 8x plus rapide au démarrage !
 *
 * 2. POURQUOI les paramètres dynamiques (:dayId, :id) ?
 *
 *    Sans paramètres, il faudrait créer une route pour chaque exercice :
 *    - /exercises/ex-cond-1
 *    - /exercises/ex-cond-2
 *    - /exercises/ex-boucle-1
 *    - ... (100+ routes !)
 *
 *    Avec paramètres :
 *    - /exercises/:id → UNE seule route pour TOUS les exercices
 *
 *    Le composant récupère l'ID et charge les bonnes données.
 *
 * 3. POURQUOI une page 404 ?
 *
 *    User Experience (UX) :
 *    - Sans 404 : "Erreur" cryptique ou page blanche
 *    - Avec 404 : "Cette page n'existe pas, voici comment revenir"
 *
 *    C'est une question de RESPECT pour l'utilisateur.
 *    On ne le laisse pas dans le flou.
 *
 * 4. POURQUOI data: { icon, label } sur chaque route ?
 *
 *    Ces métadonnées servent à générer le MENU de navigation.
 *    Au lieu de hardcoder le menu, on le génère dynamiquement
 *    à partir des routes.
 *
 *    Avantage : Si on ajoute une route, le menu se met à jour tout seul !
 *
 * Citation de Steve Krug (Don't Make Me Think) :
 * "Navigation is not just a feature of a website;
 *  navigation IS the website."
 *
 * Une bonne navigation = une bonne app.
 * Le router Angular est le CŒUR de cette navigation.
 */
