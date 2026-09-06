// Renders every page template to a complete HTML file in dist/.
// Runs after `vite build`, which produces the hashed assets and the manifest.
// See .claude/skills/fast-static-site/SKILL.md §1.
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';

import { html, join } from './lib/html.mjs';
import {
  languages,
  defaultLanguage,
  loadStrings,
  createTranslator,
  assertNoMissingTranslations,
  buildAlternates,
  pagePath,
  absolute
} from './lib/i18n.mjs';
import { loadManifest } from './lib/assets.mjs';
import { PHONE, EMAIL } from '../src/components/contact-form/contact-form.mjs';
import { loadDecks, loadSecuredDocuments } from './lib/decks.mjs';
import { basePage } from '../src/layouts/base.mjs';
import { deckPage, securedIndexPage } from '../src/layouts/deck.mjs';

import { page as homePage } from '../src/pages/home.mjs';
import { page as trainingPage } from '../src/pages/training.mjs';
import { page as kataPage } from '../src/pages/kata.mjs';
import { page as staffingPage } from '../src/pages/staffing.mjs';
import { page as sdlcPage } from '../src/pages/sdlc.mjs';
import { page as processesPage } from '../src/pages/processes.mjs';
import { page as teamPage } from '../src/pages/team.mjs';
import { page as privacyPage } from '../src/pages/privacy/privacy.mjs';
import { page as notFoundPage } from '../src/pages/not-found.mjs';
import { INSIGHTS, indexPage as insightsIndexPage, insightPages } from '../src/pages/insights/insights.mjs';

/** The four services `llms.txt` lists, keyed the way the nav and the rows key them. */
const SERVICE_PAGES = {
  training: trainingPage,
  staffing: staffingPage,
  sdlc: sdlcPage,
  processes: processesPage
};

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const contentDir = path.join(rootDir, 'src/content');

// The four insight pages are generated from one list; see
// src/pages/insights/insights.mjs.
const PAGES = [
  homePage,
  trainingPage,
  kataPage,
  staffingPage,
  sdlcPage,
  processesPage,
  teamPage,
  insightsIndexPage,
  ...insightPages,
  privacyPage,
  notFoundPage
];

const MINIFY_OPTIONS = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  removeRedundantAttributes: false,
  sortAttributes: false
};

let written = 0;

async function writeHtml(relativePath, markup) {
  const target = path.join(distDir, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, await minify(String(markup), MINIFY_OPTIONS));
  written++;
}

/* ------------------------------------------------------------------ *
 * Public, language-prefixed pages
 * ------------------------------------------------------------------ */

async function renderPublicPages({ strings, criticalCss, assets }) {
  const sitemapEntries = [];

  for (const page of PAGES) {
    const alternates = buildAlternates(page.slugs);

    for (const language of languages) {
      const slug = page.slugs[language.code];
      if (slug === undefined) continue; // Intentionally not available in this language.

      const t = createTranslator(strings, language.code);
      const meta = page.meta(t);
      const url = pagePath(language.code, slug);

      const body = page.render({ t, lang: language.code, dir: language.dir, alternates, url });

      await writeHtml(
        path.join(url.slice(1), 'index.html'),
        basePage({
          t,
          lang: language.code,
          dir: language.dir,
          url,
          pageId: page.id,
          title: meta.title,
          description: meta.description,
          noindex: page.noindex === true,
          alternates,
          criticalCss,
          assets,
          preloadImage: meta.preloadImage,
          ogImage: meta.ogImage,
          article: meta.article,
          schema: page.schema?.({ t, lang: language.code, url }),
          body
        })
      );

      // A second copy of the default language's 404, at the root of dist/.
      // Cloudflare serves `404.html` with a real 404 status for a URL that
      // matches nothing; without it the host fell back to `index.html` with a
      // 200, so every missing page was a soft 404. That matters beyond SEO:
      // a cache-first service worker that stores a 200 stores the homepage
      // under the missing asset's URL, which is why `src/sw.js` has to check
      // the Content-Type before it writes (`isCacheable`).
      if (page === notFoundPage && language.code === defaultLanguage.code) {
        await writeHtml(
          '404.html',
          basePage({
            t,
            lang: language.code,
            dir: language.dir,
            url,
            pageId: page.id,
            title: meta.title,
            description: meta.description,
            noindex: true,
            alternates,
            criticalCss,
            assets,
            body
          })
        );
      }

      if (!page.excludeFromSitemap) {
        sitemapEntries.push({ url, alternates });
      }
    }
  }

  return sitemapEntries;
}

