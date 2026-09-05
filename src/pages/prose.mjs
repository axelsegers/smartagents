// Long-form body copy: four block types and two inline marks.
//
// Two page families on the public site run long enough to need their own
// heading, quote and list levels — the insights and the privacy notice — so
// they get a small authoring vocabulary rather than hand-written markup. It
// sits here rather than in either folder because it belongs to neither. `p`, `h2` and `quote` are tagged
// template literals, which is what lets a Dutch or French sentence carry its
// apostrophes without a single backslash; `**bold**` and `[label](href)` are
// the only inline marks, and a href of the form `insight:<key>` is resolved to
// this language's URL by the caller.
//
// Every element the renderer emits carries an id (element-ids §1). A paragraph
// has no content key of its own, so the block index is the key — padded to two
// digits, as §4 prescribes for repeats with no meaning of their own. Reordering
// a body therefore renumbers it, which is the one place this repo accepts that:
// prose is read in order and nothing outside the article points into it.
import { html, join, raw, escapeHtml } from '../../build/lib/html.mjs';

/**
 * Source prose is wrapped for the 100-column rule; the reader gets one line.
 *
 * Interpolations are interleaved rather than dropped. They used to be dropped —
 * `strings.join('')` ignores the values entirely — which is silent, and silent
 * is the wrong failure for a tag whose whole job is to carry a sentence. The
 * privacy notice interpolates a VAT number and an e-mail address that are
 * defined once at the top of its body module, and it lost both without a
 * murmur. Nothing else in the repo interpolates, so this changes no existing
 * output.
 */
const squeeze = (strings, values = []) =>
  strings
    .reduce((out, chunk, i) => out + chunk + (i < values.length ? values[i] : ''), '')
    .replace(/\s+/g, ' ')
    .trim();

/** `01`-style index — the same two-digit key the rest of the site uses. */
const index = (n) => String(n).padStart(2, '0');

export const p = (strings, ...values) => ({ type: 'p', text: squeeze(strings, values) });
export const h2 = (strings, ...values) => ({ type: 'h2', text: squeeze(strings, values) });
export const quote = (strings, ...values) => ({ type: 'quote', text: squeeze(strings, values) });

/** A bulleted list. Items are plain template strings, squeezed like the rest. */
export const list = (items) => ({
  type: 'list',
  items: items.map((item) => item.replace(/\s+/g, ' ').trim())
});

// One pass over the escaped text, so the strong and link counters stay in
// document order. Escaping first is what makes the replacement safe: the marks
// use characters escapeHtml leaves alone, and everything it captures — a label,
// a href, an apostrophe — is already escaped by the time it is re-inserted.
const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;

function inline(text, id, resolveHref) {
  let links = 0;
  let strongs = 0;

  return raw(
    escapeHtml(text).replace(INLINE, (match, label, href, bold) => {
      if (bold !== undefined) {
        strongs += 1;
        return `<strong id="${id}-strong-${index(strongs)}">${bold}</strong>`;
      }
      links += 1;
      return `<a id="${id}-link-${index(links)}" href="${resolveHref(href)}">${label}</a>`;
    })
  );
}

/**
 * Render one language's body.
 *
 * @param {Array} blocks              the exported body for this language
 * @param {object} options
 * @param {string} options.scope      id prefix, e.g. `insight-aviso-body`
 * @param {Function} options.resolveHref  maps an authored href to a real one
 */
export function prose(blocks, { scope, resolveHref }) {
  return join(
    blocks.map((block, i) => {
      const id = `${scope}-block-${index(i + 1)}`;

      switch (block.type) {
        case 'h2':
          /* `tabindex="-1"` so a link into the body moves focus and not only the
             viewport. Chrome and Firefox set the sequential-focus starting point
             to a fragment's target and paper over the gap; Safari does not, so a
             keyboard user who follows the privacy notice's clause index and then
             presses Tab resumes at the index rather than in the clause. It costs
             nothing: a negative tabindex is invisible to the tab order. */
          return html`    <h2 id="${id}" class="prose__heading" tabindex="-1">${inline(block.text, id, resolveHref)}</h2>`;
        case 'quote':
          return html`    <blockquote id="${id}" class="prose__quote">
      <p id="${id}-text" class="prose__quote-text">${inline(block.text, `${id}-text`, resolveHref)}</p>
    </blockquote>`;
        case 'list':
          return html`    <ul id="${id}" class="prose__list">
${join(
  block.items.map((item, j) => {
    const itemId = `${id}-item-${index(j + 1)}`;
    return html`      <li id="${itemId}">${inline(item, itemId, resolveHref)}</li>`;
  })
)}
    </ul>`;
        default:
          return html`    <p id="${id}">${inline(block.text, id, resolveHref)}</p>`;
      }
    })
  );
}
