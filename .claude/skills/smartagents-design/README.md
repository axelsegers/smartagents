# SmartAgents — design system

Extracted from homepage direction **1a** ("Redactioneel — licht, lijnen, veel lucht") in
`SmartAgents Homepage.dc.html`, the agreed direction for the smartagents.be redesign.
That design doc lives in the "Smartagents.be Redesign Direction" Claude Design project and is
the single source of truth; every value here was lifted from it verbatim.

## The company

SmartAgents (Beringen, Belgium — BE 1037.114.694) builds "digital colleagues": agentic AI
automation for Belgian SMEs and enterprises. Three services — training, AI staffing en
coaching, procesoptimalisatie — plus their own product, **SmartSpace**
(in beta): one workspace where a company's agents and its people sit side by side.
The site is Dutch-first (NL / FR / EN).

### Sources

- `SmartAgents Homepage.dc.html` (design project) — the redesign direction, section 1a.
- `assets/logo.svg` / `assets/logo-dark.svg` — supplied by the client.
- No Figma file or brand book was provided. Anything not visible in 1a is absent here
  by design rather than invented.

## Content fundamentals

- **Language**: Dutch (Belgian), formal *u* — never *je* — in body copy. Headings occasionally
  drop into second person plural anyway ("Zullen we eens praten").
- **Sentence case everywhere.** No all-caps, no title case, not even in buttons or labels.
- **Short declaratives.** "Wat werkt en wat niet." "Digitale collega's die nooit slapen."
  Copy is confident but plain — no superlatives, no "revolutionary", no exclamation marks.
- **Honesty as a tone device.** The site repeatedly says where AI does *not* help:
  "we zeggen eerlijk waar AI niets toevoegt", "we zeggen ook wanneer u ons niet nodig hebt",
  "wat niet gebruikt wordt, halen we er weer uit". Keep that — it is the brand's whole posture.
- **Concrete over abstract**: "mail, facturen, offertes, aanbestedingen, calculaties",
  not "business processes".
- **CTA vocabulary**: *Plan een gesprek* (primary, everywhere), *Bekijk wat we doen →*,
  *Ontdek →*, *Ontdek SmartSpace*, *Alle artikelen →*. Arrows are the literal character →,
  never an icon.
- **No emoji.** Ever.
- Dates: "12 juni 2026" — lowercase month, tabular numerals.

## Visual foundations

**Two darks, one accent, a lot of paper.** Ink `oklch(0.148 0.005 247.84)` for text and primary
buttons; navy field `oklch(0.183 0.022 252)` for every dark shape; cyan
`oklch(0.53 0.112 214)` on paper and `#00d8ff` on the field. Nothing else. Paper is a stack of
near-whites (0.9846 → 0.945 on hover); pure white is reserved for a panel that floats over the
page — today only the menu the header folds into under 768px.

**The dark field is the brand.** Large navy shapes cut with angular clip paths — a wedge behind
the header logo, a petal and its counter-lobe on the hero's two flanks, a chevroned full-width
band for SmartSpace, a disc for the DNA section — each carrying a live cyan node network (the logo motif in motion) that reads as
one continuous field across the whole page. There is no illustration, no gradient background and
no texture, and pictures appear on exactly two surfaces (see "Deviations", item 5): the founders on
the team page, and the thumbnails in the homepage's "Inzichten" list.

A page may carry its own silhouette where that says something the shared ones do not. The AI
staffing page opens on an arch — one long descent off the right flank where the petal is a leaf —
with two pebbles that have come away from it into the light half of the hero, and its offer sits
between a leaf standing in the left gutter and a wedge under the far corner. Draw a new shape the
way those are drawn: one closed subpath (a magnet resamples it into a single polyline, so two lobes
written apart collapse into one), joins at the extremes with matching tangents so nothing corners
mid-curve, and every corner that remains sitting on the page edge the shape is welded to.

