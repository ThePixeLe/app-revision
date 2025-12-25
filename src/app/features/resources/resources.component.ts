/**
 * resources.component.ts
 *
 * Composant RESSOURCES - Bibliothèque de documents.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est la page qui donne accès à toutes les ressources pédagogiques :
 * - PDFs de cours (Algèbre, Algorithmique, Java)
 * - Fiches de révision
 * - Liens utiles externes
 *
 * Analogie du monde réel :
 * -----------------------
 * C'est comme la bibliothèque de ton école.
 * Tous les documents sont organisés par matière,
 * et tu peux les consulter quand tu veux.
 *
 * Fonctionnalités :
 * ----------------
 * 1. Liste des PDFs disponibles
 * 2. Filtrage par matière (Algèbre, Algo, Java)
 * 3. Recherche dans les titres
 * 4. Ouverture/téléchargement des PDFs
 * 5. Marque-pages (favoris)
 *
 * Organisation des fichiers :
 * --------------------------
 * Les PDFs sont stockés dans /assets/docs/
 * Nomenclature : "Matiere XX - Titre - Version.pdf"
 *
 * Exemples :
 * - "Algo 03 - Algorithmes Introduction - 1.0.1 MD.pdf"
 * - "Java 01 - Bases Java - MD v1.0.0.pdf"
 *
 * Philosophie David J. Malan :
 * "The best resources are useless if students can't find them."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/**
 * Interface pour un document/ressource
 */
interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'algebre' | 'algo' | 'java' | 'general';
  type: 'pdf' | 'link' | 'video';
  path: string;
  fileSize?: string;
  pageCount?: number;
  isFavorite: boolean;
  lastOpened?: Date;
}

/**
 * Interface pour les catégories
 */
interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent implements OnInit {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /**
   * Liste de toutes les ressources
   */
  allResources: Resource[] = [];

  /**
   * Ressources filtrées (affichées)
   */
  filteredResources: Resource[] = [];

  /**
   * Catégorie sélectionnée
   */
  selectedCategory: string = 'all';

  /**
   * Terme de recherche
   */
  searchTerm: string = '';

  /**
   * Afficher uniquement les favoris
   */
  showFavoritesOnly: boolean = false;

  /**
   * Informations des catégories
   */
  categories: CategoryInfo[] = [];

  /**
   * Ressource sélectionnée pour prévisualisation
   */
  selectedResource: Resource | null = null;

  // ============================================================
  // CONSTRUCTEUR ET CYCLE DE VIE
  // ============================================================

  ngOnInit(): void {
    this.loadResources();
    this.calculateCategories();
    this.applyFilters();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * Charge les ressources disponibles
   * --------------------------------
   * En production, ça viendrait d'un fichier JSON ou d'un service.
   * Pour l'instant, on définit la liste en dur.
   */
  private loadResources(): void {
    this.allResources = [
      // ===== ALGORITHMIQUE =====
      {
        id: 'algo-01',
        title: 'Introduction aux Algorithmes',
        description: 'Les bases de l\'algorithmique : définitions, pseudo-code, organigrammes',
        category: 'algo',
        type: 'pdf',
        path: 'assets/docs/Algo 03 - Algorithmes Introduction - 1.0.1 MD.pdf',
        fileSize: '450 Ko',
        pageCount: 25,
        isFavorite: false
      },
      {
        id: 'algo-02',
        title: 'Algorithmes Simples (AFPA)',
        description: 'Exercices corrigés sur les structures de base',
        category: 'algo',
        type: 'pdf',
        path: 'assets/docs/Algo A2 - Algorithmes simples - AFPA.pdf',
        fileSize: '900 Ko',
        pageCount: 40,
        isFavorite: false
      },
      {
        id: 'algo-03',
        title: 'Exercices - Les Conditions',
        description: '9 exercices sur les structures conditionnelles',
        category: 'algo',
        type: 'pdf',
        path: 'assets/docs/exercice_algo_lesConditions_Mad_V1.0.0 1.pdf',
        fileSize: '310 Ko',
        pageCount: 15,
        isFavorite: true
      },
      {
        id: 'algo-04',
        title: 'Exercices - Les Boucles',
        description: '9 exercices sur les boucles (for, while, do-while)',
        category: 'algo',
        type: 'pdf',
        path: 'assets/docs/exercice_algo_les boucles_mad_v1.0.0 1.pdf',
        fileSize: '270 Ko',
        pageCount: 14,
        isFavorite: false
      },
      {
        id: 'algo-05',
        title: 'Exercices - Les Tableaux',
        description: '9 exercices sur les tableaux et structures de données',
        category: 'algo',
        type: 'pdf',
        path: 'assets/docs/exercice_algorithme_les_tableaux_Mad_V1.0.0.pdf',
        fileSize: '280 Ko',
        pageCount: 16,
        isFavorite: false
      },

      // ===== JAVA =====
      {
        id: 'java-01',
        title: 'Bases de Java',
        description: 'Introduction à Java : environnement, compilation, exécution',
        category: 'java',
        type: 'pdf',
        path: 'assets/docs/Java 01 - Bases Java - MD v1.0.0.pdf',
        fileSize: '600 Ko',
        pageCount: 30,
        isFavorite: false
      },
      {
        id: 'java-02',
        title: 'Syntaxe Java',
        description: 'Variables, types, opérateurs, structures de contrôle',
        category: 'java',
        type: 'pdf',
        path: 'assets/docs/Java 02 - Base Syntaxe - MD v1.0.0.pdf',
        fileSize: '580 Ko',
        pageCount: 28,
        isFavorite: true
      },
      {
        id: 'java-03',
        title: 'Java Scanner',
        description: 'Lecture d\'entrées utilisateur avec Scanner',
        category: 'java',
        type: 'pdf',
        path: 'assets/docs/Java 03 - Scanner - MD v1.0.0.pdf',
        fileSize: '340 Ko',
        pageCount: 12,
        isFavorite: false
      },
      {
        id: 'java-04',
        title: 'Tableaux en Java',
        description: 'Déclaration, manipulation et parcours des tableaux',
        category: 'java',
        type: 'pdf',
        path: 'assets/docs/Java 10 - Programmation_Java_Tableaux.pdf',
        fileSize: '660 Ko',
        pageCount: 35,
        isFavorite: false
      },
      {
        id: 'java-05',
        title: 'Exercices - Tableaux Java',
        description: 'Exercices pratiques sur les tableaux en Java',
        category: 'java',
        type: 'pdf',
        path: 'assets/docs/Java 11 - Exercice Tableau en java MA.pdf',
        fileSize: '250 Ko',
        pageCount: 10,
        isFavorite: false
      }
    ];
  }

  /**
   * Calcule les statistiques par catégorie
   */
  private calculateCategories(): void {
    this.categories = [
      {
        id: 'all',
        label: 'Tout',
        icon: '📚',
        color: '#64748b',
        count: this.allResources.length
      },
      {
        id: 'algebre',
        label: 'Algèbre',
        icon: '🔵',
        color: '#3b82f6',
        count: this.allResources.filter(r => r.category === 'algebre').length
      },
      {
        id: 'algo',
        label: 'Algorithmique',
        icon: '🟣',
        color: '#8b5cf6',
        count: this.allResources.filter(r => r.category === 'algo').length
      },
      {
        id: 'java',
        label: 'Java',
        icon: '🟢',
        color: '#10b981',
        count: this.allResources.filter(r => r.category === 'java').length
      }
    ];
  }

  // ============================================================
  // FILTRAGE
  // ============================================================

  /**
   * Applique les filtres de recherche et catégorie
   */
  applyFilters(): void {
    this.filteredResources = this.allResources.filter(resource => {
      // Filtre par catégorie
      if (this.selectedCategory !== 'all' && resource.category !== this.selectedCategory) {
        return false;
      }

      // Filtre par favoris
      if (this.showFavoritesOnly && !resource.isFavorite) {
        return false;
      }

      // Filtre par recherche
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        const matchTitle = resource.title.toLowerCase().includes(search);
        const matchDesc = resource.description.toLowerCase().includes(search);
        if (!matchTitle && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Change la catégorie sélectionnée
   */
  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  /**
   * Gère la recherche (appelé sur input)
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Toggle le filtre favoris
   */
  toggleFavorites(): void {
    this.showFavoritesOnly = !this.showFavoritesOnly;
    this.applyFilters();
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Ouvre un PDF dans un nouvel onglet
   */
  openResource(resource: Resource): void {
    // Met à jour la date d'ouverture
    resource.lastOpened = new Date();

    // Ouvre le PDF
    window.open(resource.path, '_blank');
  }

  /**
   * Télécharge un PDF
   */
  downloadResource(resource: Resource, event: Event): void {
    event.stopPropagation(); // Évite d'ouvrir en même temps

    const link = document.createElement('a');
    link.href = resource.path;
    link.download = resource.title + '.pdf';
    link.click();
  }

  /**
   * Toggle le favori d'une ressource
   */
  toggleFavorite(resource: Resource, event: Event): void {
    event.stopPropagation();
    resource.isFavorite = !resource.isFavorite;
    // TODO: Sauvegarder dans le storage
  }

  /**
   * Sélectionne une ressource pour prévisualisation
   */
  selectResource(resource: Resource): void {
    this.selectedResource = resource;
  }

  /**
   * Ferme le panneau de prévisualisation
   */
  closePreview(): void {
    this.selectedResource = null;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Retourne l'icône du type de ressource
   */
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'pdf': '📄',
      'link': '🔗',
      'video': '🎬'
    };
    return icons[type] || '📁';
  }

  /**
   * Retourne la couleur de la catégorie
   */
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'algebre': '#3b82f6',
      'algo': '#8b5cf6',
      'java': '#10b981',
      'general': '#64748b'
    };
    return colors[category] || '#64748b';
  }

  /**
   * Compte les favoris
   */
  getFavoritesCount(): number {
    return this.allResources.filter(r => r.isFavorite).length;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI une bibliothèque de ressources ?
 *
 *    ACCESSIBILITÉ :
 *    - Les PDFs éparpillés dans des dossiers = difficile à trouver
 *    - Une bibliothèque centralisée = tout au même endroit
 *
 *    C'est comme la différence entre :
 *    - Chercher un livre dans une maison en désordre
 *    - Aller directement au bon rayon de la bibliothèque
 *
 * 2. POURQUOI le filtrage par catégorie ?
 *
 *    CHARGE COGNITIVE :
 *    10 documents, c'est gérable.
 *    100 documents, c'est overwhelming.
 *
 *    Les filtres réduisent le "bruit" visuel.
 *    Tu ne vois que ce qui t'intéresse.
 *
 * 3. POURQUOI les favoris ?
 *
 *    PERSONNALISATION :
 *    Chaque étudiant utilise différents documents régulièrement.
 *
 *    Les favoris créent un "raccourci" vers tes ressources préférées.
 *    C'est comme mettre un post-it sur les pages importantes d'un livre.
 *
 * 4. POURQUOI afficher la taille et le nombre de pages ?
 *
 *    EXPECTATIONS :
 *    - 10 pages = lecture rapide (10-15 min)
 *    - 50 pages = session d'étude (1h+)
 *
 *    L'utilisateur sait à quoi s'attendre avant d'ouvrir.
 *
 * 5. POURQUOI "lastOpened" ?
 *
 *    CONTEXTE :
 *    "Ah, j'ai ouvert ce PDF hier, donc je l'ai déjà consulté."
 *
 *    Ça aide à se rappeler où on en est dans sa lecture.
 *
 * Citation de David J. Malan :
 * "Make it easy for students to find what they need,
 *  and they'll spend more time learning and less time searching."
 */
