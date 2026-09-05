// Gatekeeper for dist/. Fails the build on correctness problems and on any
// breach of the performance budgets in .claude/skills/fast-static-site/SKILL.md §1.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { brotliCompressSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

const { languages, defaultLanguage } = await import('../build/lib/i18n.mjs');

/* ------------------------------------------------------------------ *
 * Budgets (fast-static-site §1)
 * ------------------------------------------------------------------ */

const BUDGETS = {
  htmlCompressedBytes: 30 * 1024,
  criticalJsCompressedBytes: 50 * 1024,
  renderBlockingRequests: 3
};

const textExtensions = new Set(['.html', '.xml', '.txt', '.css', '.js']);
const sourceTextExtensions = new Set(['.css', '.js', '.mjs', '.html']);
const ignoredSourceDirs = new Set(['dist', 'node_modules', '.git', '.claude', '.idea']);

const failures = [];
function fail(file, label, sample) {
  failures.push({ file, label, sample });
}

/* ------------------------------------------------------------------ *
 * Collect
 * ------------------------------------------------------------------ */

function collect(dir, predicate, files = [], base = dir) {
  for (const entry of readdirSync(dir)) {
    if (ignoredSourceDirs.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collect(full, predicate, files, base);
      continue;
    }
    if (!predicate(full)) continue;
    files.push({
      fullPath: full,
      relativePath: path.relative(base, full).replace(/\\/g, '/'),
      content: readFileSync(full, 'utf8')
    });
  }
  return files;
}

const distFiles = collect(distDir, (file) => textExtensions.has(path.extname(file)));
const sourceFiles = collect(repoRoot, (file) => sourceTextExtensions.has(path.extname(file)));

const allDistPaths = new Set();
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else allDistPaths.add(path.relative(distDir, full).replace(/\\/g, '/'));
  }
})(distDir);

const htmlFiles = distFiles.filter((file) => file.relativePath.endsWith('.html'));

/** Public pages live under /{lang}/; everything else is the gated area or a fallback. */
const isSecured = (file) => file.startsWith('secured/');
// Two files at the root of dist/ are not pages: `index.html` is the
// no-redirect fallback, and `404.html` is the body Cloudflare serves with a
// real 404 status for a URL that matches nothing. Neither is crawled, neither
// carries hreflang, and both are noindex.
const isRootFallback = (file) => file === 'index.html' || file === '404.html';
const isPublicPage = (file) =>
  file.endsWith('.html') && !isSecured(file) && !isRootFallback(file);
const isNotFound = (file) => /(?:^|\/)404\/index\.html$/.test(file) || file === '404.html';

/* ------------------------------------------------------------------ *
 * 1. Nothing unresolved leaked into the output
 * ------------------------------------------------------------------ */

const leakChecks = [
  { label: 'unresolved undefined.* output', regex: /undefined\.[\w.-]+/ },
  { label: 'unprocessed template marker', regex: /\{\{[\s\S]{0,200}?\}\}|\{%[\s\S]{0,200}?%\}/ },
  { label: 'unreplaced build placeholder', regex: /__[A-Z][A-Z_]+__/ },
  { label: 'unexpanded chrome marker', regex: /<!--\s*chrome/ },
  { label: 'local or development URL in output', regex: /\b(?:https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])|file:\/\/)/i },
  { label: 'raw front matter block', regex: /(?:^|\n)---\s*\n(?:[\w-]+:\s*.*\n)+---\s*(?:\n|$)/ }
];

// Any i18n key appearing verbatim in the output means a translation was not applied.
const i18nKeys = new Set(
  languages.flatMap((language) =>
    Object.keys(JSON.parse(readFileSync(path.join(repoRoot, 'src/i18n', `${language.code}.json`), 'utf8')))
  )
);

