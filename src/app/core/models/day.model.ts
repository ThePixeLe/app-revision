/**
 * day.model.ts
 *
 * Ce fichier définit la structure d'une JOURNÉE dans notre planning de 12 jours.
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine que tu planifies un voyage de 12 jours. Chaque jour du voyage a :
 * - Une date précise (ex: 25 décembre)
 * - Des activités prévues (ex: visiter le Louvre)
 * - Un thème (ex: "Journée culture")
 * - Des objectifs (ex: "Voir la Joconde")
 *
 * C'est EXACTEMENT pareil ici, mais pour l'apprentissage !
 *
 * Inspiré par la méthodologie CS50 de David J. Malan :
 * "Break down complex problems into smaller, manageable pieces"
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

// Une "Session" représente une période de travail dans la journée
// Par exemple : session du matin (9h-12h), de l'après-midi (14h-17h)
export interface Session {
  // Identifiant unique de la session (comme un numéro de série)
  // On utilise un string pour pouvoir faire "day1-morning" par exemple
  id: string;

  // À quelle journée appartient cette session ?
  // C'est comme un "pointeur" vers la journée parente
  dayId: string;

  // Période de la journée : matin, après-midi ou soir
  // Pourquoi 3 choix seulement ? Car c'est plus simple à visualiser
  // et ça correspond à notre rythme biologique !
  period: 'matin' | 'apres-midi' | 'soir';

  // Durée prévue en MINUTES (pas en heures, pour plus de précision)
  // Ex: 150 minutes = 2h30
  // Pourquoi des minutes ? Facile de les additionner et de les convertir !
  duration: number;

  // Liste des sujets à étudier pendant cette session
  // Ex: ["Tables de vérité", "Théorèmes de De Morgan"]
  // C'est un tableau car on peut avoir plusieurs sujets dans une session
  topics: string[];

  // Documents à consulter (références aux PDFs)
  // Ex: ["Algo 03 - Introduction.pdf", "exercices_conditions.pdf"]
  // On stocke juste les NOMS des fichiers, pas le contenu !
  documents: string[];

  // Liste des exercices à faire pendant cette session
  // On utilise un tableau d'objets "Exercise" (défini ailleurs)
  // C'est comme une "to-do list" d'exercices !
  exercises: string[]; // IDs des exercices

  // Est-ce que la session est terminée ?
  // Simple boolean : true = fini, false = pas encore fait
  completed: boolean;

  // Combien de sessions Pomodoro (25 min) ont été faites ?
  // Utile pour les statistiques : "Tu as fait 8 Pomodoros aujourd'hui !"
  pomodoroCount: number;

  // Quand la session a vraiment commencé (heure réelle)
  // Optionnel (?) car peut-être pas encore commencée
  // En TypeScript, "?" signifie "cette propriété peut ne pas exister"
  startTime?: Date;

  // Quand la session s'est terminée (heure réelle)
  // Aussi optionnel, pour la même raison
  endTime?: Date;
}

// Une "Journée" représente un jour complet du planning (ex: 25 décembre)
export interface Day {
  // Identifiant unique de la journée
  // Ex: "day-1", "day-2", ... "day-12"
  // Pourquoi un string ? Plus flexible qu'un nombre !
  id: string;

  // La date exacte de cette journée
  // Type "Date" de JavaScript : contient jour, mois, année, heure
  date: Date;

  // À quelle phase appartient cette journée ?
  // Phase = grand thème : Algèbre de Boole, Algo, Java ou Consolidation
  // On utilise un "union type" : seulement 4 valeurs possibles !
  // Pourquoi ? Pour éviter les fautes de frappe comme "algébre" avec accent
  phase: 'algebre' | 'algo' | 'java' | 'consolidation';

  // Titre de la journée (descriptif)
  // Ex: "Algèbre de Boole - Partie 1 : Tables de vérité"
  // C'est ce qu'on affichera dans l'interface utilisateur
  title: string;

  // Liste des objectifs de la journée
  // Ex: ["Maîtriser les tables de vérité", "Faire 10 exercices"]
  // Pourquoi un tableau ? Car on a souvent plusieurs objectifs !
  objectives: string[];

  // Toutes les sessions de travail de la journée
  // Ex: [session du matin, session de l'après-midi]
  // C'est un tableau d'objets "Session" définis au-dessus
  sessions: Session[];

  // Est-ce que TOUTE la journée est terminée ?
  // true seulement si TOUTES les sessions sont completed = true
  // C'est une "computed property" dans la vraie app
  completed: boolean;

  // Combien de points XP ont été gagnés aujourd'hui ?
  // XP = Experience Points (comme dans les jeux vidéo !)
  // Ex: 150 XP pour avoir terminé tous les exercices
  xpEarned: number;

  // Notes personnelles de la journée
  // Ex: "Trouvé difficile les tableaux de Karnaugh, à revoir"
  // C'est un champ texte libre, comme un journal
  notes: string;
}

/**
 * Pourquoi structurer comme ça ?
 * ==============================
 *
 * 1. HIÉRARCHIE CLAIRE :
 *    Day (Journée)
 *     └── Sessions (Matin, Après-midi, Soir)
 *          └── Exercises (Exercices à faire)
 *
 * 2. RÉUTILISABILITÉ :
 *    On peut facilement :
 *    - Afficher toutes les journées
 *    - Filtrer les sessions du matin
 *    - Compter les exercices terminés
 *
 * 3. MAINTENABILITÉ :
 *    Si on veut ajouter un champ (ex: "difficulty"),
 *    on le rajoute ici et TypeScript nous avertira partout
 *    où il manque !
 *
 * 4. TYPE SAFETY :
 *    TypeScript empêche les erreurs stupides comme :
 *    day.phase = "algébre" // ❌ Erreur ! Ce n'est pas dans la liste
 *    day.phase = "algebre" // ✅ OK !
 *
 * Citation de David J. Malan :
 * "The best way to learn programming is to write programs."
 *
 * Prochaine étape : Exercise Model
 */
