/**
 * chatbot.service.ts
 *
 * Service pour le chatbot d'aide intégré avec Ollama.
 *
 * Fonctionnement :
 * ---------------
 * 1. L'utilisateur pose une question
 * 2. Le service envoie la question à Ollama (local)
 * 3. Ollama répond avec une IA (Llama, Mistral, etc.)
 * 4. Fallback sur FAQ si Ollama n'est pas disponible
 *
 * Configuration Ollama :
 * ---------------------
 * 1. Installer Ollama : https://ollama.com
 * 2. Télécharger un modèle : ollama pull llama3.2
 * 3. Ollama tourne sur http://localhost:11434
 *
 * Philosophie David J. Malan :
 * "Help should be just a click away."
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

// ============================================================
// INTERFACES
// ============================================================

/**
 * Message du chat
 */
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

/**
 * Réponse Ollama
 */
interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

/**
 * Configuration Ollama
 */
interface OllamaConfig {
  baseUrl: string;
  model: string;
  systemPrompt: string;
}

/**
 * Entrée FAQ (fallback)
 */
interface FAQEntry {
  keywords: string[];
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  private config: OllamaConfig = {
    baseUrl: 'http://localhost:11434',
    model: '',  // Détecté automatiquement depuis Ollama
    systemPrompt: `Tu es un assistant pédagogique pour une application de révision en algorithmique et programmation Java.

Ton rôle :
- Aider les étudiants à comprendre les concepts d'algorithmique
- Expliquer Java de manière simple et claire
- Répondre aux questions sur la POO (Programmation Orientée Objet)
- Aider avec les bases de données et SQL
- Guider l'utilisation de l'application de révision

Règles :
- Réponds en français
- Sois concis (2-4 phrases max sauf si explication complexe)
- Utilise des exemples de code simples quand c'est utile
- Sois encourageant et pédagogue
- Si tu ne sais pas, dis-le honnêtement

L'application contient : un dashboard, des exercices, un timer Pomodoro, des PDFs de cours, et un système de gamification (XP, badges, quêtes).`
  };

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /** Historique des messages */
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  /** État du chat (ouvert/fermé) */
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSubject.asObservable();

  /** Ollama disponible ? */
  private ollamaAvailable = true;

  /** Historique pour le contexte */
  private conversationHistory: { role: string; content: string }[] = [];

  /** Message de bienvenue */
  private welcomeMessage: ChatMessage = {
    id: 'welcome',
    text: 'Salut ! 👋 Je suis ton assistant IA (propulsé par Ollama). Pose-moi tes questions sur l\'algo, Java, la POO ou les BDD. Je suis là pour t\'aider à réviser !',
    sender: 'bot',
    timestamp: new Date()
  };

  /** FAQ de fallback */
  private faq: FAQEntry[] = [
    {
      keywords: ['algorithme', 'algo', 'definition'],
      answer: 'Un algorithme est une suite d\'instructions pour résoudre un problème. Comme une recette de cuisine ! 🍳'
    },
    {
      keywords: ['variable', 'stocker'],
      answer: 'Une variable est une "boîte" qui stocke une valeur. Ex: `int age = 25;` crée une boîte "age" contenant 25.'
    },
    {
      keywords: ['boucle', 'for', 'while'],
      answer: 'Une boucle répète des instructions. `for` quand tu sais combien de fois, `while` tant qu\'une condition est vraie.'
    },
    {
      keywords: ['condition', 'if', 'else'],
      answer: 'Une condition teste vrai/faux. `if (age >= 18) { majeur } else { mineur }` - comme un aiguillage !'
    },
    {
      keywords: ['poo', 'objet', 'classe'],
      answer: 'La POO organise le code en objets. Une classe = le plan, un objet = la réalisation. Ex: Classe Voiture → objet maVoiture.'
    },
    {
      keywords: ['sql', 'select', 'base'],
      answer: 'SQL interroge les bases de données. `SELECT nom FROM users WHERE age > 18;` récupère les noms des majeurs.'
    },
    {
      keywords: ['pomodoro', 'timer'],
      answer: 'Le Pomodoro : 25 min de travail + 5 min de pause. Prouvé scientifiquement pour la concentration ! 🍅'
    },
    {
      keywords: ['xp', 'niveau', 'points'],
      answer: 'Tu gagnes des XP en faisant des exercices, des Pomodoros et en complétant le planning. Monte de niveau ! 🎮'
    }
  ];

  // ============================================================
  // CONSTRUCTEUR
  // ============================================================

  constructor(private http: HttpClient) {
    this.messagesSubject.next([this.welcomeMessage]);
    this.checkOllamaStatus();
  }

  // ============================================================
  // MÉTHODES PUBLIQUES
  // ============================================================

  /**
   * Ouvre le chat
   */
  open(): void {
    this.isOpenSubject.next(true);
  }

  /**
   * Ferme le chat
   */
  close(): void {
    this.isOpenSubject.next(false);
  }

