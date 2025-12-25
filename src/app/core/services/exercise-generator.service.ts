/**
 * exercise-generator.service.ts
 *
 * Service pour la GÉNÉRATION D'EXERCICES avec IA (Ollama).
 *
 * Fonctionnement :
 * ---------------
 * 1. L'utilisateur choisit type, difficulté, format
 * 2. Le service construit un prompt optimisé
 * 3. Ollama génère l'exercice en JSON
 * 4. Le service parse et valide la réponse
 * 5. L'exercice peut être sauvegardé dans la liste
 *
 * Philosophie David J. Malan :
 * "The best way to learn is by doing."
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';

import {
  GenerationConfig,
  GeneratedExerciseResponse,
  GenerationResult,
  GenerationStatus,
  TYPE_DESCRIPTIONS,
  DIFFICULTY_DESCRIPTIONS,
  FORMAT_INSTRUCTIONS,
  ExerciseFormat
} from '../models/generated-exercise.model';

import {
  Exercise,
  ExerciseType,
  ExerciseDifficulty,
  createExercise
} from '../models/exercise.model';

// ============================================================
// INTERFACES INTERNES
// ============================================================

interface OllamaTagsResponse {
  models: Array<{ name: string; size: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class ExerciseGeneratorService {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  private readonly OLLAMA_BASE_URL = 'http://localhost:11434';
  private readonly TIMEOUT_MS = 60000; // 60 secondes pour la génération
  private readonly CHECK_TIMEOUT_MS = 3000; // 3 secondes pour le status check

  // ============================================================
  // ÉTAT
  // ============================================================

  /** Modèle Ollama détecté */
  private currentModel = '';

  /** Ollama disponible ? */
  private ollamaAvailableSubject = new BehaviorSubject<boolean>(false);
  ollamaAvailable$ = this.ollamaAvailableSubject.asObservable();

  /** Statut de génération */
  private statusSubject = new BehaviorSubject<GenerationStatus>('idle');
  status$ = this.statusSubject.asObservable();

  /** Compteur d'exercices générés (pour les IDs uniques) */
  private generatedCount = 0;

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private http: HttpClient) {
    this.checkOllamaStatus();
  }

  // ============================================================
  // MÉTHODES PUBLIQUES
  // ============================================================

  /**
   * Vérifie si Ollama est disponible
   */
  checkOllamaStatus(): Observable<boolean> {
    this.statusSubject.next('checking');

    return this.http.get<OllamaTagsResponse>(`${this.OLLAMA_BASE_URL}/api/tags`)
      .pipe(
        timeout(this.CHECK_TIMEOUT_MS),
        map(response => {
          if (response?.models?.length > 0) {
            this.currentModel = response.models[0].name;
            console.log(`✅ Ollama disponible ! Modèle: ${this.currentModel}`);
            this.ollamaAvailableSubject.next(true);
            this.statusSubject.next('idle');
            return true;
          }
          this.ollamaAvailableSubject.next(false);
          this.statusSubject.next('idle');
          return false;
        }),
        catchError(error => {
          console.warn('⚠️ Ollama non disponible pour la génération:', error.message);
          this.ollamaAvailableSubject.next(false);
          this.statusSubject.next('idle');
          return of(false);
        })
      );
  }

  /**
   * Retourne le nom du modèle actuel
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  /**
   * Retourne si Ollama est disponible (sync)
   */
  isOllamaAvailable(): boolean {
    return this.ollamaAvailableSubject.value;
  }

  /**
   * Génère un exercice avec l'IA
   */
  async generateExercise(config: GenerationConfig): Promise<GenerationResult> {
    // Vérifie Ollama
    if (!this.ollamaAvailableSubject.value) {
      return {
        status: 'error',
        error: 'Ollama n\'est pas disponible. Lancez `ollama serve` dans un terminal.'
      };
    }

    this.statusSubject.next('generating');
    const startTime = Date.now();

    try {
      // Construit le prompt
      const prompt = this.buildPrompt(config);

      // Appelle Ollama
      const response = await this.callOllama(prompt);

      // Parse la réponse
      const exercise = this.parseResponse(response, config.format);

      this.statusSubject.next('success');

      return {
        status: 'success',
        exercise,
        generationTime: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('Erreur génération:', error);
      this.statusSubject.next('error');

      return {
        status: 'error',
        error: error.message || 'Erreur lors de la génération',
        generationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Convertit un exercice généré en Exercise pour sauvegarde
   */
  convertToExercise(
    generated: GeneratedExerciseResponse,
    config: GenerationConfig
  ): Exercise {
    this.generatedCount++;
    const id = `ai-${config.type}-${Date.now()}-${this.generatedCount}`;

    // Construit la description complète
    let fullDescription = generated.description;

    // Ajoute le code snippet si présent
    if (generated.codeSnippet) {
      fullDescription += '\n\n```java\n' + generated.codeSnippet + '\n```';
    }

    // Ajoute les options QCM si présent
    if (generated.options && generated.options.length > 0) {
      fullDescription += '\n\nOptions :\n';
      generated.options.forEach((opt, i) => {
        const letter = String.fromCharCode(65 + i); // A, B, C, D
        fullDescription += `${letter}) ${opt.text}\n`;
      });
    }

    // Crée l'exercice
    const exercise = createExercise({
      id,
      type: config.type,
      title: generated.title,
      description: fullDescription,
      difficulty: config.difficulty,
      document: 'Généré par IA',
      pageNumber: 1,
      status: 'todo',
      tags: ['ai-generated', config.format, `generated-${new Date().toISOString().split('T')[0]}`]
    });

    // Ajoute la solution si disponible
    if (generated.solution) {
      exercise.solution = {
        pseudoCode: generated.solution.pseudoCode || '',
        javaCode: generated.solution.javaCode || '',
        notes: generated.solution.explanation || '',
        lastModified: new Date()
      };
    }

    // Ajoute les hints dans les notes
    if (generated.hints && generated.hints.length > 0) {
      exercise.notes = '💡 Indices :\n' + generated.hints.map((h, i) => `${i + 1}. ${h}`).join('\n');
    }

    return exercise;
  }

  /**
   * Réinitialise l'état
   */
  reset(): void {
    this.statusSubject.next('idle');
  }

  // ============================================================
  // MÉTHODES PRIVÉES - PROMPT ENGINEERING
  // ============================================================

  /**
   * Construit le prompt complet pour Ollama
   */
  private buildPrompt(config: GenerationConfig): string {
    const typeDesc = TYPE_DESCRIPTIONS[config.type];
    const diffDesc = DIFFICULTY_DESCRIPTIONS[config.difficulty];
    const formatInstr = FORMAT_INSTRUCTIONS[config.format];

    // Structure JSON attendue selon le format
    const jsonStructure = this.getExpectedJsonStructure(config);

    return `Tu es un professeur d'informatique expert créant des exercices pédagogiques pour des étudiants AFPA.

═══════════════════════════════════════════════════════════
CONTEXTE
═══════════════════════════════════════════════════════════
Application : Study Tracker Pro - Révision algorithmique et Java
Public cible : Étudiants en formation développeur

═══════════════════════════════════════════════════════════
PARAMÈTRES DE L'EXERCICE
═══════════════════════════════════════════════════════════
SUJET : ${config.type.toUpperCase()}
${typeDesc}

DIFFICULTÉ : ${config.difficulty.toUpperCase()}
${diffDesc}

FORMAT : ${config.format.toUpperCase()}
${formatInstr}

═══════════════════════════════════════════════════════════
RÈGLES STRICTES
═══════════════════════════════════════════════════════════
1. Réponds UNIQUEMENT avec du JSON valide
2. PAS de texte avant ou après le JSON
3. PAS de markdown \`\`\`json (juste le JSON brut)
4. Titre : max 60 caractères, descriptif
5. Description : énoncé clair et complet EN FRANÇAIS
6. Adapte la complexité au niveau ${config.difficulty}
${config.includeSolution ? '7. INCLUS une solution détaillée' : '7. N\'INCLUS PAS de solution'}
${config.includeHints ? '8. INCLUS 2-3 indices progressifs' : '8. N\'INCLUS PAS d\'indices'}

═══════════════════════════════════════════════════════════
STRUCTURE JSON ATTENDUE
═══════════════════════════════════════════════════════════
${jsonStructure}

═══════════════════════════════════════════════════════════
GÉNÈRE L'EXERCICE MAINTENANT (JSON uniquement) :`;
  }

  /**
   * Retourne la structure JSON attendue selon le format
   */
  private getExpectedJsonStructure(config: GenerationConfig): string {
    const base = `{
  "title": "Titre court et descriptif",
  "description": "Énoncé complet du problème...",
  "format": "${config.format}"`;

    const options = config.format === 'qcm' ? `,
  "options": [
    { "text": "Option A", "isCorrect": false },
    { "text": "Option B (la bonne)", "isCorrect": true },
    { "text": "Option C", "isCorrect": false },
    { "text": "Option D", "isCorrect": false }
  ]` : '';

    const codeSnippet = ['code-completion', 'debugging'].includes(config.format) ? `,
  "codeSnippet": "// Code Java avec parties à compléter ou erreurs..."` : '';

    const solution = config.includeSolution ? `,
  "solution": {
    "pseudoCode": "ALGORITHME...\\nDÉBUT...\\nFIN",
    "javaCode": "public static void main...",
    "explanation": "Explication de la solution..."
  }` : '';

    const hints = config.includeHints ? `,
  "hints": [
    "Premier indice (le plus vague)",
    "Deuxième indice (plus précis)",
    "Troisième indice (presque la réponse)"
  ]` : '';

    return base + options + codeSnippet + solution + hints + '\n}';
  }

  // ============================================================
  // MÉTHODES PRIVÉES - COMMUNICATION OLLAMA
  // ============================================================

  /**
   * Appelle l'API Ollama pour générer
   */
  private async callOllama(prompt: string): Promise<string> {
    const body = {
      model: this.currentModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false,
      options: {
        temperature: 0.8, // Un peu plus créatif pour la variété
        num_predict: 2000 // Plus long pour les exercices complets
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur Ollama: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.message?.content || '';

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('La génération a pris trop de temps. Réessayez avec un exercice plus simple.');
      }

      throw error;
    }
  }

  // ============================================================
  // MÉTHODES PRIVÉES - PARSING
  // ============================================================

  /**
   * Parse la réponse JSON de l'IA avec fallbacks
   */
  private parseResponse(raw: string, format: ExerciseFormat): GeneratedExerciseResponse {
    // Nettoie la réponse
    let cleaned = raw.trim();

    // Essai 1 : JSON direct
    try {
      const parsed = JSON.parse(cleaned);
      return this.validateAndNormalize(parsed, format);
    } catch {
      // Continue avec les fallbacks
    }

    // Essai 2 : Extrait du markdown ```json ... ```
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1].trim());
        return this.validateAndNormalize(parsed, format);
      } catch {
        // Continue
      }
    }

    // Essai 3 : Trouve le premier { et dernier }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonStr);
        return this.validateAndNormalize(parsed, format);
      } catch {
        // Continue
      }
    }

    // Essai 4 : Répare le JSON commun (virgules trailing, etc.)
    try {
      const repaired = this.repairJson(cleaned);
      const parsed = JSON.parse(repaired);
      return this.validateAndNormalize(parsed, format);
    } catch {
      // Échec total
    }

    throw new Error('Impossible de parser la réponse de l\'IA. Réessayez.');
  }

  /**
   * Tente de réparer un JSON malformé
   */
  private repairJson(str: string): string {
    // Trouve le JSON
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    if (start === -1 || end === -1) return str;

    let json = str.substring(start, end + 1);

    // Supprime les virgules trailing
    json = json.replace(/,(\s*[}\]])/g, '$1');

    // Échappe les retours à la ligne dans les strings
    json = json.replace(/:\s*"([^"]*?)"/g, (match, content) => {
      const escaped = content.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      return `: "${escaped}"`;
    });

    return json;
  }

  /**
   * Valide et normalise la réponse parsée
   */
  private validateAndNormalize(data: any, format: ExerciseFormat): GeneratedExerciseResponse {
    // Vérifie les champs obligatoires
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Champ "title" manquant ou invalide');
    }
    if (!data.description || typeof data.description !== 'string') {
      throw new Error('Champ "description" manquant ou invalide');
    }

    // Normalise la réponse
    const normalized: GeneratedExerciseResponse = {
      title: data.title.substring(0, 100), // Limite la longueur
      description: data.description,
      format: format
    };

    // QCM : vérifie les options
    if (format === 'qcm') {
      if (Array.isArray(data.options) && data.options.length >= 2) {
        const options = data.options.slice(0, 4).map((opt: any) => ({
          text: String(opt.text || opt),
          isCorrect: Boolean(opt.isCorrect)
        }));

        // Assure qu'il y a au moins une bonne réponse
        const hasCorrect = options.some((o: { text: string; isCorrect: boolean }) => o.isCorrect);
        if (!hasCorrect && options.length > 0) {
          options[0].isCorrect = true;
        }

        normalized.options = options;
      }
    }

    // Code snippet
    if (data.codeSnippet && typeof data.codeSnippet === 'string') {
      normalized.codeSnippet = data.codeSnippet;
    }

    // Solution
    if (data.solution && typeof data.solution === 'object') {
      normalized.solution = {
        pseudoCode: data.solution.pseudoCode || undefined,
        javaCode: data.solution.javaCode || undefined,
        explanation: data.solution.explanation || undefined
      };
    }

    // Hints
    if (Array.isArray(data.hints)) {
      normalized.hints = data.hints.filter((h: any) => typeof h === 'string').slice(0, 5);
    }

    return normalized;
  }
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI un prompt aussi détaillé ?
 *
 *    Les LLM sont comme des étudiants : plus les instructions sont claires,
 *    meilleur est le résultat. Un prompt vague = réponse vague.
 *
 *    Le prompt engineering est une compétence à part entière !
 *
 * 2. POURQUOI plusieurs fallbacks pour le parsing ?
 *
 *    Les LLM ne sont pas parfaits. Parfois ils ajoutent du texte,
 *    parfois le JSON est mal formaté. Plutôt que d'échouer,
 *    on essaie plusieurs stratégies de récupération.
 *
 *    C'est le principe du "graceful degradation".
 *
 * 3. POURQUOI une température de 0.8 ?
 *
 *    - 0.0 = Déterministe (toujours la même réponse)
 *    - 1.0 = Très créatif (parfois trop)
 *    - 0.8 = Bon équilibre pour des exercices variés mais cohérents
 *
 * 4. POURQUOI convertir en Exercise standard ?
 *
 *    Plutôt que d'avoir deux systèmes séparés, on convertit les exercices
 *    générés au format standard. Ainsi :
 *    - Même interface pour tous les exercices
 *    - Progression et XP comptabilisés
 *    - Révision espacée applicable
 *
 * Citation de Andrej Karpathy :
 * "The hottest programming language is English."
 *
 * Le prompt engineering, c'est programmer en langage naturel !
 */
