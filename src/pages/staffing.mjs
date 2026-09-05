// The AI staffing and coaching page: the detail page behind the "AI staffing en
// coaching" service row on the homepage. Three blocks and nothing else — the
// page hero, the offer, the form — because the offer is the page. It used to
// carry an onboarding sequence and a navy reporting band under the offer as
// well; both said in two screens what the tracks already say in one, and the
// page now closes on the form while the reader is still on the offer.
// See .claude/skills/smartagents-design/README.md and element-ids/SKILL.md.
import { html, join } from '../../build/lib/html.mjs';
import { orbitRings } from '../layouts/base.mjs';
import { breadcrumbNode, homeStep, serviceNode } from '../layouts/schema.mjs';
import { contactSection } from '../components/contact-form/contact-form.mjs';

/**
 * The three ways this offer reaches a team: one engineer inside the project,
 * coaching for the people who write the code, and coaching for the people who
 * do not. Also the order they open in — the first is the one the page is titled
 * after, so it is the one that stands open on arrival.
 */
const TRACKS = ['engineer', 'developers', 'business'];

/** The three `staffing.track.<key>.tag.n` words each track is summarised by. */
const TRACK_TAGS = ['1', '2', '3'];

export const page = {
  id: 'staffing',
  slugs: { nl: 'ai-staffing', en: 'ai-staffing', fr: 'ai-staffing' },

  meta: (t) => ({
    title: t('staffing.title'),
    description: t('staffing.description')
  }),

  /* What this page is, for a machine: one `Service` provided by the company
     node every page carries, and the trail back to the language root. Both are
     read off the same keys the page prints, so the graph cannot describe an
     offer the page no longer makes. */
  schema: ({ t, lang, url }) => [
    serviceNode({ t, lang, url, key: 'staffing' }),
    breadcrumbNode([homeStep(t, lang), { name: t('service.staffing.title'), url }])
  ],

  render: ({ t, lang }) => {
    return html`<main id="main" tabindex="-1">

${hero(t)}
${tracks(t)}
${contact(t, lang)}

</main>`;
  }
};

/* ------------------------------------------------------------------ *
 * Hero — the page hero the training page opens on, carrying this page's own
 * shapes instead of the petal.
 *
 * Three shapes, one composition: an arch hung off the right flank, and two
 * pebbles that have come away from it into the light half of the hero. The
 * arch is the ground the page is set against; the pebbles are what says the
 * ground is not a wall. They are the only free-floating dark shapes on the
 * site — everything else is welded to a page edge or to a rule — and they earn
 * it here because the arch itself is welded along three sides.
 *
 * The arch's box hangs past the hero's own foot, so its tail runs on into the
 * section below and passes behind the track panel. That is the whole reason the
 * panel is opaque: the tail slides under it and comes out in the gutter, which
 * is what ties the two blocks together without a rule between them.
 *
 * All three are `data-magnet-free`: none of them may be refused a pull by the
 * nav guard, and the arch does not need it — pinned along its top edge, a
 * cursor up under the header gets a swell that fades to nothing before it can
 * peel the shape off the bar. The arch is sampled more densely than a shape
 * this size normally is: its free side is three turns of one curve, and a pull
 * reads as a fold rather than a swell if the sampling cannot follow it.
 * ------------------------------------------------------------------ */

