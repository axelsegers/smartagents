// The homepage, built from direction 1a ("Redactioneel — licht, lijnen, veel
// lucht") of the "Smartagents.be Redesign Direction" design project.
// Structure, spacing, colour and motion all come from the design system:
// see .claude/skills/smartagents-design/README.md.
import { html, join, raw } from '../../build/lib/html.mjs';
import { index, logoMark, orbitRings, servicePath } from '../layouts/base.mjs';
import { absolute } from '../../build/lib/i18n.mjs';
import { contactSection } from '../components/contact-form/contact-form.mjs';
import { articleRows, insightsIndexPath } from './insights/insights.mjs';

// The four services, in the order they are offered. Training and AI staffing
// lead because they are the two a reader arrives already looking for; the two
// AI-native tracks follow, engineering first and business second, because the
// SDLC page is the one that names the journey the business page is a part of.
// Agentic automatisatie is gone: it is what the staffing track does inside a
// project, not a fifth thing to pick from. Procesoptimalisatie is gone too —
// it was one row standing for two different engagements, and it is now the
// two rows it always was.
const SERVICES = ['training', 'staffing', 'sdlc', 'processes'];
const DNA = ['1', '2', '3', '4'];
const TRANSFORMATION = ['1', '2', '3', '4'];
const STEPS = ['1', '2', '3', '4', '5'];

/**
 * The questions we are asked before a first call, in the order they come up.
 *
 * They are here rather than in a disclosure on purpose: every answer is on the
 * page, open, at all times. A reader skims them, and an answer engine quotes
 * them — which is the point, because this block is also the site's `FAQPage`
 * (see `page.schema` below) and a question whose answer is behind a click is a
 * question the page has not answered.
 *
 * Nothing here is new: every answer is something the site already says on one
 * of its pages, collected where the question is actually asked.
 */
export const FAQ = ['price', 'speed', 'honest', 'who', 'where', 'data'];

/**
 * The cells inside one isometric plane. Pure texture and inside an `aria-hidden`
 * figure, but named all the same: element-ids §1 covers decorative and repeated
 * `<i>` cells too, and "the third cell of the fourth plane" is a thing a person
 * looking at the page can want to point at.
 */
const cells = (plane, n) =>
  raw(
    Array.from(
      { length: n },
      (unused, i) => `<i id="home-transformation-plane-${plane}-cell-${String(i + 1).padStart(2, '0')}"></i>`
    ).join('')
  );

export const page = {
  id: 'home',
  // One entry per language. An empty slug is that language's root, e.g. /nl/.
  slugs: { nl: '', en: '', fr: '' },

  meta: (t) => ({
    title: t('home.title'),
    description: t('home.description')
  }),

  /* The `FAQPage` is the block further down this file, question for question:
     the rule is that structured data may not say anything the page does not,
     and here it says exactly what the page says because both read the same
     keys. It is the format answer engines quote most, which is why the block
     exists at all. */
  schema: ({ t, url }) => [
    {
      '@type': 'FAQPage',
      '@id': `${absolute(url)}#faq`,
      mainEntity: FAQ.map((key) => ({
        '@type': 'Question',
        name: t(`faq.${key}.q`),
        acceptedAnswer: { '@type': 'Answer', text: t(`faq.${key}.a`) }
      }))
    }
  ],

  render: ({ t, lang }) => html`<main id="main" tabindex="-1">

${hero(t)}
${services(t, lang)}
${dna(t)}
${transformation(t)}
${approach(t)}
${faq(t)}
${insights(t, lang)}
${contact(t, lang)}

</main>`
};

/* ------------------------------------------------------------------ *
 * Hero — the copy ranged left in a column of its own, a dark shape on each
 * flank: a petal hung off the right edge, its counter-lobe rising out of the
 * bottom-left. Both are windows onto the same dark field.
 *
 * Each carries its own magnet tuning. `data-magnet-pin` welds the shape to the
 * page edge it hangs from, which is why both can opt out of the nav guard with
 * `data-magnet-free`; the denser sampling is what keeps these curves smooth
 * under a pull, and true in the field a join is traced from.
 * ------------------------------------------------------------------ */

