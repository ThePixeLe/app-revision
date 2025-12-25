# 🎓 Study Tracker Pro

> Votre assistant d'apprentissage interactif et personnalisable pour maîtriser n'importe quel sujet avec un planning flexible.

[![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 À propos

**Study Tracker Pro** est une application web interactive développée avec Angular 17, conçue pour accompagner un programme d'apprentissage intensif de 12 jours couvrant :

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
- **Scan automatique** - Déposez vos PDFs dans `assets/docs/`, ils sont détectés automatiquement
- **Marque-pages** personnalisés (favoris)
- **6 catégories** : Algèbre, Algo, Java, POO, BDD, Général

### 🤖 Chatbot IA intégré

- **Ollama** - IA locale gratuite (DeepSeek, Qwen, Llama...)
- **Détection automatique** du modèle disponible
- **Aide contextuelle** sur Algo, Java, POO, SQL
- **Mode FAQ** de secours si Ollama n'est pas lancé

### 🌐 Exercices externes

- **Intégration** TMC MOOC.fi, GeeksforGeeks, LeetCode, HackerRank
- **Suivi unifié** de tous vos exercices (internes + externes)
- **XP et statistiques** comptabilisés

### 🏆 Leaderboard

- **Compare tes performances** (avec toi-même ou d'autres)
- **Stats détaillées** : heures de travail, exercices complétés, scores
- **Graphiques de progression** (Chart.js)

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

4. Le chatbot détecte automatiquement le modèle disponible !

---

## 🎮 Lancer l'application

### Mode développement

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
│   │   │   ├── services/      # 8 services principaux
│   │   │   ├── models/        # 7 interfaces TypeScript
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
│   │   │   ├── resources/     # Bibliothèque PDF
│   │   │   └── settings/      # Paramètres (planning flexible)
│   │   │
│   │   └── shared/            # Composants réutilisables
│   │       ├── components/
│   │       ├── pipes/
│   │       └── directives/
│   │
│   └── assets/                # Ressources statiques
│       ├── docs/              # PDFs de cours
│       ├── data/              # Fichiers JSON
│       ├── sounds/            # Sons de notification
│       └── images/            # Images & logos
│
├── tailwind.config.js         # Config Tailwind CSS
├── angular.json               # Config Angular
├── package.json               # Dépendances npm
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
| **ResourceService** | Chargement dynamique des PDFs |

### Modèles de données

- **Day** : Représente une journée du planning
- **PlanningConfig** : Configuration flexible du planning (dates, templates, phases)
- **Exercise** : Un exercice (algo, Java, etc.)
- **Evaluation** : Auto-évaluation d'un chapitre
- **Progress** : Progression globale de l'utilisateur
- **Badge** : Un badge débloqué
- **Quest** : Une quête à accomplir

---

## 🎨 Thème et couleurs

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

### Version actuelle : 1.0.3

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

### Version 1.1.0 (à venir)

- [ ] Mode collaboratif (partage de progression)
- [ ] Export du code vers GitHub automatique
- [ ] Synchronisation multi-appareils
- [ ] Application mobile (Ionic)

### Version 2.0.0 (futur)

- [ ] Mode hors-ligne complet (PWA)
- [ ] Intégration avec LMS (Moodle, etc.)
- [ ] Générateur d'exercices IA
- [ ] Analyse prédictive de réussite

---

## 📞 Support

Besoin d'aide ? Plusieurs options :

1. 📖 Consultez la [Documentation complète](docs/)
2. 🐛 Ouvrez une [Issue](https://github.com/VOTRE_USERNAME/app-revision/issues)
3. 💬 Rejoignez les [Discussions](https://github.com/VOTRE_USERNAME/app-revision/discussions)
4. 📧 Contactez-moi par email

---

**⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile sur GitHub ! ⭐**

*Made with ❤️ and ☕ by H1m0t3p3*