  /**
   * Toggle l'état du chat
   */
  toggle(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  /**
   * Envoie un message et obtient une réponse
   */
  async sendMessage(text: string): Promise<void> {
    if (!text.trim()) return;

    const messages = this.messagesSubject.value;

    // Ajoute le message de l'utilisateur
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    messages.push(userMessage);

    // Ajoute un message "loading"
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      text: '...',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true
    };
    messages.push(loadingMessage);
    this.messagesSubject.next([...messages]);

    // Ajoute à l'historique
    this.conversationHistory.push({ role: 'user', content: text.trim() });

    try {
      let response: string;

      if (this.ollamaAvailable) {
        response = await this.askOllama(text.trim());
      } else {
        response = this.findFAQResponse(text.trim());
      }

      // Ajoute à l'historique
      this.conversationHistory.push({ role: 'assistant', content: response });

      // Remplace le loading par la vraie réponse
      const updatedMessages = this.messagesSubject.value.filter(m => !m.isLoading);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      updatedMessages.push(botMessage);
      this.messagesSubject.next([...updatedMessages]);

    } catch (error) {
      console.error('Erreur chatbot:', error);

      // En cas d'erreur, utilise la FAQ
      const updatedMessages = this.messagesSubject.value.filter(m => !m.isLoading);
      const errorMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: this.findFAQResponse(text.trim()),
        sender: 'bot',
        timestamp: new Date()
      };
      updatedMessages.push(errorMessage);
      this.messagesSubject.next([...updatedMessages]);
    }
  }

  /**
   * Réinitialise la conversation
   */
  reset(): void {
    this.conversationHistory = [];
    this.messagesSubject.next([this.welcomeMessage]);
  }

  /**
   * Obtient des suggestions de questions
   */
  getSuggestions(): string[] {
    return [
      'C\'est quoi une boucle ?',
      'Explique-moi la POO',
      'Comment faire un SELECT ?',
      'Aide-moi avec les tableaux'
    ];
  }

  /**
   * Change le modèle Ollama
   */
  setModel(model: string): void {
    this.config.model = model;
  }

  /**
   * Vérifie si Ollama est disponible
   */
  isOllamaAvailable(): boolean {
    return this.ollamaAvailable;
  }

  // ============================================================
  // MÉTHODES PRIVÉES
  // ============================================================

  /**
   * Vérifie si Ollama est en cours d'exécution et détecte le modèle
   */
  private checkOllamaStatus(): void {
    this.http.get<{ models: Array<{ name: string }> }>(`${this.config.baseUrl}/api/tags`)
      .pipe(
        timeout(3000),
        catchError(() => {
          console.warn('⚠️ Ollama non disponible. Mode FAQ activé.');
          this.ollamaAvailable = false;
          this.welcomeMessage.text = 'Salut ! 👋 Je suis ton assistant FAQ. Pour des réponses IA, lance Ollama (`ollama serve`). En attendant, je peux t\'aider avec les questions courantes !';
          this.messagesSubject.next([this.welcomeMessage]);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response && response.models && response.models.length > 0) {
          // Utilise le premier modèle disponible
          this.config.model = response.models[0].name;
          console.log(`✅ Ollama connecté ! Modèle: ${this.config.model}`);
          this.ollamaAvailable = true;

          // Met à jour le message de bienvenue avec le nom du modèle
          this.welcomeMessage.text = `Salut ! 👋 Je suis ton assistant IA (${this.config.model.split(':')[0]}). Pose-moi tes questions sur l'algo, Java, la POO ou les BDD !`;
          this.messagesSubject.next([this.welcomeMessage]);
        }
      });
  }

  /**
   * Envoie une question à Ollama
   */
  private async askOllama(question: string): Promise<string> {
    // Construit le prompt avec l'historique
    const messages = [
      { role: 'system', content: this.config.systemPrompt },
      ...this.conversationHistory.slice(-10) // Garde les 10 derniers messages
    ];

    const body = {
      model: this.config.model,
      messages: messages,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500
      }
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Erreur Ollama: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';

    } catch (error) {
      console.error('Erreur Ollama:', error);
      this.ollamaAvailable = false;
      return this.findFAQResponse(question);
    }
  }

  /**
   * Trouve une réponse dans la FAQ (fallback)
   */
  private findFAQResponse(question: string): string {
    const lowerQuestion = question.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    for (const entry of this.faq) {
      for (const keyword of entry.keywords) {
        if (lowerQuestion.includes(keyword.toLowerCase())) {
          return entry.answer + '\n\n💡 _Mode FAQ - Lance Ollama pour des réponses IA complètes !_';
        }
      }
    }

    return 'Je ne suis pas sûr de comprendre. 🤔 Essaie de reformuler ta question sur l\'algo, Java, la POO ou les bases de données.\n\n💡 _Pour des réponses plus intelligentes, lance Ollama : `ollama serve`_';
  }
}