for (const file of distFiles) {
  for (const check of leakChecks) {
    const match = file.content.match(check.regex);
    if (match) fail(file.relativePath, check.label, match[0].slice(0, 80));
  }

  if (!file.relativePath.endsWith('.html')) continue;
  for (const key of i18nKeys) {
    if (file.content.includes(`>${key}<`) || file.content.includes(`"${key}"`)) {
      fail(file.relativePath, 'untranslated i18n key in output', key);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 2. Links, images, CSS custom properties
 * ------------------------------------------------------------------ */

const cssTokenDefinitions = new Set(
  distFiles.flatMap((file) => [...file.content.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]))
);

/**
 * A custom property declared twice in one block keeps the last value, and the
 * declarations that wanted the first one do not warn — they resolve to a value
 * of the wrong kind, the declaration is thrown away as invalid, and the
 * property inherits instead. `--text-body` was the ink of body copy at the top
 * of `:root` and 15.5px at the bottom of it; seventeen blocks asking for
 * `color: var(--text-body)` had been inheriting the page's full ink since the
 * ramp was written, and every check here passed, because the property is
 * defined — just not as a colour.
 *
 * So: no name may be declared twice inside one `{ ... }`. Scoped redefinitions
 * are the point of custom properties and are not touched — this only looks
 * inside a single block, which is where a redefinition is always a mistake.
 * "Tokens live once" (CLAUDE.md) is the rule; this is what enforces it.
 *
 * Documents are read as well as stylesheets: `tokens.css` never ships as a file
 * of its own — `render.mjs` prepends it to the critical CSS and inlines the
 * pair in every `<head>` — so a stylesheet-only scan would have missed the one
 * file the rule exists for. A `{ ... }` in a document that is not CSS cannot
 * match, because the declaration pattern needs a `--name:` inside it.
 */
for (const file of distFiles) {
  if (!file.relativePath.endsWith('.css') && !file.relativePath.endsWith('.html')) continue;

  for (const block of file.content.matchAll(/\{([^{}]*)\}/g)) {
    const seen = new Set();
    for (const declaration of block[1].matchAll(/(^|;)\s*(--[\w-]+)\s*:/g)) {
      const name = declaration[2];
      if (seen.has(name)) fail(file.relativePath, 'custom property declared twice in one block', name);
      seen.add(name);
    }
  }
}

/**
 * Resolve one `href` or `src` to the path it would have inside `dist/`, or
 * `null` when it is not ours to check.
 *
 * Anything carrying a scheme belongs to somebody else — `https:`, `mailto:`,
 * `tel:`, `data:`, `blob:`, `about:` and whatever comes next — so the test is
 * for a scheme at all rather than a list of the ones seen so far. A
 * protocol-relative `//host/path` is external too.
 *
 * `directoriesAreIndexes` is what separates a link from an asset: a page is
 * addressed by its directory and served as the `index.html` inside it, while
 * an asset is addressed by its own name and a missing extension means the file
 * is missing, not that a directory was meant.
 */
function resolveLocal(from, value, { directoriesAreIndexes = false } = {}) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) return null;

  const withoutQuery = value.split(/[?#]/)[0];
  if (!withoutQuery) return null;

  let target = withoutQuery.startsWith('/')
    ? withoutQuery.slice(1)
    : path.normalize(path.join(path.dirname(from), withoutQuery));

  if (directoriesAreIndexes) {
    if (target === '.' || target === '') target = 'index.html';
    else if (target.endsWith('/')) target += 'index.html';
    else if (!path.extname(target)) target = path.join(target, 'index.html');
  }

  return target.replace(/\\/g, '/');
}

for (const file of distFiles) {
  const { relativePath, content } = file;

  // Scripts set custom properties at runtime, so only stylesheets and documents
  // can be checked statically.
  if (relativePath.endsWith('.css') || relativePath.endsWith('.html')) {
    for (const reference of content.matchAll(/var\(--([\w-]+)(\s*,[^)]*)?\)/g)) {
      if (reference[2]) continue; // has a fallback
      if (cssTokenDefinitions.has(reference[1])) continue;
      fail(relativePath, 'undefined CSS custom property', `--${reference[1]}`);
    }
  }

  if (!relativePath.endsWith('.html')) continue;

  for (const match of content.matchAll(/href="([^"#{][^"]*)"/g)) {
    const target = resolveLocal(relativePath, match[1], { directoriesAreIndexes: true });
    if (target && !allDistPaths.has(target)) fail(relativePath, 'broken internal link', match[1]);
  }

  // The same walk over `src`. An `href` that goes nowhere is a click that does
  // nothing; a `src` that goes nowhere is a hole in the page, and on a slide it
  // is a hole in front of a room. A deck folder is copied through verbatim, so
  // a portrait renamed in `assets/` and not in the slide used to ship silently
  // and 404 in the meeting.
  //
  // `srcset` cannot match here (the pattern needs whitespace then `src=`), and
  // it is left alone deliberately: it is a candidate list the browser is free
  // to skip, and the `src` beside it is the one that must work. `<source src>`
  // inside a `<video>` does match, and should.
  for (const match of content.matchAll(/\ssrc="([^"#{][^"]*)"/g)) {
    const target = resolveLocal(relativePath, match[1]);
    if (target && !allDistPaths.has(target)) fail(relativePath, 'broken asset reference', match[1]);
  }

  for (const match of content.matchAll(/<img\s[^>]*>/g)) {
    if (!match[0].includes('alt=')) fail(relativePath, 'missing alt attribute on image', match[0].slice(0, 80));
  }
}

/* ------------------------------------------------------------------ *
 * 3. Per-page metadata and i18n contract (static-i18n §2)
 * ------------------------------------------------------------------ */

for (const { relativePath, content } of htmlFiles) {
  const title = content.match(/<title>\s*([^<]*?)\s*<\/title>/i);
  if (!title || !title[1]) fail(relativePath, 'empty or missing <title>', '<title>');

  const robots = content.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  const expectedRobots =
    isSecured(relativePath) || isRootFallback(relativePath) || isNotFound(relativePath)
      ? 'noindex, follow'
      : 'index, follow';

  if (!robots) fail(relativePath, 'missing robots meta tag', '<meta name="robots">');
  else if (robots[1].trim() !== expectedRobots) {
    fail(relativePath, `unexpected robots meta, expected "${expectedRobots}"`, robots[1]);
  }

  if (!isPublicPage(relativePath)) continue;

  const description = content.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!description || !description[1].trim()) {
    fail(relativePath, 'empty or missing meta description', '<meta name="description">');
  }

  const langAttr = content.match(/<html\s+lang="([^"]+)"\s+dir="([^"]+)"/i);
  if (!langAttr) fail(relativePath, 'missing lang and dir on <html>', '<html>');

  if (!/<link rel="canonical" href="[^"]+"/.test(content)) {
    fail(relativePath, 'missing canonical link', '<link rel="canonical">');
  }

  // hreflang must list every language plus x-default.
  const hreflangs = new Set([...content.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]));
  for (const language of languages) {
    if (!hreflangs.has(language.code)) {
      fail(relativePath, 'missing hreflang alternate', language.code);
    }
  }
  if (!hreflangs.has('x-default')) fail(relativePath, 'missing hreflang x-default', 'x-default');
}