/* ------------------------------------------------------------------ *
 * Root fallback + 404 for hosts without redirect support
 * ------------------------------------------------------------------ */

async function renderRootFallback() {
  const target = pagePath(defaultLanguage.code);
  const links = languages.map(
    (language) =>
      html`<li><a href="${pagePath(language.code)}" lang="${language.code}" hreflang="${language.code}">${language.name}</a></li>`
  );

  // The host redirects / to the default language (see _redirects). This file only
  // matters when that redirect is unavailable, so it must work with no CSS and no
  // JS. It never negotiates: an unprefixed URL always resolves to the default
  // language, the browser's own preference does not override it. The other
  // languages stay one click away in the list below.
  await writeHtml(
    'index.html',
    html`<!doctype html>
<html lang="${defaultLanguage.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0; url=${target}">
<title>SmartAgents</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${absolute(target)}">
</head>
<body>
<ul>
${join(links)}
</ul>
</body>
</html>`
  );
}

/* ------------------------------------------------------------------ *
 * The password-gated area: overview, decks, standalone documents
 * ------------------------------------------------------------------ */

const COPY_SKIP = new Set(['.html', '.json']);

function copySecuredStatic() {
  const source = path.join(contentDir, 'secured');

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (COPY_SKIP.has(path.extname(entry.name).toLowerCase())) continue;

      const target = path.join(distDir, 'secured', path.relative(source, full));
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(full, target);
    }
  };

  walk(source);
}

/* ------------------------------------------------------------------ *
 * Promo media shared with the public site
 * ------------------------------------------------------------------ */

/**
 * A few large media files are authored inside a deck and shown on a public page
 * as well. `/secured/` is password-gated, so the public page cannot link to the
 * deck's copy; the file stays in the repo once and is copied out to `/media/`
 * here. Not content-hashed, so `_headers` gives it its own cache policy.
 */
const PROMO_MEDIA = [
  'presentations/enterprise-pitch/assets/kata-agentic-engineering.mp4',
  'presentations/enterprise-pitch/assets/kata-agentic-engineering-poster.jpg'
];

function copyPromoMedia() {
  for (const file of PROMO_MEDIA) {
    const target = path.join(distDir, 'media', path.basename(file));
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(contentDir, 'secured', file), target);
  }
}

async function renderSecured() {
  const decks = loadDecks(contentDir);
  const documents = loadSecuredDocuments(contentDir);

  await writeHtml('secured/index.html', securedIndexPage({ documents, decks }));

  for (const deck of decks) {
    await writeHtml(path.join('secured/presentations', deck.slug, 'index.html'), deckPage(deck));
  }

  // Standalone documents are already complete HTML pages; copy them into their
  // own directory so the URL keeps a trailing slash.
  for (const document of documents) {
    if (!document.html) continue;
    const source = path.join(contentDir, 'secured', `${document.slug}.html`);
    await writeHtml(path.join('secured', document.slug, 'index.html'), readFileSync(source, 'utf8'));
  }

  copySecuredStatic();
  return { decks, documents };
}

/* ------------------------------------------------------------------ *
 * Sitemap, robots, service worker
 * ------------------------------------------------------------------ */

function renderSitemap(entries) {
  const urls = entries.map((entry) => {
    const alternates = entry.alternates
      .map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.code}" href="${alt.href}"/>`)
      .join('\n');
    return `  <url>\n    <loc>${absolute(entry.url)}</loc>\n${alternates}\n  </url>`;
  });

  writeFileSync(
    path.join(distDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
  );

  writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt());
}

