# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versionnement Sémantique](https://semver.org/lang/fr/).

---

## [1.1.1] - 2024-12-26

### Ajouté
- **Extracteur d'exercices PDF** : Génère automatiquement des exercices depuis le contenu des PDFs avec l'IA (Ollama)
  - Bouton 📝 sur chaque carte PDF pour lancer l'extraction
  - Configuration : nombre d'exercices, difficulté, types
  - Options : inclure solutions et indices
  - Sauvegarde directe dans la liste d'exercices avec XP

- **Gestion des liens utiles** : Ajout et suppression de liens dans la section Ressources
  - Bouton "Ajouter un lien" avec modal de formulaire
  - Champs : titre, URL, description, icône (emoji)
  - Bouton poubelle pour supprimer chaque lien
  - Persistance via API Express dans resources.json

- **Endpoints API pour les liens** :
  - `POST /api/links` : Ajouter un nouveau lien
  - `DELETE /api/links/:id` : Supprimer un lien

### Modifié
- Position du bouton chatbot IA déplacée légèrement à gauche pour éviter le chevauchement
- Mise à jour du README avec documentation complète de l'extracteur d'exercices

### Corrigé
- **Suppression de PDFs persistante** : Les PDFs supprimés ne réapparaissent plus après rafraîchissement
- **Affichage des PDFs avec espaces** : Correction de l'erreur "Cannot GET" pour les fichiers avec espaces dans le nom
- Optimisation du chargement des ressources via l'API Express avec cache-busting

---

## [1.1.0] - 2024-12-25

### Ajouté
- **Résumé PDF avec IA** : Génère des résumés intelligents depuis les PDFs
  - Extraction de texte automatique avec pdf.js
  - Génération de résumés avec Ollama (IA locale)
  - 3 longueurs : Court (3-5 points), Moyen (5-8 points), Complet (8-12 points)
  - Points clés avec indicateurs d'importance
  - Concepts principaux avec descriptions
  - Exercices suggérés automatiquement
  - Sauvegarde dans IndexedDB

- **Système de Notes** : Gestionnaire complet de notes
  - Éditeur Markdown avec preview en temps réel
  - 3 types : Personnelles, Résumés IA, Flashcards
  - Organisation par catégorie et tags
  - Favoris et épinglage
  - Recherche full-text
  - Auto-save avec debounce

- **Page Notes** (`/notes`) : Interface dédiée à la gestion des notes
  - Vue grille/liste
  - Filtres par catégorie, type, tags
  - Tri par date, titre, favoris

- **Export PDF** : Génération de PDFs professionnels
  - Modal de configuration intuitive
  - 4 thèmes : Clair, Sombre, Professionnel, Minimaliste
  - Sélection des sections à inclure
  - Page de titre et table des matières
  - Numérotation des pages
  - Estimation du nombre de pages

- **Upload de PDFs** : Ajout de PDFs via l'interface
  - Bouton "Ajouter un PDF" avec drag & drop
  - Serveur Express pour l'upload (port 3001)
  - Détection automatique de la catégorie
  - Ajout automatique à resources.json

- **Suppression de PDFs** : Bouton poubelle avec confirmation

- **Services ajoutés** :
  - `PDFExtractionService` : Extraction de texte (pdf.js)
  - `PDFSummarizationService` : Résumés IA (Ollama)
  - `PDFExportService` : Export PDF (jsPDF)
  - `NotesService` : CRUD notes
  - `SummaryStorageService` : Stockage résumés

### Modifié
- Commande `npm run dev` lance maintenant Angular + serveur Express simultanément
- ResourceService charge les ressources depuis l'API Express en priorité

---

## [1.0.1] - 2024-12-24

### Ajouté
- **Mode Light/Dark** : Bascule entre thème clair et sombre
  - Toggle dans Paramètres > Apparence
  - Sauvegarde automatique de la préférence
  - Détection de la préférence système (prefers-color-scheme)
  - Variables CSS pour les deux thèmes

