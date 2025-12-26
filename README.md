# 🎓 Study Tracker Pro

> Votre assistant d'apprentissage interactif et personnalisable pour maîtriser n'importe quel sujet avec un planning flexible.

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.1.1-blue.svg)](CHANGELOG.md)

---

## 🚀 Quick Start

```bash
# 1. Cloner le projet
git clone https://github.com/VOTRE_USERNAME/app-revision.git
cd app-revision

# 2. Installer les dépendances
npm install

# 3. Lancer l'application (Angular + serveur Express)
npm run dev

# 4. Ouvrir dans le navigateur
# http://localhost:4200
```

**Optionnel** - Pour l'IA (chatbot, résumés, exercices) :
```bash
# Installer Ollama : https://ollama.com/download
ollama pull llama3.2
ollama serve
```

---

## 📖 À propos

**Study Tracker Pro** est une application web interactive développée avec Angular 17, conçue pour accompagner un programme d'apprentissage intensif de 12 jours couvrant :

> **Note** : Ce projet a démarré comme un outil personnel pour mes propres révisions. C'est pourquoi il n'intègre pas encore de pipeline CI/CD (GitHub Actions), de conteneurisation (Docker), ni d'infrastructure DevOps complète. Ces améliorations sont prévues dans les futures versions pour faciliter le déploiement et la contribution collaborative.
>
> **Tests non implémentés** :
> - Tests Unitaires
> - Tests d'Intégration
> - Tests Fonctionnels
> - Tests de Bout en Bout (E2E)
> - Tests de Performance
> - Tests de Charge
> - Tests de Stress
> - Tests de Sécurité
> - Tests d'Acceptation (UAT)
> - Tests de Régression
> - Tests d'Interface Utilisateur (UI)
> - Tests d'Accessibilité

Le programme couvre :

- 🔵 **Algèbre de Boole** - Tables de vérité, simplifications, Karnaugh
- 🟣 **Algorithmique** - Conditions, boucles, tableaux, conception
- ☕ **Java** - Syntaxe, structures, exercices pratiques
- 🧩 **POO** - Classes, héritage, polymorphisme, encapsulation
- 🗄️ **Base de données** - SQL, SELECT, INSERT, UPDATE, DELETE
- 🟠 **Consolidation** - Révisions et projets de synthèse

---

## ✨ Fonctionnalités

### 🎯 Suivi de progression

- **Dashboard interactif** avec statistiques en temps réel
- **Système XP et niveaux** pour gamifier l'apprentissage
- **Badges et quêtes** à débloquer au fur et à mesure
- **Gestion des quêtes** - Commencer, abandonner ou réclamer les récompenses
- **Streak counter** pour maintenir la motivation

### 📅 Planning intelligent et flexible

- **Planning personnalisable** - Changez la date de début à tout moment
- **Templates prédéfinis** - Algo/Java, POO/BDD, Web Dev, Python Data Science
- **Créez vos propres plannings** - Pour n'importe quel sujet de révision
- **Export/Import JSON** - Sauvegardez et restaurez votre progression
- **Calendrier interactif** avec drag & drop
- **Intégration Apple Calendar** (notifications macOS)
- **Vue par jour/semaine** avec objectifs détaillés
- **Code couleur** par matière

### 📝 Gestionnaire d'exercices

- **100+ exercices** répartis en 3 catégories
- **Suivi de statut** : À faire / En cours / Terminé / Révisé
- **Timer par exercice** pour mesurer le temps passé
- **Upload de solutions** (pseudo-code, organigramme, code Java)

### ⏱️ Pomodoro Timer

- **Sessions de 25 minutes** avec pauses automatiques
- **Notifications sonores** et visuelles
- **Statistiques de focus** par jour/semaine
- **Intégration** avec le planning

### 🔄 Système de révision espacée

