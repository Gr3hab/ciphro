/* CIPHRO · Sprachseiten für Suchmaschinen
   Erzeugt aus index.html (Startseite) die Seiten de/, en/, fr/ und it/ sowie sitemap.xml.

   Warum: Google und Bing wollen für jede Sprache eine eigene, feste Adresse, die immer in dieser Sprache
   erscheint, und Verweise zwischen den Sprachfassungen (hreflang). Die Startseite ciphro.eu/ wählt die Sprache
   selbst (gespeicherte Wahl, sonst Browsersprache) und ist deshalb die „x-default“-Seite.

   Jede Sprachseite ist das ganze Spiel (eine Kopie von index.html) mit
   – eigener <html lang>, eigenem Titel, eigener Beschreibung, eigener Vorschau (og:*),
   – canonical auf sich selbst, hreflang auf alle Sprachfassungen und die Startseite,
   – einem kurzen Text in der Sprache, den auch Suchmaschinen ohne JavaScript lesen,
   – <base href="../">, damit Schriften, Skripte und Bilder aus dem Hauptordner kommen.

   Aufruf (im Ordner _dev):
     node tools/sprachseiten.js           schreibt alle Dateien neu
     node tools/sprachseiten.js --pruefen  meldet nur, ob etwas veraltet ist (für die Tests)
   Nach jeder Änderung an index.html einmal ohne --pruefen laufen lassen. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = 'https://ciphro.eu/';
const LANGS = ['de', 'en', 'fr', 'it'];

// Texte je Sprache. Der Titel muss mit STR[lang].pageTitle in index.html übereinstimmen (prüft ein Test).
const T = {
  de: {
    title: 'CIPHRO · Tägliches Zahlenrätsel: Knacke den Code, entdecke den Fakt',
    description: 'Jeden Tag vier Zahlencodes von Easy bis Impossible. Jede Zahl ist ein Buchstabe, hinter jedem Code steckt ein wahrer Fakt. Kostenlos, ohne Anmeldung, ohne Werbung.',
    ogTitle: 'CIPHRO · Das tägliche Zahlenrätsel',
    ogDescription: 'Jede Zahl ist ein Buchstabe. Knacke den Code, dahinter steckt ein wahrer Fakt. Kostenlos, ohne Anmeldung, ohne Werbung.',
    image: 'og-de.png?v=3', imageAlt: 'CIPHRO: Knacke den Code. Entdecke den Fakt.', locale: 'de_AT',
    h2: 'Das tägliche Zahlenrätsel',
    intro: 'Jeden Tag gibt es vier Zahlencodes, von Easy bis Impossible. Jede Zahl steht für einen Buchstaben: A&nbsp;=&nbsp;1, B&nbsp;=&nbsp;2 … Z&nbsp;=&nbsp;26. Wer den Code knackt, entdeckt einen kurzen, wahren Fakt mit Quelle. Kostenlos, ohne Anmeldung, ohne Werbung.',
    js: 'Kein Rätsel zu sehen? CIPHRO läuft im Browser und braucht JavaScript. In einer Dateivorschau startet es nicht: Öffne den Link im Browser.'
  },
  en: {
    title: 'CIPHRO · Daily number puzzle: crack the code, reveal the fact',
    description: 'Four number codes every day, from Easy to Impossible. Each number is a letter, and each code hides a true fact. Free, no sign-up, no ads.',
    ogTitle: 'CIPHRO · Crack the code. Reveal the fact.',
    ogDescription: 'The daily number puzzle: each number is a letter. Crack the code and discover a true fact. Free, no sign-up, no ads.',
    image: 'og-en.png?v=3', imageAlt: 'CIPHRO: Crack the code. Reveal the fact.', locale: 'en_GB',
    h2: 'The daily number puzzle',
    intro: 'Every day there are four number codes, from Easy to Impossible. Each number stands for a letter: A&nbsp;=&nbsp;1, B&nbsp;=&nbsp;2 … Z&nbsp;=&nbsp;26. Crack the code and discover a short, true fact with its source. Free, no sign-up, no ads.',
    js: 'No puzzle showing? CIPHRO runs in your browser and needs JavaScript. It cannot start in a file preview: open the link in your browser.'
  },
  fr: {
    title: 'CIPHRO · Énigme chiffrée du jour : déchiffre le code',
    description: 'Chaque jour, quatre codes chiffrés, d’Easy à Impossible. Chaque nombre est une lettre et chaque code cache un fait vrai. Gratuit, sans inscription, sans pub.',
    ogTitle: 'CIPHRO · Déchiffre le code. Découvre le fait.',
    ogDescription: 'L’énigme chiffrée du jour : chaque nombre est une lettre. Déchiffre le code et découvre un fait vrai. Gratuit, sans inscription, sans pub.',
    image: 'og-fr.png?v=1', imageAlt: 'CIPHRO : Déchiffre le code. Découvre le fait.', locale: 'fr_FR',
    h2: 'L’énigme chiffrée du jour',
    intro: 'Chaque jour, quatre codes chiffrés t’attendent, d’Easy à Impossible. Chaque nombre représente une lettre&nbsp;: A&nbsp;=&nbsp;1, B&nbsp;=&nbsp;2 … Z&nbsp;=&nbsp;26. Déchiffre le code et découvre un fait court et vrai, avec sa source. Gratuit, sans inscription, sans pub.',
    js: 'Aucune énigme visible ? CIPHRO fonctionne dans le navigateur et a besoin de JavaScript. Il ne démarre pas dans un aperçu de fichier : ouvre le lien dans ton navigateur.'
  },
  it: {
    title: 'CIPHRO · Rompicapo numerico del giorno: decifra il codice',
    description: 'Ogni giorno quattro codici numerici, da Easy a Impossible. Ogni numero è una lettera e ogni codice nasconde un fatto vero. Gratis, senza account né pubblicità.',
    ogTitle: 'CIPHRO · Decifra il codice. Scopri il fatto.',
    ogDescription: 'Il rompicapo numerico del giorno: ogni numero è una lettera. Decifra il codice e scopri un fatto vero. Gratis, senza registrazione, senza pubblicità.',
    image: 'og-it.png?v=1', imageAlt: 'CIPHRO: Decifra il codice. Scopri il fatto.', locale: 'it_IT',
    h2: 'Il rompicapo numerico del giorno',
    intro: 'Ogni giorno ci sono quattro codici numerici, da Easy a Impossible. Ogni numero sta per una lettera: A&nbsp;=&nbsp;1, B&nbsp;=&nbsp;2 … Z&nbsp;=&nbsp;26. Decifra il codice e scopri un fatto breve e vero, con la sua fonte. Gratis, senza account né pubblicità.',
    js: 'Non vedi nessun enigma? CIPHRO funziona nel browser e ha bisogno di JavaScript. In un’anteprima del file non parte: apri il link nel browser.'
  }
};
const NAMES = { de: 'Deutsch', en: 'English', fr: 'Français', it: 'Italiano' };

const attr = s => String(s).replace(/&(?!nbsp;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const url = l => l ? SITE + l + '/' : SITE;

// Kopf: Titel, Beschreibung, canonical, hreflang, Vorschau. page = Sprache der Seite oder null für die Startseite.
function seoBlock(page) {
  const l = page || 'de', t = T[l];
  const lines = [
    `<title>${attr(t.title)}</title>`,
    `<meta name="description" content="${attr(t.description)}">`,
    `<link rel="canonical" href="${url(page)}">`,
    ...LANGS.map(x => `<link rel="alternate" hreflang="${x}" href="${url(x)}">`),
    `<link rel="alternate" hreflang="x-default" href="${url(null)}">`,
    `<meta property="og:site_name" content="CIPHRO">`,
    `<meta property="og:title" content="${attr(t.ogTitle)}">`,
    `<meta property="og:description" content="${attr(t.ogDescription)}">`,
    `<meta property="og:locale" content="${t.locale}">`,
    ...LANGS.filter(x => x !== l).map(x => `<meta property="og:locale:alternate" content="${T[x].locale}">`),
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${url(page)}">`,
    `<meta property="og:image" content="${SITE}${t.image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${attr(t.imageAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`
  ];
  // Name der Website für die Google-Ergebnisse: gehört nur auf die Startseite der Domain
  if (!page) lines.push('<script type="application/ld+json">' + JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebSite', name: 'CIPHRO', url: SITE,
    inLanguage: LANGS, description: T.de.description
  }) + '</script>');
  return lines.join('\n');
}

// Text im Spielfeld, bis das Spiel startet. Suchmaschinen ohne JavaScript lesen nur diesen.
function staticBlock(page) {
  const l = page || 'de', t = T[l];
  return [
    `      <div class="nojs" id="nojs">`,
    `        <h2>${t.h2}</h2>`,
    `        <p>${t.intro}</p>`,
    `        <p>${t.js}</p>`,
    `        <p class="langs">${LANGS.map(x => `<a href="${url(x)}" hreflang="${x}" lang="${x}">${NAMES[x]}</a>`).join(' · ')}</p>`,
    `      </div>`
  ].join('\n');
}

function between(s, a, b, inner, file) {
  const i = s.indexOf(a), j = s.indexOf(b);
  if (i < 0 || j < i) throw new Error(`${file}: Markierung ${a} oder ${b} fehlt`);
  const lineStart = s.lastIndexOf('\n', i) + 1, endOfA = s.indexOf('\n', i) + 1;
  const indentB = s.lastIndexOf('\n', j) + 1;
  return s.slice(0, endOfA) + inner + '\n' + s.slice(indentB);
}

function page(src, l) {
  let s = src;
  s = between(s, '<!-- SEO:ANFANG', '<!-- SEO:ENDE', seoBlock(l), 'index.html');
  s = between(s, '<!-- STATISCH:ANFANG', '<!-- STATISCH:ENDE', staticBlock(l), 'index.html');
  if (l) {
    if (!/<html lang="de">/.test(s)) throw new Error('index.html: <html lang="de"> nicht gefunden');
    s = s.replace('<html lang="de">', `<html lang="${l}" data-page-lang="${l}">`);
    s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<!-- Sprachseite: Dateien kommen aus dem Hauptordner. Erzeugt von _dev/tools/sprachseiten.js aus index.html, hier nicht von Hand ändern. -->\n<base href="../">');
  }
  return s;
}

function sitemap() {
  const alts = LANGS.map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${url(x)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(null)}"/>`).join('\n');
  const entry = l => `  <url>\n    <loc>${url(l)}</loc>\n${alts}\n  </url>`;
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    [null, ...LANGS].map(entry).join('\n') + '\n</urlset>\n';
}

function outputs() {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const out = { 'index.html': page(src, null), 'sitemap.xml': sitemap() };
  LANGS.forEach(l => { out[`${l}/index.html`] = page(src, l); });
  return out;
}

if (require.main === module) {
  const check = process.argv.includes('--pruefen');
  const stale = [];
  for (const [file, content] of Object.entries(outputs())) {
    const p = path.join(ROOT, file);
    const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (old === content) continue;
    stale.push(file);
    if (!check) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); }
  }
  if (check && stale.length) { console.error('Veraltet: ' + stale.join(', ') + '\nIm Ordner _dev ausführen: node tools/sprachseiten.js'); process.exit(1); }
  console.log(stale.length ? (check ? '' : 'Neu geschrieben: ' + stale.join(', ')) : 'Alles aktuell.');
}

module.exports = { outputs, T, LANGS, SITE };
