// The AI-native business processes page: the detail page behind the
// "AI-native businessprocessen" service row on the homepage. It is the offer
// for the business side of an organisation, not the engineering side, and it
// is three blocks: the hero, the engagement, and what the engagement leaves
// behind. The form closes it while the reader is still on that last list.
//
// The page is deliberately the deeper version of two things the site already
// sells. The training page teaches a class ("AI voor business teams") and the
// staffing page puts a coach beside a team ("Coaching voor business teams");
// this is the engagement that takes one real process end to end and leaves
// reusable workflows, skills and agents behind. Nothing here says that out
// loud — a page that compares itself to two other pages is a page about the
// price list. It says it by being concrete about the work instead.
// See .claude/skills/smartagents-design/README.md and element-ids/SKILL.md.
import { html, join } from '../../build/lib/html.mjs';
import { index, orbitRings } from '../layouts/base.mjs';
import { breadcrumbNode, homeStep, serviceNode } from '../layouts/schema.mjs';
import { contactSection } from '../components/contact-form/contact-form.mjs';

/**
 * The four phases of the engagement, in the order they run. They are a
 * sequence and not a menu — every engagement runs all four, which is why this
 * block borrows the homepage's `.steps` vocabulary (numbered, one rule per
 * step, the first one cyan) rather than the staffing page's accordion.
 */
const PHASES = [1, 2, 3, 4];

/**
 * What is left behind when the four phases are done. Three of them are the
 * artefacts the client names in that order — a workflow, a skill, an agent,
 * each one more autonomous than the last — and the fourth is the people, which
 * is the only one that decides whether the other three survive the quarter.
 */
const OUTCOMES = ['workflows', 'skills', 'agents', 'people'];

export const page = {
  id: 'processes',
  slugs: { nl: 'ai-native-processen', en: 'ai-native-processes', fr: 'processus-ai-native' },

  meta: (t) => ({
    title: t('processes.title'),
    description: t('processes.description')
  }),

  /* What this page is, for a machine: one `Service` provided by the company
     node every page carries, and the trail back to the language root. Both are
     read off the same keys the page prints, so the graph cannot describe an
     offer the page no longer makes. */
  schema: ({ t, lang, url }) => [
    serviceNode({ t, lang, url, key: 'processes' }),
    breadcrumbNode([homeStep(t, lang), { name: t('service.processes.title'), url }])
  ],

  render: ({ t, lang }) => {
    return html`<main id="main" tabindex="-1">

${hero(t)}
${phases(t)}
${outcome(t)}
${contact(t, lang)}

</main>`;
  }
};

/* ------------------------------------------------------------------ *
 * Hero — the shared page hero, carrying this page's own silhouette
 *
 * One shape and the paper beside it, which is the rule for every hero on the
 * site: the training page's petal, the staffing page's arch, this page's
 * terrace. It takes the box the petal would have taken (`.hero__field--right`)
 * and overrides nothing, because the composition does not need its own: there
 * is no tail running into the section below and no free-floating companion, so
 * the shared insets are the drawing.
 *
 * The silhouette is `processHero`, and it is the one shape on the site with a
 * straight line in it: a shoulder off the right edge bending to vertical, a
 * wall holding that vertical for a fifth of the box, a quarter turn onto a
 * level tread, and the tread running out to the bottom corner. Shoulder, wall,
 * step, sweep. The reasoning for the wall and the tread, and the round draft
 * they replaced, are in `clipDefs()`.
 *
 * The pull is gentler than the petal's: amplitude 52 against 86. A leaf swells
 * under a big amplitude and a shape with knees folds — at the petal's numbers
 * this one squared off into a flat shelf under the cursor, which is the one
 * thing a drawn outline may not do.
 *
 * `data-magnet-pin="right"` welds it to the page edge it hangs from, which is
 * what lets it opt out of the nav guard: a cursor up under the header gets a
 * swell that fades to nothing before it can peel the shape off the edge.
 * ------------------------------------------------------------------ */