- **Générateur d'exercices IA** : Crée des exercices personnalisés
  - 6 sujets : Algèbre de Boole, Conditions, Boucles, Tableaux, Fonctions, Java
  - 4 niveaux : Facile, Moyen, Difficile, Expert
  - 5 formats : QCM, Complétion, Debugging, Pseudo-code, Implémentation
  - Options : solutions et indices
  - Sauvegarde avec XP

- **Chatbot IA** : Assistant intégré avec Ollama
  - Bouton flottant toujours visible (z-index optimisé)
  - Détection automatique du modèle disponible
  - Mode FAQ de secours si Ollama non lancé
  - Aide contextuelle sur Algo, Java, POO, SQL

- **Abandon de quêtes** : Possibilité d'abandonner une quête en cours

- **ThemeService** : Gestion du thème avec persistance

### Modifié
- Chatbot toujours visible avec z-index élevé
- Amélioration des styles pour le mode sombre

---

## [1.0.0] - 2024-12-23

### Ajouté
- **Dashboard interactif** : Page d'accueil avec statistiques
  - Graphiques de progression (Chart.js)
  - Statistiques en temps réel
  - Résumé des activités récentes

- **Planning intelligent** : Calendrier interactif
  - FullCalendar avec drag & drop
  - 5 templates prédéfinis (Algo/Java, POO/BDD, Web Dev, Python, Personnalisé)
  - Date de début personnalisable
  - Export/Import JSON
  - Intégration Apple Calendar (macOS)
  - Vue jour/semaine avec code couleur

- **Gestionnaire d'exercices** : Suivi des exercices
  - 100+ exercices en 3 catégories
  - Statuts : À faire, En cours, Terminé, Révisé
  - Timer par exercice
  - Upload de solutions

- **Pomodoro Timer** : Sessions de focus
  - Sessions de 25 minutes
  - Pauses automatiques
  - Notifications sonores (Howler.js)
  - Statistiques de focus

- **Système de révision espacée** :
  - Algorithme de répétition (J-1, J-3, J-7)
  - Flashcards interactives
  - Quiz chronométrés
  - Mode examen blanc

- **Auto-évaluation** :
  - Notes sur 10 par chapitre
  - Points maîtrisés / à revoir
  - Questions pour le formateur
  - Export PDF du bilan

- **Gamification complète** :
  - Système XP et niveaux
  - Badges à débloquer
  - Quêtes à accomplir
  - Streak counter

- **Bibliothèque de ressources** :
  - PDFs organisés par catégorie
  - 6 catégories : Algèbre, Algo, Java, POO, BDD, Général
  - Scan automatique du dossier assets/docs
  - Marque-pages (favoris)

- **Exercices externes** :
  - Intégration TMC MOOC.fi, GeeksforGeeks, LeetCode, HackerRank
  - Suivi unifié

- **Profil utilisateur** : Stats et progression

- **Paramètres** : Configuration de l'application
  - Planning flexible
  - Notifications
  - Intégrations

- **Services principaux** :
  - `PlanningService` : Gestion du planning
  - `ProgressService` : Suivi progression
  - `ExerciseService` : CRUD exercices
  - `NotificationService` : Notifications
  - `StorageService` : Persistance (LocalForage)
  - `GamificationService` : XP, badges, quêtes
  - `CalendarSyncService` : Sync Apple Calendar
  - `PomodoroService` : Timer
  - `ResourceService` : Chargement PDFs

### Technologies
- Angular 17.3 avec standalone components
- TypeScript 5.4
- Tailwind CSS 3.4
- Angular Material 17.3
- Chart.js 4.4
- FullCalendar 6.1
- Howler.js 2.2
- LocalForage 1.10
- date-fns 3.0

---

## Légende

- **Ajouté** : Nouvelles fonctionnalités
- **Modifié** : Changements dans les fonctionnalités existantes
- **Déprécié** : Fonctionnalités qui seront supprimées prochainement
- **Retiré** : Fonctionnalités supprimées
- **Corrigé** : Corrections de bugs
- **Sécurité** : Corrections de vulnérabilités