**A new silhouette takes the box a shared one would have taken, until the composition needs its
own.** The arch was first hung off the petal's exact insets, which is what keeps a page's own shape
a variation rather than a second composition. The pebbles are what changed that: they are
positioned inside the arch's box so the three move as one, and that box has to hang past the hero's
foot for the arch's tail to run on into the section below and pass behind the panel there. So the
staffing page overrides the hero box at the two desk breakpoints and gives it straight back from
the tablet down, where the pebbles are dropped and the shared box carries the arch alone.

**Free-floating shapes are what an arch welded along three sides buys.** Everything else on the
site hangs from a page edge or from a rule. The two pebbles hang from nothing, and they read
because the arch beside them is welded top, right and bottom: the pair says the ground has shed
pieces, which needs a ground to have shed them from. Two of them, one heavy and one light, both
drawn off-round — a circle beside a hand-drawn arch reads as a bullet, not as a shape.

**A shape must read as drawn, and it must not be the ground.** Two ways to lose that, both of them
failed drafts of this one arch. Struck corner to corner with five points of bow across a 690px box,
it read as a black triangle — neither the cursor nor the node network rescues a silhouette a
reader has already filed as a triangle; a fifth of the span is the working figure for the bow.
Opened up to fill the corner instead, it stopped being a shape hung off an edge, and a hero that
has become half navy then wants a second silhouette in the opposite corner to balance it. One
shape per hero, and the paper is its counterweight. The same holds for a shape carrying copy: navy
behind a single column with the rest of the band empty is the page-scale version of the same
mistake.

**Type**: Geist (fallback Inter, system-ui) at 650 for display and headings, 600/550 for UI,
400–450 for body. Tight tracking that loosens as size drops (−0.032em display → −0.005em UI).
Body copy runs 1.6–1.62 leading, capped at 44ch. Monospace (`ui-monospace`) appears only as
cyan two-digit indexes. Instrument Serif italic exists as a single optional hero accent line.

**Layout**: full-bleed — the page runs edge to edge, no sheet and no desk. 64px page gutter,
104px between sections, 72px column gap. Content lists are hairline-separated rows — not cards.
Section headings sit under a 2px cyan rule with 22px of air. Asymmetry is the rule: the hero
text occupies the left 52%, the dark field the rest.

**Borders and elevation**: 1px hairlines at `oklch(0.925 0.005 247.84)` do most of the
separating work. Shadows are deep, wide and very soft (`0 30px 70px -34px` at 32% opacity) —
never a tight drop shadow, never an inner glow except the SmartSpace screenshot frame.
Transparency and blur are used once: the pointer spotlight over the screenshot frame.

**Radii**: 5 chip · 7 button · 8 nav item · 11 menu item · 16 menu panel · 20 card · 26 shell ·
999 pill. Pills are only used for badges and the language chip.

**Motion**: two speeds. Travel (transform, shadow) is 0.34s `cubic-bezier(0.16,1,0.3,1)`;
colour (text, border, background) is 0.22s ease. Hover on filled buttons = lift 2px + soft
shadow; on outlined buttons = cyan border and text; on rows and nav items = a wash background.
Nothing bounces, nothing scales, nothing spins. Scroll reveals are a short fade-and-rise.
The node network drifts at 30fps and freezes under `prefers-reduced-motion`.

**Press states**: the design has none beyond the hover lift settling back — keep it that way.

## Iconography

The system is deliberately icon-poor. The only vector marks are the SmartAgents logo (light and
dark), a 9×6px chevron drawn inline in the nav, and the LinkedIn "in" glyph on the team page's
founder cards — a third-party *brand* mark, drawn inline in `currentColor`, not the first member
of an icon set. Everything else that would be an icon is a typographic arrow (→). Numbers act as
icons: monospace `01–05` in cyan. **Do not introduce an icon library** — if a new surface truly
needs one, raise it rather than picking one silently.

## Fonts

The design doc loads Geist and Instrument Serif from Google Fonts. **This repository does not**:
`.claude/skills/fast-static-site/SKILL.md` §4 forbids third-party font origins, and no licensed
webfont binaries were supplied. `--font-sans` names Geist first and falls back to the platform UI
face, which costs zero requests and zero layout shift.

