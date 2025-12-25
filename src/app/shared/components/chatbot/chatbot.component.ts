/**
 * chatbot.component.ts
 *
 * Composant UI du chatbot d'aide.
 *
 * Structure :
 * ----------
 * - Bouton flottant (bulle) en bas à droite
 * - Fenêtre de chat avec historique des messages
 * - Zone de saisie pour les questions
 * - Suggestions rapides
 *
 * Philosophie David J. Malan :
 * "Help should be just a click away."
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatbotService, ChatMessage } from '../../../core/services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {

  /** Référence au conteneur des messages pour auto-scroll */
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  /** Subject pour nettoyer les subscriptions */
  private destroy$ = new Subject<void>();

  // ============================================================
  // PROPRIÉTÉS
  // ============================================================

  /** État du chat (ouvert/fermé) */
  isOpen = false;

  /** Liste des messages */
  messages: ChatMessage[] = [];

  /** Texte en cours de saisie */
  inputText = '';

  /** Suggestions de questions */
  suggestions: string[] = [];

  /** Flag pour auto-scroll */
  private shouldScroll = false;

  // ============================================================
  // CYCLE DE VIE
  // ============================================================

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // S'abonne à l'état du chat
    this.chatbotService.isOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => {
        this.isOpen = isOpen;
        if (isOpen) {
          this.shouldScroll = true;
        }
      });

    // S'abonne aux messages
    this.chatbotService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        this.shouldScroll = true;
      });

    // Charge les suggestions
    this.suggestions = this.chatbotService.getSuggestions();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Toggle le chat (ouvrir/fermer)
   */
  toggleChat(): void {
    this.chatbotService.toggle();
  }

  /**
   * Ferme le chat
   */
  closeChat(): void {
    this.chatbotService.close();
  }

  /**
   * Envoie un message
   */
  sendMessage(): void {
    if (this.inputText.trim()) {
      this.chatbotService.sendMessage(this.inputText);
      this.inputText = '';
    }
  }

  /**
   * Envoie une suggestion
   */
  sendSuggestion(suggestion: string): void {
    this.chatbotService.sendMessage(suggestion);
  }

  /**
   * Gère la touche Entrée
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Réinitialise la conversation
   */
  resetChat(): void {
    this.chatbotService.reset();
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Scroll vers le bas des messages
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur scroll:', err);
    }
  }

  /**
   * Formate l'heure d'un message
   */
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formate le texte avec du markdown basique
   * Supporte : **bold**, `code`, _italic_
   */
  formatText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
}
