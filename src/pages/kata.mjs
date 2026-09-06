// The agentic engineering kata: the detail page behind the "Agentic engineering"
// course on the training page. It is the first page on the site that sits under
// another one — `/nl/training/agentic-engineering-kata/` — because it is not a
// fifth service, it is one of the two courses the training page lists, opened up.
//
// The training page answers "what do you run and for whom". This page answers
// the four questions that stop a reader from booking: what happens on the day,
// what is left afterwards, what has to be brought, and what it costs in time and
// people. So it opens on the spec strip rather than on an argument — a reader
// who arrives here has already read the argument one page up — and closes on the
// requirements, which is the last thing anyone checks before saying yes.
//
// Nothing on the page names a language or a build tool. The exercises do run on
// one stack, and the page says so once, in `kata.requirement.stack.body`, where
// it belongs: a reader deciding whether their team qualifies. Putting it in the
// headline or the day programme turns a one-day course about a way of working
// into a course about a language, and the way of working is the thing that
// travels.
// See .claude/skills/smartagents-design/README.md and element-ids/SKILL.md.
import { html, join } from '../../build/lib/html.mjs';
import { pagePath } from '../../build/lib/i18n.mjs';
import { index, orbitRings, servicePath } from '../layouts/base.mjs';
import { ficheKilobytes } from './fiche.mjs';
import { breadcrumbNode, courseNode, homeStep } from '../layouts/schema.mjs';
import { contactSection } from '../components/contact-form/contact-form.mjs';

/** The four hard facts, in the order a reader checks them. */
const SPEC = ['duration', 'group', 'location', 'language'];

/** What is in the box, printed in the practice block's hairline band. Six,
    because `.tour__tags-list` is three rows of two — a seventh would open a
    fourth row on the desk and leave the second column of it empty. */
const CONTAINS = ['material', 'slides', 'quizzes', 'flags', 'project', 'workshops'];

/**
 * The six themes of the day, in the order they are met.
 *
 * Also what `Course.teaches` says in the graph — `KATA_THEMES` in
 * `src/layouts/schema.mjs` is the same list, keyed the same way, so the machine
 * reading the page and the person reading it are told the same six things.
 */
const THEMES = ['truth', 'workflow', 'cost', 'setup', 'parallel', 'team'];

/**
 * The four steps of the curriculum, and the numbers are the course's own: it
 * counts from `step0`, so the index printed beside the first row is `00` rather
 * than `01`. Every other numbered list on the site starts at one; this one is
 * naming folders a participant will open, and renumbering them here would put
 * the page and the repository one apart for the whole day.
 *
 * They replaced four "ochtend / namiddag" blocks read off the marketing page,
 * which said when a thing happened and never what it was. A step's own units
 * are printed under it, in the order the course walks them.
 */
const STEPS = ['00', '01', '02', '03'];

/** What a participant has to bring, in the order it is checked. */
const REQUIREMENTS = ['knowledge', 'tools', 'stack'];

/**
 * This course's one-pager, in `/media/`. Named here rather than in the training
 * page's `COURSES` list because the course owns it and both pages link it, and
 * because `training.mjs` already imports this module — the other direction would
 * close a cycle.
 */
export const FICHE = 'SmartAgents_Agentic_Engineering_Onepager.pdf';

/**
 * The tour, copied into dist/media/ by build/render.mjs (`PROMO_MEDIA`).
 * Exported because the training page shows the same file one level up, and a
 * path written down twice is a path that goes stale in one of the two places.
 */
export const KATA_VIDEO = '/media/kata-agentic-engineering.mp4';
export const KATA_POSTER = '/media/kata-agentic-engineering-poster.jpg';