**Ask the client for the font files.** Once they land: subset to WOFF2, drop them in
`assets/fonts/`, add `@font-face` rules in `tokens/fonts.css` with `font-display: swap`, preload
only the weight used above the fold, and set `size-adjust` on a fallback face so nothing shifts.

## Index

- `styles.css` — the entry point (imports only).
- `tokens/` — `fonts`, `colors`, `typography`, `spacing`, `shape`, `motion`.
- `assets/` — `logo.svg`, `logo-dark.svg`.

The production implementation of all of this lives in `src/`; see `SKILL.md` for the map.

## Deviations from the design doc

The doc is a fixed 1180px canvas rendered in a preview host. Eleven things had to be decided
outside it, and are decided the same way everywhere in `src/`:

1. **Responsive behaviour.** The three page measures (`--gutter-page`, `--gap-column`,
   `--section-rhythm`) and the type scale are fluid; the doc's value is always the upper bound.
   The desk's own composition holds down to 1080px, where the two hero shapes pull back into
   their corners so the copy keeps light ground; the shell loses its radius and shadow below
   1252px. Under that the doc has a second canvas of its own — see "The tablet" below — and the
   phone is where the invention still happens.

   **The tablet.** "SmartAgents Homepage Tablet" (834x1112) is drawn, and the site follows it.
   Four thresholds carry it, and each says one thing:

   - **1180px — the bar folds.** The artboard's header row was drawn against four items. The
     offer is six now: four services named in full, two and three words each, plus the team page
     and the sections. Fitted into 834px those are 11px type in a row with no gaps, which is not
     the artboard's header either — so the row is a desk-only thing and the tablet takes the
     disclosure the phone already has, in its compact dropdown mode. Above 1180px the row is
     still fluid: at 1181px, the narrowest it is ever printed at, the type is at 12px and the
     link padding at 7px, and the longest of the three languages leaves the primary action 29px
     clear of the page edge. If the offer ever shrinks back to two services the row fits at
     768px again and that band should get it back.
   - **768px — the header's own proportions.** What is left of the artboard's header once the
     nav has gone: the taller row, the fluid brand, the tightened gutter, and the wedge folded
     down to the shape it takes on the phone, because at the desk's 318px the cut runs past the
     trigger and "Menu" is set on navy. The chips, the gaps and the button's flanks tighten at
     the same line, so the four items clear the slope at 621px, the last width that still has
     them in the row.
   - **1000px — the columns.** Every list that is one column on a phone and three or five across
     a desk runs two abreast between these two numbers: the services, the five steps, the four
     articles. The steps and the DNA entries take the phone's vertical rule while they do, so a
     column of them draws one line. The transformation becomes the phone's single dark block up
     here too, with the list and the isometric stack still side by side inside it, and the
     stack's callouts drop.
   - **940px / 620px — the hero.** The hero stays split all the way down to the phone with the
     copy in a column just over half the page and the petal hung off the right edge; the
     counter-lobe goes, because at this width the two shapes meet in the middle. The column is
     51%, not the artboard's 57%: the petal's tip reaches back to 54% of the page at mid-height,
     which the artboard's own headline clears by a hair in one language at one width, and a
     column that clears it in all three at every width in the band is worth the six points. The
     artboard also turns the hero's hierarchy over — the wordmark steps back and the claim
     becomes the largest thing on the page — which is what the phone already did. Both the column and the lobe are shares of the width, so the pair
     holds to 621px; under it the phone takes over and the petal lies across the top of the copy
     as a sliver. There is no flat band in between: a stripe the width of the page under a block
     of copy read as a misprint, and the split it replaced still reads at 620px.
2. **Fonts.** No webfont is loaded — see above.
3. **The nav names destinations, not categories.** The doc draws a `Diensten` mega-menu over four
   services; two of them had no page, and a dropdown whose real content is two links is a lid over
   two links. The bar is written out flat instead: the four services and the team page, every one
   of them a page a reader can arrive at. Ons DNA, Aanpak and Digitale transformatie came off the
   bar and stayed on the homepage, and Inzichten joined them there once the four service names
   took the row's width — they are read on the way down rather than aimed at. Contact is in
   neither the bar nor the sheet, because the button two items along goes to the same anchor.
   Put a section back in the nav only when it becomes a page.

   `NAV_ITEMS` in `src/layouts/base.mjs` is the list the phone sheet prints and `BAR_ITEMS`
   beside it is the subset the bar prints; the difference is emitted rather than hidden in CSS,
   so what the bar contains is readable next to the list rather than in a stylesheet. A service
   is named there from `service.<key>.title`, so its nav entry, its homepage row and its own hero
   can never drift.
