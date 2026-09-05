// Entry chunk. Deliberately tiny: prefetch helper, component lazy-loader and
// service worker registration. No framework, no router (layer 2 of the
// MPA-feels-like-SPA stack is CSS-only view transitions).
// See .claude/skills/webcomponent-mpa-spa/SKILL.md §5.
import './styles/main.css';

/* ------------------------------------------------------------------ *
 * Lazy component registration
 * ------------------------------------------------------------------ */

/** tag name -> dynamic import. Vite splits each into its own hashed chunk. */
const COMPONENTS = {
  'sa-accordion': () => import('./components/accordion/accordion.js'),
  'sa-lazy-video': () => import('./components/lazy-video/lazy-video.js'),
  'sa-node-field': () => import('./components/node-field/node-field.js'),
  'sa-contact-form': () => import('./components/contact-form/contact-form.js'),
  'sa-clause-index': () => import('./components/clause-index/clause-index.js')
};

const loading = new Set();

function upgrade(tagName) {
  if (loading.has(tagName) || customElements.get(tagName)) return;
  loading.add(tagName);
  COMPONENTS[tagName]().catch((error) => {
    loading.delete(tagName);
    console.error(`Failed to load <${tagName}>`, error);
  });
}

const nearViewport = 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          upgrade(entry.target.localName);
        }
      },
      { rootMargin: '200px' }
    )
  : null;

function scan(root = document) {
  for (const tagName of Object.keys(COMPONENTS)) {
    for (const element of root.querySelectorAll(tagName)) {
      if (nearViewport) nearViewport.observe(element);
      else upgrade(tagName);
    }
  }
}

scan();
// Re-scan when a soft navigation swaps content in (no router today, but the
// contract is in place for when one is added).
document.addEventListener('page:change', () => scan());

/* ------------------------------------------------------------------ *
 * The menu disclosure
 *
 * The header menu is a <details>, so it opens and closes with no JS at all and
 * the page is fully navigable without this. What it cannot do on its own is
 * close: on a phone the panel is a full-height sheet and almost every entry in
 * it is an anchor on the page behind it, so following one leaves the sheet
 * standing over the section it just jumped to. Closing it here, and on Escape,
 * is the whole of it.
 * ------------------------------------------------------------------ */

const navToggle = document.getElementById('nav-toggle');

if (navToggle) {
  navToggle.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) navToggle.open = false;
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navToggle.open) {
      navToggle.open = false;
      navToggle.querySelector('summary')?.focus();
    }
  });
}

/* ------------------------------------------------------------------ *
 * Page motion — spotlight, magnets. Decorative, so it waits.
 * ------------------------------------------------------------------ */

import './motion.js';

/* ------------------------------------------------------------------ *
 * Hover prefetch — fallback for browsers without Speculation Rules
 * ------------------------------------------------------------------ */

if (!HTMLScriptElement.supports?.('speculationrules')) {
  const prefetched = new Set();

  const prefetch = (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname.startsWith('/secured/')) return;
    if (link.hasAttribute('download') || link.target) return;
    if (url.pathname === location.pathname) return;
    if (prefetched.has(url.href)) return;

    prefetched.add(url.href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = url.href;
    document.head.append(hint);
  };

  document.addEventListener('pointerenter', prefetch, { capture: true, passive: true });
  document.addEventListener('touchstart', prefetch, { capture: true, passive: true });
}

/* ------------------------------------------------------------------ *
 * Service worker — registered after load so it never competes with paint
 * ------------------------------------------------------------------ */

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* A failed registration must never break the page. */
    });
  });
}