/* ------------------------------------------------------------------ *
 * 4. Performance budgets (public pages only; /secured/ is internal)
 * ------------------------------------------------------------------ */

for (const { relativePath, content, fullPath } of htmlFiles) {
  if (!isPublicPage(relativePath)) continue;

  const compressed = brotliCompressSync(readFileSync(fullPath)).length;
  if (compressed > BUDGETS.htmlCompressedBytes) {
    fail(relativePath, `HTML over budget (${BUDGETS.htmlCompressedBytes} B brotli)`, `${compressed} B`);
  }

  const head = content.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? '';

  const blockingScripts = [...head.matchAll(/<script\b([^>]*)>/g)].filter((match) => {
    const attrs = match[1];
    if (!/\ssrc=/.test(attrs)) return false;
    return !/\b(?:defer|async)\b/.test(attrs) && !/type="module"/.test(attrs);
  });
  for (const script of blockingScripts) {
    fail(relativePath, 'render-blocking classic script in head', script[0].slice(0, 80));
  }

  const blockingStyles = [...head.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].filter(
    (match) => !/media="print"/.test(match[0])
  );
  if (blockingStyles.length > BUDGETS.renderBlockingRequests) {
    fail(
      relativePath,
      `more than ${BUDGETS.renderBlockingRequests} render-blocking stylesheets`,
      String(blockingStyles.length)
    );
  }

  if (!/<style>/.test(head)) {
    fail(relativePath, 'no inline critical CSS in head', '<style>');
  }
}

