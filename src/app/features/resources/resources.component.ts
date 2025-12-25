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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Service pour charger les ressources dynamiquement
import { ResourceService, PDFResource, LinkResource } from '../../core/services/resource.service';

// Modal d'upload PDF
import { PdfUploadModalComponent } from '../../shared/components/pdf-upload-modal/pdf-upload-modal.component';

/**
 * Interface pour un document/ressource
 */
interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'algebre' | 'algo' | 'java' | 'poo' | 'bdd' | 'general';
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
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule, PdfUploadModalComponent],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent implements OnInit, OnDestroy {

  /** Subject pour nettoyer les subscriptions */
  private destroy$ = new Subject<void>();

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

  /**
   * Affiche le modal d'upload PDF
   */
  showUploadModal: boolean = false;

  // ============================================================
  // CONSTRUCTEUR ET CYCLE DE VIE
  // ============================================================

  constructor(private resourceService: ResourceService) {}

  ngOnInit(): void {
    this.loadResources();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  /**
   * Charge les ressources depuis le fichier JSON
   * --------------------------------------------
   * Utilise le ResourceService pour charger dynamiquement
   * les PDFs depuis assets/data/resources.json
   *
   * Pour ajouter un PDF :
   * 1. Copier le PDF dans assets/docs/
   * 2. Ajouter une entrée dans assets/data/resources.json
   * 3. C'est tout ! Le PDF apparaîtra automatiquement.
   *
   * Philosophie David J. Malan :
   * "Separate data from logic. It makes maintenance a breeze."
   */
  private loadResources(): void {
    this.resourceService.getPDFs()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pdfs => {
        // Convertit les PDFResource en Resource (format interne)
        this.allResources = pdfs.map(pdf => ({
          id: pdf.id,
          title: pdf.title,
          description: pdf.description,
          category: pdf.category as 'algebre' | 'algo' | 'java' | 'general',
          type: 'pdf' as const,
          path: this.resourceService.getPDFPath(pdf.filename),
          fileSize: pdf.pages ? `${pdf.pages} pages` : undefined,
          pageCount: pdf.pages,
          isFavorite: this.loadFavoriteStatus(pdf.id)
        }));

        console.log(`📚 ${this.allResources.length} PDFs chargés depuis resources.json`);

        // Calcule les catégories et applique les filtres
        this.calculateCategories();
        this.applyFilters();
      });
  }

  /**
   * Charge le statut favori depuis le localStorage
   */
  private loadFavoriteStatus(resourceId: string): boolean {
    try {
      const favorites = JSON.parse(localStorage.getItem('resource-favorites') || '[]');
      return favorites.includes(resourceId);
    } catch {
      return false;
    }
  }

  /**
   * Sauvegarde les favoris dans le localStorage
   */
  private saveFavorites(): void {
    const favorites = this.allResources
      .filter(r => r.isFavorite)
      .map(r => r.id);
    localStorage.setItem('resource-favorites', JSON.stringify(favorites));
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
        icon: '☕',
        color: '#f97316',
        count: this.allResources.filter(r => r.category === 'java').length
      },
      {
        id: 'poo',
        label: 'POO',
        icon: '🧩',
        color: '#ec4899',
        count: this.allResources.filter(r => r.category === 'poo').length
      },
      {
        id: 'bdd',
        label: 'Base de données',
        icon: '🗄️',
        color: '#06b6d4',
        count: this.allResources.filter(r => r.category === 'bdd').length
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
    // Sauvegarde dans le localStorage
    this.saveFavorites();
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
      'java': '#f97316',
      'poo': '#ec4899',
      'bdd': '#06b6d4',
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

  // ============================================================
  // UPLOAD PDF
  // ============================================================

  /**
   * Ouvre le modal d'upload PDF
   */
  openUploadModal(): void {
    this.showUploadModal = true;
    console.log('📤 Ouverture du modal d\'upload');
  }

  /**
   * Ferme le modal d'upload PDF
   */
  closeUploadModal(): void {
    this.showUploadModal = false;
    console.log('📤 Fermeture du modal d\'upload');
  }

  /**
   * Callback quand un PDF est uploadé
   * Recharge la liste des ressources
   */
  onPdfUploaded(filename: string): void {
    console.log('✅ PDF uploadé:', filename);

    // Recharge les ressources pour inclure le nouveau PDF
    // Note: Le fichier resources.json doit être mis à jour par le serveur
    // ou on peut ajouter le PDF manuellement à la liste
    setTimeout(() => {
      this.loadResources();
    }, 500);
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
