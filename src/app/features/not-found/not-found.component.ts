/**
 * not-found.component.ts
 *
 * Composant PAGE 404 - Page non trouvée.
 *
 * Qu'est-ce qu'une page 404 ?
 * --------------------------
 * C'est la page affichée quand un utilisateur essaie d'accéder
 * à une URL qui n'existe pas dans l'application.
 *
 * Pourquoi "404" ?
 * ---------------
 * 404 est un code HTTP standard signifiant "Not Found".
 * C'est comme si tu demandais un livre à une bibliothèque
 * et que le bibliothécaire te disait "Ce livre n'existe pas".
 *
 * Analogie du monde réel :
 * -----------------------
 * Imagine que tu cherches une salle dans un bâtiment.
 * Tu arrives devant une porte avec le numéro "B404".
 * Un panneau dit : "Cette salle n'existe pas. Retournez à l'accueil."
 *
 * C'est exactement ce que fait cette page !
 *
 * Philosophie UX (User Experience) :
 * ---------------------------------
 * Une bonne page 404 doit :
 * 1. Expliquer clairement le problème
 * 2. Ne pas blâmer l'utilisateur
 * 3. Offrir une solution (retour à l'accueil)
 * 4. Être visuellement agréable (pas effrayante)
 *
 * Philosophie David J. Malan :
 * "Error messages should be helpful, not cryptic."
 *
 * Auteur: H1m0t3p3
 * Date: 24 décembre 2024
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * @Component Decorator
 * -------------------
 * Définit les métadonnées du composant 404.
 *
 * Ce composant est "standalone" (autonome) :
 * - Il n'a pas besoin d'être déclaré dans un module
 * - Il importe directement ce dont il a besoin
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!--
      STRUCTURE DE LA PAGE 404
      ========================

      Layout simple et centré :
      - Icône/Emoji expressive
      - Code d'erreur (404)
      - Message explicatif
      - Bouton de retour

      L'objectif : Rassurer l'utilisateur et le guider.
    -->
    <div class="not-found-container">

      <!-- Animation visuelle (emoji expressif) -->
      <div class="not-found-visual">
        <span class="emoji-lost">🧭</span>
        <span class="emoji-question">❓</span>
      </div>

      <!-- Code d'erreur stylisé -->
      <h1 class="error-code">404</h1>

      <!-- Message principal -->
      <h2 class="error-title">Page non trouvée</h2>

      <!--
        Message explicatif
        ------------------
        On utilise un ton amical, pas technique.
        "La page n'existe pas" plutôt que "HTTP Error 404".
      -->
      <p class="error-message">
        Oups ! La page que tu cherches semble avoir disparu
        dans les méandres de l'algorithmique...
      </p>

      <!--
        Suggestions d'actions
        ---------------------
        On donne à l'utilisateur des options claires.
      -->
      <div class="error-suggestions">
        <p>Voici ce que tu peux faire :</p>
        <ul>
          <li>Vérifier l'URL dans la barre d'adresse</li>
          <li>Retourner au tableau de bord</li>
          <li>Explorer le planning des 12 jours</li>
        </ul>
      </div>

      <!--
        Boutons d'action
        ----------------
        Le bouton principal ramène au dashboard.
        Un bouton secondaire pour le planning.
      -->
      <div class="error-actions">
        <a routerLink="/dashboard" class="btn-primary">
          <span class="btn-icon">🏠</span>
          <span>Retour au Dashboard</span>
        </a>

        <a routerLink="/planning" class="btn-secondary">
          <span class="btn-icon">📅</span>
          <span>Voir le Planning</span>
        </a>
      </div>

      <!--
        Citation pédagogique
        --------------------
        Un petit rappel encourageant pour l'utilisateur.
      -->
      <footer class="error-footer">
        <blockquote>
          "Getting lost is just another way of saying 'going exploring'."
          <cite>— Anonymous Programmer</cite>
        </blockquote>
      </footer>

    </div>
  `,
  styles: [`
    /**
     * Styles de la page 404
     * =====================
     *
     * Design centré et apaisant.
     * On veut que l'utilisateur se sente guidé, pas perdu.
     */

    /* Container principal - Centrage vertical et horizontal */
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 57px);
      padding: 2rem;
      text-align: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f8fafc;
    }

    /* Animation visuelle avec emojis */
    .not-found-visual {
      position: relative;
      margin-bottom: 1rem;

      .emoji-lost {
        font-size: 5rem;
        animation: float 3s ease-in-out infinite;
      }

      .emoji-question {
        position: absolute;
        top: -10px;
        right: -20px;
        font-size: 2rem;
        animation: bounce 1s ease-in-out infinite;
      }
    }

    /* Animation flottante */
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    /* Animation rebond */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    /* Code 404 - Grand et stylisé */
    .error-code {
      font-size: 8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
      line-height: 1;
    }

    /* Titre du message */
    .error-title {
      font-size: 2rem;
      font-weight: 600;
      margin: 1rem 0;
      color: #f8fafc;
    }

    /* Message explicatif */
    .error-message {
      font-size: 1.125rem;
      color: #94a3b8;
      max-width: 400px;
      margin-bottom: 2rem;
    }

    /* Suggestions */
    .error-suggestions {
      background: rgba(51, 65, 85, 0.5);
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      text-align: left;

      p {
        color: #94a3b8;
        margin-bottom: 0.5rem;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          color: #e2e8f0;

          &::before {
            content: '→';
            position: absolute;
            left: 0;
            color: #3b82f6;
          }
        }
      }
    }

    /* Boutons d'action */
    .error-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* Bouton primaire */
    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      text-decoration: none;
      border-radius: 0.75rem;
      font-weight: 600;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
    }

    /* Bouton secondaire */
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: #334155;
      color: #f8fafc;
      text-decoration: none;
      border-radius: 0.75rem;
      font-weight: 600;
      transition: all 0.2s;

      &:hover {
        background: #475569;
        transform: translateY(-2px);
      }
    }

    .btn-icon {
      font-size: 1.25rem;
    }

    /* Footer avec citation */
    .error-footer {
      margin-top: 3rem;

      blockquote {
        font-style: italic;
        color: #64748b;
        max-width: 400px;

        cite {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .error-code {
        font-size: 5rem;
      }

      .error-title {
        font-size: 1.5rem;
      }

      .error-actions {
        flex-direction: column;
        width: 100%;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class NotFoundComponent {
  /**
   * Ce composant est intentionnellement simple.
   *
   * Pas de logique complexe :
   * - Pas d'appels API
   * - Pas d'état à gérer
   * - Juste de l'affichage statique
   *
   * La simplicité est une vertu en programmation !
   *
   * "Simplicity is the ultimate sophistication."
   * — Leonardo da Vinci
   */
}

/**
 * Réflexions pédagogiques (style David J. Malan)
 * ==============================================
 *
 * 1. POURQUOI une page 404 personnalisée ?
 *
 *    La page 404 par défaut du navigateur est :
 *    - Technique et intimidante
 *    - Sans branding (l'utilisateur perd le contexte)
 *    - Sans solution claire
 *
 *    Notre page 404 est :
 *    - Amicale et rassurante
 *    - Dans le style de l'application
 *    - Avec des actions concrètes
 *
 * 2. POURQUOI le ton humoristique ?
 *
 *    L'humour désamorce la frustration.
 *    "Les méandres de l'algorithmique" fait référence
 *    au thème de l'application tout en restant léger.
 *
 * 3. POURQUOI des suggestions ?
 *
 *    On ne laisse JAMAIS l'utilisateur sans option.
 *    C'est comme être perdu en forêt avec une boussole
 *    plutôt que sans rien.
 *
 * 4. POURQUOI les animations ?
 *
 *    Les micro-animations (float, bounce) :
 *    - Attirent l'attention de façon subtile
 *    - Rendent la page moins "morte"
 *    - Montrent que l'app fonctionne (même si la page n'existe pas)
 *
 * 5. POURQUOI le gradient sur le 404 ?
 *
 *    Le gradient utilise les couleurs de l'app (bleu/violet).
 *    Ça renforce l'identité visuelle même dans l'erreur.
 *
 * Citation finale de Steve Krug :
 * "Don't make me think about what went wrong.
 *  Tell me, and show me how to fix it."
 */
