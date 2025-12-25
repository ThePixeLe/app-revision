/**
 * resource.service.ts
 *
 * Service pour charger dynamiquement les ressources (PDFs, liens, videos).
 *
 * Avantages du chargement dynamique :
 * ----------------------------------
 * - Ajouter un PDF = modifier resources.json (pas de code !)
 * - Facile à maintenir
 * - Séparation données / code
 *
 * Philosophie David J. Malan :
 * "Separate data from logic. It makes maintenance a breeze."
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

// ============================================================
// INTERFACES
// ============================================================

/**
 * Interface pour un PDF
 */
export interface PDFResource {
  id: string;
  title: string;
  filename: string;
  category: 'algo' | 'java' | 'algebre' | 'poo' | 'bdd';
  description: string;
  pages?: number;
  tags?: string[];
}

/**
 * Interface pour un lien externe
 */
export interface LinkResource {
  id: string;
  title: string;
  url: string;
  category: 'algo' | 'java' | 'algebre';
  description: string;
  icon?: string;
  recommended?: boolean;
}

/**
 * Interface pour une vidéo
 */
export interface VideoResource {
  id: string;
  title: string;
  url: string;
  category: 'algo' | 'java' | 'algebre';
  description: string;
  duration?: string;
  language?: string;
}

/**
 * Interface pour un outil
 */
export interface ToolResource {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  free?: boolean;
}

/**
 * Structure complète du fichier resources.json
 */
export interface ResourcesData {
  pdfs: PDFResource[];
  links: LinkResource[];
  videos: VideoResource[];
  tools: ToolResource[];
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /** Cache des ressources chargées */
  private resourcesCache: ResourcesData | null = null;

  /** Subject pour les ressources */
  private resourcesSubject = new BehaviorSubject<ResourcesData | null>(null);

  /** Observable public */
  resources$ = this.resourcesSubject.asObservable();

  /** Chemin vers le fichier JSON */
  private readonly RESOURCES_PATH = 'assets/data/resources.json';

  /** Chemin vers le dossier des PDFs */
  private readonly DOCS_PATH = 'assets/docs/';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private http: HttpClient) {
    // Charge les ressources au démarrage
    this.loadResources().subscribe();
  }

  // ============================================================
  // MÉTHODES PUBLIQUES
  // ============================================================

  /**
   * Charge toutes les ressources depuis le fichier JSON
   */
  loadResources(): Observable<ResourcesData> {
    // Si déjà en cache, retourne le cache
    if (this.resourcesCache) {
      return of(this.resourcesCache);
    }

    return this.http.get<ResourcesData>(this.RESOURCES_PATH).pipe(
      tap(data => {
        console.log('📚 Ressources chargées:', data);
        this.resourcesCache = data;
        this.resourcesSubject.next(data);
      }),
      catchError(error => {
        console.error('❌ Erreur chargement ressources:', error);
        // Retourne des données vides en cas d'erreur
        const emptyData: ResourcesData = {
          pdfs: [],
          links: [],
          videos: [],
          tools: []
        };
        return of(emptyData);
      })
    );
  }

  /**
   * Obtient tous les PDFs
   */
  getPDFs(): Observable<PDFResource[]> {
    return this.loadResources().pipe(
      map(data => data.pdfs || [])
    );
  }

  /**
   * Obtient les PDFs par catégorie
   */
  getPDFsByCategory(category: 'algo' | 'java' | 'algebre'): Observable<PDFResource[]> {
    return this.getPDFs().pipe(
      map(pdfs => pdfs.filter(pdf => pdf.category === category))
    );
  }

  /**
   * Obtient tous les liens
   */
  getLinks(): Observable<LinkResource[]> {
    return this.loadResources().pipe(
      map(data => data.links || [])
    );
  }

  /**
   * Obtient les liens par catégorie
   */
  getLinksByCategory(category: string): Observable<LinkResource[]> {
    return this.getLinks().pipe(
      map(links => links.filter(link => link.category === category))
    );
  }

  /**
   * Obtient toutes les vidéos
   */
  getVideos(): Observable<VideoResource[]> {
    return this.loadResources().pipe(
      map(data => data.videos || [])
    );
  }

  /**
   * Obtient tous les outils
   */
  getTools(): Observable<ToolResource[]> {
    return this.loadResources().pipe(
      map(data => data.tools || [])
    );
  }

  /**
   * Construit le chemin complet vers un PDF
   */
  getPDFPath(filename: string): string {
    return this.DOCS_PATH + filename;
  }

  /**
   * Ouvre un PDF dans un nouvel onglet
   */
  openPDF(pdf: PDFResource): void {
    const path = this.getPDFPath(pdf.filename);
    window.open(path, '_blank');
  }

  /**
   * Télécharge un PDF
   */
  downloadPDF(pdf: PDFResource): void {
    const path = this.getPDFPath(pdf.filename);
    const link = document.createElement('a');
    link.href = path;
    link.download = pdf.filename;
    link.click();
  }

  /**
   * Recherche dans toutes les ressources
   */
  search(query: string): Observable<{
    pdfs: PDFResource[];
    links: LinkResource[];
    videos: VideoResource[];
  }> {
    const lowerQuery = query.toLowerCase();

    return this.loadResources().pipe(
      map(data => ({
        pdfs: data.pdfs.filter(pdf =>
          pdf.title.toLowerCase().includes(lowerQuery) ||
          pdf.description.toLowerCase().includes(lowerQuery) ||
          (pdf.tags && pdf.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
        ),
        links: data.links.filter(link =>
          link.title.toLowerCase().includes(lowerQuery) ||
          link.description.toLowerCase().includes(lowerQuery)
        ),
        videos: data.videos.filter(video =>
          video.title.toLowerCase().includes(lowerQuery) ||
          video.description.toLowerCase().includes(lowerQuery)
        )
      }))
    );
  }

  /**
   * Obtient les statistiques des ressources
   */
  getStats(): Observable<{
    totalPDFs: number;
    totalLinks: number;
    totalVideos: number;
    totalTools: number;
    byCategory: { [key: string]: number };
  }> {
    return this.loadResources().pipe(
      map(data => {
        const byCategory: { [key: string]: number } = {};

        // Compte les PDFs par catégorie
        data.pdfs.forEach(pdf => {
          byCategory[pdf.category] = (byCategory[pdf.category] || 0) + 1;
        });

        return {
          totalPDFs: data.pdfs.length,
          totalLinks: data.links.length,
          totalVideos: data.videos.length,
          totalTools: data.tools.length,
          byCategory
        };
      })
    );
  }
}
