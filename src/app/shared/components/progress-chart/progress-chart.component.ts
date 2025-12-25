/**
 * progress-chart.component.ts
 *
 * Composant graphique de progression.
 *
 * Affiche deux graphiques :
 * - XP gagnés par jour (courbe)
 * - Exercices complétés par jour (barres)
 *
 * Philosophie David J. Malan :
 * "A picture is worth a thousand numbers."
 *
 * Les graphiques permettent de visualiser la progression
 * de manière intuitive et motivante.
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Chart.js imports
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Services
import { ProgressService } from '../../../core/services/progress.service';

// Enregistre les composants Chart.js nécessaires
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './progress-chart.component.html',
  styleUrls: ['./progress-chart.component.scss']
})
export class ProgressChartComponent implements OnInit, OnDestroy {

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  private destroy$ = new Subject<void>();

  /** Labels des jours (7 derniers jours) */
  chartLabels: string[] = [];

  /** Données XP pour le graphique courbe */
  xpData: number[] = [];

  /** Données exercices pour le graphique barres */
  exercisesData: number[] = [];

  /** Type de graphique pour XP */
  xpChartType: ChartType = 'line';

  /** Type de graphique pour exercices */
  exercisesChartType: ChartType = 'bar';

  /** Configuration du graphique XP */
  xpChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'XP gagnés',
      fill: true,
      tension: 0.4,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#6366f1'
    }]
  };

  /** Configuration du graphique exercices */
  exercisesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Exercices',
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
      borderColor: '#22c55e',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  /** Options pour le graphique XP */
  xpChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `+${context.parsed.y} XP`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#94a3b8'
        }
      }
    }
  };

  /** Options pour le graphique exercices */
  exercisesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} exercice(s)`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: '#94a3b8',
          stepSize: 1
        }
      }
    }
  };

  @ViewChild('xpChart') xpChart!: BaseChartDirective;
  @ViewChild('exercisesChart') exercisesChart!: BaseChartDirective;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private progressService: ProgressService) {}

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  ngOnInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // MÉTHODES
  // ============================================================

  /**
   * Charge les données du graphique depuis le service
   */
  private loadChartData(): void {
    this.progressService.getChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.chartLabels = data.labels;
        this.xpData = data.xpData;
        this.exercisesData = data.exercisesData;

        // Met à jour les graphiques
        this.updateCharts();
      });
  }

  /**
   * Met à jour les données des graphiques
   */
  private updateCharts(): void {
    // Graphique XP
    this.xpChartData = {
      labels: this.chartLabels,
      datasets: [{
        data: this.xpData,
        label: 'XP gagnés',
        fill: true,
        tension: 0.4,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1'
      }]
    };

    // Graphique exercices
    this.exercisesChartData = {
      labels: this.chartLabels,
      datasets: [{
        data: this.exercisesData,
        label: 'Exercices',
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 4
      }]
    };

    // Force le re-render des graphiques
    if (this.xpChart) {
      this.xpChart.update();
    }
    if (this.exercisesChart) {
      this.exercisesChart.update();
    }
  }

  /**
   * Calcule le total XP de la semaine
   */
  getTotalXP(): number {
    return this.xpData.reduce((sum, xp) => sum + xp, 0);
  }

  /**
   * Calcule le total exercices de la semaine
   */
  getTotalExercises(): number {
    return this.exercisesData.reduce((sum, ex) => sum + ex, 0);
  }

  /**
   * Calcule la moyenne XP par jour
   */
  getAverageXP(): number {
    if (this.xpData.length === 0) return 0;
    return Math.round(this.getTotalXP() / this.xpData.length);
  }
}
