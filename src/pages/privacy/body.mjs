// The privacy notice, in the three languages the site is published in.
//
// Every factual claim here is read off the code, not assumed, and the ones that
// are easy to get wrong are worth naming so the next person editing this knows
// what to re-check:
//
//   • The public pages set no cookies and load nothing third-party. Verified:
//     the only external host in a built public page is the LinkedIn href in the
//     footer, and it is a link, not a request. `localStorage` appears only under
//     /secured/, which is password-gated and internal.
//   • Art. 13 is answered item by item, 13(2)(e) included: "Wat we verzamelen"
//     ends by saying that nothing here is obligatory and what follows from not
//     giving it. That was the one sub-article the notice did not answer, which
//     is the kind of gap a DPO reading it notices first.
//   • The two ways to reach a person are both links. The number was plain text
//     and four ordinary spaces, so it broke across two lines at a 768px tablet
//     in English, at 500px in French and at 1024 in Dutch — and it was the one
//     SmartAgents phone number on the site that was not a `tel:`, on the page
//     where it is an art. 13(1)(a) contact detail rather than a convenience.
//     `.prose a[href^="tel:"]` is `white-space: nowrap`, which is the same
//     answer the footer's legal microline already gives.
//   • The clause says "no cookies *of our own*", not "no cookies", and the two
//     strings outside this file that summarise it — `privacy.description`, which
//     is the page's own search snippet, and `faq.data.a`, which ships as
//     `FAQPage` structured data — carry the same qualifier. They did not, for a
//     round: the body conceded that touching the form loads Turnstile, which may
//     place a technical value of its own, while the snippet a reviewer reads
//     first said none ever is.
//   • /secured/ does set one cookie, and the notice says so. `export_session` is
//     written by `functions/secured/login.js` — HttpOnly, Secure, SameSite=Strict,
//     `Max-Age=604800`, scoped to the secured path. Two drafts of the Cookies
//     clause said this site sets no cookies at all, which is false in the
//     absolute on a page whose whole posture is that every claim is read off the
//     code. Seven days is that Max-Age, not a rounding.
//   • Turnstile loads on the first interaction with the form and never before —
//     `contact-form.js` binds it to `focusin` with `{ once: true }`.
//   • The rate limiter keys on the caller's IP and stores the counter in
//     Cloudflare KV with `expirationTtl: 7200`, so that record is gone two hours
//     later. That is a real number, not a rounded one.
//   • n8n forwards; it does not store. The message lands in Slack and in the
//     mailbox, which is where retention actually applies.
//
// The 24-month retention is a commitment, not an observation: nothing in the
// code enforces it, so it has to be honoured by hand in Slack and the mailbox.
// Shorten the number here if that is not realistic.
//
// The opening sentence is not in here. It is `privacy.lede` in src/i18n, printed
// in the head as the standfirst every other page on the site carries — it is the
// one line that says what the document is, and as the first block of the body it
// sat under the clause index at every width below 1000px, which put the summary
// after its own table of contents. Everything from the first `h2` down is here.
//
// One href in the copy is not a URL: `clause:NN` is the NNth `h2` of this
// notice, resolved in privacy.mjs against the same derivation the clause index
// uses. A cross-reference inside a document nobody reads end to end has to be a
// link — "zie hieronder" is useless to a reader who arrived at that clause from
// the index — and hand-writing the anchor would be hand-keeping a number the
// rest of this page is generated precisely to avoid. The ordinal is safe
// because the three languages carry the same eight clauses in the same order.
//
// The copy is authored with the shared `prose` vocabulary (src/pages/prose.mjs),
// which is what lets a Dutch or French sentence carry its apostrophes unescaped.
import { p, h2, list } from '../prose.mjs';

const CONTROLLER = 'SmartAgents BV';
const VAT = 'BE 1037.114.694';
const EMAIL = 'info@smartagents.be';
const PHONE = '+32 11 11 10 20';
/* Repeated from `components/contact-form/contact-form.mjs` rather than imported
   from it: that module imports the privacy page for the form's own consent
   line, so importing it back from here would close a cycle and put these
   constants in the temporal dead zone depending on which side is evaluated
   first. Two strings, and the number is the same one in the footer. */
const PHONE_HREF = 'tel:+3211111020';

/* ------------------------------------------------------------------ *
 * Nederlands
 * ------------------------------------------------------------------ */