// Critical JS budget: the entry chunk plus anything it statically pulls in.
const entryJs = [...allDistPaths].filter((file) => /^assets\/app\.[^/]+\.js$/.test(file));
for (const file of entryJs) {
  const compressed = brotliCompressSync(readFileSync(path.join(distDir, file))).length;
  if (compressed > BUDGETS.criticalJsCompressedBytes) {
    fail(file, `entry JS over budget (${BUDGETS.criticalJsCompressedBytes} B brotli)`, `${compressed} B`);
  }
}

/* ------------------------------------------------------------------ *
 * 5. Required output files
 * ------------------------------------------------------------------ */

const required = [
  'index.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'llms.txt',
  'sw.js',
  '_headers',
  '_redirects',
  'favicon.svg'
];
for (const file of required) {
  if (!allDistPaths.has(file)) fail(file, 'required output file missing', file);
}

for (const language of languages) {
  for (const file of [`${language.code}/index.html`, `${language.code}/404/index.html`]) {
    if (!allDistPaths.has(file)) fail(file, 'missing language output', language.code);
  }
}

if (!allDistPaths.has(`${defaultLanguage.code}/index.html`)) {
  fail('index.html', 'default language home missing', defaultLanguage.code);
}

/* ------------------------------------------------------------------ *
 * 5b. The routing table: nothing may hide behind the catch-all
 * ------------------------------------------------------------------ */

// _redirects ends with a catch-all that sends an unprefixed URL to the default
// language. It is followed whether or not an asset matches, so every top-level
// entry in dist/ needs a rule of its own above it or it stops being reachable.
const redirectRules = readFileSync(path.join(distDir, '_redirects'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('/'))
  .map((line) => line.split(/\s+/)[0]);

if (redirectRules.at(-1) !== '/*') {
  fail('_redirects', 'the catch-all is not the last rule', redirectRules.at(-1) ?? 'no rules');
}

const covered = new Set(redirectRules.slice(0, -1));
for (const entry of readdirSync(distDir, { withFileTypes: true })) {
  if (entry.name.startsWith('.') || entry.name === '_redirects' || entry.name === '_headers') continue;
  // A directory needs two rules: the splat for everything inside it, and the
  // bare name, which the splat does not match and the catch-all would take.
  const rules = entry.isDirectory()
    ? [`/${entry.name}/*`, `/${entry.name}`]
    : [`/${entry.name}`];
  for (const rule of rules) {
    if (!covered.has(rule)) {
      fail('_redirects', 'unreachable behind the catch-all', rule);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 6. Source hygiene: no stale token lookups
 * ------------------------------------------------------------------ */

const sourceTokenDefinitions = new Set(
  sourceFiles.flatMap((file) => [...file.content.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]))
);

for (const file of sourceFiles) {
  if (!/\b(?:readTokenValue|readNumberToken|getPropertyValue)\s*\(/.test(file.content)) continue;
  for (const match of file.content.matchAll(
    /\b(?:readTokenValue|readNumberToken|getPropertyValue)\s*\(\s*['"`](--[\w-]+)['"`]/g
  )) {
    const token = match[1].slice(2);
    if (sourceTokenDefinitions.has(token)) continue;
    fail(file.relativePath, 'undefined CSS custom property in source script', match[1]);
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

if (failures.length > 0) {
  console.error('Build sanity check failed.');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.label} (${failure.sample})`);
  }
  process.exit(1);
}

const publicPages = htmlFiles.filter((file) => isPublicPage(file.relativePath));
const largest = Math.max(
  ...publicPages.map((file) => brotliCompressSync(readFileSync(file.fullPath)).length)
);
console.log(
  `Build sanity check passed. ${htmlFiles.length} pages, ` +
    `largest public page ${largest} B brotli (budget ${BUDGETS.htmlCompressedBytes} B).`
);
