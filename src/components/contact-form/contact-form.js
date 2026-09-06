// <sa-contact-form> — progressive enhancement for the contact section.
//
// The form inside works without this component: it falls back to a mailto:
// submit. When a Turnstile site key is configured the component takes over,
// posts JSON to /api/contact and reports the result inline.
//
// Turnstile is third-party and is therefore never part of the initial load: the
// script is fetched on the first interaction with the form, not before.
// See .claude/skills/fast-static-site/SKILL.md §1 (third-party budget: 0).

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileReady = null;

function loadTurnstile() {
  if (turnstileReady) return turnstileReady;

  turnstileReady = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.append(script);
  });

  return turnstileReady;
}

/**
 * What each field the visitor fills in has to satisfy. Anything with no
 * `pattern` only has to be non-empty. The e-mail pattern is the same one
 * `validatePayload` in functions/api/contact.js applies, deliberately: a form
 * that accepts what the endpoint will reject sends the visitor a network round
 * trip to be told what the page already knew.
 */
const RULES = [
  { name: 'name' },
  { name: 'email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { name: 'message' }
];

class ContactForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.status = this.querySelector('.form-status');
    this.submitter = this.querySelector('button[type="submit"]');
    this.sitekey = this.dataset.sitekey;
    if (!this.form || !this.sitekey) return;

    // The browser's own validation is the fallback, not the plan: it reports
    // one field at a time, in a bubble that vanishes, with no mark left on the
    // field afterwards. Taking `novalidate` here is what lets every failing
    // field be named at once, in the page, where it stays until it is fixed —
    // and it is taken only once the component has upgraded, so a page with no
    // JS keeps the native behaviour rather than losing validation altogether.
    this.form.noValidate = true;

    // Nothing about the form should reach the network before someone uses it.
    this.form.addEventListener('focusin', () => this.prepare(), { once: true });
    this.form.addEventListener('submit', (event) => this.submit(event));

    // A message clears as soon as the field it is about stops being wrong, not
    // on the next submit: a form that keeps saying "fill this in" at a field
    // that now has something in it is reporting its own staleness.
    for (const { name } of RULES) {
      this.control(name)?.addEventListener('input', () => this.revalidate(name));
    }
  }

  control(name) {
    return this.form.elements[name] || null;
  }

  /** The empty span the markup already pointed this field's description at. */
  slot(name) {
    const described = this.control(name)?.getAttribute('aria-describedby');
    return described ? this.form.querySelector(`#${CSS.escape(described)}`) : null;
  }

  /** The rule's complaint about this field's current value, or null. */
  problem(rule) {
    const value = (this.control(rule.name)?.value || '').trim();
    if (!value) return this.dataset.errorRequired;
    if (rule.pattern && !rule.pattern.test(value)) return this.dataset.errorEmail;
    return null;
  }

  mark(name, message) {
    const control = this.control(name);
    const slot = this.slot(name);
    if (!control || !slot) return;

    slot.textContent = message || '';
    slot.hidden = !message;
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }

  /** Re-check one field, but only once it has already been reported wrong. */
  revalidate(name) {
    const control = this.control(name);
    if (!control || control.getAttribute('aria-invalid') !== 'true') return;

    const rule = RULES.find((entry) => entry.name === name);
    this.mark(name, this.problem(rule));
  }

  /** Marks every failing field and returns the first one, or null. */
  validate() {
    let first = null;
    for (const rule of RULES) {
      const message = this.problem(rule);
      this.mark(rule.name, message);
      if (message && !first) first = this.control(rule.name);
    }
    return first;
  }

  async prepare() {
    if (this.widget !== undefined) return;
    this.widget = null;

    try {
      const turnstile = await loadTurnstile();
      const host = document.createElement('div');
      host.hidden = true;
      this.append(host);
      this.widget = turnstile.render(host, {
        sitekey: this.sitekey,
        size: 'invisible',
        callback: (token) => this.resolveToken?.(token),
        'error-callback': () => this.rejectToken?.(new Error('challenge failed'))
      });
    } catch {
      this.widget = null; // stays on the mailto: fallback
    }
  }

  token() {
    return new Promise((resolve, reject) => {
      this.resolveToken = resolve;
      this.rejectToken = reject;
      window.turnstile.reset(this.widget);
      window.turnstile.execute(this.widget);
    });
  }

  async submit(event) {
    if (this.busy) {
      event.preventDefault();
      return;
    }

    // Before anything is awaited. `preventDefault` only counts while the event
    // is still being dispatched, and the `mailto:` fallback below depends on
    // this method sometimes letting the submit through — so the one branch that
    // has to stop it stops it synchronously.
    const firstInvalid = this.validate();
    if (firstInvalid) {
      event.preventDefault();
      this.say('');
      firstInvalid.focus();
      return;
    }

    await this.prepare();
    if (!this.widget) return; // let the browser run the mailto: fallback

    event.preventDefault();
    this.setBusy(true);
    this.say(this.dataset.sending, 'busy');

    try {
      const data = Object.fromEntries(new FormData(this.form));
      data['cf-turnstile-response'] = await this.token();

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(String(response.status));

      this.form.reset();
      for (const { name } of RULES) this.mark(name, null);
      this.say(this.dataset.sent, 'ok');
    } catch {
      this.say(this.dataset.failed, 'error');
    } finally {
      this.setBusy(false);
    }
  }

  /**
   * The status line already says the message is going; the button is what the
   * hand is still on, and until now it said nothing. `aria-disabled` rather
   * than `disabled`, because a disabled button leaves the focus ring nowhere
   * and stops being announced at the moment there is something to announce —
   * what actually refuses the second click is the guard at the top of
   * `submit`, which was always the thing doing the work.
   */
  setBusy(busy) {
    this.busy = busy;
    if (busy) this.submitter?.setAttribute('aria-disabled', 'true');
    else this.submitter?.removeAttribute('aria-disabled');
  }

  say(message, state) {
    if (!this.status) return;
    this.status.textContent = message || '';
    if (state) this.status.dataset.state = state;
    else delete this.status.dataset.state;
  }
}

customElements.define('sa-contact-form', ContactForm);
