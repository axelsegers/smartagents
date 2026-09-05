// The training page: the detail page behind the "Training en coaching" service
// row on the homepage. It carries the offer itself: the two courses we run
// today, each an editorial block rather than a card, in the redesign's own
// language (hairlines, no numbering).
// See .claude/skills/smartagents-design/README.md and element-ids/SKILL.md.
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { html, join } from '../../build/lib/html.mjs';
import { orbitRings } from '../layouts/base.mjs';
import { breadcrumbNode, homeStep, serviceNode } from '../layouts/schema.mjs';
import { contactSection } from '../components/contact-form/contact-form.mjs';

/**
 * The courses we run today, in the order they are offered.
 *
 * A fiche is named after the course it belongs to. It used to be named after
 * the product the course was once built around — `M365_Copilot` under "AI voor
 * business teams", `AI_Developers` under "Agentic engineering" — and a browser
 * puts the file name in the download bar, so the reader clicked one course and
 * was handed something that looked like another.
 */
const COURSES = [
  { key: 'business', fiche: 'SmartAgents_AI_Business_Teams_Onepager.pdf' },
  { key: 'agentic', fiche: 'SmartAgents_Agentic_Engineering_Onepager.pdf' }
];

/**
 * How big the download is, in kilobytes, read off the file itself at build
 * time. These are 400 KB documents on a link that says only "Download de
 * fiche", which on a phone connection is worth knowing before the tap — and
 * read rather than written down, so it cannot go stale when a fiche is
 * replaced.
 */
const MEDIA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/media');
const ficheKilobytes = (file) => Math.round(statSync(path.join(MEDIA_DIR, file)).size / 1024);

/** The `learn.n` lines every live course carries. */
const LEARN = ['1', '2', '3', '4'];

const BENEFITS = ['adoption', 'productivity', 'risk', 'return', 'autonomy'];

/**
 * The facts strip under every course: what a prospect has to know before they
 * can decide whether this is for them.
 *
 * Neither course stated a format, a group size, an audience or a price, so the
 * only next step from this page was the contact form and every enquiry started
 * from zero. Everything here is something the site already said somewhere else
 * — the format in the closing paragraph, the group size in "Hoe een cursus
 * verloopt", the audience in the homepage's own service row, the tools in the
 * line this replaced — collected where the decision is made. Duration and open
 * dates are the two facts nothing on the site knows; they are deliberately not
 * guessed at here.
 */
const FACTS = [
  { name: 'audience', value: (key) => `training.course.${key}.audience` },
  { name: 'format', value: () => 'training.facts.format.value' },
  { name: 'group', value: () => 'training.facts.group.value' },
  { name: 'tools', value: (key) => `training.course.${key}.tools` },
  { name: 'price', value: () => 'training.facts.price.value' }
];

/** What a participant walks away with, listed under `training.format.tags.title`. */
const INCLUDED = ['material', 'exercises', 'labs', 'qa', 'slides', 'guidance'];

/** The developer course tour, copied into dist/media/ by build/render.mjs. */
const KATA_VIDEO = '/media/kata-agentic-engineering.mp4';
const KATA_POSTER = '/media/kata-agentic-engineering-poster.jpg';

export const page = {
  id: 'training',
  slugs: { nl: 'training', en: 'training', fr: 'formation' },

  meta: (t) => ({
    title: t('training.title'),
    description: t('training.description')
  }),

  /* What this page is, for a machine: one `Service` provided by the company
     node every page carries, and the trail back to the language root. Both are
     read off the same keys the page prints, so the graph cannot describe an
     offer the page no longer makes. */
  schema: ({ t, lang, url }) => [
    serviceNode({ t, lang, url, key: 'training' }),
    breadcrumbNode([homeStep(t, lang), { name: t('service.training.title'), url }])
  ],

  render: ({ t, lang }) => {
    return html`<main id="main" tabindex="-1">

${hero(t)}
${why(t)}
${offer(t)}
${format(t)}
${contact(t, lang)}

</main>`;
  }
};

