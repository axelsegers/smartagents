# CLAUDE.md - Agent Entry Point

Pre-rendered static site, no backend, no framework. The public site is the
redesigned homepage, five detail pages — training, AI staffing and coaching,
the AI-native SDLC, AI-native businessprocessen, and team — the privacy notice,
the "Inzichten" index and the four articles under it (NL / EN / FR); the
password-gated `/secured/` area (internal documents and pitch decks) is live.

## Skills — read these first

Six of the skills in `.claude/skills/` define the architecture, the look and the
markup conventions. They are the source of truth; this file only records how
they are applied here.

- **`fast-static-site`** — the foundation. Pre-rendered HTML, Vite, critical CSS,
  caching, service worker, budgets.
- **`static-i18n`** — one HTML file per page per language, decided at build time.
- **`webcomponent-mpa-spa`** — web components and the layers that make an MPA
  feel like an SPA.
- **`smartagents-design`** — the brand: tokens, type, the dark field, motion,
  tone of voice. Read its `README.md` before touching anything visual.
- **`element-ids`** — every element rendered inside `<body>` carries a unique,
  language-independent `id` so any part of a page can be named exactly. Read it
  before writing or editing markup.
- **`new-presentation`** — the decks under `/secured/presentations/`: the seven
  slide archetypes, the shared slide vocabulary, and the copy rules. Read it
  before adding a deck or a slide.

## Quick Commands

- **Build**: `npm run build` (Vite → `build/render.mjs` → `scripts/check-dist.mjs`)
- **Dev**: `npm run dev` — builds, serves `dist/` on :8000, then watches `src/`,
  `build/`, `public/` and `vite.config.js`. A save rebuilds (~0.8s) and reloads
  the open page over SSE, keeping scroll position; a failed build shows the
  error as a banner in the browser. `scripts/live-reload.mjs` injects that
  client into HTML responses only when the server runs with `--watch`, so
  `npm run serve` still serves `dist/` exactly as it deploys.
- **Agents**: `npm run ai` — the entry point for an agent that needs the site
  running (Playwright, a screenshot, a curl). It builds and serves `dist/` on
  **:8001**, so it never fights the human's `npm run dev` on :8000, and it is
  the only port an agent should start or assume. Start it in the background and
  leave it up; a second call while it is already serving prints
  `Already serving ... reusing it.` and exits 0, so it is safe to run at the top
  of any session. There is no watcher on it, deliberately: an agent that edits a
  file runs `npm run build` itself and knows the rebuild finished before it
  looks, where a watcher would race the screenshot. Nothing is injected into the
  HTML either, unlike `npm run dev`, so what the browser sees is what deploys.
  `--port=` and `--reuse` on `scripts/start-local.mjs` are what make this one
  script serve all three cases.
- **Deck PDFs**: `npm run export:pdfs` (needs a current `dist/`)

## Deployment

Cloudflare Pages, wired to the GitHub repo. There is no workflow file and never
has been: Pages clones the branch, runs `npm ci` then `npm run build`, and
publishes `dist/`. `main` is production, every other branch gets a preview URL.
Nothing here is a GitHub Action, so a green local build is the only signal.

- **`wrangler.toml` is the deployment config, not the dashboard.** Once a Pages
  project has one, Cloudflare reads `pages_build_output_dir`, bindings and
  `[vars]` from it and ignores the dashboard equivalents. Secrets
  (`TURNSTILE_SECRET_KEY`, `N8N_SHARED_SECRET`, `EXPORT_PASSWORD`,
  `EXPORT_SESSION_SECRET`) stay dashboard-managed; a binding a Function needs at
  runtime belongs in the file. `functions/api/README.md` records one that is
  still missing.
- **Build-time variables are separate.** `TURNSTILE_SITE_KEY` and `SITE_ORIGIN`
  are read by `build/lib/config.mjs` and `build/lib/i18n.mjs` while the site
  renders, so they are ordinary Pages build settings and `wrangler.toml` does not
  touch them. Both have fallbacks, so a missing one changes the output instead of
  failing the build: no site key means the contact form keeps its `mailto:`
  fallback.
- **Node is pinned in `.nvmrc` (22.14.0), mirrored by `engines` in
  `package.json`.** Vite 7 needs `^20.19 || >=22.12` and the Pages build image
  defaults to a much older Node, so the pin is what keeps the build alive.
- **The toolchain is a devDependency.** A build environment with
  `NODE_ENV=production` makes `npm ci` skip it; `scripts/build-site.mjs` checks
  for `vite` up front and says so rather than exiting silently.
- **`dist/.vite/` is scaffolding.** `render.mjs` reads the manifest from it, then
  `build-site.mjs` deletes the directory before `check-dist.mjs` runs, so it
  never ships. Both validators already skip dot-entries at the root of `dist/`.
- **`functions/` is picked up from the repo root**, not from `dist/`. Cloudflare
  derives the routes from the file tree, which is why there is no `_routes.json`.

## Tech Stack

- **Templating**: `build/lib/html.mjs` — a tagged template literal that escapes
  interpolations. No template engine, no client-side templating runtime.
  (Eleventy and Nunjucks were removed; there is no `.njk` left in the repo.)

## Key Patterns

- **Language is a build-time decision.** Public URLs are `/{lang}/{slug}/`; an
  unprefixed URL resolves to Dutch, the first entry in `languages` and therefore
  the default. A page module declares `slugs: { nl, en, fr }`; omit a language to
  exclude the page from it. Missing translation keys fail the build.
- **The routing table is generated.** `public/_redirects` holds the rules a human
  wrote. `build/render.mjs` wraps them with a pass-through rule for every
  top-level entry in `dist/` and, on the last line, the catch-all that sends an
  unprefixed URL to the default language: `/training/` lands on `/nl/training/`.
  A redirect is followed whether or not an asset matches it, so anything without
  a rule above the catch-all stops being reachable; `check-dist.mjs` fails the
  build when that happens. A directory needs two rules, not one: `/secured/*`
  does not match `/secured`, so every top-level directory also gets the
  trailing-slash redirect (`/secured /secured/ 301`) a static host would have
  issued itself. Without it the bare name reached the catch-all and `/secured`
  — the URL people actually type, and the one that has to arrive at the Pages
  Function guarding `/secured/*` — was sent to `/nl/secured`, which is nothing.
  `scripts/start-local.mjs` reads `dist/_redirects` too, so dev routes like
  production. Nothing negotiates on `Accept-Language`.
