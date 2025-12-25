/**
 * planning-config.model.ts
 *
 * Modèle de configuration pour un planning FLEXIBLE.
 *
 * Permet de :
 * - Changer la date de début
 * - Créer des templates personnalisés
 * - Sauvegarder/charger différentes configurations
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

// ============================================================
// TYPES DE PHASES PERSONNALISABLES
// ============================================================

/**
 * Phase personnalisée dans un planning
 */
export interface CustomPhase {
  id: string;                    // ID unique (ex: 'phase-1')
  name: string;                  // Nom affiché (ex: 'Python Basics')
  color: string;                 // Couleur hex (ex: '#3B82F6')
  icon: string;                  // Emoji ou icône (ex: '🐍')
  daysCount: number;             // Nombre de jours pour cette phase
}

/**
 * Jour personnalisé dans un template
 */
export interface CustomDayTemplate {
  dayNumber: number;             // Numéro du jour (1, 2, 3...)
  phaseId: string;               // À quelle phase appartient ce jour
  title: string;                 // Titre du jour
  objectives: string[];          // Objectifs de la journée
  sessions: CustomSessionTemplate[];
}

/**
 * Session personnalisée dans un template
 */
export interface CustomSessionTemplate {
  period: 'matin' | 'apres-midi' | 'soir';
  duration: number;              // Durée en minutes
  topics: string[];              // Sujets à couvrir
  documents?: string[];          // Documents optionnels
}

// ============================================================
// CONFIGURATION PRINCIPALE
// ============================================================

/**
 * Configuration complète d'un planning
 */
export interface PlanningConfig {
  id: string;                    // ID unique de la config
  name: string;                  // Nom du planning (ex: 'Révision Algo Java 2024')
  description?: string;          // Description optionnelle

  // Dates
  startDate: Date;               // Date de début
  endDate?: Date;                // Date de fin calculée automatiquement

  // Structure
  totalDays: number;             // Nombre total de jours
  phases: CustomPhase[];         // Phases du planning

  // Templates de jours (optionnel pour personnalisation avancée)
  dayTemplates?: CustomDayTemplate[];

  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;             // Est-ce le planning actif ?
  isTemplate: boolean;           // Est-ce un template réutilisable ?
}

// ============================================================
// TEMPLATES PRÉDÉFINIS
// ============================================================

/**
 * Templates de planning prédéfinis
 */
export const PLANNING_TEMPLATES: Omit<PlanningConfig, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'isActive'>[] = [
  {
    name: 'Algo + Java (12 jours)',
    description: 'Programme intensif : Algèbre de Boole, Algorithmique, Java et consolidation',
    totalDays: 12,
    isTemplate: true,
    phases: [
      { id: 'algebre', name: 'Algèbre de Boole', color: '#3B82F6', icon: '🔵', daysCount: 2 },
      { id: 'algo', name: 'Algorithmique', color: '#8B5CF6', icon: '🟣', daysCount: 4 },
      { id: 'java', name: 'Java', color: '#F97316', icon: '☕', daysCount: 4 },
      { id: 'consolidation', name: 'Consolidation', color: '#64748B', icon: '📚', daysCount: 2 }
    ]
  },
  {
    name: 'POO + BDD (10 jours)',
    description: 'Programmation Orientée Objet et Bases de données SQL',
    totalDays: 10,
    isTemplate: true,
    phases: [
      { id: 'poo-basics', name: 'POO Bases', color: '#EC4899', icon: '🧩', daysCount: 3 },
      { id: 'poo-advanced', name: 'POO Avancé', color: '#D946EF', icon: '🔧', daysCount: 3 },
      { id: 'bdd', name: 'Base de données', color: '#06B6D4', icon: '🗄️', daysCount: 3 },
      { id: 'projet', name: 'Projet Final', color: '#22C55E', icon: '🚀', daysCount: 1 }
    ]
  },
  {
    name: 'Web Development (14 jours)',
    description: 'HTML, CSS, JavaScript et frameworks',
    totalDays: 14,
    isTemplate: true,
    phases: [
      { id: 'html-css', name: 'HTML/CSS', color: '#E34F26', icon: '🌐', daysCount: 3 },
      { id: 'javascript', name: 'JavaScript', color: '#F7DF1E', icon: '⚡', daysCount: 4 },
      { id: 'typescript', name: 'TypeScript', color: '#3178C6', icon: '📘', daysCount: 3 },
      { id: 'framework', name: 'Framework', color: '#DD0031', icon: '🅰️', daysCount: 3 },
      { id: 'projet-web', name: 'Projet Web', color: '#22C55E', icon: '🚀', daysCount: 1 }
    ]
  },
  {
    name: 'Python Data Science (7 jours)',
    description: 'Python pour l\'analyse de données',
    totalDays: 7,
    isTemplate: true,
    phases: [
      { id: 'python-basics', name: 'Python Bases', color: '#3776AB', icon: '🐍', daysCount: 2 },
      { id: 'numpy-pandas', name: 'NumPy/Pandas', color: '#150458', icon: '📊', daysCount: 2 },
      { id: 'visualization', name: 'Visualisation', color: '#FF6F00', icon: '📈', daysCount: 2 },
      { id: 'projet-data', name: 'Projet Data', color: '#22C55E', icon: '🚀', daysCount: 1 }
    ]
  },
  {
    name: 'Planning Vide (Personnalisé)',
    description: 'Créez votre propre planning de zéro',
    totalDays: 7,
    isTemplate: true,
    phases: [
      { id: 'custom-1', name: 'Phase 1', color: '#3B82F6', icon: '1️⃣', daysCount: 2 },
      { id: 'custom-2', name: 'Phase 2', color: '#8B5CF6', icon: '2️⃣', daysCount: 3 },
      { id: 'custom-3', name: 'Phase 3', color: '#22C55E', icon: '3️⃣', daysCount: 2 }
    ]
  }
];

/**
 * Génère un ID unique
 */
export function generateConfigId(): string {
  return `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée une configuration par défaut
 */
export function createDefaultConfig(startDate: Date = new Date()): PlanningConfig {
  const template = PLANNING_TEMPLATES[0]; // Algo + Java par défaut

  return {
    id: generateConfigId(),
    name: template.name,
    description: template.description,
    startDate: startDate,
    totalDays: template.totalDays,
    phases: template.phases,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isTemplate: false
  };
}

/**
 * Crée une configuration à partir d'un template
 */
export function createConfigFromTemplate(
  templateIndex: number,
  startDate: Date,
  customName?: string
): PlanningConfig {
  const template = PLANNING_TEMPLATES[templateIndex] || PLANNING_TEMPLATES[0];

  // Calcule la date de fin
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + template.totalDays - 1);

  return {
    id: generateConfigId(),
    name: customName || template.name,
    description: template.description,
    startDate: startDate,
    endDate: endDate,
    totalDays: template.totalDays,
    phases: [...template.phases],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isTemplate: false
  };
}
