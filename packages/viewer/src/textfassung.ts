/**
 * Builds the HTML text version of a catalogue.
 *
 * This is not a fallback — it is the foundation. Three requirements need the
 * catalogue text as real HTML rather than pixels: BFSG accessibility, Google
 * indexing, and use without a mouse. The flipbook is the surface on top.
 *
 * In phase 1 this moves into Astro as one route per page. The markup produced
 * here is the template for it.
 */
import { sichereAkzentfarbe } from './farbe.ts';
import type { Katalog, Seite } from './katalog-typen.ts';

// Gleicher Name wie maskiereHtml im Generator (extract.ts): identisches Konzept,
// über die bewusst getrennte Paketgrenze hinweg absichtlich nicht geteilt.
const HTML_ERSATZ: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/** For values that reach us unescaped — title, chapter labels, image paths. */
export function maskiereHtml(text: string): string {
  return text.replace(/[&<>"]/g, (z) => HTML_ERSATZ[z] ?? z);
}

const ALT_LAENGE = 110;

/**
 * Removes tags without a regular expression.
 *
 * `/<[^>]+>/g` degrades to quadratic time on input full of unclosed angle
 * brackets. Page text comes from foreign PDFs, so a linear scan is the safer
 * choice even though our own generator produces the markup.
 */
function ohneTags(html: string): string {
  let text = '';
  let imTag = false;

  for (const zeichen of html) {
    if (zeichen === '<') imTag = true;
    else if (zeichen === '>') imTag = false;
    else if (!imTag) text += zeichen;
  }

  return text;
}

/** Falls back to the page number when a page carries no text at all. */
export function baueAltText(seite: Seite, gesamt: number): string {
  const worte = ohneTags(seite.text_html).replace(/\s+/g, ' ').trim();

  if (worte.length === 0) return `Seite ${seite.nr} von ${gesamt} — ohne Text`;
  if (worte.length <= ALT_LAENGE) return `Seite ${seite.nr} von ${gesamt}: ${worte}`;

  // Am letzten vollständigen Wort abschneiden, nicht mitten hinein.
  const anfang = worte.slice(0, ALT_LAENGE);
  const letzteLuecke = anfang.lastIndexOf(' ');
  const gekuerzt = letzteLuecke > 0 ? anfang.slice(0, letzteLuecke) : anfang;

  return `Seite ${seite.nr} von ${gesamt}: ${gekuerzt} …`;
}

function baueInhaltsverzeichnis(katalog: Katalog): string {
  if (katalog.toc.length === 0) return '';

  const punkte = katalog.toc
    .map((e) => {
      // Die Sprungmarken heißen nach der Dateiposition, das Inhaltsverzeichnis
      // nennt die gedruckte Seitenzahl. Bei Katalogen mit unnummerierten
      // Vorsatzblättern sind das zwei verschiedene Zahlen.
      const ziel = e.index ?? e.seite;
      return (
        `      <li><a href="#seite-${ziel}">${maskiereHtml(e.label)}</a> ` +
        `<span class="seitenzahl">Seite ${e.seite}</span></li>`
      );
    })
    .join('\n');

  return `
    <nav class="toc" aria-labelledby="toc-titel">
      <h2 id="toc-titel">Inhalt</h2>
      <ol>
${punkte}
      </ol>
    </nav>`;
}

function baueSeite(seite: Seite, gesamt: number): string {
  const text =
    seite.text_html.length > 0
      ? seite.text_html
      : '<p class="ohne-text">Diese Seite enthält keinen auslesbaren Text.</p>';

  return `
      <section class="seite" id="seite-${seite.nr}" aria-labelledby="seite-${seite.nr}-titel">
        <h2 id="seite-${seite.nr}-titel">Seite ${seite.nr}</h2>
        <div class="seite-inhalt">
          <div class="seite-text">
${text}
          </div>
          <img
            src="/katalog/${maskiereHtml(seite.bild)}"
            width="${Number(seite.breite) || ''}"
            height="${Number(seite.hoehe) || ''}"
            loading="lazy"
            decoding="async"
            alt="${maskiereHtml(baueAltText(seite, gesamt))}">
        </div>
      </section>`;
}

export function baueTextfassung(katalog: Katalog): string {
  const titel = maskiereHtml(katalog.titel);
  const farbe = sichereAkzentfarbe(katalog.akzentfarbe);

  const seiten = katalog.seiten.map((s) => baueSeite(s, katalog.seitenzahl)).join('\n');

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titel} — Textfassung</title>
  <meta name="description" content="Textfassung des Katalogs ${titel}. Alle Inhalte als Text, ohne Blätterfunktion.">
  <link rel="stylesheet" href="/src/textfassung.css">
  <style>:root { --akzent: ${farbe}; }</style>
</head>
<body>
  <a class="skiplink" href="#inhalt">Zum Inhalt springen</a>

  <header>
    <h1>${titel}</h1>
    <p class="hinweis">
      Textfassung — alle Inhalte als Text, ohne Blätterfunktion.
      <a href="/">Zum Blätterkatalog</a> ·
      <a href="/katalog/${maskiereHtml(katalog.download_pdf)}" download>PDF herunterladen</a>
    </p>
  </header>

  <main id="inhalt">
${baueInhaltsverzeichnis(katalog)}
${seiten}
  </main>

  <footer>
    <p>${katalog.seitenzahl} Seiten · erzeugt am ${maskiereHtml(katalog.erzeugt_am.slice(0, 10))}</p>
  </footer>
</body>
</html>
`;
}
