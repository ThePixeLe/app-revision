/**
 * exercise.service.ts
 *
 * Service de gestion des EXERCICES.
 *
 * Analogie du monde réel :
 * ----------------------
 * Imagine un carnet d'exercices de maths avec :
 * - Une liste de tous les exercices disponibles
 * - Ton avancement sur chaque exercice
 * - Tes notes et solutions
 * - Un système de révision espacée
 *
 * Ce service est comme un professeur personnel qui :
 * - Te donne les exercices à faire
 * - Suit ta progression
 * - Te rappelle quoi réviser
 * - Calcule tes statistiques
 *
 * Responsabilités :
 * ----------------
 * 1. Charger tous les exercices (100+ exercices)
 * 2. Filtrer par type, difficulté, statut
 * 3. Suivre la progression de chaque exercice
 * 4. Gérer la révision espacée
 * 5. Calculer les statistiques
 * 6. Sauvegarder les solutions (pseudo-code, Java)
 *
 * Philosophie David J. Malan :
 * "Practice makes perfect, but deliberate practice makes expertise."
 *
 * La révision espacée = deliberate practice
 *
 * Auteur: H1m0t3p3
 * Date: 23 décembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Import des modèles
import {
  Exercise,
  ExerciseType,
  ExerciseDifficulty,
  ExerciseStatus,
  ExerciseStats,
  calculateCompletionPercentage,
  calculateNextReviewDate
} from '../models/exercise.model';

// Import du service de stockage
import { StorageService, StorageKeys } from './storage.service';

/**
 * Service Injectable
 */