function hero(t) {
  return html`<section id="staffing-hero" class="hero hero--page hero--staffing">
${orbitRings('staffing-hero')}
  <div id="staffing-hero-field-slot-right" class="field-slot hero__field hero__field--right" aria-hidden="true">
    <div id="staffing-hero-field-arch" class="field" data-magnet data-magnet-free data-magnet-pin="top,right,bottom" data-magnet-points="340" data-magnet-amp="46" data-clip="heroArch"><sa-node-field id="staffing-hero-nodes-arch"></sa-node-field></div>
    <div id="staffing-hero-field-pebble-a" class="field hero__pebble hero__pebble--a" data-magnet data-magnet-free data-magnet-points="200" data-magnet-amp="30" data-clip="heroPebbleA"><sa-node-field id="staffing-hero-nodes-pebble-a"></sa-node-field></div>
    <div id="staffing-hero-field-pebble-b" class="field hero__pebble hero__pebble--b" data-magnet data-magnet-free data-magnet-points="160" data-magnet-amp="24" data-clip="heroPebbleB"><sa-node-field id="staffing-hero-nodes-pebble-b"></sa-node-field></div>
  </div>
  <div id="staffing-hero-inner" class="hero__inner">
    <div id="staffing-hero-text" class="hero__text">
      <p id="staffing-hero-eyebrow" class="page-eyebrow">${t('staffing.hero.eyebrow')}</p>
      <h1 id="staffing-hero-title">${t('staffing.hero.title')}</h1>
      <div id="staffing-hero-actions" class="hero__actions">
        <a id="staffing-hero-cta-talk" class="btn btn--primary" href="#contact">${t('cta.talk')}</a>
        <a id="staffing-hero-cta-tracks" class="btn btn--ghost" href="#tracks">${t('staffing.cta.tracks')} <span id="staffing-hero-cta-tracks-arrow" aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Wat we doen — the three tracks, one open at a time
 *
 * The one figure on the page, so it gets to be a panel rather than a column:
 * three rows on white, each a name and the three words that place it, opening
 * onto a paragraph. Side by side as three columns the three read as a price
 * table and the reader compares them; stacked as rows that open, the reader
 * picks the one that is theirs and reads only that. The offer has never been a
 * choice between three — it is one of three, and which one is obvious from the
 * team asking.
 *
 * Every row is a `<details>` and they share a `name`, so the panel works with JS
 * off: the rows open, and the browser closes the open one when another opens.
 * `<sa-accordion>` takes both over when it loads, because that is the only way
 * either of them travels rather than snaps — see the note at the top of
 * `components/accordion/accordion.js`. The first row stands open, so the block
 * never arrives as three closed bars.
 *
 * The panel is opaque and sits above the hero's tail, and it is flanked by two
 * shapes of its own: the leaf in the left gutter and the tail-wedge dropping
 * from the far corner, a diagonal across the block rather than an ornament on
 * one side of it.
 * ------------------------------------------------------------------ */

/**
 * One track: a summary that is a name and three words, and a body it opens on.
 *
 * The name is an `<h3>`, not a `<span>`. `<summary>` takes phrasing content
 * "optionally intermixed with heading content", so a heading is allowed there,
 * and without one the three offers this page exists to sell were the only named
 * blocks on the site missing from the heading outline.
 *
 * @param {object} options
 * @param {Function} options.t
 * @param {string} options.key    track key, also the id suffix
 * @param {boolean} options.open  whether the row stands open on arrival
 */
function track({ t, key, open }) {
  const id = `staffing-track-${key}`;

  const tags = TRACK_TAGS.map(
    (n) => html`            <li id="${id}-tag-${n}" class="track__tag">${t(`staffing.track.${key}.tag.${n}`)}</li>`
  );

  return html`      <details id="${id}" class="track" name="staffing-track"${open ? ' open' : ''}>
        <summary id="${id}-summary" class="track__summary">
          <div id="${id}-head" class="track__head">
            <h3 id="${id}-title" class="track__title">${t(`staffing.track.${key}.title`)}</h3>
            <ul id="${id}-tags" class="track__tags">
${join(tags)}
            </ul>
          </div>
          <span id="${id}-chevron" class="track__chevron" aria-hidden="true"></span>
        </summary>
        <div id="${id}-panel" class="track__panel">
          <div id="${id}-panel-inner" class="track__inner">
            <p id="${id}-body" class="track__body">${t(`staffing.track.${key}.body`)}</p>
            <p id="${id}-how" class="track__body">${t(`staffing.track.${key}.how`)}</p>
            <div id="${id}-fit" class="track__fit">
              <p id="${id}-fit-label" class="track__fit-label">${t('staffing.track.fitLabel')}</p>
              <p id="${id}-fit-body" class="track__fit-body">${t(`staffing.track.${key}.fit`)}</p>
            </div>
          </div>
        </div>
      </details>`;
}

function tracks(t) {
  const rows = TRACKS.map((key, i) => track({ t, key, open: i === 0 }));

  return html`<section id="tracks" class="section" aria-labelledby="staffing-tracks-title">
  <div id="staffing-tracks-head" class="section__head">
    <h2 id="staffing-tracks-title" class="section-heading">${t('staffing.tracks.title')}</h2>
  </div>
  <!-- Outside the accordion on purpose. Two of the three rows are closed on
       arrival, so with the whole offer inside the disclosure the page said
       about forty words above the fold on the site's most commercially loaded
       service name. This paragraph is what a reader gets before they open
       anything. -->
  <p id="staffing-tracks-lede" class="section-lede">${t('staffing.tracks.lede')}</p>
  <div id="staffing-tracks-ground" class="tracks">
    <div id="staffing-tracks-leaf-slot" class="field-slot tracks__leaf" aria-hidden="true">
      <div id="staffing-tracks-leaf" class="field" data-magnet data-magnet-free data-magnet-pin="left" data-magnet-points="260" data-magnet-amp="34" data-clip="tracksLeaf"><sa-node-field id="staffing-tracks-leaf-nodes"></sa-node-field></div>
    </div>
    <div id="staffing-tracks-tail-slot" class="field-slot tracks__tail" aria-hidden="true">
      <div id="staffing-tracks-tail" class="field" data-magnet data-magnet-free data-magnet-points="220" data-magnet-amp="30" data-clip="tracksTail"><sa-node-field id="staffing-tracks-tail-nodes"></sa-node-field></div>
    </div>
    <sa-accordion id="staffing-tracks-panel" class="tracks__panel">
${join(rows)}
    </sa-accordion>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Contact — the shared form, with the two lines this page phrases for itself.
 * ------------------------------------------------------------------ */

function contact(t, lang) {
  return contactSection({
    t,
    lang,
    prefix: 'staffing',
    title: t('staffing.cta.title'),
    lede: t('staffing.cta.body')
  });
}
