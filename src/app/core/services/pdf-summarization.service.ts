/**
 * pdf-summarization.service.ts
 *
 * Service pour RESUMER des PDFs avec l'IA (Ollama).
 *
 * Fonctionnement :
 * ---------------
 * 1. Recoit le texte extrait d'un PDF
 * 2. Construit un prompt optimise pour le resume
 * 3. Envoie a Ollama (local)
 * 4. Parse la reponse JSON
 * 5. Retourne un resume structure
 *
 * Configuration Ollama :
 * ---------------------
 * 1. Installer Ollama : https://ollama.com
 * 2. Telecharger un modele : ollama pull llama3.2
 * 3. Demarrer : ollama serve
 *
 * Philosophie David J. Malan :
 * "AI is a tool, not a replacement for thinking."
 *
 * L'IA resume, mais l'etudiant doit quand meme COMPRENDRE !
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PDFSummary,
  SummaryGenerationConfig,
  SummaryGenerationResult,
  SummaryLength,
  SummaryStatus,
  KeyPoint,
  MainConcept,
  SuggestedExercise,
  SUMMARY_LENGTH_CONFIG,
  createPDFSummary
} from '../models/pdf-summary.model';

// ============================================================
// INTERFACES INTERNES
// ============================================================

/**
 * Reponse du modele Ollama
 */
interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Reponse parsee de l'IA
 */