export const page = {
  id: 'training-kata',

  /* Under the training page's own slug in every language, so the URL says what
     the breadcrumb says: this is part of the training offer, not beside it. It
     is the first page on the site whose slug has a slash in it, which nothing in
     the build minds — `pagePath` trims and rejoins, and the generated routing
     table only ever names the top-level entries of `dist/`.
     The parent segment is written out rather than read off `training.mjs`,
     because that page imports `kataPath` back and the pair would close a cycle;
     the same reason `PHONE_HREF` is repeated in the privacy body. Rename the
     training slug and this has to move with it — `check-dist.mjs` fails the
     build on the broken link if it does not. */
  slugs: {
    nl: 'training/agentic-engineering-kata',
    en: 'training/agentic-engineering-kata',
    fr: 'formation/kata-agentic-engineering'
  },

  meta: (t) => ({
    title: t('kata.title'),
    description: t('kata.description')
  }),

  /* What this page is, for a machine: one `Course` provided by the company node
     every page carries, and a three-step trail, because this page has a parent
     that is not the language root. Both are read off the same keys the page
     prints. */
  schema: ({ t, lang, url }) => [
    courseNode({ t, url, key: 'kata', themes: THEMES }),
    breadcrumbNode([
      homeStep(t, lang),
      { name: t('service.training.title'), url: servicePath('training', lang) },
      { name: t('kata.hero.title'), url }
    ])
  ],

  render: ({ t, lang }) => {
    return html`<main id="main" tabindex="-1">

${hero(t)}
${spec(t)}
${tour(t)}
${day(t)}
${themes(t)}
${practice(t)}
${requirements(t, lang)}
${contact(t, lang)}

</main>`;
  }
};

/* ------------------------------------------------------------------ *
 * Hero — the training page's hero, shape and all
 *
 * The petal, not a silhouette of its own. Every other detail page on the site
 * hangs off a service row and draws its own shape to say it is a different
 * offer; this one hangs off a course inside the training page and is the same
 * offer, read closer. The reader arrives here from the petal and should land on
 * it — a new silhouette would say "another service" in the one place the page
 * is trying to say "the same one, in detail".
 * ------------------------------------------------------------------ */