4. **Rows are only links when there is somewhere to go.** The doc's service and article rows link
   to detail pages that mostly did not exist, so a row with no destination renders plain and drops
   the "Ontdek →" cue. All four services have a page now — training, AI staffing and coaching, the
   AI-native SDLC and AI-native businessprocessen — so every row links; the lookup is
   `servicePath(key, lang)` in `src/layouts/base.mjs`, and adding a page to `SERVICE_PAGES` there
   brings the hover, the arrow and the translate back on the homepage row and puts the service in
   the nav at the same time. All four article rows link too, through `insightPath(key, lang)` in
   `src/pages/insights/insights.mjs`. The plain branch is still reached, and now only for the case
   it was always really about: a language a page is not published in, where `servicePath()`
   returns null.
5. **Two surfaces carry pictures**, which the doc rules out everywhere else.

   **The team page** puts photography in its hero: under the headline, the two founders fill the
   rest of the opening screen side by side, with the petal hung off the right edge and running
   past their feet. The petal and the two portrait scrims are the whole dark field on that page —
   it closes on paper, because a navy band under a pair of navy-scrimmed portraits was a third
   dark mass in one screen. Each portrait *is* the card — a 2:3 crop, a 1px hairline, the card
   radius, no ring, no shadow — and everything about the person is laid over its foot on a scrim
   of the same navy (`color-mix` of `--sa-field`, 97% at the bottom to transparent at the top).
   Hairlines inside the overlay are white at low alpha, not `--border-on-dark`, which disappears
   over a photograph.

   Below 940px the pair needs the whole page, so this hero turns the split a quarter rather than
   losing it: the headline keeps a column, the petal is hung off the right edge beside it at the
   proportion it is drawn at, and the two faces run underneath on the full width. The shape is in
   normal flow for the only time on the site — sized by `aspect-ratio`, with a negative margin
   putting its welded edge back on the page edge — so the row it sits in *is* the petal's height
   and the headline reads on its centre line. Under 621px the phone's own treatment takes over
   unchanged: the sliver across the top-right, the headline under it. What this replaced was a
   flat navy band between the headline and the faces, which is the thing the homepage hero
   already refuses at this width; stretched across a tablet its slope flattened out and the band
   read as a diagonal rule.

   **The homepage's "Inzichten" list** carries a thumbnail per article: a 208px 16:9 crop opening
   the row, the title with its excerpt directly under it, and the date and category badges ranged
   right at the row's end, so the row spans the page like every other list on it and stays about
   as tall as its picture. Below 1080px the meta moves above the title, and below 1000px the
   article stacks — but two abreast, which is how the tablet artboard sets it and what the 156px
   stamp beside five lines of type had been standing in for. Four of them are two rows, not four
   screens, which is the objection that kept the row a row. The list stays a hairline list — no
   cards and no shadows — but every row is now a link and carries the "Ontdek →" cue, inside the
   text column rather than in a reserved third one: the row's third column is the date and the
   badges, and it is ranged right against the page edge.

   **An insight's own page** shows the same thumbnail again, in the same frame, at the reading
   measure. That is the third surface with a picture on it and it is not a new decision so much as
   the same one twice: it is the picture the reader clicked, so showing anything else would be the
   surprise. It is deliberately not full-bleed and not wider than the type — the widest derivation
   is 760w and the smallest original is 542px across, so a banner running the width of the page
   would be the one visibly soft picture on the site.
   The four pictures are a photograph, an illustration and a product screenshot, which is exactly
   why the frame is fixed: 1px hairline, `--radius-panel`, over paper — the navy the portraits sit
   on would put four dark blocks in the section while the lazy images load.

   Both surfaces grade the picture itself `saturate(0.72) contrast(1.04)` so it cools towards the
   field. On the portraits the grade is a decoration and hover lifts it, so a coarse pointer —
   which has no hover to undo it — never gets it at all. On the thumbnails the grade is the thing
   that makes three kinds of picture read as one column, so it stays put on every pointer and only
   lifts once a row is a link. Anything else that wants a picture is a new decision, not a
   precedent.