- **Pages are functions.** A page module exports `{ id, slugs, meta(t), render(ctx) }`
  and returns markup from the `html` tag. Never hard-code visible text: use `t()`.
- **An insight is a page generated from a list.** `src/pages/insights/insights.mjs`
  holds `INSIGHTS` — one entry per article, with its per-language slug under that
  language's own word for the section (`inzichten/` · `insights/` · `analyses/`)
  — and turns each entry into a page module, so `build/render.mjs` spreads
  `insightPages` into `PAGES` and the homepage builds its rows from the same
  list. That word for the section is also a page of its own: `indexPage` in the
  same file is the archive at `/nl/inzichten/`, the parent directory of every
  article slug, and the homepage section and the index print the same rows from
  the same `articleRows()` so the two can never disagree. It is what the rail's
  "Alle artikelen →" points at and what `navHref('insights')` resolves to; both
  used to point at the homepage's `#insights` anchor because there was nowhere
  else to go. Adding an article means adding an entry there plus a body module beside
  it; nothing else has to be told. Title, excerpt, date, alt text and tag labels
  come from the shared `article.*` keys the homepage row already prints, so the
  list and the page it opens can never disagree. Only the long-form body lives
  outside `src/i18n`: `prose.mjs` gives it four block types (`p`, `h2`, `quote`,
  `list`) as tagged template literals — which is what lets a Dutch or French
  sentence carry its apostrophes unescaped — and two inline marks, `**bold**` and
  `[label](href)`. A href of `insight:<key>` resolves to that article in the
  language being rendered, which is the only way a cross-article link stays
  correct in three languages. The copy itself is the client's, ported verbatim
  from the Eleventy blog on `main` under `blog/posts/`. These are the only public
  pages with no hero and no dark shape: they open on the headline at the reading
  measure, with the other three articles in a rail beside the body. See
  "Deviations from the design doc", item 7, in the `smartagents-design` README.
- **Every page states itself twice: once for a reader and once for a machine.**
  `src/layouts/base.mjs` emits one `<script type="application/ld+json">` per
  page, and `src/layouts/schema.mjs` is where the nodes are built. Two of them
  are on every page — the `Organization` and the `WebSite`, both with a stable
  `@id` on the origin so everything else refers to them rather than restating
  them — and a page module adds its own by exporting `schema({ t, lang, url })`:
  a `Service` on each of the four service pages, a `BlogPosting` on each
  article, two `Person` nodes on the team page, a `Blog` on the insights index,
  an `FAQPage` on the homepage, and a `BreadcrumbList` on everything below the
  homepage. The one rule is that nothing in the graph may say something the page
  does not; every node is read off the same `t()` keys the visible page is, so a
  claim cannot outlive the sentence it was made from. `meta()` carries the other
  half of the head: `ogImage` overrides the brand share card (an article uses
  its own thumbnail) and `article` turns `og:type` into `article` and prints the
  published date the body only had as a `<time datetime>`.
- **The two raster brand images are generated, not exported.**
  `public/media/og-default.png` (1200x630, the default share card) and
  `public/media/smartagents-mark.png` (512x512, what `Organization.logo` points
  at) are drawn by `node scripts/make-social-images.mjs` from the same tokens
  and the same logo mark the site uses, in headless Chrome. It is not part of
  `npm run build`, for the reason `check:slides` is not: it needs a browser and
  the Pages build image has none. Both files are committed. Run it again when
  the wordmark, the claim or the dark field change.
- **`robots.txt` and `llms.txt` are generated too.** `renderSitemap()` writes a
  robots file that names every major AI crawler explicitly rather than leaving
  them to the wildcard — the wire result is the same, but for a company selling
  AI expertise "nobody decided" is not a policy — and `renderLlmsTxt()` writes
  the site in one page, in the default language, from the same page modules and
  string files the site is built from.
- **Decks are data.** Each deck is `deck.json` plus `slides/*.html` fragments.
  The `<!--chrome 05/10-->` marker expands to the slide footer at render time.
  Adding a deck means adding a folder; discovery is automatic. The look lives in
  `presentations/shared/slide.css`, one stylesheet for every deck, listed in a
  deck's `deck.json` under `styles`. It is the `Slide Template` design canvas
  turned into classes, and it is what makes a deck's own `deck.css` empty: the
  ten decks that predate it each carried a thousand-plus lines copied from the
  deck before, which is the drift it exists to end. Seven are empty now; the
  other three keep one figure each, listed in the skill. The eight archetypes,
  the ready markup for each and the rules that keep them on brand are in the
  `new-presentation` skill. Note that `check-dist.mjs` fails on an unexpanded
  chrome marker anywhere in `dist/`, comments in a stylesheet included.
  `npm run check:slides` is the other half: it opens every deck in headless
  Chrome and measures each slide, because a slide with a line too many is
  clipped by the stage's `overflow: hidden` and nothing static can see that.