const nl = [
  h2`Wie is verantwoordelijk`,
  p`${CONTROLLER}, ${VAT}, Mijnschoolstraat 18, 3580 Beringen, België, is de
    verwerkingsverantwoordelijke. U bereikt ons op
    [${EMAIL}](mailto:${EMAIL}) of op [${PHONE}](${PHONE_HREF}). We hebben geen
    functionaris voor gegevensbescherming aangesteld: daarvoor zijn we te klein,
    en uw vraag komt bij een van de twee zaakvoerders terecht.`,

  h2`Wat we verzamelen`,
  p`Er is één plek op deze website waar u gegevens achterlaat, en dat is het
    contactformulier. Daarnaast verwerken we, zoals elke website, technische
    gegevens die nodig zijn om de pagina te tonen en om misbruik tegen te gaan.`,
  list([
    `**Het contactformulier.** Uw naam, uw e-mailadres en uw bericht, en uw
     bedrijf als u dat invult. Het formulier stuurt ook twee verborgen velden
     mee: een vaste onderwerpregel en de naam van de pagina waarop u het
     invulde, zodat we weten waarover uw vraag gaat.`,
    `**Uw IP-adres.** Onze server gebruikt het om te controleren dat u een mens
     bent en om te tellen hoeveel berichten er vanaf één adres komen.`,
    `**Gewone serverlogs** bij onze hostingpartner, die horen bij het uitleveren
     van een webpagina.`
  ]),
  p`U bent niet verplicht ons iets te geven. Het formulier invullen is een
    keuze; laat u het staan, dan verandert er niets en missen we alleen de
    gegevens die we nodig hebben om u te antwoorden. Bellen of mailen kan
    natuurlijk ook.`,
  p`We verzamelen niets anders. Er is geen analytics, geen tracking, geen
    advertentiepixel en geen profilering op deze website. We nemen ook geen
    beslissingen over u op een geautomatiseerde manier.`,

  h2`Waarom, en op welke grond`,
  p`Uw bericht verwerken we om erop te antwoorden en om de stappen te zetten die
    u vraagt voor er eventueel een samenwerking is. Dat is artikel 6, lid 1, b)
    en f) van de AVG: de uitvoering van precontractuele stappen op uw verzoek,
    en ons gerechtvaardigd belang om op een vraag te kunnen antwoorden.`,
  p`Uw IP-adres verwerken we om het formulier te beschermen tegen spam en
    misbruik. Dat is artikel 6, lid 1, f): zonder die bescherming is een open
    formulier binnen een dag onbruikbaar.`,

  h2`Wie uw bericht te zien krijgt`,
  p`Uw bericht gaat niet verder dan deze partijen, en we verkopen of verhuren
    uw gegevens aan niemand.`,
  list([
    `**Cloudflare** host deze website, levert de spamcontrole (Turnstile) en
     bewaart kortstondig de teller die aan uw IP-adres hangt.`,
    `**n8n Cloud** (EU-regio) neemt uw bericht van onze server over en stuurt
     het door. Het bewaart uw bericht niet.`,
    `**Slack** is waar uw bericht bij ons binnenkomt, samen met een e-mail naar
     onze eigen mailbox.`
  ]),
  p`Cloudflare en Slack zijn bedrijven die gegevens ook buiten de Europese
    Economische Ruimte kunnen verwerken. Dat gebeurt op basis van de
    standaardcontractbepalingen van de Europese Commissie; een kopie daarvan
    kunt u bij ons opvragen via [${EMAIL}](mailto:${EMAIL}). n8n Cloud draait in
    de EU-regio.`,

  h2`Hoe lang we het bijhouden`,
  list([
    `**Uw bericht** blijft in onze Slack en onze mailbox staan zolang we ermee
     bezig zijn, en daarna tot 24 maanden na ons laatste contact. Wordt u klant,
     dan valt uw dossier onder de bewaartermijnen van die samenwerking.`,
    `**De teller op uw IP-adres** verdwijnt automatisch na twee uur. Dat is geen
     schatting: de sleutel wordt met een vervaltermijn van 7200 seconden
     weggeschreven en daarna gewist.`,
    `**Serverlogs** vallen onder de bewaartermijnen van onze hostingpartner.`
  ]),
  p`Wilt u eerder weg, dan volstaat een mail. Zie [Uw rechten](clause:07).`,

  h2`Cookies`,
  p`Op de publieke pagina's van deze website plaatsen we zelf geen cookies, en er
    staat dan ook geen cookiebanner. Als u het contactformulier aanraakt, laadt
    de spamcontrole van Cloudflare, en die kan daarbij zelf een technisch gegeven
    plaatsen dat ze nodig heeft om de controle uit te voeren. Raakt u het
    formulier niet aan, dan gebeurt dat niet.`,
  p`Er is één uitzondering, en die ligt buiten het publieke deel van de site. Wie
    op het afgeschermde gedeelte inlogt, krijgt daarbij één strikt noodzakelijke
    sessiecookie die na zeven dagen vervalt. Die is er alleen om de aanmelding te
    onthouden; hij volgt u niet en hij komt niet op een publieke pagina terecht.`,
  p`Uw browser bewaart wel pagina's en afbeeldingen van deze site zodat ze de
    tweede keer sneller openen. Dat blijft op uw eigen toestel, bevat geen
    persoonsgegevens, en u wist het met de gewone knop om browsergegevens te
    verwijderen.`,

  h2`Uw rechten`,
  p`U hebt het recht om uw gegevens in te kijken, te laten verbeteren of te
    laten wissen, om de verwerking te laten beperken, om er bezwaar tegen te
    maken, en om ze in een leesbaar formaat mee te krijgen. Mail naar
    [${EMAIL}](mailto:${EMAIL}) en we handelen het binnen de maand af. We vragen
    geen kosten en we vragen ook niet meer bewijs dan nodig om zeker te zijn dat
    u het bent.`,
  p`Bent u niet tevreden met hoe we dat doen, dan kunt u klacht indienen bij de
    Gegevensbeschermingsautoriteit, Drukpersstraat 35, 1000 Brussel,
    [contact@apd-gba.be](mailto:contact@apd-gba.be). We horen het liever eerst
    zelf, maar dat recht staat los van ons.`,

  h2`Wijzigingen`,
  p`Verandert er iets aan wat we verwerken, dan passen we deze pagina aan en
    verzetten we de datum bovenaan. Er is geen archief van oudere versies: de
    pagina beschrijft wat de website vandaag doet.`
];

