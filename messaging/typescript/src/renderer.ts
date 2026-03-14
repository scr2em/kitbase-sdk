import type { InAppMessage, MessageButton } from './types.js';
import { STYLES } from './styles.js';

export interface RendererCallbacks {
  onShow: (message: InAppMessage) => void;
  onDismiss: (message: InAppMessage) => void;
  onAction: (message: InAppMessage, button: MessageButton) => void | false;
}

/**
 * Renders in-app messages into a shadow DOM container.
 * Handles stacking for banners (top) and cards (bottom-right),
 * and overlays for modals and images.
 * @internal
 */
export class MessageRenderer {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private bannerContainer: HTMLElement;
  private cardContainer: HTMLElement;
  private displayed = new Map<string, { element: HTMLElement; message: InAppMessage }>();

  constructor(private callbacks: RendererCallbacks, container?: HTMLElement) {
    this.host = document.createElement('div');
    this.host.id = 'kitbase-messaging';
    (container || document.body).appendChild(this.host);

    this.shadow = this.host.attachShadow({ mode: 'open' });

    // Inject styles
    const style = document.createElement('style');
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    // Persistent containers for stackable types
    this.bannerContainer = document.createElement('div');
    this.bannerContainer.className = 'kb-banner-container';
    this.shadow.appendChild(this.bannerContainer);

    this.cardContainer = document.createElement('div');
    this.cardContainer.className = 'kb-card-container';
    this.shadow.appendChild(this.cardContainer);
  }

  /**
   * Reconcile: add new messages, remove stale ones.
   * Idempotent — calling with the same list is a no-op.
   */
  update(messages: InAppMessage[]): void {
    const incoming = new Set(messages.map((m) => m.id));

    // Remove messages no longer in the response
    for (const [id] of this.displayed) {
      if (!incoming.has(id)) {
        this.removeMessage(id);
      }
    }

    // Add new messages
    for (const msg of messages) {
      if (!this.displayed.has(msg.id)) {
        this.renderMessage(msg);
      }
    }
  }

  /** Programmatically dismiss a message (with exit animation). */
  dismiss(messageId: string): void {
    this.removeMessage(messageId);
  }

  /** Remove all rendered messages immediately. */
  clear(): void {
    for (const [id] of this.displayed) {
      const entry = this.displayed.get(id);
      if (entry) entry.element.remove();
    }
    this.displayed.clear();
  }

  /** Remove the shadow host from the DOM entirely. */
  destroy(): void {
    this.clear();
    this.host.remove();
  }

  // ── Rendering ─────────────────────────────────────────────────

  private renderMessage(msg: InAppMessage): void {
    let element: HTMLElement;

    switch (msg.type) {
      case 'banner':
        element = this.renderBanner(msg);
        this.bannerContainer.appendChild(element);
        break;
      case 'card':
        element = this.renderCard(msg);
        this.cardContainer.appendChild(element);
        break;
      case 'image':
        element = this.renderImageOverlay(msg);
        this.shadow.appendChild(element);
        break;
      case 'modal':
      default:
        element = this.renderModal(msg);
        this.shadow.appendChild(element);
        break;
    }

    this.displayed.set(msg.id, { element, message: msg });
    this.callbacks.onShow(msg);
  }