- **The privacy notice is the article layout, rail and all.** It has no hero,
  for the reason the insights have none: a 540px navy shape between the header
  and the first paragraph is a screen to scroll past before reading. What it
  does have is the rail, and what is in the rail is not a "read next" — there is
  no next from a legal notice — but the notice's own clauses. That is the one
  piece of navigation a legal page needs (nobody reads a privacy statement end
  to end; they arrive wanting one thing) and it is what answers the page's real
  problem: without it the notice was a 1022px column of GDPR prose, 133
  characters to the line and the longest measure on the site, with 354px of
  empty paper beside it for four fifths of its height — the "single column with
  the rest of the band empty" the design README refuses at page scale. The list
  is generated from the same array `prose()` renders and derives its anchors the
  same way, so a heading added to `body.mjs` appears in the index with no second
  edit and the two can never name different ids. It is a `<nav>`, not the
  article's `<aside>`: eight in-page links whose whole purpose is navigation do
  not belong in a `complementary` landmark. It is also **first in the DOM** and
  put back on the right by `order` on a desk — an index belongs before the thing
  it indexes, and the other way round a phone's tab order ran through the whole
  notice before reaching the index sitting under the headline. Seven things are
  load-bearing, each with its rule in main.css under `.notice`:
  - **There is no dark shape on this page**, and it is the only page on the
    public site with a `.section--orbits` and no silhouette. Two were drawn and
    both are gone — a crest in the air beside the head, through three drafts,
    and a mirrored close standing on the footer's hairline. What the drafts
    taught is kept in item 11 of the design README even though the shapes are
    not, because every one of the three failures is a failure a new silhouette
    can repeat. The rings are the whole of the brand here.
  - **The rings stick.** `.orbits--notice` is the one orbit set on the site that
    is not nailed to its section: the origin is `position: sticky` at `top: 50vh`
    and the arcs hold the right flank the whole way down, because the outermost
    ring is 845px in radius against a 2820px section and an origin nailed
    anywhere in it leaves a third of the page with no ground under it. Its
    `top` is **clamped** (`clamp(380px, 50vh, 520px)`) and that clamp is
    load-bearing: plain `50vh` walks the origin down as the window grows taller
    while the clause index stays pinned at 96px, so *which rings cross the index
    is a function of viewport height* — at 900 tall it is rings 01 and 02, at
    1100 ring 03 arrives, at 1600 ring 04 arrives too. Ring 03 is the heaviest
    of the five and deliberately undimmed, so a taller window reintroduced the
    artefact the dimming exists to remove, with a heavier arc. Held under the
    height at which ring 03's window opens — struck off the rail's top-left
    corner, lowest at **534px on a 1280px-wide page**, so 520 leaves 14px — the
    crossing set is 01 and 02 at every height, which is what makes two dim rules
    a complete answer instead of one that happens to hold at 900. Six review
    passes measured this across widths, where the crossings move under 5px;
    height was the axis that mattered. The cap's own cost is at the other end:
    the field reaches viewport y 1365 and no further, so a window over ~1500px
    tall has bare paper under the arcs. Raising it to get that back breaks the
    crossing set and the ring weights with it. Three
    details carry it. The layer takes `overflow: clip` and not `hidden` —
    `hidden` makes it a scroll container and a sticky child would never move, the
    same pair of declarations and the same reason as `.shell`. It is the
    *origin* that sticks and not the layer, because a sticky box is in flow and
    a sticky layer would add a screen of height to the section, where a 0x0
    origin costs nothing and is still a containing block for the rings. And the
    horizontal placement is `margin-left`, because on a sticky box `left` is an
    inset for horizontal stickiness rather than a position. Two consequences are
    paid for in the same rule. The layer is masked to nothing over its last
    200px, because held against the viewport the rings are still at full radius
    when the section's bottom edge arrives and four arcs stopping dead on one
    horizontal line read as a seam. And **rings 01 and 02 are dimmed to 6% and
    10%** from their drawn 10% and 20%: the rings and the clause index are now
    both anchored to the viewport, so those two arcs stand across the same eight
    labels for the whole section and never move relative to them, and an arc at
    the weight of the rules it crosses, held still, is a stray column rule in a
    table rather than ground. The offender is the cyan one, not the innermost —
    sampled, it composites to rgb(209,228,235) against hairlines at
    rgb(228,230,233) while ring 01 is a dead heat at rgb(231,232,233). Scoped to
    two rings and not taken out of the layer's opacity, because rings 03, 04 and
    05 have no crossing of the rail at any height inside the clamp or any width
    from 1024 to 2560, and they are the only ground in the gap the wide-cap
    decision leaves open — those are **widths**, and that decision is the
    "measure is capped below 1000px" bullet further down: 190px at 1600 wide,
    510 at 1920, 1150 at 2560. The `top` cap's own cost, two sentences up, is
    quoted at *heights*. Same numerals, two axes; say which every time.
    Under `prefers-reduced-motion` the origin stops being
    sticky and falls back to the 34% it was struck at before it stuck: a layer
    held against the viewport while the page moves past it is scroll-coupled
    motion, and it is the only such motion on the site. The clause rail is
    sticky too and is deliberately not treated that way — it is navigation a
    reader is using, and a decoration is the half that can be given up.
  - **There is no phone override on the rings**, and every other orbit set on
    the site has one. The reasoning behind those — push the origin out so the
    strong inner rings leave the reading measure — is half true and the
    conclusion does not follow: moving the origin out also shortens the vertical
    reach the outer rings need to arrive. Counted at 390px, rows of the measure
    each ring crosses at 98% against 150%: ring 02 (cyan) 490 → 651, ring 03
    (the darkest ink ring) 72 → 845. It is worse on every ring but the one it
    was aimed at. `.orbits--insights` carries the same override and the same
    reversal and is left alone — see the follow-ups.
  - **The head sits outside the article grid.** It was put there for a
    silhouette that had to weld to the page edge, and it is kept because the
    head reads as the notice's own block — headline, standfirst and date across
    the content width, the copy below in the article's column.
  - **The measure is capped below 1000px and deliberately not above it.** Below
    1000px the article grid collapses and the column takes the whole page: at
    999px the notice ran 112 characters to the line against 74 one pixel
    earlier, so the block is held to the desk's own 780px. Above ~1500px the
    column is capped at the prose measure while the rail stays welded to the
    right gutter, so the gap between them grows with the window — 510px at 1920
    — and that is left alone. Capping the block closed the gap and opened a
    worse one: the rail left the page gutter, which is the one thing
    `.article__rail` promises, and this page alone stopped matching the four
    insight pages on the same grid. If it is ever
    worth solving it is worth solving for the article layout as a whole.
  - **The standfirst is `privacy.lede` in `src/i18n`, not the body's first
    paragraph.** It is the sentence that says what the document is; as the first
    block of the body it read as one paragraph of twenty-one and, below 1000px,
    arrived after the index of the thing it summarises.
  - **Below 1000px the index goes above the notice** in two columns, and the
    body ends on a "Terug naar de inhoud ↑" link: down there the index scrolls
    away with the first clause a reader jumps to, and there is nothing else on
    the site to get back to it with. On a desk the rail is sticky and the link
    is hidden.
  The copy carries one authored href that is not a URL: `clause:NN` is the NNth
  clause of the notice, resolved in `privacy.mjs` from the same derivation the
  index is built from, so a cross-reference ("zie hieronder", useless to a reader
  who arrived at that clause from the index) is a link without a hand-kept
  anchor. An ordinal with no clause behind it fails the build. Both ways to reach
  a person in the body are links too, and the number is `white-space: nowrap`
  (`.prose a[href^="tel:"]`) for the reason every fact in the footer's legal
  microline is: four ordinary spaces make a phone number five words to a line
  breaker, and it broke across two lines at an English tablet, a French phone and
  a Dutch laptop. `PHONE_HREF` is repeated in `body.mjs` rather than imported
  from `contact-form.mjs`, which imports the privacy page back and would close a
  cycle.
  Three things say where the reader is. `scroll-padding-top` went from the
  header's own height and nothing more (2px of clearance at 1180px, 4 at the
  tablet's 72px row) to 96px on the desk and 108 on the tablet, so a clause
  lands with air under the bar. `.prose__heading:target` takes the pull quote's
  cyan rule stood back up, which answers the click. And
  `components/clause-index/clause-index.js` — `<sa-clause-index>`, wrapping the
  list, lazily loaded like every other component — puts `aria-current="location"`
  on the row whose clause the reader is in, which answers the scrolling that
  follows. All three degrade to eight working links. The component's one real
  trap is the foot of the document: the last clauses of a long notice never
  cross the line, because the page runs out of scroll before they reach it, so
  on a 1440x900 desk the index said "Cookies" to a reader looking straight at
  "Uw rechten" — and said it to anyone who pressed those rows too, which is an
  index lying about the row just pressed. At the floor the hash decides if there
  is one *and its heading is still on screen*, and the last heading on screen
  decides otherwise; a `hashchange` listener catches a press that moves no
  pixels. The "still on screen" half is not belt and braces: a hash outlives the
  press that set it, so honoured unconditionally the mark travelled backwards —
  press clause five, read on to the end, and at the floor it jumped back to a
  heading 376px above the top of the screen.
  **The spy owns both marks, and paper owns neither.** `:target` and the row's
  `aria-current` are the same 2px cyan rule with different lifetimes — one set
  by the last hash, one tracking the scroll — so left alone they name different
  clauses in the same viewport: click a row, scroll back 200px, and the rail
  marks one clause while the copy marks another 300px away. The component stamps
  `data-clause-spy` on the root and the stylesheet stands `:target` down under
  it, which leaves `:target` as the no-JS half and as the only mark the four
  insight pages have. Both are reset in `@media print`: they are screen state
  that outlives the gesture that set it, so whichever was live when Print was
  pressed came out on the PDF as a stray rule in the margin and a contents list
  with seven grey rows and one black one — two people printing the same legal
  notice getting two different documents.
  The **Cookies clause** is the one place this page has been factually wrong:
  two drafts said the site sets no cookies at all, and `functions/secured/login.js`
  sets `export_session` for seven days on `/secured/`. The clause is scoped to
  the public pages now and names that one — as are `privacy.description`, which
  is the page's own search snippet, and `faq.data.a`, which ships as `FAQPage`
  structured data and is therefore the sentence an answer engine quotes. On a
  page whose whole posture is that every claim is read off the code, an absolute
  has to be checked against the
  whole repo and not just `src/`. It is also the only page with no contact section — a notice that