/* ------------------------------------------------------------------ *
 * English
 * ------------------------------------------------------------------ */

const en = [
  h2`Who is responsible`,
  p`${CONTROLLER}, ${VAT}, Mijnschoolstraat 18, 3580 Beringen, Belgium, is the data controller.
    You can reach us at [${EMAIL}](mailto:${EMAIL}) or on
    [${PHONE}](${PHONE_HREF}). We have not
    appointed a data protection officer: we are too small to need one, and your
    question reaches one of the two founders.`,

  h2`What we collect`,
  p`There is one place on this site where you leave data behind, and that is the
    contact form. Beyond it we process, as every website does, the technical
    data needed to serve a page and to keep the form from being abused.`,
  list([
    `**The contact form.** Your name, your e-mail address and your message, plus
     your company if you fill it in. The form also sends two hidden fields: a
     fixed subject line and the name of the page you filled it in on, so we know
     what your question is about.`,
    `**Your IP address.** Our server uses it to check that you are a person and
     to count how many messages come from one address.`,
    `**Ordinary server logs** at our hosting provider, of the kind that come
     with serving a web page.`
  ]),
  p`You are under no obligation to give us anything. Filling in the form is a
    choice; leave it and nothing changes, except that we do not have what we
    would need in order to answer you. Calling or mailing works just as well.`,
  p`We collect nothing else. There is no analytics, no tracking, no advertising
    pixel and no profiling on this site. We also make no automated decisions
    about you.`,

  h2`Why, and on what basis`,
  p`We process your message in order to answer it and to take the steps you are
    asking for before there is any engagement. That is article 6(1)(b) and (f)
    of the GDPR: pre-contractual steps at your own request, and our legitimate
    interest in being able to answer a question.`,
  p`We process your IP address to protect the form against spam and abuse. That
    is article 6(1)(f): without that protection an open form is unusable within
    a day.`,

  h2`Who sees your message`,
  p`Your message goes no further than these parties, and we neither sell nor
    rent your data to anyone.`,
  list([
    `**Cloudflare** hosts this site, provides the spam check (Turnstile) and
     briefly holds the counter attached to your IP address.`,
    `**n8n Cloud** (EU region) takes your message from our server and forwards
     it. It does not store it.`,
    `**Slack** is where your message arrives with us, alongside an e-mail to our
     own mailbox.`
  ]),
  p`Cloudflare and Slack are companies that may also process data outside the
    European Economic Area. That happens under the European Commission's
    standard contractual clauses; mail [${EMAIL}](mailto:${EMAIL}) for a copy of
    them. n8n Cloud runs in the EU region.`,

  h2`How long we keep it`,
  list([
    `**Your message** stays in our Slack and our mailbox while we are working on
     it, and after that for up to 24 months from our last contact. If you become
     a client, your file falls under the retention terms of that engagement.`,
    `**The counter on your IP address** disappears automatically after two
     hours. That is not an estimate: the key is written with an expiry of 7200
     seconds and deleted afterwards.`,
    `**Server logs** fall under our hosting provider's retention terms.`
  ]),
  p`If you would rather we removed it sooner, an e-mail is enough. See
    [Your rights](clause:07).`,

  h2`Cookies`,
  p`On the public pages of this site we set no cookies of our own, which is why
    there is no cookie banner. If you interact with the contact form,
    Cloudflare's spam check loads, and it may itself place a technical value it
    needs in order to run the check. If you do not touch the form, that does not
    happen.`,
  p`There is one exception, and it sits outside the public part of the site.
    Signing in to the password-protected area sets a single strictly necessary
    session cookie that expires after seven days. It is there to remember the
    sign-in and nothing else; it does not follow you, and it never reaches a
    public page.`,
  p`Your browser does keep pages and images from this site so that they open
    faster the second time. That stays on your own device, holds no personal
    data, and clears with the ordinary button for clearing browsing data.`,

  h2`Your rights`,
  p`You have the right to see your data, to have it corrected or erased, to have
    the processing restricted, to object to it, and to receive it in a readable
    format. Mail [${EMAIL}](mailto:${EMAIL}) and we will deal with it within a
    month. We charge nothing, and we ask for no more proof than we need to be
    sure it is you.`,
  p`If you are not satisfied with how we handle it, you can complain to the
    Belgian Data Protection Authority, Drukpersstraat 35, 1000 Brussels,
    [contact@apd-gba.be](mailto:contact@apd-gba.be). We would rather hear it
    first ourselves, but that right does not depend on us.`,

  h2`Changes`,
  p`If what we process changes, we change this page and move the date at the
    top. There is no archive of older versions: the page describes what the site
    does today.`
];