  private renderModal(msg: InAppMessage): HTMLElement {
    const overlay = this.el('div', 'kb-overlay');

    const modal = this.el('div', 'kb-modal');
    if (msg.backgroundColor) modal.style.background = msg.backgroundColor;
    this.applyStyle(modal, msg);

    modal.appendChild(this.closeButton(msg));

    if (msg.imageUrl) {
      const img = document.createElement('img');
      img.className = 'kb-msg-image';
      img.src = msg.imageUrl;
      img.alt = '';
      modal.appendChild(img);
    }

    const content = this.el('div', 'kb-content');
    content.appendChild(this.titleEl(msg.title));
    if (msg.body) content.appendChild(this.bodyEl(msg.body));
    content.appendChild(this.buttonsEl(msg));
    modal.appendChild(content);

    // Click overlay backdrop to dismiss
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.handleDismiss(msg);
    });

    overlay.appendChild(modal);
    return overlay;
  }

  private renderBanner(msg: InAppMessage): HTMLElement {
    const banner = this.el('div', 'kb-banner');
    if (msg.backgroundColor) {
      banner.style.background = msg.backgroundColor;
    }
    this.applyStyle(banner, msg);

    const content = this.el('div', 'kb-content');
    content.appendChild(this.titleEl(msg.title));
    if (msg.body) content.appendChild(this.bodyEl(msg.body));
    banner.appendChild(content);

    const actions = this.el('div', 'kb-actions');
    if (msg.actionButton) {
      actions.appendChild(this.btnEl(msg, msg.actionButton, 'kb-btn-action'));
    }
    if (msg.secondaryButton) {
      actions.appendChild(this.btnEl(msg, msg.secondaryButton, 'kb-btn-secondary'));
    }
    actions.appendChild(this.closeButton(msg));
    banner.appendChild(actions);

    return banner;
  }

  private renderCard(msg: InAppMessage): HTMLElement {
    const card = this.el('div', 'kb-card');
    if (msg.backgroundColor) card.style.background = msg.backgroundColor;
    this.applyStyle(card, msg);

    card.appendChild(this.closeButton(msg));

    if (msg.imageUrl) {
      const img = document.createElement('img');
      img.className = 'kb-msg-image';
      img.src = msg.imageUrl;
      img.alt = '';
      card.appendChild(img);
    }

    const content = this.el('div', 'kb-content');
    content.appendChild(this.titleEl(msg.title));
    if (msg.body) content.appendChild(this.bodyEl(msg.body));
    content.appendChild(this.buttonsEl(msg));
    card.appendChild(content);

    return card;
  }

  private renderImageOverlay(msg: InAppMessage): HTMLElement {
    const overlay = this.el('div', 'kb-overlay');

    const container = this.el('div', 'kb-image-msg');
    this.applyStyle(container, msg);
    container.appendChild(this.closeButton(msg));

    if (msg.imageUrl) {
      const img = document.createElement('img');
      img.src = msg.imageUrl;
      img.alt = msg.title;
      container.appendChild(img);
    }

    const buttons = this.buttonsEl(msg);
    if (buttons.childElementCount > 0) {
      container.appendChild(buttons);
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.handleDismiss(msg);
    });

    overlay.appendChild(container);
    return overlay;
  }

  // ── Shared elements ───────────────────────────────────────────

  private titleEl(text: string): HTMLElement {
    const el = this.el('div', 'kb-title');
    el.textContent = text;
    return el;
  }

  private bodyEl(text: string): HTMLElement {
    const el = this.el('div', 'kb-body');
    el.textContent = text;
    return el;
  }

  private buttonsEl(msg: InAppMessage): HTMLElement {
    const wrap = this.el('div', 'kb-buttons');
    if (msg.secondaryButton) {
      wrap.appendChild(this.btnEl(msg, msg.secondaryButton, 'kb-btn-secondary'));
    }
    if (msg.actionButton) {
      wrap.appendChild(this.btnEl(msg, msg.actionButton, 'kb-btn-action'));
    }
    return wrap;
  }

  private btnEl(
    msg: InAppMessage,
    button: MessageButton,
    className: string,
  ): HTMLElement {
    const btn = document.createElement('button');
    btn.className = `kb-btn ${className}`;
    btn.textContent = button.text;
    if (button.color) btn.style.background = button.color;
    if (button.textColor) btn.style.color = button.textColor;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleAction(msg, button);
    });

    return btn;
  }

  private closeButton(msg: InAppMessage): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'kb-close';
    btn.innerHTML = '&#x2715;';
    btn.setAttribute('aria-label', 'Close');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleDismiss(msg);
    });

    return btn;
  }

  // ── Event handling ────────────────────────────────────────────

  private handleDismiss(msg: InAppMessage): void {
    const entry = this.displayed.get(msg.id);
    if (!entry) return;
    this.animateOut(entry.element, msg);
  }

  private handleAction(msg: InAppMessage, button: MessageButton): void {
    const result = this.callbacks.onAction(msg, button);

    // Navigate unless prevented
    if (result !== false && button.url) {
      window.open(button.url, '_blank', 'noopener');
    }

    // Dismiss after action
    const entry = this.displayed.get(msg.id);
    if (entry) {
      this.animateOut(entry.element, msg);
    }
  }

  // ── Animation + cleanup ───────────────────────────────────────

  private removeMessage(id: string): void {
    const entry = this.displayed.get(id);
    if (!entry) return;
    this.animateOut(entry.element, entry.message);
  }

  private animateOut(element: HTMLElement, msg: InAppMessage): void {
    if (element.classList.contains('kb-exit')) return; // already exiting
    element.classList.add('kb-exit');

    const cleanup = () => {
      element.remove();
      this.displayed.delete(msg.id);
      this.callbacks.onDismiss(msg);
    };

    element.addEventListener('animationend', cleanup, { once: true });
    // Fallback if animation doesn't fire (e.g. prefers-reduced-motion)
    setTimeout(cleanup, 300);
  }

  // ── Helpers ───────────────────────────────────────────────────

  private el(tag: string, className: string): HTMLElement {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  }

  private applyStyle(el: HTMLElement, msg: InAppMessage): void {
    const radiusMap = { none: '0', small: '8px', medium: '16px', large: '24px' };
    const shadowMap = {
      none: 'none',
      small: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
      medium: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      large: '0 25px 50px -12px rgba(0,0,0,0.25)',
    };
    if (msg.borderRadius) el.style.borderRadius = radiusMap[msg.borderRadius] || radiusMap.medium;
    if (msg.shadow) el.style.boxShadow = shadowMap[msg.shadow] || shadowMap.medium;
  }
}