interface ParsedSummaryResponse {
  summary: string;
  keyPoints: { text: string; importance: string }[];
  mainConcepts: { title: string; description: string }[];
  suggestedExercises: { title: string; description: string; difficulty: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class PDFSummarizationService {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  private readonly OLLAMA_BASE_URL = 'http://localhost:11434';
  private readonly SUMMARIZATION_TIMEOUT = 120000; // 2 minutes

  /**
   * Prompt systeme pour le resume
   */
  private readonly SYSTEM_PROMPT = `Tu es un assistant pedagogique expert en resume de documents techniques.
Ton role est de creer des resumes clairs et structures pour des etudiants en informatique.

Regles STRICTES :
- Reponds UNIQUEMENT en JSON valide (pas de texte avant/apres)
- Utilise un langage simple et accessible
- Mets en avant les concepts cles
- Adapte le niveau au contenu (algorithmique, Java, bases de donnees)
- Inclus des exemples concrets quand pertinent

Tu dois toujours retourner un JSON avec cette structure exacte.`;

  // ============================================================
  // PROPRIETES
  // ============================================================

  /** Statut actuel */
  private statusSubject = new BehaviorSubject<SummaryStatus>('pending');
  status$ = this.statusSubject.asObservable();

  /** Ollama disponible ? */
  private ollamaAvailableSubject = new BehaviorSubject<boolean>(false);
  ollamaAvailable$ = this.ollamaAvailableSubject.asObservable();

  /** Modele actuel */
  private currentModel = '';

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor() {
    this.detectOllamaModel();
  }

  // ============================================================
  // METHODES PUBLIQUES
  // ============================================================

  /**
   * VERIFIER DISPONIBILITE OLLAMA
   * ----------------------------
   * Teste si Ollama est accessible.
   */
  async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        this.ollamaAvailableSubject.next(true);

        // Detecter le premier modele disponible
        if (data.models && data.models.length > 0 && !this.currentModel) {
          this.currentModel = data.models[0].name;
          console.log('🤖 Ollama model detected:', this.currentModel);
        }

        return true;
      }

      this.ollamaAvailableSubject.next(false);
      return false;

    } catch (error) {
      console.warn('⚠️ Ollama not available:', error);
      this.ollamaAvailableSubject.next(false);
      return false;
    }
  }

  /**
   * OBTENIR LES MODELES DISPONIBLES
   * ------------------------------
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return data.models?.map((m: any) => m.name) || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * RESUMER UN PDF
   * -------------
   * Methode principale pour generer un resume.
   *
   * @param config - Configuration de generation
   * @param extractedText - Texte extrait du PDF
   * @returns Resultat de la generation
   */
  async summarizePDF(
    config: SummaryGenerationConfig,
    extractedText: string
  ): Promise<SummaryGenerationResult> {
    const startTime = Date.now();

    try {
      // Verifier Ollama
      const ollamaOk = await this.checkOllamaStatus();
      if (!ollamaOk) {
        return {
          status: 'error',
          error: 'Ollama n\'est pas disponible. Verifiez que "ollama serve" est lance.',
          generationTime: Date.now() - startTime
        };
      }

      this.statusSubject.next('summarizing');

      // Construire le prompt
      const prompt = this.buildPrompt(config, extractedText);

      // Appeler Ollama
      const rawResponse = await this.callOllama(prompt);

      // Parser la reponse
      const parsed = this.parseResponse(rawResponse);

      // Creer le resume
      const summary = this.buildSummary(config, parsed);

      this.statusSubject.next('completed');

      return {
        status: 'success',
        summary,
        generationTime: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('❌ Summarization error:', error);
      this.statusSubject.next('error');

      return {
        status: 'error',
        error: error.message || 'Erreur lors de la generation du resume',
        generationTime: Date.now() - startTime
      };
    }
  }

  /**
   * EXTRAIRE SEULEMENT LES POINTS CLES
   * ---------------------------------
   */
  async extractKeyPointsOnly(
    text: string,
    count: number = 5
  ): Promise<KeyPoint[]> {
    try {
      const prompt = `Extrais exactement ${count} points cles de ce texte.

TEXTE:
${text.substring(0, 5000)}

Reponds en JSON avec cette structure exacte:
{
  "keyPoints": [
    { "text": "Le point cle", "importance": "high" }
  ]
}

Les niveaux d'importance sont: "high", "medium", "low"`;

      const response = await this.callOllama(prompt);
      const parsed = JSON.parse(this.extractJSON(response));

      return (parsed.keyPoints || []).map((kp: any, index: number) => ({
        id: `kp-${Date.now()}-${index}`,
        text: kp.text,
        importance: kp.importance || 'medium'
      }));

    } catch (error) {
      console.error('❌ Key points extraction failed:', error);
      return [];
    }
  }

  // ============================================================
  // METHODES PRIVEES
  // ============================================================

  /**
   * Detecter le modele Ollama
   */
  private async detectOllamaModel(): Promise<void> {
    await this.checkOllamaStatus();
  }

  /**
   * Construire le prompt pour Ollama
   */
  private buildPrompt(config: SummaryGenerationConfig, text: string): string {
    const lengthConfig = SUMMARY_LENGTH_CONFIG[config.length];

    // Limiter le texte pour ne pas depasser le contexte du modele
    const maxLength = 8000;
    const truncatedText = text.length > maxLength
      ? text.substring(0, maxLength) + '\n\n[Texte tronque...]'
      : text;

    let prompt = `Resume ce document PDF de cours.

LONGUEUR: ${lengthConfig.label} (${lengthConfig.pointCount})

DOCUMENT:
${truncatedText}

REPONDS en JSON avec cette structure EXACTE:
{
  "summary": "Resume global du document en 2-3 paragraphes",
  "keyPoints": [
    { "text": "Point cle 1", "importance": "high" },
    { "text": "Point cle 2", "importance": "medium" }
  ]`;

    if (config.includeConcepts) {
      prompt += `,
  "mainConcepts": [
    { "title": "Concept 1", "description": "Explication du concept" }
  ]`;
    }

    if (config.includeExercises) {
      prompt += `,
  "suggestedExercises": [
    { "title": "Exercice 1", "description": "Description", "difficulty": "facile" }
  ]`;
    }

    prompt += `
}

IMPORTANT: Retourne UNIQUEMENT le JSON, sans texte avant ou apres.`;

    return prompt;
  }

  /**
   * Appeler l'API Ollama
   */
  private async callOllama(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.SUMMARIZATION_TIMEOUT);

    try {
      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: [
            { role: 'system', content: this.SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          stream: false,
          options: {
            temperature: 0.3, // Plus bas = plus factuel
            num_predict: 2000
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json();
      return data.message?.content || '';

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Timeout: La generation a pris trop de temps');
      }

      throw error;
    }
  }

  /**
   * Parser la reponse de l'IA
   */
  private parseResponse(rawResponse: string): ParsedSummaryResponse {
    try {
      // Essayer de parser directement
      return JSON.parse(rawResponse);
    } catch {
      // Essayer d'extraire le JSON de la reponse
      const jsonString = this.extractJSON(rawResponse);

      try {
        return JSON.parse(jsonString);
      } catch {
        // Retour par defaut
        console.warn('⚠️ Could not parse JSON, using raw text');
        return {
          summary: rawResponse,
          keyPoints: [],
          mainConcepts: [],
          suggestedExercises: []
        };
      }
    }
  }

  /**
   * Extraire le JSON d'une chaine
   */
  private extractJSON(text: string): string {
    // Chercher le premier { et le dernier }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }

    return text;
  }

  /**
   * Construire l'objet PDFSummary
   */
  private buildSummary(
    config: SummaryGenerationConfig,
    parsed: ParsedSummaryResponse
  ): PDFSummary {
    const now = new Date();

    // Transformer les points cles
    const keyPoints: KeyPoint[] = (parsed.keyPoints || []).map((kp, index) => ({
      id: `kp-${Date.now()}-${index}`,
      text: kp.text,
      importance: this.normalizeImportance(kp.importance)
    }));

    // Transformer les concepts
    const mainConcepts: MainConcept[] = (parsed.mainConcepts || []).map((mc, index) => ({
      id: `mc-${Date.now()}-${index}`,
      title: mc.title,
      description: mc.description
    }));

    // Transformer les exercices
    const suggestedExercises: SuggestedExercise[] = (parsed.suggestedExercises || []).map((ex, index) => ({
      id: `ex-${Date.now()}-${index}`,
      title: ex.title,
      description: ex.description,
      difficulty: this.normalizeDifficulty(ex.difficulty),
      type: 'practice' as const
    }));

    return createPDFSummary({
      pdfId: config.pdfId,
      pdfTitle: '', // A remplir par l'appelant
      summaryLength: config.length,
      summary: parsed.summary || '',
      keyPoints,
      mainConcepts,
      suggestedExercises,
      status: 'completed',
      summarizedAt: now,
      modelUsed: this.currentModel
    });
  }

  /**
   * Normaliser le niveau d'importance
   */
  private normalizeImportance(value: string): 'high' | 'medium' | 'low' {
    const normalized = value?.toLowerCase();
    if (normalized === 'high' || normalized === 'haute' || normalized === 'elevee') {
      return 'high';
    }
    if (normalized === 'low' || normalized === 'basse' || normalized === 'faible') {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Normaliser la difficulte
   */
  private normalizeDifficulty(value: string): 'facile' | 'moyen' | 'difficile' {
    const normalized = value?.toLowerCase();
    if (normalized === 'facile' || normalized === 'easy') {
      return 'facile';
    }
    if (normalized === 'difficile' || normalized === 'hard' || normalized === 'dur') {
      return 'difficile';
    }
    return 'moyen';
  }
}

/**
 * Reflexions pedagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI utiliser Ollama en local ?
 *
 *    - Gratuit : Pas de couts API
 *    - Prive : Les PDFs restent sur ta machine
 *    - Rapide : Pas de latence reseau
 *    - Offline : Fonctionne sans Internet
 *
 *    Le seul inconvenient : besoin d'un PC puissant (~8GB RAM).
 *
 * 2. POURQUOI forcer un format JSON ?
 *
 *    Les LLMs sont bavards et imprevisibles !
 *    Sans structure forcee :
 *    "Voici le resume du document... blablabla"
 *
 *    Avec JSON :
 *    { "summary": "...", "keyPoints": [...] }
 *
 *    Plus facile a parser et afficher proprement.
 *
 * 3. POURQUOI une temperature basse (0.3) ?
 *
 *    Temperature = "creativite" du modele
 *    - 0.0 = Tres factuel, peu varie
 *    - 1.0 = Tres creatif, parfois farfelu
 *
 *    Pour un resume, on veut des FAITS, pas de la poesie !
 *
 * 4. POURQUOI tronquer le texte ?
 *
 *    Les LLMs ont une limite de "contexte" (ex: 8K tokens).
 *    Depasser = erreur ou resume de mauvaise qualite.
 *
 *    8000 caracteres ≈ 2000 tokens = zone de securite.
 */
