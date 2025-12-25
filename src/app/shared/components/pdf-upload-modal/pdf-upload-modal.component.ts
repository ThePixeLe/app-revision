/**
 * pdf-upload-modal.component.ts
 *
 * Modal pour uploader des PDFs dans le dossier assets/docs.
 *
 * Fonctionnalités :
 * - Drag & drop de fichiers PDF
 * - Sélection via le file picker
 * - Upload vers le serveur Express local
 * - Feedback visuel de progression
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  success: boolean;
  file?: {
    name: string;
    path: string;
  };
  error?: string;
}

@Component({
  selector: 'app-pdf-upload-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-upload-modal.component.html',
  styleUrls: ['./pdf-upload-modal.component.scss']
})
export class PdfUploadModalComponent implements OnInit {

  // ============================================================
  // ÉVÉNEMENTS
  // ============================================================

  @Output() close = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<string>(); // Émet le nom du fichier uploadé

  // ============================================================
  // ÉTAT
  // ============================================================

  /** Fichier sélectionné */
  selectedFile: File | null = null;

  /** Statut de l'upload */
  status: UploadStatus = 'idle';

  /** Progression (0-100) */
  progress: number = 0;

  /** Message d'erreur */
  errorMessage: string = '';

  /** Serveur disponible */
  serverAvailable: boolean = false;

  /** Drag over actif */
  isDragOver: boolean = false;

  /** URL du serveur */
  private serverUrl = 'http://localhost:3001';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private http: HttpClient) {}

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    this.checkServer();
  }

  // ============================================================
  // MÉTHODES PUBLIQUES
  // ============================================================

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Vérifie si le serveur est disponible
   */
  checkServer(): void {
    this.http.get<{ status: string }>(`${this.serverUrl}/api/health`)
      .subscribe({
        next: () => {
          this.serverAvailable = true;
        },
        error: () => {
          this.serverAvailable = false;
        }
      });
  }

  /**
   * Gère le drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Gère le drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Gère le drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /**
   * Gère la sélection de fichier
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  /**
   * Traite le fichier sélectionné
   */
  handleFile(file: File): void {
    // Vérifie que c'est un PDF
    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Seuls les fichiers PDF sont acceptés';
      this.status = 'error';
      return;
    }

    // Vérifie la taille (max 50 MB)
    if (file.size > 50 * 1024 * 1024) {
      this.errorMessage = 'Le fichier est trop volumineux (max 50 MB)';
      this.status = 'error';
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';
    this.status = 'idle';
  }

  /**
   * Upload le fichier
   */
  uploadFile(): void {
    if (!this.selectedFile) return;

    this.status = 'uploading';
    this.progress = 0;

    const formData = new FormData();
    formData.append('pdf', this.selectedFile);

    this.http.post<UploadResult>(`${this.serverUrl}/api/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          const result = event.body;
          if (result?.success) {
            this.status = 'success';
            console.log('✅ PDF uploadé:', result.file?.name);

            // Émet l'événement après un délai
            setTimeout(() => {
              this.uploaded.emit(result.file?.name);
              this.closeModal();
            }, 1500);
          } else {
            this.status = 'error';
            this.errorMessage = result?.error || 'Erreur inconnue';
          }
        }
      },
      error: (error) => {
        console.error('❌ Erreur upload:', error);
        this.status = 'error';
        this.errorMessage = error.error?.error || 'Erreur de connexion au serveur';
      }
    });
  }

  /**
   * Réinitialise le formulaire
   */
  reset(): void {
    this.selectedFile = null;
    this.status = 'idle';
    this.progress = 0;
    this.errorMessage = '';
  }

  /**
   * Formate la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
