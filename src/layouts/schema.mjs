// The site's structured data, in one place.
//
// Every public page carries the same two nodes — the company and the site — and
// adds whatever it is itself: a `Service` on a service page, a `BlogPosting` on
// an article, `Person` on the team page, a `BreadcrumbList` on anything below
// the homepage. `basePage` merges the two halves into a single `@graph`, which
// is what lets a page-specific node point at the company with `{"@id": …}`
// instead of restating it.
//
// Why it exists at all: the site had no structured data of any kind, so an
// answer engine had no machine-readable statement of who SmartAgents is, what
// it sells or who wrote the articles — and the four articles are the strongest
// thing on the site. Everything here is read off the same `t()` keys and the
// same page modules the visible page is built from, so a claim in the graph
// cannot outlive the sentence it was made from.
//
// One rule: nothing in here may say something the page does not. Structured
// data that describes a page the visitor cannot see is the thing search engines
// penalise, and it is also just untrue.
import { SITE_ORIGIN, absolute, defaultLanguage, languages, pagePath } from '../../build/lib/i18n.mjs';
import { EMAIL, PHONE } from '../components/contact-form/contact-form.mjs';

export const LINKEDIN_URL = 'https://www.linkedin.com/company/smartagents-be/';

/* Stable node identities. A `@id` is what makes the graph a graph rather than a
   pile of repeated objects: the company is declared once per document and every
   other node refers to it. They are fragment URLs on the origin, not on the
   page, so the same company node is the same node on all 57 pages. */
export const ORGANISATION_ID = `${SITE_ORIGIN}/#organisation`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const founderId = (key) => `${SITE_ORIGIN}/#${key}`;

/** The default share card, 1200×630 (scripts/make-social-images.mjs). */
export const OG_IMAGE = {
  href: '/media/og-default.png',
  width: 1200,
  height: 630
};

/**
 * The two founders. The names, the portraits and the profile URLs live in
 * `src/pages/team.mjs`, which is where the page renders them from; this is the
 * same list keyed for the graph, and it is short enough that duplicating it
 * costs less than a shared module that both would have to import.
 */
const FOUNDERS = [
  { key: 'axel', name: 'Axel Segers', linkedin: 'https://www.linkedin.com/in/axelsegers/' },
  { key: 'tom', name: 'Tom Haeldermans', linkedin: 'https://www.linkedin.com/in/tom-haeldermans-862172117/' }
];

/**
 * The registered seat, split into the fields schema.org wants.
 *
 * The footer prints the two as one line, because a reader reads an address as a
 * line; a `PostalAddress` wants the street, the town and the postcode apart,
 * which is the only reason they are still two keys.
 * They are the register's own values (KBO/BCE, enterprise number 1037.114.694)
 * and are the same in all three languages, so they are constants here rather
 * than keys — only the country's *name* translates, and `addressCountry` takes
 * the ISO code instead.
 */
const SEAT = {
  postalCode: '3580',
  addressLocality: 'Beringen',
  addressCountry: 'BE'
};

/** `BE 1037.114.694` as the VAT identifier wants it: no spaces, no dots. */
const VAT_ID = 'BE1037114694';

/** Drops keys with no value, so an absent field is absent rather than null. */
function node(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null));
}

/** An `ImageObject` for a file under /media/, with the dimensions it really has. */
export function imageNode(href, width, height) {
  return node({
    '@type': 'ImageObject',
    url: absolute(href),
    width,
    height
  });
}

/* ------------------------------------------------------------------ *
 * The two nodes every page carries
 * ------------------------------------------------------------------ */

export function organisationNode(t) {
  return node({
    '@type': 'Organization',
    '@id': ORGANISATION_ID,
    name: 'SmartAgents',
    legalName: t('footer.company'),
    url: SITE_ORIGIN,
    logo: imageNode('/media/smartagents-mark.png', 512, 512),
    image: imageNode(OG_IMAGE.href, OG_IMAGE.width, OG_IMAGE.height),
    description: t('home.description'),
    email: EMAIL,
    telephone: PHONE,
    vatID: VAT_ID,
    address: node({
      '@type': 'PostalAddress',
      streetAddress: t('footer.street'),
      ...SEAT
    }),
    areaServed: { '@type': 'Country', name: 'Belgium' },
    founder: FOUNDERS.map((founder) => ({ '@id': founderId(founder.key) })),
    sameAs: [LINKEDIN_URL]
  });
}

export function websiteNode(t) {
  return node({
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_ORIGIN,
    name: 'SmartAgents',
    description: t('home.description'),
    publisher: { '@id': ORGANISATION_ID },
    inLanguage: languages.map((language) => language.code)
  });
}

/* ------------------------------------------------------------------ *
 * What a page adds
 * ------------------------------------------------------------------ */

/**
 * The trail from the language root to this page. Emitted by every page below
 * the homepage and by nothing else, because a breadcrumb whose only step is the
 * page you are on is not a trail.
 *
 * @param {Array<{name: string, url: string}>} steps — the root first, this page last.
 */
export function breadcrumbNode(steps) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: absolute(step.url)
    }))
  };
}

/** One of the four things the company sells, as its own page says it. */
export function serviceNode({ t, lang, url, key }) {
  return node({
    '@type': 'Service',
    '@id': `${absolute(url)}#service`,
    name: t(`service.${key}.title`),
    description: t(`service.${key}.body`),
    serviceType: t(`service.${key}.title`),
    url: absolute(url),
    provider: { '@id': ORGANISATION_ID },
    areaServed: { '@type': 'Country', name: 'Belgium' },
    inLanguage: lang
  });
}

/**
 * One article. `author` is the company rather than a person: the pieces are
 * published under the SmartAgents byline and the site prints no byline of its
 * own, and inventing one here would be the exact thing the rule at the top of
 * this file forbids.
 */
export function articleNode({ t, lang, url, key, published, image }) {
  return node({
    '@type': 'BlogPosting',
    '@id': `${absolute(url)}#article`,
    headline: t(`article.${key}.title`),
    description: t(`article.${key}.body`),
    image,
    datePublished: published,
    dateModified: published,
    author: { '@id': ORGANISATION_ID },
    publisher: { '@id': ORGANISATION_ID },
    inLanguage: lang,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: absolute(url)
  });
}

/** The founders, for the team page. */
export function founderNodes(t) {
  return FOUNDERS.map((founder) =>
    node({
      '@type': 'Person',
      '@id': founderId(founder.key),
      name: founder.name,
      description: t(`team.person.${founder.key}.body`),
      image: absolute(`/media/team/${founder.key}-440.jpg`),
      worksFor: { '@id': ORGANISATION_ID },
      sameAs: [founder.linkedin]
    })
  );
}

/* ------------------------------------------------------------------ *
 * The document
 * ------------------------------------------------------------------ */

/**
 * The whole graph for one rendered page: the company, the site, and whatever
 * the page module contributed.
 */
export function schemaGraph({ t, extra = [] }) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organisationNode(t), websiteNode(t), ...extra]
  };
}

/** The language root, for the first step of every breadcrumb. */
export const homeStep = (t, lang) => ({ name: t('nav.home'), url: pagePath(lang) });

export { defaultLanguage };