/* ------------------------------------------------------------------ *
 * Français
 * ------------------------------------------------------------------ */

const fr = [
  h2`Qui est responsable`,
  p`${CONTROLLER}, ${VAT}, Mijnschoolstraat 18, 3580 Beringen, en Belgique, est le responsable
    du traitement. Vous nous joignez à [${EMAIL}](mailto:${EMAIL}) ou au
    [${PHONE}](${PHONE_HREF}). Nous n'avons pas désigné de délégué à la
    protection des données :
    nous sommes trop petits pour y être tenus, et votre question arrive chez
    l'un des deux fondateurs.`,

  h2`Ce que nous recueillons`,
  p`Il y a un seul endroit sur ce site où vous laissez des données, et c'est le
    formulaire de contact. À côté de cela, nous traitons, comme tout site web,
    les données techniques nécessaires pour afficher une page et pour empêcher
    que le formulaire soit détourné.`,
  list([
    `**Le formulaire de contact.** Votre nom, votre adresse e-mail et votre
     message, ainsi que votre entreprise si vous la renseignez. Le formulaire
     envoie aussi deux champs masqués : une ligne d'objet fixe et le nom de la
     page depuis laquelle vous l'avez rempli, pour que nous sachions sur quoi
     porte votre question.`,
    `**Votre adresse IP.** Notre serveur s'en sert pour vérifier que vous êtes
     une personne et pour compter combien de messages proviennent d'une même
     adresse.`,
    `**Des journaux de serveur ordinaires** chez notre hébergeur, de ceux qui
     accompagnent la remise d'une page web.`
  ]),
  p`Vous n'êtes tenu de rien nous fournir. Remplir le formulaire est un choix ;
    si vous ne le faites pas, rien ne change, si ce n'est que nous n'avons pas ce
    qu'il nous faudrait pour vous répondre. Un appel ou un e-mail fait tout aussi
    bien l'affaire.`,
  p`Nous ne recueillons rien d'autre. Il n'y a sur ce site ni analytique, ni
    traçage, ni pixel publicitaire, ni profilage. Nous ne prenons pas non plus
    de décision automatisée à votre sujet.`,

  h2`Pourquoi, et sur quelle base`,
  p`Nous traitons votre message afin d'y répondre et d'accomplir les démarches
    que vous demandez avant toute collaboration. C'est l'article 6, paragraphe
    1, b) et f) du RGPD : des mesures précontractuelles prises à votre demande,
    et notre intérêt légitime à pouvoir répondre à une question.`,
  p`Nous traitons votre adresse IP pour protéger le formulaire du spam et des
    abus. C'est l'article 6, paragraphe 1, f) : sans cette protection, un
    formulaire ouvert devient inutilisable en une journée.`,

  h2`Qui voit votre message`,
  p`Votre message ne va pas plus loin que ces parties, et nous ne vendons ni ne
    louons vos données à qui que ce soit.`,
  list([
    `**Cloudflare** héberge ce site, fournit le contrôle antispam (Turnstile) et
     conserve brièvement le compteur rattaché à votre adresse IP.`,
    `**n8n Cloud** (région UE) reprend votre message depuis notre serveur et le
     transmet. Il ne le conserve pas.`,
    `**Slack** est l'endroit où votre message nous parvient, en même temps qu'un
     e-mail vers notre propre boîte.`
  ]),
  p`Cloudflare et Slack sont des sociétés susceptibles de traiter des données
    en dehors de l'Espace économique européen. Cela se fait sur la base des
    clauses contractuelles types de la Commission européenne ; vous pouvez nous
    en demander une copie à [${EMAIL}](mailto:${EMAIL}). n8n Cloud tourne dans la
    région UE.`,

  h2`Combien de temps nous le gardons`,
  list([
    `**Votre message** reste dans notre Slack et notre boîte mail tant que nous
     nous en occupons, puis jusqu'à 24 mois après notre dernier contact. Si vous
     devenez client, votre dossier relève des durées de conservation de cette
     collaboration.`,
    `**Le compteur lié à votre adresse IP** disparaît automatiquement après deux
     heures. Ce n'est pas une estimation : la clé est écrite avec une expiration
     de 7200 secondes, puis effacée.`,
    `**Les journaux de serveur** relèvent des durées de conservation de notre
     hébergeur.`
  ]),
  p`Si vous préférez que nous l'effacions plus tôt, un e-mail suffit. Voyez
    [Vos droits](clause:07).`,

  h2`Cookies`,
  p`Sur les pages publiques de ce site, nous ne déposons aucun cookie de notre
    fait, et c'est pourquoi il n'y a pas de bandeau cookies. Si vous interagissez
    avec le formulaire de contact, le contrôle antispam de Cloudflare se charge,
    et il peut lui-même déposer une valeur technique dont il a besoin pour
    effectuer ce contrôle. Si vous ne touchez pas au formulaire, cela n'arrive
    pas.`,
  p`Il y a une exception, et elle se situe hors de la partie publique du site.
    Toute personne qui se connecte à l'espace protégé par mot de passe reçoit un
    seul cookie de session strictement nécessaire, qui expire après sept jours.
    Il ne sert qu'à mémoriser la connexion : il ne vous suit pas et n'arrive
    jamais sur une page publique.`,
  p`Votre navigateur conserve en revanche des pages et des images de ce site
    pour qu'elles s'ouvrent plus vite la deuxième fois. Cela reste sur votre
    appareil, ne contient pas de données personnelles, et s'efface avec le
    bouton habituel de suppression des données de navigation.`,

  h2`Vos droits`,
  p`Vous avez le droit de consulter vos données, de les faire rectifier ou
    effacer, d'en faire limiter le traitement, de vous y opposer, et de les
    recevoir dans un format lisible. Écrivez à
    [${EMAIL}](mailto:${EMAIL}) et nous traitons la demande dans le mois. Nous
    ne facturons rien et nous ne demandons pas plus de preuves qu'il n'en faut
    pour être sûrs qu'il s'agit bien de vous.`,
  p`Si notre manière de faire ne vous satisfait pas, vous pouvez introduire une
    plainte auprès de l'Autorité de protection des données, rue de la Presse 35,
    1000 Bruxelles, [contact@apd-gba.be](mailto:contact@apd-gba.be). Nous
    préférons l'entendre d'abord nous-mêmes, mais ce droit ne dépend pas de
    nous.`,

  h2`Modifications`,
  p`Si ce que nous traitons change, nous modifions cette page et déplaçons la
    date en haut. Il n'y a pas d'archive des versions antérieures : la page
    décrit ce que le site fait aujourd'hui.`
];

export const body = { nl, en, fr };