- **Algorithme de répétition** intelligent (J-1, J-3, J-7)
- **Flashcards** interactives
- **Quiz chronométrés** avec correction détaillée
- **Mode examen blanc** pour s'auto-évaluer

### 📊 Auto-évaluation

- **Notes sur 10** par chapitre
- **Ce que tu maîtrises** ✅
- **Points à revoir** ⚠️
- **Questions pour le formateur** 💬
- **Export PDF** du bilan complet

### 📚 Bibliothèque de ressources

- **Tous les PDFs** organisés par catégorie (Algo, Java, POO, BDD)
- **Upload de PDFs** - Bouton "Ajouter un PDF" avec drag & drop
- **Suppression de PDFs** - Bouton poubelle avec confirmation
- **Détection automatique** de la catégorie selon le nom du fichier
- **Scan automatique** - Les PDFs dans `assets/docs/` sont détectés automatiquement
- **Marque-pages** personnalisés (favoris)
- **6 catégories** : Algèbre, Algo, Java, POO, BDD, Général
- **Résumé IA** - Génère des résumés intelligents de chaque PDF avec Ollama

### 🤖 Résumé PDF avec IA

- **Extraction de texte** automatique depuis les PDFs (pdf.js)
- **Génération de résumés** avec Ollama (IA locale)
- **3 longueurs** : Court (3-5 points), Moyen (5-8 points), Complet (8-12 points)
- **Points clés** avec indicateurs d'importance (haute, moyenne, basse)
- **Concepts principaux** avec descriptions détaillées
- **Exercices suggérés** générés automatiquement
- **Sauvegarde** des résumés dans IndexedDB pour accès hors-ligne

### 📝 Système de Notes

- **Éditeur Markdown** avec preview en temps réel
- **3 types de notes** : Personnelles, Résumés IA, Flashcards
- **Organisation** par catégorie (Algo, Java, POO, BDD...)
- **Tags personnalisés** pour un filtrage précis
- **Favoris et épinglage** pour accès rapide
- **Recherche full-text** dans titres et contenus
- **Auto-save** avec debounce (2 secondes)
- **Export PDF** professionnel avec jsPDF

### 📄 Export PDF

- **Modal de configuration** - Interface intuitive pour personnaliser l'export
- **4 thèmes** : Clair, Sombre, Professionnel, Minimaliste
- **Sélection du contenu** - Choisir quelles sections inclure
- **Page de titre** automatique avec date et logo
- **Table des matières** générée automatiquement
- **Sections formatées** : Résumé, Points clés, Concepts, Exercices
- **Indicateurs colorés** par niveau d'importance
- **Numérotation des pages** (X / Y)
- **Formats supportés** : A4, Letter, A5 (portrait/paysage)
- **Estimation** - Affiche le nombre de pages et la taille estimée

### 🤖 Chatbot IA intégré

- **Ollama** - IA locale gratuite (DeepSeek, Qwen, Llama...)
- **Détection automatique** du modèle disponible
- **Aide contextuelle** sur Algo, Java, POO, SQL
- **Mode FAQ** de secours si Ollama n'est pas lancé

### 🧠 Générateur d'exercices IA

- **Génération automatique** d'exercices personnalisés avec Ollama
- **6 sujets** : Algèbre de Boole, Conditions, Boucles, Tableaux, Fonctions, Java
- **4 niveaux de difficulté** : Facile, Moyen, Difficile, Expert
- **5 formats** : QCM, Complétion de code, Debugging, Pseudo-code, Implémentation
- **Options** : Inclure solution, inclure indices
- **Sauvegarde** directe dans la liste d'exercices avec XP

### 📝 Extracteur d'exercices depuis PDF

- **Analyse automatique** du contenu des PDFs de cours
- **Extraction intelligente** via IA (Ollama) des concepts clés
- **Génération contextuelle** d'exercices basés sur le contenu du PDF
- **Personnalisation** : nombre d'exercices, difficulté, types
- **Options** : solutions incluses, indices pour guider l'étudiant
- **Catégorisation auto** selon la matière du PDF source
- **Sauvegarde** directe dans la liste d'exercices avec XP

