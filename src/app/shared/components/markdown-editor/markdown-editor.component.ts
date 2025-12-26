/**
 * markdown-editor.component.ts
 *
 * Editeur de notes Markdown avec preview.
 *
 * Qu'est-ce que ce composant ?
 * ---------------------------
 * C'est un editeur simple mais efficace pour ecrire
 * des notes en Markdown avec apercu en temps reel.
 *
 * Analogie du monde reel :
 * -----------------------
 * C'est comme un carnet avec deux pages cote a cote :
 * - A gauche, tu ecris
 * - A droite, tu vois le resultat formate
 *
 * Fonctionnalites :
 * ----------------
 * 1. Editeur de texte avec coloration syntaxique basique
 * 2. Preview Markdown en temps reel
 * 3. Toolbar avec actions rapides (gras, italique, etc.)
 * 4. Auto-save avec debounce
 * 5. Mode plein ecran
 *
 * Philosophie David J. Malan :
 * "Simple tools that do one thing well."
 *
 * Auteur: H1m0t3p3
 * Date: 26 decembre 2024
 */

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { Note, NoteType, NoteCategory, createNote } from '../../../core/models/note.model';

/**
 * Action de la toolbar
 */
interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss']
})
export class MarkdownEditorComponent implements OnInit, OnDestroy {

  // ============================================================
  // ENTREES/SORTIES
  // ============================================================

  @Input() note: Note | null = null;
  @Input() isCreating = false;
  @Input() categories: { value: NoteCategory; label: string; color: string }[] = [];

  @Output() save = new EventEmitter<Partial<Note>>();
  @Output() close = new EventEmitter<void>();

  // ============================================================
  // ETAT DU COMPOSANT
  // ============================================================

  private destroy$ = new Subject<void>();
  private autoSave$ = new Subject<void>();

  /** Mode apercu */
  showPreview = true;

  /** Mode plein ecran */
  isFullscreen = false;

  /** Tags temporaires (en string) */
  tagsInput = '';

  /** Formulaire */
  form = {
    title: '',
    content: '',
    type: 'personal' as NoteType,
    category: 'general' as NoteCategory,
    tags: [] as string[],
    isFavorite: false,
    isPinned: false
  };

  /** Dirty state */
  isDirty = false;

  // ============================================================
  // TOOLBAR
  // ============================================================

  toolbarActions: ToolbarAction[] = [
    {
      id: 'bold',
      icon: 'B',
      label: 'Gras',
      shortcut: 'Ctrl+B',
      action: () => this.wrapSelection('**', '**')
    },
    {
      id: 'italic',
      icon: 'I',
      label: 'Italique',
      shortcut: 'Ctrl+I',
      action: () => this.wrapSelection('*', '*')
    },
    {
      id: 'code',
      icon: '<>',
      label: 'Code inline',
      action: () => this.wrapSelection('`', '`')
    },
    {
      id: 'heading',
      icon: 'H',
      label: 'Titre',
      action: () => this.insertAtLineStart('## ')
    },
    {
      id: 'list',
      icon: '•',
      label: 'Liste',
      action: () => this.insertAtLineStart('- ')
    },
    {
      id: 'checklist',
      icon: '☑',
      label: 'Checklist',
      action: () => this.insertAtLineStart('- [ ] ')
    },
    {
      id: 'link',
      icon: '🔗',
      label: 'Lien',
      action: () => this.insertLink()
    },
    {
      id: 'codeblock',
      icon: '{ }',
      label: 'Bloc de code',
      action: () => this.insertCodeBlock()
    }
  ];

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    this.initForm();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialise le formulaire
   */
  private initForm(): void {
    if (this.note) {
      this.form = {
        title: this.note.title,
        content: this.note.content,
        type: this.note.type,
        category: (this.note.category as NoteCategory) || 'general',
        tags: [...(this.note.tags || [])],
        isFavorite: this.note.isFavorite,
        isPinned: this.note.isPinned
      };
      this.tagsInput = this.form.tags.join(', ');
    } else {
      this.form = {
        title: '',
        content: '',
        type: 'personal',
        category: 'general',
        tags: [],
        isFavorite: false,
        isPinned: false
      };
      this.tagsInput = '';
    }
  }