function hero(t) {
  return html`<section id="processes-hero" class="hero hero--page">
${orbitRings('processes-hero')}
  <div id="processes-hero-field-slot-right" class="field-slot hero__field hero__field--right" aria-hidden="true">
    <div id="processes-hero-field-right" class="field" data-magnet data-magnet-free data-magnet-pin="right" data-magnet-points="460" data-magnet-amp="52" data-magnet-sigma="104" data-clip="processHero"><sa-node-field id="processes-hero-nodes-right"></sa-node-field></div>
  </div>
  <div id="processes-hero-inner" class="hero__inner">
    <div id="processes-hero-text" class="hero__text">
      <p id="processes-hero-eyebrow" class="page-eyebrow">${t('processes.hero.eyebrow')}</p>
      <h1 id="processes-hero-title">${t('processes.hero.title')}</h1>
      <div id="processes-hero-actions" class="hero__actions">
        <a id="processes-hero-cta-talk" class="btn btn--primary" href="#contact">${t('cta.talk')}</a>
        <a id="processes-hero-cta-phases" class="btn btn--ghost" href="#phases">${t('processes.cta.phases')} <span id="processes-hero-cta-phases-arrow" aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Hoe een traject verloopt — the four phases
 *
 * The one figure on the page, and it is a sequence rather than a panel: an
 * engagement runs all four phases in order, so there is nothing for a reader
 * to pick between and nothing to open. That is the homepage's `.steps`
 * vocabulary exactly — a rule along the top of each step with its dot sitting
 * on it, a monospace index, and the first rule in cyan so the reading order is
 * unambiguous — and it is reused here rather than redrawn. The only thing this
 * page adds is `.steps--four`: five columns with four steps in them leaves a
 * column of paper at the end of the row.
 *
 * The lede under the heading carries the one thing the four titles cannot say
 * on their own: that the review starts from the work that already exists, and
 * that "AI adds nothing here" is part of the answer we come back with. It is
 * the same register as `step.1.body` on the homepage, which is where the site
 * says this first.
 * ------------------------------------------------------------------ */

function phases(t) {
  const steps = PHASES.map((n) => {
    const id = `processes-phase-${index(n)}`;

    return html`    <div id="${id}" class="step${n === 1 ? ' step--first' : ''}">
      <span id="${id}-index" class="step__index" aria-hidden="true">${index(n)}</span>
      <h3 id="${id}-title">${t(`processes.phase.${index(n)}.title`)}</h3>
      <p id="${id}-body">${t(`processes.phase.${index(n)}.body`)}</p>
    </div>`;
  });

  return html`<section id="phases" class="section" aria-labelledby="processes-phases-title">
  <div id="processes-phases-head" class="section__head">
    <h2 id="processes-phases-title" class="section-heading">${t('processes.phases.title')}</h2>
  </div>
  <p id="processes-phases-lede" class="section-lede">${t('processes.phases.lede')}</p>
  <div id="processes-phases-steps" class="steps steps--four">
${join(steps)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Wat u overhoudt — the four things the engagement leaves behind
 *
 * A hairline list, not cards and not a second sequence: these are four things
 * that exist at the same time when the engagement ends, and the row idiom is
 * what the site uses for exactly that. It is the training page's benefit list
 * with a different argument in it.
 *
 * No dark shape. A second one was drawn for the left gutter here, on the model
 * of the AI staffing page's leaf, and it was wrong for a reason worth writing
 * down: the leaf works because the track panel beside it is opaque and clips
 * it, so its right contour is never shown and the panel edge hands it a crisp
 * counter-edge. A hairline list has no such wall. The same shape beside it has
 * to carry its own contour, and a silhouette 78px wide and 546px tall does not
 * have the width to draw one — it read as a smear against the rows, and under
 * the cursor it reached past the row padding onto the first word. The hero
 * carries this page's dark field on its own, and the paper is the
 * counterweight.
 * ------------------------------------------------------------------ */

function outcome(t) {
  const rows = OUTCOMES.map((key) => {
    const id = `processes-outcome-row-${key}`;

    return html`      <div id="${id}" class="row">
        <span id="${id}-title" class="row__title">${t(`processes.outcome.${key}.title`)}</span>
        <span id="${id}-body" class="row__body">${t(`processes.outcome.${key}.body`)}</span>
      </div>`;
  });

  return html`<section id="processes-outcome" class="section" aria-labelledby="processes-outcome-title">
  <div id="processes-outcome-head" class="section__head">
    <h2 id="processes-outcome-title" class="section-heading">${t('processes.outcome.title')}</h2>
  </div>
  <div id="processes-outcome-rows" class="rows">
${join(rows)}
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
    prefix: 'processes',
    title: t('processes.cta.title'),
    lede: t('processes.cta.body')
  });
}