- **The footer is paper, and about 110px of it.** It was a dark band carrying a
  full `sa-node-field` and three stacked columns of micro type, which spent a
  screen of navy under every page in the site on the one block nobody scrolls
  down wanting. It is two rows on a hairline now, 111px from about 850px up: the two
  ways to reach a person, Inzichten and LinkedIn on the first, and on the second the WER/WVV disclosure as a single
  11.5px microline with the privacy notice and the copyright opposite it. What
  is left of the dark field is `.footer-mark`, a small wedge in the bottom-left
  corner holding the logo — the header's wedge turned over, so the page opens
  and closes on the same shape. It carries no node field: the header masks its
  own into the 100px tail past the wordmark, and this wedge's tail is 46px on a
  desk, which is a flat navy plate rather than a window onto anything. Its cut
  follows the header's, which moves four times: the row grows at 1180px, which
  shallows the slope the header draws without changing its cut; the cut itself
  changes at 1000px and again at 767px; and the wedge's own height drops with
  the stack at 800px, which shallows what the same run draws. There is a rule
  for each, and the run is stated in pixels rather than as a share of the wedge,
  because it is the header's run that has to be matched and the two boxes are
  different widths. Measure both boxes before touching it: two drafts of this
  got the premise wrong, one leaving a 180px band and one leaving the phone. Five things are
  load-bearing.
  - **The base row is a grid, and that is what keeps the wedge in the corner.**
    Flex breaks a line on what its items *want* to be — their max-content size —
    before it lets any of them shrink, so the link group pushed itself onto a
    line of its own below the wedge and left the wedge floating in the middle of
    the block. Three tracks (`auto minmax(0, 1fr) auto`) cannot wrap.
  - **The row keeps no block padding**, so its bottom edge is the page's and the
    wedge can reach it. What holds type off that edge is padding on the type.
    The row above it does carry padding, because it wraps on a phone.
  - **The microline's separator is the gap and never a character.** Each fact is
    `white-space: nowrap`, so a break falls only between two facts. The `·` the
    facts used to carry put the break opportunity behind the dot and stranded
    one at the end of every wrapped line.
  - **The disclosure is at its legal minimum, and that is what buys the single
    line.** Art. 2:20 WVV asks for the name, the legal form, the precise seat,
    the enterprise number and "RPR" followed by the *seat of the court*; art.
    III.74 WER puts the enterprise number on every website of a registered
    entity; art. XII.6 WER adds the VAT identification and an e-mail address.
    Four facts carry all of it. "Besloten vennootschap" went because "BV" is
    what it abbreviates and 2:20 takes the abbreviation, and the court's full
    name went because the statute asks only for its seat. One label does double
    duty: the enterprise number and the VAT number are the same identifier in
    Belgium, so `footer.vat` answers III.74 and XII.6 in one string. 1131px of
    type became 727, which is one line from 1261px up in Dutch, 1248 in French
    and 1230 in English, instead of two everywhere below 1780. **The Dutch line
    clears 1280 by 18px**, and it is measured in the platform face because no
    Geist binary is shipped — supplying Geist, or adding a fact, or touching
    this row's gaps, means measuring it again.
  - **800px is where the base row changes shape**, and it is a height threshold
    rather than a line-count one. Stacking does not buy a single line back —
    the widest full-width row below 800 is 720px against 781 of type — it buys
    a two-line block that is wide instead of one that is narrow, and it costs
    about 40px of footer. Above the threshold the block beside the wedge is
    shorter; below it the column would stop fitting two facts to a line and the
    facts would land one per line, which is what the stack exists to prevent.
