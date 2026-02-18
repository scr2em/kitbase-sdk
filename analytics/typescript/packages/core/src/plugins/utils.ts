import type { Tags } from '../types-lite.js';

/**
 * CSS selector matching interactive elements for click tracking.
 * Includes standard HTML elements and common ARIA roles.
 */
export const CLICKABLE_SELECTOR = [
  'a', 'button', 'input', 'select', 'textarea',
  '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]',
].join(', ');

/**
 * Find the nearest clickable element from a click event.
 * Uses `composedPath()` to traverse through Shadow DOM boundaries.
 * When a match is found inside a Shadow DOM, the custom-element host
 * is returned so that tracked attributes reflect the public component.
 */
export function findClickableElement(event: MouseEvent): Element | null {
  const path = event.composedPath?.() as Element[] | undefined;

  if (path) {
    for (const node of path) {
      if (!(node instanceof Element)) continue;
      if (node === document.documentElement) break;

      if (node.matches(CLICKABLE_SELECTOR)) {
        const root = node.getRootNode();
        if (root instanceof ShadowRoot && root.host instanceof Element) {
          return root.host;
        }
        return node;
      }

      // Custom elements (tag name contains a hyphen per spec)
      if (node.tagName.includes('-')) {
        return node;
      }
    }
  }

  // Fallback for browsers without composedPath
  const target = event.target as Element | null;
  if (!target?.closest) return null;
  return target.closest(CLICKABLE_SELECTOR);
}

/**
 * Build a lightweight CSS selector for an element.
 * Used to identify frustration signal targets.
 */
export function buildCssSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const classes = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  if (classes) return `${tag}${classes}`;
  return tag;
}

/**
 * Get root domain from hostname (e.g., blog.example.com -> example.com)
 */
export function getRootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, '').split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/**
 * Check if two hostnames share the same root domain
 */
export function isSameRootDomain(host1: string, host2: string): boolean {
  return getRootDomain(host1) === getRootDomain(host2);
}

/**
 * Get UTM parameters from current URL
 */
export function getUtmParams(): Tags {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utmParams: Tags = {};

  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) {
      utmParams[`__${key}`] = value;
    }
  }

  return utmParams;
}