6. **The SmartSpace band is not built.** The doc's chevroned navy band, its screenshot frame and
   the *Ontdek SmartSpace* button are gone from the homepage, and with them the `bandField` clip
   path, the `nav.smartspace` entry and the `smartspace.*` copy. The product is still named on
   the site — the third article row is about it — but it has no section of its own. Bring the
   band back only if SmartSpace gets a page to send people to.

   The **figure** did come back once, on the AI staffing page — a full-bleed navy band carrying
   what the client's management hears and when, the only navy shape on the public site that ever
   carried copy rather than texture — and has since gone again with the section it belonged to.
   It was built and it worked; what it could not survive was the page around it getting shorter.
   A closing statement is only a closing statement while there is a page behind it to close, and
   on a page of three blocks the band was the second of them. No navy shape on the public site
   carries copy today. Bring one back only for a block that is genuinely the last word on a long
   page; a second one anywhere near it would make both read as cards.

7. **Long-form copy is a page type the doc never drew.** The four insight articles are the only
   thing on the site that is read rather than scanned, and four decisions had to be made for them
   that nothing else on the site needed.

   **The measure is the page, not a measure.** Body copy is capped at 44ch everywhere, which is
   right for the two or three lines a marketing block runs to and far too narrow for twenty
   paragraphs of one: at the reading size 44ch is about fifty characters, and a column of that width
   turns an article into a very tall thin ribbon. A capped column has a second problem here, which
   two drafts of this page both had — set at 58ch and then at 72ch, it left 300–440px of dead page
   between the prose and the rail, which is the same "single column with the rest empty" the band
   rule already refuses. So the article column takes what the page leaves beside the rail, the way
   the hero takes 52% and every other block on the site is a share of the width. On a 1440px desk
   that is 965px, around 115 characters — long by the usual measure, and the client's call. The
   levers if it ever wants tightening are the body size and `--measure-prose`, which is now only an
   outer bound so the column cannot run away on a very wide monitor.

   The standfirst under the headline sits at 62ch: narrower than the body it introduces, which is
   what makes it read as a standfirst, but not the site's 44ch, which beside a column this wide
   reads as a stub.

   **The opening figure is inset, not stretched.** The column is wider than any derivation, so it is
   capped at 760px — the widest there is — and sits inset in its column. An article whose widest
   derivation cannot reach that stops at the width it does have: `BANNER_CAP` in
   `src/pages/insights/insights.mjs` and `.article__figure--short-source`. Only the launch
   photograph is in that position, at 480px, because its original is 542px across. Stretching 760px
   of pixels across 965 is the one soft picture this system refuses.


   **The other half of the page.** A single column of prose with the rest of the page empty is the
   mistake this README already names at page scale — "navy behind a single column with the rest of
   the band empty". The honest thing to put beside a page someone is reading is what else there is
   to read, so the other three articles sit in a rail against the right edge: the homepage's row
   idiom narrowed, hairline under each, title and date, no thumbnail, and it sticks so it is still
   there at the foot of a long piece. Its track is a flat 260px on the right page gutter, so its
   right edge is the nav's and the footer's and the only air between the two columns is the column
   gap. Below 1000px — the same line every other two-abreast list collapses on — it drops under the
   article, which is where a "read next" block belongs anyway.

   **There is no hero, and no dark shape at all.** Every other page opens on one because it is
   selling something and the petal is what says whose page it is. This one is a piece of writing, and
   a 540px shape between the header and the first paragraph is a screen the reader has to scroll past
   before they can start. So the page opens on the headline, at the measure the body runs at, and it
   is the one page on the public site that is paper end to end. An article headline is a sentence, so
   it is set at `--text-h1-sub` on a 26ch measure rather than at the display size: at the display
   size two of the four run to three lines, and the brand's display voice is not what a piece of
   writing opens in. Under it the excerpt the homepage row prints is printed again, then the date and
   the category badges take the row the other detail pages give their buttons — an article's next
   action is to read it, so there is nothing to press.

   **Three marks inside the body, and no more.** A heading is `--text-h3` at the display weight. A
   pull quote is the 2px cyan rule a section heading sits under, stood on its side — no quotation
   marks, no italic, the rule and the size are the whole signal. A list is a disc with a cyan
   marker, because the site's own list idioms (hairline rows, cyan two-digit indexes) do not survive
   inside a paragraph's rhythm, and the marker is cyan for the same reason the indexes are. Inline
   links are the one underlined thing on the site: cyan is the accent colour of every link here, and
   inside a paragraph colour alone is not a reliable cue. Nothing else — no drop cap, no aside, no
   figure inside the body.