- **`src/pages/prose.mjs` is the long-form vocabulary, and it is not the
  insights'.** Two page families run long enough to need headings, quotes and
  lists — the articles and the privacy notice — so it sits a level above both.
  `p`, `h2` and `quote` interleave their interpolations; they used to drop them
  silently, which is the wrong failure for a tag whose job is to carry a
  sentence.
- **Colocation**: keep CSS/JS/assets in the component or page folder. A component
  that also owns markup keeps both halves there under one name:
  `components/contact-form/contact-form.mjs` renders the section at build time,
  `contact-form.js` upgrades it in the browser. The homepage and the team page
  both call `contactSection()`, passing an id prefix and the two lines each page
  phrases for itself; everything else comes from the shared `contact.*` and
  `form.*` keys, so the two forms can never drift apart.
- **`/media/` is the un-hashed public file namespace**: the two course
  one-pagers live in `public/media/` beside the two generated brand images, the
  founder portraits in `public/media/team/` and the "Inzichten" thumbnails in
  `public/media/insights/`, and all of them ship as-is. A fiche is named after
  the course it belongs to (`SmartAgents_AI_Business_Teams_Onepager.pdf`,
  `SmartAgents_Agentic_Engineering_Onepager.pdf`): the browser prints the file
  name in the download bar, and the two were named after the products the
  courses were once built around, so a reader clicked one course and was handed
  something that looked like another. The link prints the format and the size,
  read off the file at build time in `training.mjs`. The awareness and
  management fiches that were left over from the learning path "Ons aanbod"
  replaced are deleted: nothing linked them and Google would have indexed them
  as orphan PDFs competing with `/training/`. A file authored inside a deck and shown
  on a public page too (today: the kata tour video) is never duplicated: it stays
  in the deck folder and `PROMO_MEDIA` in `build/render.mjs` copies it into the
  same `/media/`. `/secured/` is gated, so a public page can never link into it.
  `_headers` gives `/media/*` its own cache policy.
- **Tokens live once.** `src/styles/tokens.css` is the only place custom
  properties are defined; `build/render.mjs` prepends it to `critical.css` and
  inlines the pair in every `<head>`. Never redefine a token in `main.css`.
- **The dark field is one field, and where two shapes meet under the cursor it
  is one fluid.** Every navy shape is a `.field` carrying `data-magnet` and
  `data-clip`, with a `<sa-node-field>` inside. The clip path must sit on the
  same element as `data-magnet`: `src/motion.js` grows that element's box and
  remaps the outline into it. A shape's own silhouette is the outline itself,
  moved: every sample slides toward the cursor by a Gaussian in *arc length*
  along the perimeter, so the swell is a bell with the drawn curvature intact
  and a stretch of edge far along the outline cannot follow the cursor, however
  close it happens to lie in the plane. One silhouette, never a seam — the clip
  path is rewritten, so the swell carries the node field with it.
- **A join is the only place a field is used, and it is local.** Where two
  displaced outlines come within reach of each other, they are read as
  `exp(-distance/k)` and summed over a window covering where the two can reach
  each other — the overlap of their boxes, opened out by how far one still lifts
  the other's contour, *not* a box around the narrowest point, because once two
  shapes are close enough to run together their outlines cross well away from
  it. The contour where that sum is 1 is the metaball union, which lies outside
  every outline and necks between two of them with a concave fillet at each
  body. It is traced by marching squares on a 4px grid, resampled at even arc
  length, and written out as Bézier curves — a chord anywhere on a join is a
  corner waiting to be seen, and a spline through unevenly spaced points
  scallops, so both halves of that matter. The trace is not the silhouette: it
  is drawn half a pixel inside the union, so wherever the join has lifted the
  contour by less than that the authored outline is what shows — which keeps
  every apex exactly as drawn and buries the corner where the two hand over.
  Outside the window there is no field at all.
- **What holds a join together is `k`, and `k` is the cursor's.** It scales on
  how near the cursor is to the *further* of the two shapes, so a join needs the
  cursor to be near both and at rest there is none. It is keyed on the distance
  to each outline and never on the point that realises it: distance to a closed
  curve moves as smoothly as the cursor does, while the nearest point jumps
  across a shape the moment two approaches tie — and a join keyed on that jumps
  with it, which is seen as the whole thing flickering as the pointer travels.
  Two outlines facing each other across `g` can only close it when `g` is under
  `2k·ln2`, which is the early-out the pass leans on: most frames strike no
  window at all. A join has to arrive a little inside that limit, where its
  waist is already tens of pixels wide, and is then held to the limit itself
  once open — a 4px grid cannot draw a waist thinner than a cell, and without
  the hysteresis the merge stutters on sub-pixel cursor travel. What the
  neighbours add to the sum has the value it would have at the window's rim
  taken off it, smoothly, so the lift is gone by the rim and the window's own
  shape can never show.