### 🌐 Exercices externes

- **Intégration** TMC MOOC.fi, GeeksforGeeks, LeetCode, HackerRank
- **Suivi unifié** de tous vos exercices (internes + externes)
- **XP et statistiques** comptabilisés

### 🏆 Leaderboard

- **Compare tes performances** (avec toi-même ou d'autres)
- **Stats détaillées** : heures de travail, exercices complétés, scores
- **Graphiques de progression** (Chart.js)

### 🎨 Mode Light / Dark

- **Thème sombre** par défaut (idéal pour les sessions nocturnes)
- **Thème clair** pour les environnements lumineux
- **Toggle dans les paramètres** → Section Apparence
- **Sauvegarde automatique** de la préférence
- **Détection système** (respecte prefers-color-scheme)

---

## 🚀 Installation

### Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 18.0.0 ([Télécharger](https://nodejs.org/))
- **npm** >= 9.0.0 (inclus avec Node.js)
- **Angular CLI** 17 (voir ci-dessous)
- **Git** ([Télécharger](https://git-scm.com/))

### Étape 1 : Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/app-revision.git
cd app-revision
```

### Étape 2 : Installer Angular CLI (si pas déjà fait)

```bash
npm install -g @angular/cli@17
```

Vérifiez l'installation :

```bash
ng version
```

### Étape 3 : Installer les dépendances

```bash
npm install
```

⏳ Cette étape prend environ 2-3 minutes.

### Étape 4 : Configurer l'environnement

1. **Copiez vos PDFs** dans le dossier `src/assets/docs/`
   - Les PDFs sont détectés automatiquement au lancement !
   - Nomenclature recommandée : `Algo 01 - Titre.pdf`, `Java 02 - Titre.pdf`

2. **Vérifiez la configuration Tailwind** :
   - Le fichier `tailwind.config.js` doit pointer vers `./src/**/*.{html,ts}`

3. **Optionnel** : Configurez l'intégration Apple Calendar (voir section dédiée)

### Étape 5 : Configurer Ollama (optionnel, pour le chatbot IA)

1. **Téléchargez Ollama** : [ollama.com/download](https://ollama.com/download)

2. **Installez un modèle** :

   ```bash
   ollama pull llama3.2        # Recommandé (3.8 GB)
   # ou
   ollama pull deepseek-v3     # Plus puissant
   # ou
   ollama pull qwen3-coder     # Spécialisé code
   ```

3. **Lancez Ollama** (dans un terminal séparé) :

   ```bash
   ollama serve
   ```

4. Le chatbot et le générateur d'exercices détectent automatiquement le modèle disponible !

### Utiliser le générateur d'exercices IA

1. Allez sur la page **Exercices**
2. Cliquez sur le bouton **"Générer avec IA"** (violet)
3. Configurez votre exercice :
   - **Sujet** : Algèbre de Boole, Conditions, Boucles, Tableaux, Fonctions, Java
   - **Difficulté** : Facile, Moyen, Difficile, Expert
   - **Format** : QCM, Complétion de code, Debugging, Pseudo-code, Implémentation
   - **Options** : Inclure solution, inclure indices
4. Cliquez sur **"Générer"**
5. Prévisualisez l'exercice, puis **"Sauvegarder"** ou **"Régénérer"**
6. L'exercice est ajouté à votre liste avec les XP correspondants !

### Ajouter des PDFs via l'interface

1. Lancez l'application avec `npm run dev` (inclut le serveur d'upload)
2. Allez sur la page **Ressources**
3. Cliquez sur le bouton **"Ajouter un PDF"** (vert)
4. Glissez-déposez votre PDF ou cliquez pour parcourir
5. Cliquez sur **"Uploader"**
6. Le PDF est automatiquement :
   - Copié dans `src/assets/docs/`
   - Ajouté à `resources.json`
   - Catégorisé selon son nom (Algo, Java, POO, etc.)
7. Le PDF apparaît immédiatement dans la bibliothèque !

### Extraire des exercices depuis un PDF

Cette fonctionnalité permet d'analyser un PDF de cours et d'en extraire automatiquement des exercices pratiques grâce à l'IA (Ollama).

**Prérequis :**
- Ollama doit être installé et lancé (`ollama serve`)
- Un modèle doit être disponible (llama3.2, deepseek-v3, qwen3-coder...)

**Étapes :**

1. Allez sur la page **Ressources**
2. Repérez le PDF dont vous voulez extraire les exercices
3. Cliquez sur le bouton **📝** (Extraire les exercices) sur la carte du PDF
4. Le modal d'extraction s'ouvre avec plusieurs options :

   | Option | Description |
   |--------|-------------|
   | **Nombre d'exercices** | Combien d'exercices générer (1-10) |
   | **Difficulté** | Facile, Moyen, Difficile ou Expert |
   | **Types d'exercices** | QCM, Code, Pseudo-code, Analyse... |
   | **Inclure solutions** | Ajoute les corrections aux exercices |
   | **Inclure indices** | Ajoute des hints pour guider l'étudiant |

5. Cliquez sur **"Extraire les exercices"**
6. L'IA analyse le contenu du PDF :
   - **Extraction** du texte (pdf.js)
   - **Analyse** des concepts clés
   - **Génération** d'exercices adaptés au contenu
7. Prévisualisez les exercices générés
8. Cliquez sur **"Sauvegarder"** pour les ajouter à votre liste d'exercices

**Exemple concret :**

```
PDF : "Algo 03 - Les boucles.pdf"
       ↓
[Extraction du texte]
       ↓
[Analyse IA : boucles for, while, do-while, conditions d'arrêt]
       ↓
[Génération de 5 exercices]
       ↓
Exercices créés :
  1. QCM sur les différences entre for et while
  2. Compléter une boucle for qui calcule une somme
  3. Débugger une boucle infinie
  4. Écrire un algorithme de recherche avec while
  5. Convertir un for en while équivalent
```

**Conseils :**
- Les exercices sont automatiquement catégorisés selon le PDF source
- Chaque exercice généré rapporte des **XP** une fois complété
- Vous pouvez régénérer si les exercices ne conviennent pas
- Les exercices sont sauvegardés dans IndexedDB (persistent)

---

## 🎮 Lancer l'application

### Mode développement (recommandé)

```bash
npm run dev
```

Cette commande lance **simultanément** :
- Le serveur Angular sur **http://localhost:4200**
- Le serveur d'upload PDF sur **http://localhost:3001**

Tu pourras ainsi uploader des PDFs directement depuis l'interface !

### Mode simple (sans upload)

```bash
ng serve
```

Puis ouvrez votre navigateur sur : **http://localhost:4200**

L'application se recharge automatiquement à chaque modification du code ! 🔄

### Mode production (optimisé)

```bash
ng build --configuration production
```

Les fichiers optimisés seront dans le dossier `dist/`.

---

## 📱 Intégration Apple Calendar (macOS)

Pour synchroniser automatiquement ton planning avec le Calendrier Apple :

1. **Autoriser les notifications** dans les Préférences Système > Notifications
2. **Lancer l'app** et aller dans Paramètres > Intégrations
3. **Activer "Sync Apple Calendar"**
4. Les événements du planning seront automatiquement créés dans ton calendrier ! 📅

---

## 🗂️ Structure du projet

```
app-revision/
├── src/
│   ├── app/
│   │   ├── core/              # Services, modèles, guards
│   │   │   ├── services/      # 15+ services principaux
│   │   │   │   ├── pdf-extraction.service.ts     # Extraction texte PDF
│   │   │   │   ├── pdf-summarization.service.ts  # Résumés IA (Ollama)
│   │   │   │   ├── pdf-export.service.ts         # Export PDF (jsPDF)
│   │   │   │   ├── notes.service.ts              # CRUD notes
│   │   │   │   ├── summary-storage.service.ts    # Stockage résumés
│   │   │   │   └── ...                           # Autres services
│   │   │   ├── models/        # 10+ interfaces TypeScript
│   │   │   │   ├── pdf-summary.model.ts          # Modèles résumés
│   │   │   │   ├── note.model.ts                 # Modèles notes
│   │   │   │   ├── pdf-export.model.ts           # Config export
│   │   │   │   └── ...                           # Autres modèles
│   │   │   ├── guards/        # Route guards
│   │   │   └── interceptors/  # HTTP interceptors
│   │   │
│   │   ├── features/          # Modules fonctionnels
│   │   │   ├── dashboard/     # Page d'accueil
│   │   │   ├── planning/      # Calendrier interactif
│   │   │   ├── exercises/     # Gestion des exercices
│   │   │   ├── evaluation/    # Auto-évaluation
│   │   │   ├── revision/      # Flashcards & Quiz
│   │   │   ├── pomodoro/      # Timer Pomodoro
│   │   │   ├── profile/       # Profil & Stats
│   │   │   ├── resources/     # Bibliothèque PDF + Résumés IA
│   │   │   ├── notes/         # Gestionnaire de notes (NEW)
│   │   │   └── settings/      # Paramètres (planning flexible)
│   │   │
│   │   └── shared/            # Composants réutilisables
│   │       ├── components/
│   │       │   ├── pdf-summary-modal/    # Modal résumé IA
│   │       │   ├── pdf-export-modal/     # Modal export PDF
│   │       │   ├── markdown-editor/      # Éditeur Markdown
│   │       │   ├── chatbot/              # Assistant IA flottant
│   │       │   └── ...                   # Autres composants
│   │       ├── pipes/
│   │       └── directives/
│   │
│   └── assets/                # Ressources statiques
│       ├── docs/              # PDFs de cours
│       ├── data/              # Fichiers JSON
│       ├── sounds/            # Sons de notification
│       └── images/            # Images & logos
│
├── server.js                  # Serveur Express (upload PDFs, API)
├── tailwind.config.js         # Config Tailwind CSS
├── angular.json               # Config Angular
├── package.json               # Dépendances npm (v1.1.1)
├── CHANGELOG.md               # Historique des versions
└── README.md                  # Ce fichier !
```

---

## 🛠️ Technologies utilisées

| Technologie | Version | Usage |
|------------|---------|-------|
| **Angular** | 17.3.17 | Framework principal |
| **TypeScript** | 5.4+ | Langage de développement |
| **Tailwind CSS** | 3.4+ | Styles & design system |
| **Angular Material** | 17.3+ | Composants UI |
| **Chart.js** | 4.4+ | Graphiques de progression |
| **FullCalendar** | 6.1+ | Calendrier interactif |
| **Howler.js** | 2.2+ | Sons & notifications |
| **LocalForage** | 1.10+ | Stockage local avancé |
| **date-fns** | 3.0+ | Manipulation de dates |
| **Lucide Angular** | Latest | Icônes modernes |
| **pdfjs-dist** | 5.4+ | Extraction texte PDF |
| **jsPDF** | 2.5+ | Génération de PDF |
| **Ollama** | - | IA locale (résumés, exercices) |

---

## 📚 Documentation des modules

### Services principaux

| Service | Description |
|---------|-------------|
| **PlanningService** | Gestion du planning des 12 jours |
| **ProgressService** | Suivi de la progression (XP, niveaux, badges) |
| **ExerciseService** | CRUD des exercices et suivi de statut |
| **NotificationService** | Notifications macOS et rappels |
| **StorageService** | Persistance des données (LocalForage) |
| **GamificationService** | Système XP, badges, quêtes |
| **CalendarSyncService** | Synchronisation Apple Calendar |
| **PomodoroService** | Timer Pomodoro avec statistiques |
| **ChatbotService** | Chatbot IA avec Ollama + FAQ fallback |
| **ExerciseGeneratorService** | Générateur d'exercices IA avec Ollama |
| **ResourceService** | Chargement dynamique des PDFs |
| **ThemeService** | Gestion du thème Light/Dark avec persistance |
| **PDFExtractionService** | Extraction de texte depuis les PDFs (pdf.js) |
| **PDFSummarizationService** | Génération de résumés IA (Ollama) |
| **PDFExportService** | Export en PDF professionnel (jsPDF) |
| **NotesService** | CRUD notes avec recherche et filtres |
| **SummaryStorageService** | Persistance des résumés (IndexedDB) |

### Serveur Express (server.js)

Un mini serveur Node.js pour la gestion des ressources :

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/health` | GET | Vérifie que le serveur est actif |
| `/api/resources` | GET | Retourne le contenu de resources.json (sans cache) |
| `/api/pdfs` | GET | Liste tous les PDFs du dossier docs |
| `/api/upload` | POST | Upload un PDF (multipart/form-data, max 50MB) |
| `/api/pdfs/:filename` | DELETE | Supprime un PDF et met à jour resources.json |
| `/api/links` | POST | Ajoute un nouveau lien utile |
| `/api/links/:id` | DELETE | Supprime un lien utile |
| `/docs/:filename` | GET | Sert les fichiers PDF statiques |

### Modèles de données

- **Day** : Représente une journée du planning
- **PlanningConfig** : Configuration flexible du planning (dates, templates, phases)
- **Exercise** : Un exercice (algo, Java, etc.)
- **Evaluation** : Auto-évaluation d'un chapitre
- **Progress** : Progression globale de l'utilisateur
- **Badge** : Un badge débloqué
- **Quest** : Une quête à accomplir
- **PDFSummary** : Résumé généré par IA (points clés, concepts, exercices)
- **Note** : Note personnelle avec support Markdown
- **Flashcard** : Carte question/réponse pour révision
- **PDFExportConfig** : Configuration d'export PDF (thème, sections, format)

---

## 🎨 Thème et couleurs

### Mode Light / Dark

L'application supporte les deux modes :

- 🌙 **Mode Sombre** (par défaut) - Idéal pour les sessions nocturnes
- ☀️ **Mode Clair** - Parfait pour les environnements lumineux

Pour changer de thème :
1. Allez dans **Paramètres** (⚙️)
2. Section **Apparence**
3. Cliquez sur le **toggle** pour basculer

Le thème est sauvegardé automatiquement et respecte aussi la préférence système.

### Code couleur par matière

L'application utilise un code couleur cohérent :

- 🔵 **Bleu** (#3B82F6) → Algèbre de Boole
- 🟣 **Violet** (#8B5CF6) → Algorithmique
- 🟠 **Orange** (#F97316) → Java
- 🩷 **Rose** (#EC4899) → POO
- 🩵 **Cyan** (#06B6D4) → Base de données
- ⚫ **Gris** (#64748B) → Général

---

## 📊 Templates de planning disponibles

L'application propose **5 templates prédéfinis** que vous pouvez personnaliser :

### 1. Algo + Java (12 jours) - *Template par défaut*

| Phase | Durée | Contenu |
|-------|-------|---------|
| 🔵 Algèbre de Boole | 2 jours | Tables de vérité, De Morgan, Karnaugh |
| 🟣 Algorithmique | 4 jours | Conditions, boucles, tableaux, conception |
| ☕ Java | 4 jours | Syntaxe, structures, projets |
| 📚 Consolidation | 2 jours | Révisions, projet final |

### 2. POO + BDD (10 jours)

| Phase | Durée | Contenu |
|-------|-------|---------|
| 🧩 POO Bases | 3 jours | Classes, objets, encapsulation |
| 🔧 POO Avancé | 3 jours | Héritage, polymorphisme, interfaces |
| 🗄️ Base de données | 3 jours | SQL, SELECT, JOIN, CRUD |
| 🚀 Projet Final | 1 jour | Application complète |

### 3. Web Development (14 jours)

| Phase | Durée | Contenu |
|-------|-------|---------|
| 🌐 HTML/CSS | 3 jours | Structure, styles, responsive |
| ⚡ JavaScript | 4 jours | ES6+, DOM, async |
| 📘 TypeScript | 3 jours | Types, interfaces, génériques |
| 🅰️ Framework | 3 jours | Angular/React/Vue |
| 🚀 Projet Web | 1 jour | Application complète |

### 4. Python Data Science (7 jours)

| Phase | Durée | Contenu |
|-------|-------|---------|
| 🐍 Python Bases | 2 jours | Syntaxe, fonctions, OOP |
| 📊 NumPy/Pandas | 2 jours | Arrays, DataFrames, manipulation |
| 📈 Visualisation | 2 jours | Matplotlib, Seaborn, Plotly |
| 🚀 Projet Data | 1 jour | Analyse complète |

### 5. Planning Vide (Personnalisé)

Créez votre propre planning de zéro avec vos propres phases et durées.

---

## 🔧 Personnaliser le planning

### Changer la date de début

1. Allez dans **Paramètres** (⚙️)
2. Cliquez sur **"Configurer le planning"**
3. Sélectionnez une nouvelle date de début
4. Cliquez sur **"Appliquer"**

Toutes les dates du planning seront automatiquement recalculées !

### Créer un nouveau planning

1. Allez dans **Paramètres > Planning**
2. Choisissez un **template** dans la grille
3. Donnez un nom personnalisé (optionnel)
4. Sélectionnez la date de début
5. Cliquez sur **"Créer le nouveau planning"**

### Sauvegarder / Restaurer

- **Export** : Téléchargez votre planning + progression en JSON
- **Import** : Restaurez un planning exporté sur n'importe quel appareil

---

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifiez que Node.js >= 18 est installé : `node --version`
2. Supprimez `node_modules` et réinstallez :

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Les styles Tailwind ne s'appliquent pas

1. Vérifiez `tailwind.config.js`
2. Relancez le serveur de dev : `ng serve`

### Les notifications macOS ne fonctionnent pas

1. Autorisez les notifications dans Préférences Système
2. Utilisez un navigateur compatible (Chrome, Safari)

### L'upload de PDF ne fonctionne pas

1. Vérifiez que le serveur Express tourne sur le port 3001
2. Lancez avec `npm run dev` (pas `ng serve` seul)
3. Vérifiez les logs du serveur dans le terminal

### Les PDFs ne s'affichent pas / Erreur "Cannot GET"

1. Assurez-vous d'utiliser `npm run dev` pour lancer les deux serveurs
2. Les PDFs sont servis via `http://localhost:3001/docs/`
3. Vérifiez que le fichier existe dans `src/assets/docs/`

### Le chatbot IA ne répond pas

1. Vérifiez qu'Ollama est installé et lancé : `ollama serve`
2. Vérifiez qu'un modèle est disponible : `ollama list`
3. Le mode FAQ s'active automatiquement si Ollama n'est pas disponible

### Les PDFs supprimés réapparaissent

1. Assurez-vous d'utiliser `npm run dev` (serveur Express requis)
2. La suppression met à jour `resources.json` via l'API
3. Rafraîchissez la page pour voir les changements

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le projet
2. Créez une **branche** pour votre feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

---

## 📝 License

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**H1m0t3p3**

- GitHub: [@VOTRE_USERNAME](https://github.com/VOTRE_USERNAME)
- Email: votre.email@example.com

---

## 🙏 Remerciements

- **David J. Malan** (Harvard CS50) pour l'inspiration pédagogique
- **AFPA** pour les supports de cours en algorithmique
- La communauté **Angular** pour le framework exceptionnel
- **Anthropic Claude** pour l'assistance au développement

---

## 🎯 Roadmap

### Version actuelle : 1.1.1

- ✅ Dashboard interactif avec graphiques (Chart.js)
- ✅ Planning avec calendrier (FullCalendar)
- ✅ Gestionnaire d'exercices
- ✅ Pomodoro Timer
- ✅ Système de révision
- ✅ Auto-évaluation
- ✅ Gamification complète (XP, badges, quêtes)
- ✅ **Chatbot IA** avec Ollama (DeepSeek, Qwen, Llama...)
- ✅ **Scan automatique des PDFs**
- ✅ **Exercices externes** (TMC MOOC.fi, GeeksforGeeks...)
- ✅ **6 catégories** : Algèbre, Algo, Java, POO, BDD, Général
- ✅ **Planning flexible** - Date de début personnalisable
- ✅ **5 templates de planning** - Algo/Java, POO/BDD, Web Dev, Python, Personnalisé
- ✅ **Export/Import** - Sauvegardez et restaurez votre progression
- ✅ **Générateur d'exercices IA** - Crée des exercices personnalisés avec Ollama
- ✅ **Upload de PDFs** - Ajoute des PDFs via l'interface avec drag & drop
- ✅ **Mode Light/Dark** - Bascule entre thème clair et sombre dans les paramètres
- ✅ **Résumé PDF avec IA** - Génère des résumés intelligents depuis les PDFs
- ✅ **Système de Notes** - Éditeur Markdown avec preview et tags
- ✅ **Export PDF** - Génère des PDFs professionnels (4 thèmes)
- ✅ **Page Notes** - Gestion centralisée de toutes les notes
- ✅ **Modal Export PDF** - Interface de configuration pour l'export (thème, sections, format)
- ✅ **Abandon de quêtes** - Possibilité d'abandonner une quête en cours
- ✅ **Chatbot toujours visible** - Bouton flottant avec z-index optimisé
- ✅ **Suppression de PDFs** - Bouton poubelle avec confirmation pour supprimer des ressources
- ✅ **Extracteur d'exercices PDF** - Génère des exercices depuis le contenu des PDFs avec l'IA
- ✅ **Gestion des liens utiles** - Ajout et suppression de liens dans la section Ressources

### Version 1.2.0 (à venir)

- [ ] Mode collaboratif (partage de progression)
- [ ] Export du code vers GitHub automatique
- [ ] Synchronisation multi-appareils
- [ ] Application mobile (Ionic)

### Version 1.2.0 (DevOps)

- [ ] **Docker** - Conteneurisation de l'application
- [ ] **GitHub Actions** - Pipeline CI/CD automatisé
- [ ] **Tests automatisés** - Unit tests, E2E avec Cypress
- [ ] **Déploiement automatique** - Vercel / Netlify / GitHub Pages

### Version 2.0.0 (futur)

- [ ] Mode hors-ligne complet (PWA)
- [ ] Intégration avec LMS (Moodle, etc.)
- [ ] Analyse prédictive de réussite

---

## 📞 Support

Besoin d'aide ? Plusieurs options :

1. 📖 Consultez le [Changelog](CHANGELOG.md) pour l'historique des versions
2. 📚 Lisez ce README pour la documentation complète
3. 🐛 Ouvrez une [Issue](https://github.com/VOTRE_USERNAME/app-revision/issues)
4. 💬 Rejoignez les [Discussions](https://github.com/VOTRE_USERNAME/app-revision/discussions)
5. 📧 Contactez-moi par email

---

**⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile sur GitHub ! ⭐**

*Made with ❤️ and ☕ by H1m0t3p3*