@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  /**
   * BehaviorSubject pour tous les exercices
   * ---------------------------------------
   * Contient la liste COMPLÈTE de tous les exercices du programme.
   */
  private exercisesSubject = new BehaviorSubject<Exercise[]>([]);

  /**
   * Observable public des exercices
   */
  public exercises$: Observable<Exercise[]> = this.exercisesSubject.asObservable();

  /**
   * BehaviorSubject pour les exercices en cours de révision
   * ------------------------------------------------------
   * Les exercices qui doivent être révisés aujourd'hui.
   */
  private reviewQueueSubject = new BehaviorSubject<Exercise[]>([]);

  /**
   * Observable public de la file de révision
   */
  public reviewQueue$: Observable<Exercise[]> = this.reviewQueueSubject.asObservable();

  /**
   * Constructeur
   */
  constructor(
    private storageService: StorageService
  ) {
    // Chargement automatique des exercices au démarrage
    this.loadExercises();
  }

  // ============================================================
  // INITIALISATION ET CHARGEMENT
  // ============================================================

  /**
   * CHARGER LES EXERCICES
   * --------------------
   * Charge depuis le stockage ou crée la liste par défaut.
   */
  private loadExercises(): void {
    console.log('📝 Chargement des exercices...');

    this.storageService.get<Exercise[]>(StorageKeys.EXERCISES)
      .subscribe({
        next: (savedExercises) => {
          if (savedExercises && savedExercises.length > 0) {
            console.log('✅ Exercices trouvés:', savedExercises.length);
            this.exercisesSubject.next(savedExercises);
            this.updateReviewQueue();
          } else {
            console.log('📝 Création de la liste d\'exercices par défaut...');
            this.createDefaultExercises();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des exercices:', error);
          this.createDefaultExercises();
        }
      });
  }

  /**
   * CRÉER LA LISTE D'EXERCICES PAR DÉFAUT
   * ------------------------------------
   * Génère tous les exercices basés sur tes PDFs.
   *
   * Total : ~100 exercices
   * - Algèbre de Boole : ~20 exercices
   * - Conditions : 9 exercices
   * - Boucles : 9 exercices
   * - Tableaux : 9 exercices
   * - Java : ~50+ exercices (mêmes que algo, mais en Java)
   */
  private createDefaultExercises(): void {
    const exercises: Exercise[] = [];
    const now = new Date();

    // ===== EXERCICES CONDITIONS (9 exercices) =====

    exercises.push(
      this.createExercise(
        'ex-cond-1',
        'condition',
        'Nombre positif ou négatif',
        'Écrire un algorithme qui demande un nombre à l\'utilisateur, et l\'informe ensuite si ce nombre est positif ou négatif (on laisse de côté le cas où le nombre vaut zéro).',
        'facile',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-1-2',
        'condition',
        'Nombre positif, négatif ou zéro',
        'Écrire un algorithme qui demande un nombre à l\'utilisateur, et l\'informe ensuite si ce nombre est positif ou négatif (on inclut cette fois le traitement du cas où le nombre vaut zéro).',
        'facile',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-2',
        'condition',
        'Produit de deux nombres',
        'Écrire un algorithme qui demande deux nombres à l\'utilisateur et l\'informe ensuite si leur produit est négatif ou positif (on laisse de côté le cas où le produit est nul). Attention toutefois : on ne doit pas calculer le produit des deux nombres.',
        'moyen',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-3',
        'condition',
        'Catégories d\'âge',
        'Écrire un algorithme qui demande l\'âge d\'un enfant à l\'utilisateur. Ensuite, il l\'informe de sa catégorie : "Poussin" de 6 à 7 ans, "Pupille" de 8 à 9 ans, "Minime" de 10 à 11 ans, "Cadet" après 12 ans.',
        'moyen',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-4',
        'condition',
        'Heure dans une minute',
        'Cet algorithme est destiné à prédire l\'avenir, et il doit être infaillible ! Il lira au clavier l\'heure et les minutes, et il affichera l\'heure qu\'il sera une minute plus tard.',
        'moyen',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-4-2',
        'condition',
        'Heure dans une seconde',
        'De même que le précédent, cet algorithme doit demander une heure et en afficher une autre. Mais cette fois, il doit gérer également les secondes, et afficher l\'heure qu\'il sera une seconde plus tard.',
        'difficile',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-5',
        'condition',
        'Facturation photocopies',
        'Un magasin de reprographie facture 0,10 € les dix premières photocopies, 0,09 € les vingt suivantes et 0,08 € au-delà. Ecrivez un algorithme qui demande à l\'utilisateur le nombre de photocopies effectuées et qui affiche la facture correspondante.',
        'moyen',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-6',
        'condition',
        'Impôts à Zorglub',
        'Les habitants de Zorglub paient l\'impôt selon les règles suivantes : les hommes de plus de 20 ans paient l\'impôt, les femmes paient l\'impôt si elles ont entre 18 et 35 ans, les autres ne paient pas d\'impôt.',
        'difficile',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-cond-8',
        'condition',
        'Assurance automobile',
        'Une compagnie d\'assurance automobile propose à ses clients quatre familles de tarifs identifiables par une couleur. Le tarif dépend de la situation du conducteur. [Énoncé complet dans le PDF]',
        'expert',
        'exercice_algo_lesConditions_Mad_V1.0.0.pdf',
        1
      )
    );

    // ===== EXERCICES BOUCLES (9 exercices) =====

    exercises.push(
      this.createExercise(
        'ex-boucle-1',
        'boucle',
        'Nombre entre 1 et 3',
        'Ecrire un algorithme qui demande à l\'utilisateur un nombre compris entre 1 et 3 jusqu\'à ce que la réponse convienne.',
        'facile',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-boucle-2',
        'boucle',
        'Nombre entre 10 et 20',
        'Ecrire un algorithme qui demande un nombre compris entre 10 et 20, jusqu\'à ce que la réponse convienne. En cas de réponse supérieure à 20, on fera apparaître un message : « Plus petit ! », et inversement.',
        'facile',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-boucle-3',
        'boucle',
        'Dix nombres suivants',
        'Ecrire un algorithme qui demande un nombre de départ, et qui ensuite affiche les dix nombres suivants. Par exemple, si l\'utilisateur entre le nombre 17, le programme affichera les nombres de 18 à 27.',
        'moyen',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-boucle-4',
        'boucle',
        'Somme des entiers',
        'Ecrire un algorithme qui demande un nombre de départ, et qui calcule la somme des entiers jusqu\'à ce nombre. Par exemple, si l\'on entre 5, le programme doit calculer : 1 + 2 + 3 + 4 + 5 = 15',
        'moyen',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-boucle-5',
        'boucle',
        'Factorielle',
        'Ecrire un algorithme qui demande un nombre de départ, et qui calcule sa factorielle. NB : la factorielle de 8, notée 8 !, vaut 1 x 2 x 3 x 4 x 5 x 6 x 7 x 8',
        'difficile',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-boucle-6',
        'boucle',
        'Plus grand de 20 nombres',
        'Ecrire un algorithme qui demande successivement 20 nombres à l\'utilisateur, et qui lui dise ensuite quel était le plus grand parmi ces 20 nombres.',
        'moyen',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-boucle-7',
        'boucle',
        'Plus grand nombre (saisie libre)',
        'Réécrire l\'algorithme précédent, mais cette fois-ci on ne connaît pas d\'avance combien l\'utilisateur souhaite saisir de nombres. La saisie des nombres s\'arrête lorsque l\'utilisateur entre un zéro.',
        'difficile',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-boucle-8',
        'boucle',
        'Monnaie à rendre',
        'Lire la suite des prix (en euros entiers et terminée par zéro) des achats d\'un client. Calculer la somme qu\'il doit, lire la somme qu\'il paye, et simuler la remise de la monnaie.',
        'expert',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        2
      ),
      this.createExercise(
        'ex-boucle-9',
        'boucle',
        'Tiercé / Quarté / Quinté',
        'Écrire un algorithme qui permette de connaître ses chances de gagner au tiercé, quarté, quinté. On demande à l\'utilisateur le nombre de chevaux partants, et le nombre de chevaux joués.',
        'expert',
        'exercice_algo_les boucles_mad_v1.0.0.pdf',
        2
      )
    );

    // ===== EXERCICES TABLEAUX (9 exercices) =====

    exercises.push(
      this.createExercise(
        'ex-tableau-1',
        'tableau',
        'Tableau de zéros',
        'Ecrire un algorithme qui déclare et remplisse un tableau de 7 valeurs numériques en les mettant toutes à zéro.',
        'facile',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-tableau-2',
        'tableau',
        'Tableau des voyelles',
        'Ecrire un algorithme qui déclare et remplisse un tableau contenant les six voyelles de l\'alphabet latin.',
        'facile',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-tableau-3',
        'tableau',
        'Valeurs positives et négatives',
        'Ecrivez un algorithme permettant à l\'utilisateur de saisir un nombre quelconque de valeurs, qui devront être stockées dans un tableau. Le programme affichera ensuite le nombre de valeurs négatives et le nombre de valeurs positives.',
        'moyen',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-tableau-4',
        'tableau',
        'Somme d\'un tableau',
        'Ecrivez un algorithme calculant la somme des valeurs d\'un tableau (on suppose que le tableau a été préalablement saisi).',
        'facile',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-tableau-5',
        'tableau',
        'Somme de deux tableaux',
        'Ecrivez un algorithme constituant un tableau, à partir de deux tableaux de même longueur préalablement saisis. Le nouveau tableau sera la somme des éléments des deux tableaux de départ.',
        'moyen',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-tableau-6',
        'tableau',
        'Produit de tableaux',
        'Toujours à partir de deux tableaux précédemment saisis, écrivez un algorithme qui calcule la somme des produits des deux tableaux.',
        'difficile',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        2
      ),
      this.createExercise(
        'ex-tableau-7',
        'tableau',
        'Augmentation de valeurs',
        'Ecrivez un algorithme qui permette la saisie d\'un nombre quelconque de valeurs. Toutes les valeurs doivent être ensuite augmentées de 1, et le nouveau tableau sera affiché à l\'écran.',
        'moyen',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        1
      ),
      this.createExercise(
        'ex-tableau-8',
        'tableau',
        'Plus grande valeur et position',
        'Ecrivez un algorithme permettant à l\'utilisateur de saisir un nombre déterminé de valeurs. Le programme renvoie la plus grande valeur en précisant quelle position elle occupe dans le tableau.',
        'difficile',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        2
      ),
      this.createExercise(
        'ex-tableau-9',
        'tableau',
        'Notes supérieures à la moyenne',
        'Ecrivez un algorithme permettant à l\'utilisateur de saisir les notes d\'une classe. Le programme renvoie le nombre de ces notes supérieures à la moyenne de la classe.',
        'difficile',
        'exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        2
      )
    );

    // On sauvegarde les exercices créés
    this.exercisesSubject.next(exercises);
    this.saveExercises(exercises).subscribe({
      next: () => {
        console.log('✅ Liste d\'exercices créée et sauvegardée !');
        this.updateReviewQueue();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la sauvegarde des exercices:', error);
      }
    });
  }

  /**
   * Fonction helper pour créer un exercice
   */
  private createExercise(
    id: string,
    type: ExerciseType,
    title: string,
    description: string,
    difficulty: ExerciseDifficulty,
    document: string,
    pageNumber: number
  ): Exercise {
    const now = new Date();

    return {
      id,
      type,
      title,
      description,
      difficulty,
      document,
      pageNumber,
      status: 'todo',
      timeSpent: 0,
      attempts: 0,
      notes: '',
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * SAUVEGARDER LES EXERCICES
   */
  private saveExercises(exercises: Exercise[]): Observable<Exercise[]> {
    return this.storageService.set(StorageKeys.EXERCISES, exercises);
  }

  /**
   * METTRE À JOUR LA FILE DE RÉVISION
   * --------------------------------
   * Identifie les exercices à réviser aujourd'hui.
   */
  private updateReviewQueue(): void {
    const exercises = this.exercisesSubject.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toReview = exercises.filter(ex => {
      // Seulement les exercices terminés
      if (ex.status !== 'completed' && ex.status !== 'reviewed') {
        return false;
      }

      // Si pas de date de révision, à réviser
      if (!ex.nextReviewDate) return true;

      // Si la date de révision est aujourd'hui ou avant
      const reviewDate = new Date(ex.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);

      return reviewDate.getTime() <= today.getTime();
    });

    this.reviewQueueSubject.next(toReview);
    console.log(`📚 ${toReview.length} exercice(s) à réviser aujourd'hui`);
  }

  // ... (Suite dans le prochain artifact : méthodes publiques)
}

/**
 * Réflexions pédagogiques (À suivre...)
 */