- **The union covers the bodies it was struck from, so the lowest of them paints
  it** and the others draw their bodies over the top: that is what keeps the DNA
  disc's helix from being painted out by the blob reaching it. It also makes
  winding load-bearing. A join appended to a body under one fill and the default
  `clip-rule: nonzero` reads a loop wound against that body as a hole punched
  through it, and the silhouettes in `clipDefs()` are not all wound the same way
  — the staffing arch and the tracks wedge run one way, the DNA shapes the
  other. `src/motion.js` measures each path's winding at setup and turns the
  join to match. A new silhouette may be drawn either way round; a silhouette
  with two subpaths of its own has to wind them consistently.
- **A page's height is not a constant, and `<sa-node-field>` is anchored to the
  document.** The shared field re-measures on every tick, and it used to re-seed
  whenever the document grew or shrank by more than 2px — which is fine for a
  page that only reflows on resize and is the network flying apart thirty times
  a second on one that does not. The AI staffing accordion was the first block
  on the site to move the document height at runtime and it found this. A field
  that has changed size is now topped up rather than re-seeded, with enough
  hysteresis that an opening row does not change the population at all, and
  every window re-measures its slice because the shapes below a block that just
  grew have all shifted. Anything else that animates a block's height inherits
  this for free; anything that re-seeds will look the same way again.
- **A magnet rewrites the path its `data-clip` names, not the one the element
  is actually clipped by.** `collectMagnets()` in `src/motion.js` resolves the
  outline with `getElementById(element.dataset.clip)` and never reads the
  computed `clip-path`. Every hero silhouette is swapped to `#heroSwoop` under
  621px, so down there the magnet is rewriting a path nothing is using and the
  pull does nothing — which is right, because there is no cursor on a phone,
  but it is right by accident. A silhouette that is swapped at some width for a
  reason other than the phone would need the magnet told about it.
- **Setting up a magnet is two steps, and only the first one runs before the
  page is painted.** `collectMagnets()` grows the box and writes the resting
  silhouette; `arm()` samples the outline and builds the arc-length table, on
  the first idle callback or on the first pointer move, whichever comes first.
  The split is what put CLS at 0. Growing five boxes by 140px a tenth of a
  second after the page arrived scored 0.07 of layout shift, and the growth
  could not simply be moved before the paint because sampling those five
  outlines costs 111ms on a cold engine (`getPointAtLength` is ~85µs a call
  until it warms up, then ~20µs). It does not have to be: growing the box is an
  affine map in unit space, an affine map of a Bézier is the same map applied to
  its control points, so `remapPathData()` moves the *authored* curve into the
  grown box exactly, in ten segments rather than four hundred and eighty, with
  no sampling at all. The dense outline is only what the pull runs on, and
  nothing needs it until a cursor arrives. `collectMagnets()` also reads every
  layout value before it writes any of them, for the ordinary reason.
- **A magnet's box is frozen in pixels the moment it is set up, and so is
  everything struck from it.** The outline is sampled, the grown box is
  measured, the outline is remapped into it, and the arc-length table the
  falloff runs on is built — once. The committed build before this one
  re-measured the box every frame and so tracked a runtime size change; this one
  does not, which is the trade for not rebuilding an arc-length table sixty
  times a second. So a shape may not be struck between two edges that can move
  apart afterwards: it would not merely shift, it would stretch, and the
  silhouette would stop fitting what it was sampled against. Only a window
  resize rebuilds it. Nothing is precomputed against a *neighbour's* position,
  though — a join is struck from where both outlines stand this frame, so shapes
  that move relative to each other at runtime are fine. The AI staffing page has
  one of each: the track panel's leaf is anchored to the panel's top and sized
  from the gutter, so it is still while rows open; the wedge under the panel's
  foot is anchored with `bottom` plus a height, so it travels with the foot at a
  constant size. Sizing the `.field` itself is still insets-only — an explicit
  width or height over-constrains the box and moves it instead of growing it —
  but the `.field-slot` around it is ordinary CSS and is where a stable box
  belongs.
- **The magnet attributes tune the swell, and the swell is what decides a
  join.** `data-magnet-amp` is how far the outline travels at the deepest point
  of the pull, and `data-magnet-sigma` is how wide a stretch of the perimeter
  travels with it — a big shape swells over a wider stretch of its edge than a
  small one, or the pull reads as a spike rather than a turn. Both feed the join
  only through the gap they leave: two shapes run together when what is left
  between them is under `2k·ln2`. `data-magnet-free` opts a shape out of the
  guard that refuses a pull from an edge tucked under the nav or past the page
  edge. Take it only for a shape that is nowhere near either, or for one that
  pins the edge it would have been guarded on. It also changes the default
  amplitude — 34 guarded-out against 92 guarded — so removing it from a small
  shape does not merely lift a guard, it triples the pull and translates the
  whole silhouette; the DNA blob is 100px across and needs the 34, and the disc
  beside it, which opts out because its own outline runs along the top of its
  box, has to say `data-magnet-amp="92"` to keep the pull it had.
  `data-magnet-pin` (a comma-separated list) welds the shape to each page edge
  it hangs from: the pull fades to nothing over the last 30px before each, so
  no swell can peel it off the edge it is drawn from. A silhouette may be
  several subpaths when a join is drawn, and a join between three shapes can
  leave a paper island: the trace keeps marching squares' own relative winding
  and the set is turned as a whole by the sign of its total area, so the island
  stays wound against the loop around it and the nonzero fill rule paints it as
  the paper it is.