/* ------------------------------------------------------------------ *
 * Hero — the homepage hero minus the wordmark: the same orbit rings, one petal
 * hung off the right edge, the copy in its own column on the left.
 * ------------------------------------------------------------------ */

function hero(t) {
  return html`<section id="training-hero" class="hero hero--page">
${orbitRings('training-hero')}
  <div id="training-hero-field-slot-right" class="field-slot hero__field hero__field--right" aria-hidden="true">
    <div id="training-hero-field-right" class="field" data-magnet data-magnet-free data-magnet-pin="right" data-magnet-points="480" data-magnet-amp="86" data-magnet-sigma="118" data-clip="heroPetal"><sa-node-field id="training-hero-nodes-right"></sa-node-field></div>
  </div>
  <div id="training-hero-inner" class="hero__inner">
    <div id="training-hero-text" class="hero__text">
      <p id="training-hero-eyebrow" class="page-eyebrow">${t('training.hero.eyebrow')}</p>
      <h1 id="training-hero-title">${t('training.hero.title')}</h1>
      <div id="training-hero-actions" class="hero__actions">
        <a id="training-hero-cta-talk" class="btn btn--primary" href="#contact">${t('cta.talk')}</a>
        <a id="training-hero-cta-offer" class="btn btn--ghost" href="#offer">${t('training.cta.offer')} <span id="training-hero-cta-offer-arrow" aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Waarom — the argument, and what it returns
 * ------------------------------------------------------------------ */

function why(t) {
  const rows = BENEFITS.map(
    (key) => html`    <div id="training-benefit-${key}" class="row">
      <span id="training-benefit-${key}-title" class="row__title">${t(`training.benefit.${key}.title`)}</span>
      <span id="training-benefit-${key}-body" class="row__body">${t(`training.benefit.${key}.body`)}</span>
    </div>`
  );

  return html`<section id="training-why" class="section" aria-labelledby="training-why-title">
  <div id="training-why-head" class="section__head">
    <h2 id="training-why-title" class="section-heading">${t('training.why.title')}</h2>
  </div>
  <div id="training-why-rows" class="rows">
${join(rows)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Ons aanbod — the courses
 *
 * The two courses stand side by side, split by a hairline, so the offer is one
 * screen and the reader compares rather than scrolls. Nothing is numbered: this
 * is a list, not a path. The hero's orbit diagram returns behind the pair, dimmer
 * and struck from the opposite edge, so the section has ground of its own.
 * ------------------------------------------------------------------ */

/**
 * One course we run today: a column of hairline-separated blocks.
 *
 * @param {object} options
 * @param {Function} options.t
 * @param {string} options.key   course key, also the id suffix
 * @param {string} options.fiche file name of the one-pager in /media/
 */
function courseColumn({ t, key, fiche }) {
  const id = `training-offer-course-${key}`;

  const items = LEARN.map(
    (n) => html`        <li id="${id}-learn-${n}" class="offer-course__item">${t(`training.course.${key}.learn.${n}`)}</li>`
  );

  return html`    <article id="${id}" class="offer-course">
      <h3 id="${id}-title" class="offer-course__title">${t(`training.course.${key}.title`)}</h3>
      <p id="${id}-body" class="offer-course__body">${t(`training.course.${key}.body`)}</p>
      <p id="${id}-learn-label" class="offer-course__learn">${t('training.offer.learn')}</p>
      <ul id="${id}-learn-list" class="offer-course__list">
${join(items)}
      </ul>
      <dl id="${id}-facts" class="offer-course__facts">
${join(
        FACTS.map(
          ({ name, value }) => html`        <div id="${id}-fact-${name}" class="offer-course__fact">
          <dt id="${id}-fact-${name}-label">${t(`training.facts.${name}.label`)}</dt>
          <dd id="${id}-fact-${name}-value">${t(value(key))}</dd>
        </div>`
        ),
        '\n'
      )}
      </dl>
      <a id="${id}-fiche" class="offer-course__fiche" href="/media/${fiche}" type="application/pdf">${t('training.download')} <span id="${id}-fiche-size" class="offer-course__fiche-size">(PDF, ${ficheKilobytes(fiche)} kB)</span> <span id="${id}-fiche-arrow" aria-hidden="true">&rarr;</span></a>
    </article>`;
}

function offer(t) {
  const columns = COURSES.map(({ key, fiche }) => courseColumn({ t, key, fiche }));

  return html`<section id="offer" class="section section--orbits" aria-labelledby="training-offer-title">
${orbitRings('training-offer', 'orbits--offer')}
  <div id="training-offer-head" class="section__head">
    <h2 id="training-offer-title" class="section-heading">${t('training.offer.title')}</h2>
  </div>
  <div id="training-offer-list" class="offer">
${join(columns)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Hoe een cursus verloopt — the copy beside the developer course tour
 *
 * Two shapes of the dark field open the section, hung off the two rules that
 * bound it. A half disc drops from the rule the offer closes on, just left of
 * the split between the two courses, and a stone stands on the rule the tour
 * hangs from, further right and a band lower — so the pair reads as one
 * diagonal across the band rather than two ornaments.
 * Each is pinned to its own rule, so the cursor swells and rocks them but never
 * peels them off, and both are windows onto the one node field.
 *
 * The stone lives inside the section head, which is what puts its foot on the
 * rule: the head's bottom edge is the tour's top border, whatever the heading
 * does to the height above it. The disc hangs off the section's own top edge,
 * which is the rule the offer closes on.
 * ------------------------------------------------------------------ */

function format(t) {
  return html`<section id="training-format" class="section" aria-labelledby="training-format-title">
  <div id="training-format-dome-slot" class="field-slot tour__dome" aria-hidden="true">
    <div id="training-format-dome" class="field" data-magnet data-magnet-free data-magnet-pin="top" data-magnet-points="280" data-magnet-amp="24" data-magnet-sigma="70" data-clip="tourDome"><sa-node-field id="training-format-dome-nodes"></sa-node-field></div>
  </div>
  <div id="training-format-head" class="section__head tour__ground">
    <h2 id="training-format-title" class="section-heading">${t('training.format.title')}</h2>
    <div id="training-format-stone-slot" class="field-slot tour__stone" aria-hidden="true">
      <div id="training-format-stone" class="field" data-magnet data-magnet-free data-magnet-pin="bottom" data-magnet-points="300" data-magnet-amp="42" data-magnet-sigma="70" data-clip="tourStone"><sa-node-field id="training-format-stone-nodes"></sa-node-field></div>
    </div>
  </div>
  <div id="training-format-inner" class="tour">
    <div id="training-format-copy" class="tour__copy">
      <p id="training-format-body" class="tour__body">${t('training.format.body')}</p>
      <p id="training-format-group" class="tour__meta">${t('training.format.group')}</p>
      <div id="training-format-tags" class="tour__tags">
        <p id="training-format-tags-title" class="tour__tags-title">${t('training.format.tags.title')}</p>
        <ul id="training-format-tags-list" class="tour__tags-list">
${join(
        INCLUDED.map(
          (key) => html`          <li id="training-format-tag-${key}" class="tour__tags-item">${t(`training.format.tags.${key}`)}</li>`
        ),
        '\n'
      )}
        </ul>
      </div>
      <p id="training-format-accents" class="tour__body">${t('training.format.accents')}</p>
    </div>
    <div id="training-format-media" class="video-block">
      <sa-lazy-video id="training-format-video" class="video-frame">
        <video id="training-format-video-el" controls playsinline preload="none" poster="${KATA_POSTER}" aria-label="${t('training.format.videoLabel')}">
          <source id="training-format-video-source" type="video/mp4" data-src="${KATA_VIDEO}">
        </video>
      </sa-lazy-video>
      <noscript id="training-format-video-noscript"><a id="training-format-video-fallback" class="video-block__fallback" href="${KATA_VIDEO}">${t('training.format.fallback')}</a></noscript>
    </div>
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
    prefix: 'training',
    title: t('training.cta.title'),
    lede: t('training.cta.body')
  });
}