/**
 * The AI crawlers, named rather than left to the wildcard.
 *
 * `User-agent: *` already allows them, so on the wire this file says nothing
 * new. It is here because silence is not a policy: a crawler operator, a
 * customer and a court all read an unnamed agent as "nobody decided", and this
 * is a company that sells AI expertise. Being findable by the engines it sells
 * expertise in is the point, so every one of them is allowed explicitly, and
 * the one rule that matters — `/secured/` is off limits — is repeated for each
 * so it cannot be missed by an agent that stops reading at its own block.
 *
 * Google-Extended is not a crawler: it is the switch that says whether content
 * Googlebot already fetched may train Gemini and ground its answers. Allowing
 * it is the same decision as the rest.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
  'Amazonbot',
  'cohere-ai'
];

function robotsTxt() {
  const blocks = ['User-agent: *', 'Allow: /', 'Disallow: /secured/', ''];

  for (const agent of AI_CRAWLERS) {
    blocks.push(`User-agent: ${agent}`, 'Allow: /', 'Disallow: /secured/', '');
  }

  blocks.push(`Sitemap: ${absolute('/sitemap.xml')}`);
  return `${blocks.join('\n')}\n`;
}

/**
 * `/llms.txt` — the site, in one page, for a model that has to answer a question
 * about it without crawling six pages first.
 *
 * It is generated from the same page modules and the same string files the site
 * is, in the default language, so it cannot describe an offer the site no longer
 * has. Every URL in it is the canonical one; the other two languages are named
 * once at the foot rather than tripling the file.
 */
function renderLlmsTxt({ strings }) {
  const t = createTranslator(strings, defaultLanguage.code);
  const lang = defaultLanguage.code;
  const line = (label, url, body) => `- [${label}](${absolute(url)}): ${body}`;

  // The kata is not a fifth service: it is the developer course inside the
  // training offer, so it is a nested bullet under the line it belongs to
  // rather than an entry of its own in the list of four.
  const services = ['training', 'staffing', 'sdlc', 'processes']
    .map((key) => {
      const slug = SERVICE_PAGES[key].slugs[lang];
      const entry = line(t(`service.${key}.title`), pagePath(lang, slug), t(`service.${key}.body`));
      if (key !== 'training') return entry;
      const kataSlug = kataPage.slugs[lang];
      return `${entry}\n  ${line(t('kata.hero.title'), pagePath(lang, kataSlug), t('kata.description'))}`;
    })
    .join('\n');

  const articles = [
    line(t('section.insights'), pagePath(lang, insightsIndexPage.slugs[lang]), t('insights.index.description')),
    ...INSIGHTS.map((insight) =>
      line(t(`article.${insight.key}.title`), pagePath(lang, insight.slugs[lang]), t(`article.${insight.key}.body`))
    )
  ].join('\n');

  const alternates = languages
    .filter((language) => language.code !== lang)
    .map((language) => `${language.name}: ${absolute(pagePath(language.code))}`)
    .join(' · ');

  const body = `# SmartAgents

> ${t('home.description')}

SmartAgents BV is een Belgisch bedrijf, gevestigd in ${t('footer.city')} —
${t('footer.vat')}. Vier diensten, hieronder met hun canonieke URL. De huisregel
is dat AI alleen wordt aangeraden waar het echt iets oplevert; elke dienstpagina
zegt ook waar dat niet zo is.

## Diensten

${services}

## Inzichten

${articles}

## Over

${line(t('team.hero.title'), pagePath(lang, teamPage.slugs[lang]), t('team.description'))}
${line(t('privacy.heading'), pagePath(lang, privacyPage.slugs[lang]), t('privacy.description'))}

## Contact

E-mail: ${EMAIL} · Telefoon: ${PHONE} · ${t('contact.location')}

## Talen

Elke pagina bestaat in drie talen. ${alternates}
`;

  writeFileSync(path.join(distDir, 'llms.txt'), body);
}