- **The AI staffing page's hero is an arch and two pebbles.** `heroArch` is hung
  off the right edge and `heroPebbleA`/`heroPebbleB` are positioned inside the
  arch's own box, so the three move as one and the page overrides only that box.
  The box hangs 14% past the hero's foot: the arch's tail runs on into the
  section below and passes behind the track panel there, which is the whole
  reason that panel is opaque. The pebbles are the only free-floating dark
  shapes on the site and they are dropped from the tablet down, where the shared
  `.hero__field--right` carries the arch alone and the phone turns it into the
  same sliver the petal becomes. The arch went through two drafts that both
  failed the same way: a diagonal struck corner to corner with a shallow bow
  read as a black triangle, and the cove that replaced it filled the whole
  corner and needed a second silhouette in the opposite one to balance it.
- **A disclosure is a `<details>`, and an accordion is three of them sharing a
  `name`.** The AI staffing page's track panel is the only figure on the site
  that opens and closes. The markup is what works with JS off — the rows open,
  and the `name` group makes the browser close the open one — and
  `<sa-accordion>` takes both over when it loads, because that is the only way
  either of them travels rather than snaps. The CSS version came first and does
  not work: Gecko supports `::details-content` but not `interpolate-size`, so
  `block-size: 0` -> `auto` on the pseudo is not interpolable there and every
  row arrives at full height. Two boxes inside the row, not one: a padded box
  cannot be animated to nothing, because its own padding is the floor its height
  stops at. The same no-JS-first reasoning is why the mobile nav is a
  `<details>`.
- **The tablet is drawn, so it is not invented.** `SmartAgents Homepage Tablet`
  (834x1112) in the design project is the source for everything between the
  desk and the phone, and four breakpoints carry it now. 1180px is where the
  header stops being a nav bar: the artboard drew that row against four items
  and the offer is six, four of them service names two and three words long, so
  the row is a desk-only thing and the tablet takes the disclosure the phone
  already has, in its compact dropdown mode. 768px is what is left of the
  artboard's own header — the taller row, the fluid brand, the wedge narrowed to
  the phone's, the tightened gutter — and it no longer moves the nav. 1000px is
  where every list that runs two abreast starts doing so, and 620px is where the
  hero stops being split, the phone's own line, because the column and the lobe
  are both shares of the width and hold to 621px. See "Deviations from the
  design doc", item 1, in the `smartagents-design` README for what each one
  changes; change a number there and in the CSS together. If the offer ever
  shrinks back to two services the row fits at 768px again and that band should
  get it back.
- **No third-party requests.** No webfonts, no icon library, no analytics on the
  public pages. Turnstile is the one exception and loads only on interaction.
- **`/secured/` is self-contained but not off-brand.** It serves its own
  `tokens.css`, `base.css` and `deck-stage.js` and links nothing from the public
  build, yet `src/content/secured/tokens.css` carries the same values as
  `src/styles/tokens.css`: paper, ink, the navy field, one cyan. Every page
  behind the password reads it — the login gate, the overview, both Smart Scan
  documents and all ten decks — so it is the one place a colour is defined
  there. Keep it in step with the public token file.
- **The dark field is a class in `/secured/`.** `.field` on any element flips
  the semantic roles to their on-navy values, so a rule written once reads on
  both grounds. A slide is paper and never carries it; what carries it is the
  navy shape clipped into the cover and the closing slide, and any navy element
  inside a paper slide. The retired decks put it on the `<section>` and painted
  a whole slide navy, which is the one thing the redesign does not do. The
  branch in `chrome()` that swaps in `logo-dark.svg` for a `.field` section is
  what is left of them. The one thing that
  breaks is painting `--sa-field` on an element and leaving the class off — the
  text inside then stays ink on navy.
- **The decks are paper with categorical colour.** `--sky`, `--blue`,
  `--purple`, `--violet`, `--teal`, `--green`, `--amber` and `--rose` exist only
  in the secured token file: a deck codes a section or a step by colour and the
  public site never does. Each has an on-paper value and an on-navy step under
  `.field`. Reach for `--accent` first; these are for when a thing is genuinely
  one of several.
- **The form reports its own failures, and only counts a submission it could
  forward.** Three of the four fields are required and nothing said so: the
  visitor found out on submit, one field at a time, from a bubble that vanished.
  The marker is a `*` with the word behind it for a screen reader and a legend
  at the head of the form; `contact-form.js` takes `novalidate` once it has
  upgraded, names every failing field at once in a slot `aria-describedby`
  already points at, and clears each one on `input`. The e-mail pattern is the
  one `validatePayload` applies, deliberately — a form that accepts what the
  endpoint rejects sends the visitor a round trip to be told what the page knew.
  On the endpoint, `checkAndIncrementRateLimit` now runs *after*
  `validatePayload`: the other way round a malformed submission burned one of
  the caller's five attempts an hour.
- **The contact path is checked end to end, because it broke in the gap between
  its two halves.** The form posts what its inputs are named; `/api/contact`
  validates its own list; nothing compared them, so a required `subject` no
  input carried 400'd every submission the site ever made. `scripts/check-contact.mjs`
  runs as the last build step: it parses the rendered form out of `dist/`, posts
  those exact fields through the real `onRequestPost`, and fails the build if
  they are rejected, if the message does not reach the webhook, or if a missing
  or erroring webhook is answered with `{ ok: true }`. Turnstile and n8n are
  stubbed at `globalThis.fetch`, so it needs no network and no secrets. Add a
  field to the form or a rule to `validatePayload` and this is what tells you
  the other half disagrees.
- **`.orbits--insights` pushes its origin to 150% on a phone and the number is
  probably backwards.** The same override was tried on the privacy notice and
  dropped: measured there, moving the origin out lifts the innermost ring off
  the reading measure but shortens the vertical reach the outer rings need, so
  the cyan ring gains 161 rows of crossing and the darkest ink ring gains the
  column's whole height. The insights index has not been measured against its
  own geometry — its section is a third the height and its origin starts at 104%
  rather than 98% — so the rule stands there and the comment says so. Measure it
  before copying either number to a third page.