function hero(t) {
  return html`<section id="kata-hero" class="hero hero--page">
${orbitRings('kata-hero')}
  <div id="kata-hero-field-slot-right" class="field-slot hero__field hero__field--right" aria-hidden="true">
    <div id="kata-hero-field-right" class="field" data-magnet data-magnet-free data-magnet-pin="right" data-magnet-points="480" data-magnet-amp="86" data-magnet-sigma="118" data-clip="heroPetal"><sa-node-field id="kata-hero-nodes-right"></sa-node-field></div>
  </div>
  <div id="kata-hero-inner" class="hero__inner">
    <div id="kata-hero-text" class="hero__text">
      <p id="kata-hero-eyebrow" class="page-eyebrow">${t('kata.hero.eyebrow')}</p>
      <h1 id="kata-hero-title">${t('kata.hero.title')}</h1>
      <div id="kata-hero-actions" class="hero__actions">
        <a id="kata-hero-cta-talk" class="btn btn--primary" href="#contact">${t('cta.talk')}</a>
        <a id="kata-hero-cta-day" class="btn btn--ghost" href="#kata-day">${t('kata.cta.day')} <span id="kata-hero-cta-day-arrow" aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * The spec strip — four facts on the rule under the hero
 *
 * A day, a group size, a place and two languages, before a word of argument. It
 * is the block that separates this page from the training page one level up:
 * that page sells the idea and quotes nothing hard, and every enquiry it
 * produced started with the same four questions. They are a `<dl>` because that
 * is what they are, and each pair carries its own top hairline rather than the
 * strip carrying one, so the rules stay right when the four wrap to two columns
 * and then to one without a media query per shape.
 *
 * Not in the hero: the hero's copy column is 52% of the page and four facts in
 * half a page is four narrow columns of wrapped type.
 *
 * The section carries no `aria-label`, deliberately. Named, it becomes a
 * landmark, and the only name it has is the page's — so a screen reader's
 * landmark list said "De agentic engineering kata" twice, once for the region
 * and once for the `h1` 200px above it. Unnamed, a `<section>` is not exposed as
 * a region at all, which is right for four facts.
 * ------------------------------------------------------------------ */

function spec(t) {
  const items = SPEC.map(
    (key) => html`      <div id="kata-spec-${key}" class="spec__item">
        <dt id="kata-spec-${key}-label">${t(`kata.spec.${key}.label`)}</dt>
        <dd id="kata-spec-${key}-value">${t(`kata.spec.${key}.value`)}</dd>
      </div>`
  );

  return html`<section id="kata-spec" class="spec-band">
    <dl id="kata-spec-list" class="spec">
${join(items)}
    </dl>
  </section>`;
}

/* ------------------------------------------------------------------ *
 * Wat de kata is — the copy beside the tour
 *
 * The same two-column block the training page closes on, and the same eighty
 * seconds of video, which is the one thing on this page that is deliberately
 * said twice on the site. The training page shows the tour to illustrate how a
 * course runs in general; here it is the course itself, and a reader who lands
 * on this page from a search never saw the other one. Two framings, one file,
 * and it costs nothing on the wire: `preload="none"`, the poster is the only
 * byte fetched until someone presses play.
 *
 * There is no caption. One was drafted twice — in `.tour__meta` beside the copy,
 * where it read as a specification of the course and ended up 400px from the
 * video below 940px, then under the video itself — and it went at the client's
 * call: the section is already titled and the two paragraphs beside the frame
 * say what the tour shows, so a third line restating it is a caption for a
 * figure that was never unclear.
 *
 * No dark shape flanks it. The training page's dome and stone are struck off
 * the split between its two courses and the rule its offer closes on, neither
 * of which exists here, and a shape hung at those coordinates on this page
 * would be an ornament rather than a thing standing on something.
 * ------------------------------------------------------------------ */

function tour(t) {
  return html`<section id="kata-tour" class="section" aria-labelledby="kata-tour-title">
  <div id="kata-tour-head" class="section__head">
    <h2 id="kata-tour-title" class="section-heading">${t('kata.tour.title')}</h2>
  </div>
  <div id="kata-tour-inner" class="tour">
    <div id="kata-tour-copy" class="tour__copy">
      <p id="kata-tour-body" class="tour__body">${t('kata.tour.body')}</p>
      <p id="kata-tour-accents" class="tour__body tour__body--follow">${t('kata.tour.accents')}</p>
    </div>
    <div id="kata-tour-media" class="video-block">
      <sa-lazy-video id="kata-tour-video" class="video-frame">
        <video id="kata-tour-video-el" controls playsinline preload="none" poster="${KATA_POSTER}" aria-label="${t('kata.tour.videoLabel')}">
          <source id="kata-tour-video-source" type="video/mp4" data-src="${KATA_VIDEO}">
        </video>
      </sa-lazy-video>
      <noscript id="kata-tour-video-noscript"><a id="kata-tour-video-fallback" class="video-block__fallback" href="${KATA_VIDEO}">${t('kata.tour.fallback')}</a></noscript>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Hoe uw dag verloopt — the four steps of the curriculum
 *
 * Numbered, unlike the themes below it, and numbered for the reason the site
 * numbers anything: these are met in this order and one does not work without
 * the one before it. It is also what keeps the two lists apart — four hairline
 * rows followed by six more of the same shape read as one list interrupted by a
 * heading.
 *
 * The indexes are the course's own folder numbers and start at `00`, which is
 * the only numbered list on the site that does not start at one. It is worth
 * the oddity: a participant opens `step0` on the day, and a page that renumbers
 * the curriculum to look tidier is a page they have to translate all day.
 *
 * Each step prints its own units under the paragraph, in course order and in
 * the micro size, because that is the level of detail a technical lead is
 * actually deciding on. It is one line of text rather than a nested list: ten
 * `<li>`s under a row would make the block a table of contents, and this is a
 * page selling a day, not the course's own navigation.
 *
 * **Course order is the registry's order, not a tidy one.** `front/src/steps/
 * step1/index.tsx` puts `prompt` and `tools` ahead of `context`, deliberately —
 * the two layers a student writes and reads for themselves come first — and the
 * first draft of this line reordered them into something that looked more
 * logical and dropped `recap` for length. A participant then reads a programme
 * that does not match the day. Check the four registries, not the four locale
 * files, when this line changes.
 *
 * The titles are `h3`s rather than the `div` `.numbered__title` also takes on
 * the AI-native SDLC page: this is the page's programme and the thing the
 * hero's second button points at, so it is worth being able to jump through.
 * `.numbered__title` styles either, so nothing moves.
 * ------------------------------------------------------------------ */

function day(t) {
  const items = STEPS.map((key) => {
    const id = `kata-step-${key}`;

    // Each unit is its own unbreakable chunk, carrying the separator that
    // follows it. A unit name is two or three words and the line runs ten of
    // them, so left as one string the browser broke inside a name — "Het" at
    // the end of one line and "model" at the start of the next — and stranded a
    // separator at the end of every wrapped line besides. Same reasoning as the
    // footer's legal microline, and the opposite conclusion about the character:
    // there the separator went, because the gap alone reads as a list of facts;
    // here the items are prose phrases and would run together without one, so
    // it stays and is welded to the item in front of it instead.
    const units = t(`kata.step.${key}.units`).split(' · ');
    const chunks = units.map(
      (unit, i) => html`<span id="${id}-unit-${index(i + 1)}" class="numbered__unit">${unit}${i < units.length - 1 ? ' ·' : ''}</span>`
    );

    return html`    <div id="${id}" class="numbered">
      <span id="${id}-index" class="numbered__index" aria-hidden="true">${key}</span>
      <div id="${id}-copy">
        <h3 id="${id}-title" class="numbered__title">${t(`kata.step.${key}.title`)}</h3>
        <p id="${id}-body">${t(`kata.step.${key}.body`)}</p>
        <p id="${id}-units" class="numbered__units">${join(chunks, ' ')}</p>
      </div>
    </div>`;
  });

  return html`<section id="kata-day" class="section" aria-labelledby="kata-day-title">
  <div id="kata-day-head" class="section__head">
    <h2 id="kata-day-title" class="section-heading">${t('kata.day.title')}</h2>
  </div>
  <p id="kata-day-lede" class="section-lede">${t('kata.day.lede')}</p>
  <div id="kata-day-rows" class="rows">
${join(items)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Wat blijft hangen — what the day is about
 *
 * Hairline rows, two abreast on a tablet. One word as the title and one
 * sentence as the body: these are the things a participant should still be able
 * to name a week later, so each is given a name short enough to be remembered
 * rather than a heading that describes it.
 *
 * **Nothing on this page announces how many of anything there are.** The
 * heading was "Zes thema's" and the lede opened "Zes dingen die…", the day's
 * lede opened "Vier stappen…", and the practice lede counted "drie van de
 * vier". A count in a heading is a promise about length rather than about
 * content, it dates the moment a seventh theme or a fifth step arrives, and the
 * reader can see how many there are. Say what the block is; let the rows do the
 * counting.
 * ------------------------------------------------------------------ */

function themes(t) {
  const rows = THEMES.map((key) => {
    const id = `kata-theme-${key}`;

    return html`    <div id="${id}" class="row">
      <span id="${id}-title" class="row__title">${t(`kata.theme.${key}.title`)}</span>
      <span id="${id}-body" class="row__body">${t(`kata.theme.${key}.body`)}</span>
    </div>`;
  });

  return html`<section id="kata-themes" class="section" aria-labelledby="kata-themes-title">
  <div id="kata-themes-head" class="section__head">
    <h2 id="kata-themes-title" class="section-heading">${t('kata.themes.title')}</h2>
  </div>
  <p id="kata-themes-lede" class="section-lede">${t('kata.themes.lede')}</p>
  <div id="kata-themes-rows" class="rows rows--pair">
${join(rows)}
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Hoe u oefent — the exercises, and what is in the box
 *
 * The block that answers the question a technical buyer asks after "what is on
 * the programme": what do my people actually *do* all day. It is a paragraph
 * beside a band rather than a list, which is the third shape on this page after
 * the two-column tour and the numbered steps, and it is why the six-row themes
 * above it and the three-row requirements below it do not read as one list.
 *
 * The band is the tour's own `.tour__tags`, used outside `.tour`. Nothing in
 * that rule is a descendant selector, so it travels; it is a titled hairline
 * band holding short items in three rows of two, which is exactly what six
 * one-word deliverables want. Both halves are capped at the reading measure, so
 * stacked they leave most of the page bare — `.practice` is the two-column grid
 * that puts them beside each other instead.
 * ------------------------------------------------------------------ */

function practice(t) {
  const tags = CONTAINS.map(
    (key) => html`      <li id="kata-practice-tag-${key}" class="tour__tags-item">${t(`kata.practice.tags.${key}`)}</li>`
  );

  return html`<section id="kata-practice" class="section" aria-labelledby="kata-practice-title">
  <div id="kata-practice-head" class="section__head">
    <h2 id="kata-practice-title" class="section-heading">${t('kata.practice.title')}</h2>
  </div>
  <div id="kata-practice-inner" class="practice">
    <p id="kata-practice-lede" class="tour__body">${t('kata.practice.lede')}</p>
    <div id="kata-practice-tags" class="tour__tags">
      <p id="kata-practice-tags-title" class="tour__tags-title">${t('kata.practice.tags.title')}</p>
      <ul id="kata-practice-tags-list" class="tour__tags-list">
${join(tags)}
      </ul>
    </div>
  </div>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Wat u meebrengt — the three practical conditions
 *
 * The closing block before the form, and the shortest one on the page: three
 * lines that let a reader rule themselves in or out. `.section--close`, because
 * a heading and three rows at the full section rhythm read as a half-empty
 * screen.
 *
 * It carries the page's two exits, in the wrapper the training page's course
 * columns use. The one-pager was reachable from the training page and from
 * nowhere else, so a reader arriving here from a search — this page is in the
 * sitemap and in `llms.txt` — could not get it, and had no way back up to the
 * offer except the nav bar. Both are `.offer-course__fiche`: it is a standalone
 * rule, not a descendant of `.offer-course`, and it is the site's one style for
 * a link that leaves the page sideways rather than into the form.
 * ------------------------------------------------------------------ */

function requirements(t, lang) {
  const rows = REQUIREMENTS.map((key) => {
    const id = `kata-requirement-${key}`;

    return html`    <div id="${id}" class="row">
      <span id="${id}-title" class="row__title">${t(`kata.requirement.${key}.title`)}</span>
      <span id="${id}-body" class="row__body">${t(`kata.requirement.${key}.body`)}</span>
    </div>`;
  });

  return html`<section id="kata-requirements" class="section section--close" aria-labelledby="kata-requirements-title">
  <div id="kata-requirements-head" class="section__head">
    <h2 id="kata-requirements-title" class="section-heading">${t('kata.requirements.title')}</h2>
  </div>
  <div id="kata-requirements-rows" class="rows">
${join(rows)}
  </div>
  <p id="kata-requirements-links" class="offer-course__links">
    <a id="kata-requirements-fiche" class="offer-course__fiche" href="/media/${FICHE}" type="application/pdf">${t('training.download')} <span id="kata-requirements-fiche-size" class="offer-course__fiche-size">(PDF, ${ficheKilobytes(FICHE)} kB)</span> <span id="kata-requirements-fiche-arrow" aria-hidden="true">&rarr;</span></a>
    <a id="kata-requirements-offer" class="offer-course__fiche" href="${servicePath('training', lang)}">${t('kata.cta.offer')} <span id="kata-requirements-offer-arrow" aria-hidden="true">&rarr;</span></a>
  </p>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Contact — the shared form, with the two lines this page phrases for itself.
 * ------------------------------------------------------------------ */

function contact(t, lang) {
  return contactSection({
    t,
    lang,
    prefix: 'kata',
    title: t('kata.cta.title'),
    lede: t('kata.cta.body')
  });
}

/**
 * URL of this page in `lang`, for the course column on the training page that
 * links down to it. Exported here rather than resolved there, so the slug is
 * named in exactly one place.
 */
export function kataPath(lang) {
  const slug = page.slugs[lang];
  return slug === undefined ? null : pagePath(lang, slug);
}