/**
 * The authored rules in public/_redirects plus the catch-all that sends an
 * unprefixed URL to the default language: `/training/` lands on `/nl/training/`.
 *
 * A catch-all in a _redirects file swallows everything after it, `/assets/*` and
 * `/nl/*` included, because the file has no negative match and a redirect is
 * followed whether or not an asset matches the request. The exclusion is a
 * same-path 200 rewrite: the first matching rule wins and no later rule is
 * considered, so the rule serves the file and hides it from the catch-all. That
 * list is generated from what is actually in dist/, so a new top-level file or
 * directory excludes itself by existing rather than by someone remembering to
 * add a line here. Pages Functions never reach this table, so /api/ and
 * /secured/ are handled before it applies.
 *
 * A splat rule does not cover the bare directory it stands for: `/secured/*`
 * matches `/secured/anything` but not `/secured`, so without a rule of its own
 * that URL falls through to the catch-all and is sent to `/nl/secured`, which
 * is nothing. Every top-level directory therefore also gets the trailing-slash
 * redirect a static host would have issued itself. `/secured` matters most —
 * it is the entry point people type, and it has to reach the Pages Function
 * that guards `/secured/*` rather than the Dutch tree.
 *
 * Cloudflare wants every static rule above the first rule with a splat, hence
 * the two generated blocks around the authored one.
 */
function renderRedirects() {
  // Cloudflare serves neither these nor dotfiles, so a rule for them would be dead.
  const internal = new Set(['_redirects', '_headers']);
  const entries = readdirSync(distDir, { withFileTypes: true }).filter(
    (entry) => !internal.has(entry.name) && !entry.name.startsWith('.')
  );

  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => `/${entry.name} /${entry.name} 200`)
    .sort();
  const directoryRoots = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/${entry.name} /${entry.name}/ 301`)
    .sort();
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/${entry.name}/* /${entry.name}/:splat 200`)
    .sort();

  const authored = readFileSync(path.join(rootDir, 'public/_redirects'), 'utf8').trim();
  const generated = [
    '# Generated by build/render.mjs from the dist/ tree. Edit public/_redirects.',
    '# Each rule below serves its own path and ends the lookup there, so the',
    '# catch-all on the last line cannot swallow a URL that already resolves.',
    ...files,
    '',
    '# Generated: a bare directory name is not matched by its own splat rule, so',
    '# it takes the trailing-slash redirect a static host would have issued.',
    ...directoryRoots,
    '',
    authored,
    '',
    '# Generated: the same exclusion for every top-level directory.',
    ...directories,
    '',
    `# Anything left is an unprefixed URL, so it resolves to ${defaultLanguage.name}.`,
    `/* ${pagePath(defaultLanguage.code)}:splat 302`
  ];

  writeFileSync(path.join(distDir, '_redirects'), `${generated.join('\n')}\n`);
}

function renderServiceWorker(precache) {
  const template = readFileSync(path.join(rootDir, 'src/sw.js'), 'utf8');
  // The hashed asset names are the version: new assets mean a new cache.
  const version = precache.join('|').replace(/[^a-z0-9]/gi, '').slice(-16) || 'dev';

  writeFileSync(
    path.join(distDir, 'sw.js'),
    template
      .replace("'__VERSION__'", JSON.stringify(version))
      .replace("'__PRECACHE__'", JSON.stringify(precache))
  );
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

const strings = loadStrings(rootDir);
// Tokens first: critical.css and every component stylesheet build on them, and
// the inlined block is the only place they are defined.
const criticalCss = ['src/styles/tokens.css', 'src/styles/critical.css']
  .map((file) => readFileSync(path.join(rootDir, file), 'utf8'))
  .join('\n');
const assets = loadManifest(distDir);

const sitemapEntries = await renderPublicPages({ strings, criticalCss, assets });
await renderRootFallback();
const { decks, documents } = await renderSecured();
copyPromoMedia();

// Static files that ship as-is (favicon, any future robots additions).
cpSync(path.join(rootDir, 'public'), distDir, { recursive: true });

renderSitemap(sitemapEntries);
renderLlmsTxt({ strings });
renderServiceWorker(assets.precache);
// Last: the pass-through list mirrors the finished dist/ tree.
renderRedirects();

assertNoMissingTranslations();

console.log(
  `Rendered ${written} pages: ${PAGES.length} templates × ${languages.length} languages, ` +
    `${decks.length} decks, ${documents.filter((d) => d.html).length} documents.`
);
