/**
 * planning-settings.component.ts
 *
 * Composant pour configurer le planning de manière flexible.
 *
 * Fonctionnalités :
 * - Changer la date de début
 * - Créer un nouveau planning depuis un template
 * - Exporter/Importer un planning
 * - Réinitialiser le planning
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PlanningService } from '../../core/services/planning.service';
import { PlanningConfig, PLANNING_TEMPLATES } from '../../core/models/planning-config.model';
import { Day } from '../../core/models/day.model';

@Component({
  selector: 'app-planning-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <header class="settings-header">
        <h1>Paramètres du Planning</h1>
        <p class="subtitle">Personnalisez votre programme de révision</p>
      </header>

      <!-- Section Date de début -->
      <section class="settings-section">
        <h2>
          <span class="section-icon">📅</span>
          Date de début
        </h2>
        <p class="section-desc">
          Modifiez la date de début pour recalculer tout le planning.
        </p>

        <div class="date-picker-container">
          <div class="current-dates">
            <div class="date-info">
              <span class="date-label">Début actuel</span>
              <span class="date-value">{{ currentStartDate | date:'dd MMMM yyyy':'':'fr' }}</span>
            </div>
            <span class="date-arrow">→</span>
            <div class="date-info">
              <span class="date-label">Fin prévue</span>
              <span class="date-value">{{ currentEndDate | date:'dd MMMM yyyy':'':'fr' }}</span>
            </div>
          </div>

          <div class="date-input-group">
            <label for="newStartDate">Nouvelle date de début :</label>
            <input
              type="date"
              id="newStartDate"
              [(ngModel)]="newStartDate"
              class="date-input"
            />
            <button
              class="btn btn-primary"
              (click)="changeStartDate()"
              [disabled]="!newStartDate || isLoading">
              <span *ngIf="!isLoading">Appliquer</span>
              <span *ngIf="isLoading">...</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Section Templates -->
      <section class="settings-section">
        <h2>
          <span class="section-icon">📋</span>
          Créer un nouveau planning
        </h2>
        <p class="section-desc">
          Choisissez un template pour créer un nouveau programme de révision.
          <strong class="warning">Attention : cela remplacera le planning actuel !</strong>
        </p>

        <div class="templates-grid">
          <div
            *ngFor="let template of templates; let i = index"
            class="template-card"
            [class.selected]="selectedTemplate === i"
            (click)="selectTemplate(i)">
            <div class="template-header">
              <span class="template-name">{{ template.name }}</span>
              <span class="template-days">{{ template.totalDays }} jours</span>
            </div>
            <p class="template-desc">{{ template.description }}</p>
            <div class="template-phases">
              <span
                *ngFor="let phase of template.phases"
                class="phase-tag"
                [style.background-color]="phase.color + '20'"
                [style.color]="phase.color"
                [style.border-color]="phase.color">
                {{ phase.icon }} {{ phase.name }} ({{ phase.daysCount }}j)
              </span>
            </div>
          </div>
        </div>

        <div class="create-planning-form" *ngIf="selectedTemplate !== null">
          <div class="form-group">
            <label>Nom personnalisé (optionnel)</label>
            <input
              type="text"
              [(ngModel)]="customPlanningName"
              placeholder="Ex: Ma révision Python 2025"
              class="text-input"
            />
          </div>
          <div class="form-group">
            <label>Date de début du nouveau planning</label>
            <input
              type="date"
              [(ngModel)]="newPlanningStartDate"
              class="date-input"
            />
          </div>
          <button
            class="btn btn-success"
            (click)="createNewPlanning()"
            [disabled]="!newPlanningStartDate || isLoading">
            Créer le nouveau planning
          </button>
        </div>
      </section>

      <!-- Section Export/Import -->
      <section class="settings-section">
        <h2>
          <span class="section-icon">💾</span>
          Sauvegarder / Restaurer
        </h2>
        <p class="section-desc">
          Exportez votre planning pour le sauvegarder ou l'importer sur un autre appareil.
        </p>

        <div class="export-import-buttons">
          <button class="btn btn-secondary" (click)="exportPlanning()">
            📤 Exporter le planning
          </button>
          <label class="btn btn-secondary file-input-label">
            📥 Importer un planning
            <input
              type="file"
              accept=".json"
              (change)="importPlanning($event)"
              class="file-input"
            />
          </label>
        </div>
      </section>

      <!-- Section Reset -->
      <section class="settings-section danger-zone">
        <h2>
          <span class="section-icon">⚠️</span>
          Zone de danger
        </h2>
        <p class="section-desc">
          Actions irréversibles. Procédez avec prudence !
        </p>

        <div class="danger-actions">
          <button
            class="btn btn-danger"
            (click)="confirmReset()"
            [disabled]="isLoading">
            🗑️ Réinitialiser le planning
          </button>
        </div>

        <div class="confirm-modal" *ngIf="showResetConfirm">
          <div class="modal-content">
            <h3>Confirmer la réinitialisation ?</h3>
            <p>Cette action supprimera TOUTE votre progression et recréera un planning vierge.</p>
            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="showResetConfirm = false">
                Annuler
              </button>
              <button class="btn btn-danger" (click)="resetPlanning()">
                Oui, réinitialiser
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Toast de notification -->
      <div class="toast" [class.show]="showToast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
        {{ toastMessage }}
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: #94a3b8;
        font-size: 1rem;
      }
    }

    .settings-section {
      background: #1e293b;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid #334155;

      h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
        margin-bottom: 0.5rem;
      }

      .section-icon {
        font-size: 1.5rem;
      }

      .section-desc {
        color: #94a3b8;
        font-size: 0.875rem;
        margin-bottom: 1.5rem;

        .warning {
          display: block;
          color: #f59e0b;
          margin-top: 0.5rem;
        }
      }
    }

    /* Date picker */
    .date-picker-container {
      .current-dates {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #0f172a;
        border-radius: 0.75rem;
      }

      .date-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .date-label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
      }

      .date-value {
        font-size: 1rem;
        font-weight: 600;
        color: #f8fafc;
      }

      .date-arrow {
        font-size: 1.5rem;
        color: #3b82f6;
      }
    }

    .date-input-group {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;

      label {
        color: #94a3b8;
        font-size: 0.875rem;
      }
    }

    .date-input, .text-input {
      padding: 0.75rem 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      color: #f8fafc;
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: #3b82f6;
      }
    }

    .text-input {
      width: 100%;
    }

    /* Buttons */
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: #3b82f6;
      color: white;

      &:hover:not(:disabled) {
        background: #2563eb;
      }
    }

    .btn-secondary {
      background: #475569;
      color: white;

      &:hover:not(:disabled) {
        background: #64748b;
      }
    }

    .btn-success {
      background: #22c55e;
      color: white;

      &:hover:not(:disabled) {
        background: #16a34a;
      }
    }

    .btn-danger {
      background: #ef4444;
      color: white;

      &:hover:not(:disabled) {
        background: #dc2626;
      }
    }

    /* Templates */
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .template-card {
      background: #0f172a;
      border: 2px solid #334155;
      border-radius: 0.75rem;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #3b82f6;
      }

      &.selected {
        border-color: #3b82f6;
        background: #1e3a5f;
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .template-name {
        font-weight: 600;
        color: #f8fafc;
      }

      .template-days {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        background: #3b82f6;
        color: white;
        border-radius: 9999px;
      }

      .template-desc {
        font-size: 0.8rem;
        color: #94a3b8;
        margin-bottom: 0.75rem;
      }

      .template-phases {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .phase-tag {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid;
      }
    }

    .create-planning-form {
      background: #0f172a;
      padding: 1.5rem;
      border-radius: 0.75rem;

      .form-group {
        margin-bottom: 1rem;

        label {
          display: block;
          color: #94a3b8;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
      }
    }

    /* Export/Import */
    .export-import-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .file-input-label {
      position: relative;
      cursor: pointer;
    }

    .file-input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      cursor: pointer;
    }

    /* Danger zone */
    .danger-zone {
      border-color: #ef444433;

      h2 {
        color: #ef4444;
      }
    }

    .danger-actions {
      display: flex;
      gap: 1rem;
    }

    /* Modal */
    .confirm-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #1e293b;
      padding: 2rem;
      border-radius: 1rem;
      max-width: 400px;
      text-align: center;

      h3 {
        color: #f8fafc;
        margin-bottom: 1rem;
      }

      p {
        color: #94a3b8;
        margin-bottom: 1.5rem;
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      color: white;
      font-weight: 600;
      opacity: 0;
      transition: all 0.3s;
      z-index: 1001;

      &.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }

      &.success {
        background: #22c55e;
      }

      &.error {
        background: #ef4444;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .settings-container {
        padding: 1rem;
      }

      .current-dates {
        flex-direction: column;

        .date-arrow {
          transform: rotate(90deg);
        }
      }

      .date-input-group {
        flex-direction: column;
        align-items: stretch;
      }

      .templates-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PlanningSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Dates actuelles
  currentStartDate: Date = new Date();
  currentEndDate: Date = new Date();
  days: Day[] = [];

  // Formulaire de changement de date
  newStartDate: string = '';

  // Templates
  templates = PLANNING_TEMPLATES;
  selectedTemplate: number | null = null;
  customPlanningName: string = '';
  newPlanningStartDate: string = '';

  // UI State
  isLoading: boolean = false;
  showResetConfirm: boolean = false;

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private planningService: PlanningService) {}

  ngOnInit(): void {
    // S'abonne aux jours pour avoir les dates
    this.planningService.days$
      .pipe(takeUntil(this.destroy$))
      .subscribe(days => {
        this.days = days;
        if (days.length > 0) {
          this.currentStartDate = new Date(days[0].date);
          this.currentEndDate = new Date(days[days.length - 1].date);
        }
      });

    // Initialise la date par défaut à aujourd'hui
    const today = new Date();
    this.newStartDate = this.formatDateForInput(today);
    this.newPlanningStartDate = this.formatDateForInput(today);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Formater une date pour l'input type="date"
   */
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Changer la date de début
   */
  changeStartDate(): void {
    if (!this.newStartDate) return;

    this.isLoading = true;
    const newDate = new Date(this.newStartDate);

    this.planningService.setStartDate(newDate).subscribe({
      next: () => {
        this.isLoading = false;
        this.showNotification('Date de début modifiée avec succès !', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Erreur lors du changement de date', 'error');
        console.error(error);
      }
    });
  }

  /**
   * Sélectionner un template
   */
  selectTemplate(index: number): void {
    this.selectedTemplate = this.selectedTemplate === index ? null : index;
  }

  /**
   * Créer un nouveau planning
   */
  createNewPlanning(): void {
    if (this.selectedTemplate === null || !this.newPlanningStartDate) return;

    this.isLoading = true;
    const startDate = new Date(this.newPlanningStartDate);

    this.planningService.createPlanningFromTemplate(
      this.selectedTemplate,
      startDate,
      this.customPlanningName || undefined
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.selectedTemplate = null;
        this.customPlanningName = '';
        this.showNotification('Nouveau planning créé avec succès !', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Erreur lors de la création du planning', 'error');
        console.error(error);
      }
    });
  }

  /**
   * Exporter le planning en JSON
   */
  exportPlanning(): void {
    const data = this.planningService.exportPlanning();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `planning-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.showNotification('Planning exporté !', 'success');
  }

  /**
   * Importer un planning depuis JSON
   */
  importPlanning(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.days || !Array.isArray(data.days)) {
          throw new Error('Format de fichier invalide');
        }

        this.planningService.importPlanning(data).subscribe({
          next: () => {
            this.showNotification('Planning importé avec succès !', 'success');
          },
          error: (error) => {
            this.showNotification('Erreur lors de l\'import', 'error');
            console.error(error);
          }
        });
      } catch (error) {
        this.showNotification('Fichier JSON invalide', 'error');
        console.error(error);
      }
    };

    reader.readAsText(file);
    input.value = ''; // Reset pour permettre de réimporter le même fichier
  }

  /**
   * Afficher la confirmation de reset
   */
  confirmReset(): void {
    this.showResetConfirm = true;
  }

  /**
   * Réinitialiser le planning
   */
  resetPlanning(): void {
    this.showResetConfirm = false;
    this.isLoading = true;

    this.planningService.resetPlanning().subscribe({
      next: () => {
        this.isLoading = false;
        this.showNotification('Planning réinitialisé !', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Erreur lors de la réinitialisation', 'error');
        console.error(error);
      }
    });
  }

  /**
   * Afficher une notification toast
   */
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