8. **A hero is an eyebrow, a headline and two buttons, and the homepage's wordmark is not its
   heading.** The hero is the doc's, unchanged. Every one of the five carried a lede for a while —
   one or two sentences between the headline and the actions, `.hero__lede` and `<page>.hero.lede`
   in `src/i18n` — because the doc's hero leaves about 550px of bare paper under the buttons on a
   desk and a first-time visitor scrolls a full screen before learning what is sold. They are gone
   at the client's call: five paragraphs written to the same shape read as generated copy, which
   costs more than the scroll they saved. The block under the hero is what says what is sold now.
   If a hero ever gets a sentence back it is one sentence, in the client's own words, not the same
   sentence five times. `--text-lede` survives as a size, on `--text-body` ink — the first is the
   16.5px step, the second the body ink; they were both called `--text-lead`/`--text-body` until
   the size ramp and the ink ramp were found to be overwriting each other in `:root`.

   On the homepage the wordmark lockup stays exactly as drawn but is a `<p>` beside the heading
   rather than the first line inside it. As part of the `h1` the page's one heading read
   "SmartAgents Digitale collega's die nooit slapen", which repeats the wordmark 60px above it in
   the header and names no service. Nothing moved on screen; `.hero h1, .hero__wordmark` carry the
   display size between them, and every `.hero__claim` rule has to name the element as well or
   `.hero h1` outranks it.

9. **`.page-eyebrow` is a label, not a link.** It is the section a detail page belongs to, printed
   over the headline. Drawn in the accent it was the shape of a breadcrumb in the colour of every
   real link on the site — "Ontdek →", "Alle artikelen →", the phone number, the e-mail address —
   on a `<p>` with `cursor: auto`. It is `--text-muted` at `--text-meta-sm` now. It stays in
   sentence case: caps is the other way a label says it is not a link, and this system has no
   all-caps anywhere.

10. **Three blocks the doc never drew, all in idioms it did.** Each is the hairline row list or the
    `<dl>` the rest of the site already uses; none of them is a new component.

    **The FAQ** (`#faq`, homepage, between the approach and the insights) is six questions in the
    plain `.rows` list, question in the title column and answer in the body one. Every answer is
    open, always: this block is also the site's `FAQPage` structured data, and an answer engine
    cannot quote what is behind a click. Nothing in it is new copy in the sense of a new claim —
    every answer is something one of the pages already says, collected where the question is asked.

    **The course facts strip** (`.offer-course__facts`) is a `<dl>` under each course on the
    training page: who it is for, the format, the group size, what to bring, the price. Two-column
    grid, hairline between rows, labels in `--text-faint`. Neither course stated any of it, so the
    only next step from that page was the form and every enquiry started from zero. Duration and
    open dates are the two facts nothing on the site knows and they are deliberately absent rather
    than guessed at.

    **The insights index** (`/nl/inzichten/`, `/en/insights/`, `/fr/analyses/`) is the archive the
    article rail's "Alle artikelen →" always claimed to point at, and it prints the homepage's own
    article rows from the same function (`articleRows()` in `src/pages/insights/insights.mjs`), so
    the two lists cannot drift. It opens the way an article does: no hero, no dark shape, the
    orbit rings the homepage section carries and nothing else.