- **`--measure-prose` is 100ch, and 100ch is 128 characters.** The token caps
  every `.article__main` on the site — the four insight pages and the privacy
  notice — and it only bites above about 1500px, where the grid would otherwise
  give the column more. There it resolves to 1022px, which at the body size is
  128 characters to the line, not 100: at 1920 the notice is a 128-character
  column with 510px of gutter beside it, which is the measure the design README
  calls "long by the usual measure, and the client's call". The README names the
  lever (the body size and this token) and 78ch would put it at about 100
  characters. It is left alone here because lowering it changes the four
  articles' measure at every desk width, which is a decision the client made,
  not one to take silently while fixing a legal page.
- **The orbit rings are hidden under `forced-colors: active`, site-wide.** A
  forced palette substitutes a system colour for every border and drops the
  alpha with it, so five hairlines drawn at 5–11% precisely to sit under the
  type came back as `CanvasText` at the layer's full 0.8 — ground designed to be
  barely there rendering as the strongest line on the screen, through the
  reading column. A decoration has no weight it can be given in a palette it
  does not choose, so it goes, the way `@media print` already drops it.
  `.cycle__phase` on the AI-native SDLC page is the other half of the same
  thought: that figure carries meaning, so a forced palette gets a border it can
  keep instead. The privacy notice is only where this landed hardest — a sticky
  origin puts the same arcs on every screen of a 2820px document rather than
  behind one hero — but the rule is not scoped to it, because no orbit set on
  the site means anything.
- **There is a print stylesheet, and it exists for one page.** A GDPR notice is
  the page most likely to be saved as a PDF — by a DPO, a procurement reviewer,
  a client's lawyer — and until the block at the foot of `main.css` existed that
  print carried a solid navy shape, the orbit rings, the sticky header, the
  phone's action bar and a rail beside a column. The rules are written for every
  page rather than scoped to that one, because nothing in them is
  page-specific: hide what is chrome or texture, unstack what is a share of a
  viewport that no longer exists, and print the href after an off-page link.
- **Validation**: `scripts/check-dist.mjs` is the gatekeeper. It checks unresolved
  templates, broken internal links, missing alt text, undefined CSS custom
  properties, robots meta, the full hreflang contract, the routing table, and the
  performance budgets from `fast-static-site` §1.

## Known follow-ups

- Nothing under `/secured/` loads a webfont any more: `deck.json` lost its
  `fonts` entry and the Smart Scan documents lost their Google Fonts links, so
  Geist-then-platform carries the sans and Georgia stands in for the serif
  accent. The decks were drawn against Inter and the documents against DM Serif
  Display, so a few headings set a little differently now. Supplying the Geist
  and Instrument Serif binaries closes both that gap and the public site's.
- One of the brand's two moving parts is ported to a deck.
  `presentations/shared/node-field.js` is `<sa-node-field>` with the sharing
  taken out: the site keeps one field in document coordinates and treats every
  dark shape as a window onto it, which a fixed, transform-scaled stage has
  nothing to anchor to, so each element seeds and drifts its own network in its
  own box and the host's `clip-path` does the rest. It is denser and brighter
  than the site's, because a silhouette covers about a quarter of the box it is
  drawn in. The magnetic pull in `src/motion.js` is not ported and will not be:
  it has no meaning without a cursor on the shape. The orbit rings are ported
  too, at about half the site's period and with the long fade, because a slide
  is looked at rather than scrolled past. Every deck in the folder is on this
  now; the flat navy covers went with the per-deck stylesheets.
- No build-step image pipeline. Both picture sets under `public/media/` were
  derived by hand with `sips`. The recipe, and the two traps that cost the most
  time (`--cropOffset` is in points; an odd-dimension AVIF renders as its alt
  text in Gecko), are in the `image-pipeline` skill.
- Geist is named first in `--font-sans` but no binaries were supplied, so the
  platform face is what renders. Ask the client for the WOFF2 files. One thing
  is measured against the face that renders today and has to be re-measured
  when they arrive: the footer's disclosure line clears a 1280px laptop by 18px
  in Dutch, and the same string sets 12px wider in some faces. See
  `.footer-micro` in `main.css`.
- All four service rows link out, through `servicePath()` in
  `src/layouts/base.mjs`, which is the one place the homepage rows and the nav
  bar both ask. Procesoptimalisatie is gone: it was one row standing for two
  different engagements, and it is now the two it always was — AI-native SDLC
  for the engineering side and AI-native businessprocessen for the business
  side. The plain-row branch in `services()` survives for the case it was
  always really about: a language a page is not published in, where
  `servicePath()` returns null. Agentic automatisatie was dropped as a service
  of its own — it is part of what the staffing track does inside a project. All
  four article rows link too, through `insightPath()`. See "Deviations from the
  design doc" in the `smartagents-design` README.
- **`NAV_ITEMS` is not what the bar prints.** `BAR_ITEMS` in
  `src/layouts/base.mjs` is: the four services and the team page. Inzichten is
  in `NAV_ITEMS` for the phone sheet alone, because with four service names in
  the row there is no width left for a section that is read on the way down the
  homepage anyway, and Contact is in neither — the button two items along goes
  to the same anchor, in the bar and in the sheet. The difference is emitted
  rather than hidden in CSS: a nav link that is `display: none` at every width
  ships in every one of the site's HTML files, is out of the accessibility tree
  too, and puts what the bar contains in a stylesheet instead of beside the
  list.
- The live site also has a Jobs page. It has not been redesigned yet, and
  nothing links to it.
- A URL that matches no page gets a real 404 now: `render.mjs` writes the
  default language's not-found body to `dist/404.html` as well as to
  `/nl/404/`, and Cloudflare serves that with the status code. It used to fall
  back to `index.html` with a 200, and `src/sw.js` still checks the
  `Content-Type` before it caches anything (`isCacheable`) — a cache-first
  worker that stores a 200 stores the homepage under a missing asset's URL, and
  the asset then fails on every later visit with no way to reload out of it.
  Keep that check whatever the host does.