  /**
   * Configure l'auto-save
   */
  private setupAutoSave(): void {
    this.autoSave$
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.isDirty && !this.isCreating && this.note) {
          this.onSave(true);
        }
      });
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Gere les changements dans le formulaire
   */
  onFormChange(): void {
    this.isDirty = true;
    this.autoSave$.next();
  }

  /**
   * Gere les changements de tags
   */
  onTagsChange(): void {
    this.form.tags = this.tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
    this.onFormChange();
  }

  /**
   * Sauvegarde la note
   */
  onSave(isAutoSave = false): void {
    if (!this.form.title.trim()) {
      if (!isAutoSave) {
        alert('Le titre est requis');
      }
      return;
    }

    if (this.isCreating) {
      const newNote = createNote({
        title: this.form.title.trim(),
        content: this.form.content,
        type: this.form.type,
        category: this.form.category,
        tags: this.form.tags,
        isFavorite: this.form.isFavorite,
        isPinned: this.form.isPinned
      });
      this.save.emit(newNote);
    } else {
      const noteData: Partial<Note> = {
        title: this.form.title.trim(),
        content: this.form.content,
        type: this.form.type,
        category: this.form.category,
        tags: this.form.tags,
        isFavorite: this.form.isFavorite,
        isPinned: this.form.isPinned
      };
      this.save.emit(noteData);
    }

    this.isDirty = false;
  }

  /**
   * Ferme l'editeur
   */
  onClose(): void {
    if (this.isDirty) {
      if (confirm('Des modifications non sauvegardees seront perdues. Continuer ?')) {
        this.close.emit();
      }
    } else {
      this.close.emit();
    }
  }

  /**
   * Toggle mode preview
   */
  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
  }

  // ============================================================
  // MANIPULATION DU TEXTE
  // ============================================================

  /**
   * Entoure la selection avec des caracteres
   */
  private wrapSelection(before: string, after: string): void {
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.form.content;
    const selectedText = text.substring(start, end);

    this.form.content =
      text.substring(0, start) +
      before + selectedText + after +
      text.substring(end);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, end + before.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length);
      }
    }, 0);

    this.onFormChange();
  }

  /**
   * Insere au debut de la ligne
   */
  private insertAtLineStart(prefix: string): void {
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = this.form.content;

    // Trouve le debut de la ligne
    let lineStart = start;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
      lineStart--;
    }

    this.form.content =
      text.substring(0, lineStart) +
      prefix +
      text.substring(lineStart);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);

    this.onFormChange();
  }

  /**
   * Insere un lien
   */
  private insertLink(): void {
    const url = prompt('URL du lien:', 'https://');
    if (url) {
      this.wrapSelection('[', `](${url})`);
    }
  }

  /**
   * Insere un bloc de code
   */
  private insertCodeBlock(): void {
    const language = prompt('Langage (java, javascript, python...):', 'java');
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = this.form.content;
    const selectedText = text.substring(start, textarea.selectionEnd) || 'code ici';

    const codeBlock = `\n\`\`\`${language || ''}\n${selectedText}\n\`\`\`\n`;

    this.form.content =
      text.substring(0, start) +
      codeBlock +
      text.substring(textarea.selectionEnd);

    this.onFormChange();
  }

  // ============================================================
  // RENDU MARKDOWN
  // ============================================================

  /**
   * Convertit le Markdown en HTML
   * Note: Version simplifiee sans bibliotheque externe
   */
  renderMarkdown(content: string): string {
    if (!content) return '';

    let html = content
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')

      // Bold and italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="code-block" data-lang="${lang}"><code>${code.trim()}</code></pre>`;
      })

      // Inline code
      .replace(/`(.+?)`/g, '<code class="inline-code">$1</code>')

      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')

      // Lists
      .replace(/^- \[ \] (.+)$/gm, '<li class="checkbox unchecked">$1</li>')
      .replace(/^- \[x\] (.+)$/gm, '<li class="checkbox checked">$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li.*?>.*?<\/li>\n?)+/g, '<ul>$&</ul>')

      // Blockquotes
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

      // Horizontal rules
      .replace(/^---$/gm, '<hr>')

      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p>')

      // Single newlines to br
      .replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Obtient la couleur d'une categorie
   */
  getCategoryColor(category: NoteCategory): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.color || '#64748b';
  }
}