11. **The privacy notice keeps the rail and loses the shape**, and the two halves of that are
    worth separating. An insight answers the emptiness beside a single column with three more
    articles; a legal notice has no "read next", and the same layout minus the rail leaves a
    1022px column of GDPR prose (133 characters to the line, the longest measure on the site) with
    354px of bare paper beside it for four fifths of the page. That is the "single column with the
    rest of the band empty" this README already refuses at page scale, and decoration does not
    answer it: two shapes at the extreme ends of a 2820px section bookend a void rather than filling
    it.

    **What goes in the rail is the notice's own clauses.** It is the one piece of navigation a
    legal page genuinely needs — nobody reads a privacy statement end to end, they arrive wanting
    one thing — and it brings the column back to the article's own 980px on the way. Same
    component, same rows, one line each and no date, and it is a `<nav>` rather than the article
    rail's `<aside>`. Below 1000px it goes *first* rather than under the article, in two columns at
    half the row padding, and the body ends on a link back to it: an index at the foot of a long
    notice is an index nobody reaches, and an index that scrolls away on the first jump is an
    index that works once.

    **The dark field is not on this page.** A silhouette was drawn for the air beside the head,
    went through three drafts, and came off; a second one standing on the footer's hairline came
    off before it. The notice is paper end to end now, the way the four insight articles are, and
    the brand on it is the rings.

    **The rings stick, and no others on the site do.** Every other orbit set is nailed to its
    section, which is right for a hero and for a list one screen tall. This section is 2820px and
    the outermost ring is 845px in radius, so an origin nailed anywhere in it leaves a third of the
    page with no ground under it at all. Struck against the viewport — `position: sticky` on the
    origin, not on the layer, since a sticky box is in flow and a 0x0 origin costs no height while
    a layer would cost a screen — the arcs hold the right flank the whole way down and the reading
    column travels past a field that is holding still. The layer takes `overflow: clip` and not
    `hidden` for the reason `.shell` does, and fades out over its last 200px, because a set held at
    full radius when the section's bottom edge arrives is four arcs stopping dead on one line.

    **Its offset is clamped rather than `50vh`, and that is the part worth carrying off this page.**
    A sticky decoration and a sticky rail are both pinned to the viewport, but at *different*
    offsets — so the distance between them is a function of viewport height, and therefore so is
    which of five concentric rings crosses the rail. Plain `50vh` gave rings 01 and 02 at 900 tall,
    plus ring 03 at 1100 and ring 04 at 1600; ring 03 is the heaviest of the five and the one
    deliberately left undimmed, so a taller window reintroduced the artefact the dimming exists to
    remove, with a heavier arc. Six review passes measured this across widths, where the crossings
    move by under 5px, and none of them thought to sweep the axis the geometry actually turns on.
    **When two sticky things are pinned at different offsets, the variable is the viewport dimension
    they are pinned along.** Clamped under the height at which the next ring's window opens, the
    crossing set is invariant and two dim rules are a complete answer rather than one that happens
    to hold at the size it was checked at.

    Two corollaries, both of which cost a round to learn. **A threshold like that is struck off a
    corner, so check which corner** — this one comes off the rail's top-left, which means it moves
    with the page's width (lowest at 1280px, not at the 1440 it was derived at) and does not move
    with the index's height at all; a taller index opens a second window from the *other* corner
    instead, which lowering the cap makes worse. And **a cap has a cost at the end you were not
    looking at**: held under 520, the ring field reaches 1365px of viewport and no further, so a
    window taller than that has bare paper under the arcs — the same failure the stickiness was
    introduced to fix, moved from the document's axis onto the viewport's. It is the right trade
    only because it begins above 1500px while the collision begins at 1100.

    **And an arc that never moves has to be quieter than one that sweeps past.** The rings and the
    clause index are both anchored to the viewport now, so the two arcs that cross the index stand
    across the same eight labels for the whole section and never move relative to them — and a
    hairline at the weight of the rules it crosses, held still, is a stray column rule rather than
    ground. Two things about the fix are worth carrying to the next case.

    It is **scoped to the two rings that actually collide**, not taken out of the layer's opacity.
    Rings 03, 04 and 05 have no crossing of the rail; dimming the layer punished
    three arcs for a collision they cannot have, and those three are the only ground in the gap the
    wide-gutter decision deliberately leaves open at 1600px and up. And **the offender was not the
    one it looked like**: sampled off the render, the cyan ring composites to rgb(209,228,235)
    against hairlines at rgb(228,230,233) while the innermost ink ring is a dead heat at
    rgb(231,232,233). Diagnosing it by eye, or by interpolating lightness in OKLCH rather than
    sampling the sRGB the browser actually composites in, points at the wrong ring and makes
    halving the whole layer look necessary. Moving the origin is not an option either: the first
    offset that clears the rail with ring 01 puts ring 02 inside it.

    **And the phone override that every other orbit set carries was measured and dropped here.**
    The reasoning behind it — push the origin out so the strong inner rings leave the reading
    measure — is half true, and the half that is missing reverses the conclusion: moving the origin
    out also shortens the vertical reach the *outer* rings need to arrive, so rings that could not
    reach the column start doing so. Counted at 390px, rows of the measure each ring crosses at 98%
    against 150%: ring 01 519 → 293, the cyan ring 490 → 651, the darkest ink ring 72 → 845. It
    trades the faintest ring's crossings for the two strongest ones'. The number is inherited on
    the insights index and left alone there, because that is a different page's rendering and its
    geometry has not been measured; the comment there says so. **Measure a decorative offset
    against the rings it lets in, not only the ones it takes out.**

    **What the three failed crests taught is worth keeping even though the crest is not.** Each is
    a way a new silhouette can fail, anywhere on this site:

    - **Welded along the top edge**, it put 490px of flat navy against the header's own bottom
      line: the hairline stopped two thirds across and the black CTA sat 11px above a mass of
      nearly its own colour. The homepage petal does not do that — it enters that corner and falls
      away fast, so the actions keep paper under them.
    - **Drawn with two lobes** separated by an 11% rise, it read as a wave divider rather than as a
      drawn shape, and the hook at its end left a droplet hanging off the corner. One belly, one
      tongue, no local low point.
    - **A shape needs its box held, not only its silhouette drawn.** The crest's box was the air
      above the copy, which made it collision-proof — but that box's height barely moved across the
      range while its width halved, so left to itself it went from 1.72 wide-to-tall on a desk to
      0.59 on a phone and the silhouette read as a mitten with a detached drip. A `max-height`
      keyed to the box's own width holds it landscape at every width, and because it can only ever
      shorten the box the collision guarantee survives it.

    And one rule that outlives the shape entirely: **type beside a silhouette is held off the ink,
    not off the box.** Every silhouette has a leftmost point some way inside the box that carries
    it, and the box is what a reader never sees. Subtracting the whole of it from the headline's
    measure left 160px on a 390px screen, less than the French heading's longest single word;
    subtracting only the part that could be navy left 220. The draft that trusted the box cleared
    the ink by 2px, and only because of where the curve happened to fall, in the platform face
    rather than the one this site will ship. A number naming the silhouette's own reach is a
    construction; a measured clearance is a coincidence waiting for a font.

    **The head carries a standfirst, like every other head on the site** (see item 8). It is the
    sentence that says what the document is, and it was the body's first paragraph until the rail
    arrived — where it read as one paragraph of twenty-one and, at the widths the index sits above
    the copy, arrived after the index of the thing it summarises.

    **A cap can be worse than the hole it closes.** Past about 1500px the notice's column is held
    at the prose measure while its rail stays welded to the right page gutter, so the gap between
    them grows with the window — 510px at 1920. Capping the whole block to
    measure-plus-gap-plus-rail closes that and breaks two things: the rail leaves the page gutter,
    which is the one thing the rail contract promises, and this page stops matching the four
    insight pages built on the same grid. A wide gutter *inside* a block reads as air. The same
    width of paper *outside* it reads as a block that has come loose. The gap stays.