function hero(t) {
  return html`<section id="home-hero" class="hero">
${orbitRings('home-hero')}
  <div id="home-hero-field-slot-right" class="field-slot hero__field hero__field--right" aria-hidden="true">
    <div id="home-hero-field-right" class="field" data-magnet data-magnet-free data-magnet-pin="right" data-magnet-points="480" data-magnet-amp="86" data-magnet-sigma="118" data-clip="heroPetal"><sa-node-field id="home-hero-nodes-right"></sa-node-field></div>
  </div>
  <div id="home-hero-field-slot-left" class="field-slot hero__field hero__field--left" aria-hidden="true">
    <div id="home-hero-field-left" class="field" data-magnet data-magnet-free data-magnet-pin="left" data-magnet-points="460" data-magnet-amp="60" data-magnet-sigma="100" data-clip="heroLobe"><sa-node-field id="home-hero-nodes-left"></sa-node-field></div>
  </div>
  <div id="home-hero-inner" class="hero__inner">
    <div id="home-hero-text" class="hero__text">
      <!-- The wordmark is the drawn hero lockup and it is beside the heading,
           not inside it: as part of the h1 it made the page's one heading read
           "SmartAgents Digitale collega's die nooit slapen", which repeats the
           wordmark 60px above it in the header and says nothing about what is
           sold. It is the same lockup on screen; only the outline changed. -->
      <p id="home-hero-wordmark" class="hero__wordmark">${logoMark('ink', 'home-hero-logo')}<span id="home-hero-wordmark-text">Smart<span id="home-hero-wordmark-accent" class="brand-accent">Agents</span></span></p>
      <h1 id="home-hero-title" class="hero__claim">${t('hero.claim')}</h1>
      <div id="home-hero-actions" class="hero__actions">
        <a id="home-hero-cta-talk" class="btn btn--primary" href="#contact">${t('cta.talk')}</a>
        <a id="home-hero-cta-work" class="btn btn--ghost" href="#services">${t('cta.seeWork')} <span id="home-hero-cta-work-arrow" aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Wat we doen — hairline-separated rows, not cards
 *
 * A service with a detail page of its own is a link, and gets the "Ontdek →"
 * cue back along with the hover, the arrow and the translate. All four have one
 * today, so every row is a link — but the plain-row branch stays: a service is
 * only a link in a language its page is published in, and `servicePath()`
 * returns null everywhere else (design README, "Deviations", item 4).
 * ------------------------------------------------------------------ */

function services(t, lang) {
  const rows = SERVICES.map((key) => {
    const id = `home-services-row-${key}`;
    const href = servicePath(key, lang);

    const content = html`    <span id="${id}-title" class="row__title">${t(`service.${key}.title`)}</span>
    <span id="${id}-body" class="row__body">${t(`service.${key}.body`)}</span>${href
      ? html`
    <span id="${id}-cue" class="row__cue">${t('cta.moreInfo')} <span id="${id}-cue-arrow" aria-hidden="true">&rarr;</span></span>`
      : ''}`;

    return href
      ? html`<a id="${id}" class="row" href="${href}">
${content}
  </a>`
      : html`<div id="${id}" class="row">
${content}
  </div>`;
  });

  return html`<section class="section" id="services" aria-labelledby="home-services-title">
  <div id="home-services-head" class="section__head">
    <h2 id="home-services-title" class="section-heading">${t('section.services')}</h2>
  </div>
  <div id="home-services-rows" class="rows rows--pair">
${join(rows)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Ons DNA — the disc and its rotating helix
 * ------------------------------------------------------------------ */

function dna(t) {
  const items = DNA.map(
    (n) => html`<div id="home-dna-item-${n}" class="numbered numbered--plain">
      <div id="home-dna-item-${n}-inner">
        <h3 id="home-dna-item-${n}-title" class="numbered__title">${t(`dna.${n}.title`)}</h3>
        <p id="home-dna-item-${n}-body">${t(`dna.${n}.body`)}</p>
      </div>
    </div>`
  );

  return html`<section class="section" id="dna" aria-labelledby="home-dna-title">
  <div id="home-dna-head" class="section__head section__head--wide">
    <h2 id="home-dna-title" class="section-heading">${t('section.dna')}</h2>
  </div>
  <div id="home-dna-inner" class="dna">
    <!-- The disc's outline runs along the top and the right of its own box, and
         a guarded shape is refused a pull from an edge that does — the guard is
         there to stop a hero shape swelling up under the nav bar. This one is a
         figure in the middle of a section with clear paper above it, so it opts
         out, and states the amplitude a guarded shape would have had by
         default: without that it drops to the free default of 34, which on a
         shape this size is barely a pull at all. -->
    <div id="home-dna-figure" class="dna__figure" aria-hidden="true">
      <div id="home-dna-disc" class="field dna__disc" data-magnet data-magnet-free data-magnet-amp="92" data-clip="dnaField"></div>
      <div id="home-dna-helix" class="dna__helix"><sa-node-field id="home-dna-helix-nodes" variant="helix"></sa-node-field></div>
      <div id="home-dna-blob" class="field dna__blob" data-magnet data-magnet-free data-clip="dnaBlob"><sa-node-field id="home-dna-blob-nodes"></sa-node-field></div>
    </div>
    <div id="home-dna-list" class="dna__list">
${join(items)}
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Digitale transformatie — four capability areas, drawn as an isometric stack
 *
 * Not numbered, and that is the point. This block and "Van vraag tot werkende
 * oplossing" two sections down both used to run 01, 02, 03, 04 — one of four
 * steps and one of five, describing overlapping things, back to back on the
 * same page. A reader could not tell which of the two was the engagement. The
 * steps are the engagement; these are the areas the work touches, and an area
 * has no number because there is no order to be in.
 * ------------------------------------------------------------------ */

function transformation(t) {
  const items = TRANSFORMATION.map(
    (n) => html`<div id="home-transformation-item-${n}" class="numbered numbered--plain">
      <div id="home-transformation-item-${n}-inner">
        <h3 id="home-transformation-item-${n}-title" class="numbered__title">${t(`transformation.${n}.title`)}</h3>
        <p id="home-transformation-item-${n}-body">${t(`transformation.${n}.body`)}</p>
      </div>
    </div>`
  );

  // The stack repeats the same four layers as the list beside it, so it is
  // decorative: the accessible copy is the list. That is also why these labels
  // stay `<div>` where the list beside them took `<h3>` — the whole figure is
  // `aria-hidden`, so promoting them would add nothing to the outline and would
  // put four headings in the document that no reader can reach.
  const labels = TRANSFORMATION.map(
    (n) => html`<div id="home-transformation-stack-label-${n}" class="stack__label stack__label--${n}${n === '1' ? ' stack__label--active' : ''}">
        <span id="home-transformation-stack-label-${n}-text">${t(`transformation.${n}.label`)}</span>
      </div>`
  );

  return html`<section class="section" id="transformation" aria-labelledby="home-transformation-title">
  <div id="home-transformation-head" class="section__head section__head--wide">
    <h2 id="home-transformation-title" class="section-heading">${t('section.transformation')}</h2>
  </div>
  <div id="home-transformation-inner" class="transformation">
    <div id="home-transformation-list" class="transformation__list">
${join(items)}
    </div>
    <div id="home-transformation-stack" class="stack" aria-hidden="true">
      <div id="home-transformation-stack-field" class="field stack__field" data-magnet data-clip="stackField"><sa-node-field id="home-transformation-stack-nodes"></sa-node-field></div>
      <div id="home-transformation-planes" class="stack__planes">
        <div id="home-transformation-plane-1" class="plane plane--1"><div id="home-transformation-plane-1-cells" class="plane__quadrants">${cells('1', 4)}</div></div>
        <div id="home-transformation-plane-2" class="plane plane--2"><div id="home-transformation-plane-2-cells" class="plane__rows">${cells('2', 3)}</div></div>
        <div id="home-transformation-plane-3" class="plane plane--3"><div id="home-transformation-plane-3-cells" class="plane__grid">${cells('3', 9)}</div></div>
        <div id="home-transformation-plane-4" class="plane plane--4"><div id="home-transformation-plane-4-cells" class="plane__cells">${cells('4', 16)}</div></div>
${join(labels)}
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Van vraag tot werkende oplossing — five steps
 * ------------------------------------------------------------------ */

function approach(t) {
  const steps = STEPS.map(
    (n) => html`<div id="home-approach-step-${n}" class="step${n === '1' ? ' step--first' : ''}">
      <span id="home-approach-step-${n}-index" class="step__index" aria-hidden="true">${index(n)}</span>
      <h3 id="home-approach-step-${n}-title">${t(`step.${n}.title`)}</h3>
      <p id="home-approach-step-${n}-body">${t(`step.${n}.body`)}</p>
    </div>`
  );

  return html`<section class="section" id="approach" aria-labelledby="home-approach-title">
  <div id="home-approach-head" class="section__head section__head--wide">
    <h2 id="home-approach-title" class="section-heading">${t('section.approach')}</h2>
  </div>
  <div id="home-approach-steps" class="steps">
${join(steps)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Veelgestelde vragen — the same hairline rows every other list uses, with the
 * question in the title column and the answer in the body one.
 * ------------------------------------------------------------------ */

function faq(t) {
  const rows = FAQ.map(
    (key) => html`    <div id="home-faq-${key}" class="row">
      <h3 id="home-faq-${key}-question" class="row__title">${t(`faq.${key}.q`)}</h3>
      <p id="home-faq-${key}-answer" class="row__body">${t(`faq.${key}.a`)}</p>
    </div>`
  );

  return html`<section class="section" id="faq" aria-labelledby="home-faq-title">
  <div id="home-faq-head" class="section__head">
    <h2 id="home-faq-title" class="section-heading">${t('section.faq')}</h2>
  </div>
  <div id="home-faq-rows" class="rows">
${join(rows)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Inzichten — the one list on this page that carries pictures.
 *
 * The rows stay rows: a hairline list, not a grid of cards. A row is a
 * thumbnail, then the title with its excerpt directly underneath, then the date
 * and the category badges out at the row's right edge. The article therefore
 * reads as one block in one measure, the row stays about as tall as its
 * picture, and the meta anchors the row to the same right edge every other list
 * on this page runs to.
 *
 * Each thumbnail is a 16:9 crop, framed like the founder portraits on the team
 * page — hairline, card radius, and the same cool grade that pulls a
 * photograph, an illustration and a screenshot into one family. See
 * "Deviations from the design doc", item 5, in
 * .claude/skills/smartagents-design/README.md.
 * ------------------------------------------------------------------ */

function insights(t, lang) {
  const archive = insightsIndexPath(lang);

  return html`<section class="section section--orbits" id="insights" aria-labelledby="home-insights-heading">
${orbitRings('home-insights', 'orbits--insights', ['01', '02', '03', '04'])}
  <div id="home-insights-head" class="section__head">
    <h2 id="home-insights-heading" class="section-heading">${t('section.insights')}</h2>${archive
      ? html`
    <a id="home-insights-all" class="section-link" href="${archive}">${t('cta.allArticles')} <span id="home-insights-all-arrow" aria-hidden="true">&rarr;</span></a>`
      : ''}
  </div>
  <div id="home-insights-list" class="rows rows--cards">
${join(articleRows({ t, lang, prefix: 'home-insights' }))}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Contact
 * ------------------------------------------------------------------ */

function contact(t, lang) {
  return contactSection({
    t,
    lang,
    prefix: 'home',
    title: t('contact.title'),
    lede: t('contact.lede')
  });
}
