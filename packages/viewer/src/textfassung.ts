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
import type { Katalog, Seite } from './katalog-typen.ts';

const ERSATZ: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/** For values that reach us unescaped — title, chapter labels, colour. */
export function maskiere(text: string): string {
  return text.replace(/[&<>"]/g, (z) => ERSATZ[z] ?? z);
}

/** Falls back to the page number when a page carries no text at all. */
export function baueAltText(seite: Seite, gesamt: number): string {
  const worte = seite.text_html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (worte.length === 0) return `Seite ${seite.nr} von ${gesamt} — ohne Text`;

  const anfang = worte.slice(0, 110);
  const gekuerzt = worte.length > 110 ? `${anfang.replace(/\s\S*$/, '')} …` : anfang;
  return `Seite ${seite.nr} von ${gesamt}: ${gekuerzt}`;
}

function baueInhaltsverzeichnis(katalog: Katalog): string {
  if (katalog.toc.length === 0) return '';

  const punkte = katalog.toc
    .map(
      (e) =>
        `      <li><a href="#seite-${e.seite}">${maskiere(e.label)}</a> ` +
        `<span class="seitenzahl">Seite ${e.seite}</span></li>`,
    )
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
            src="/katalog/${seite.bild}"
            width="${seite.breite}"
            height="${seite.hoehe}"
            loading="lazy"
            decoding="async"
            alt="${maskiere(baueAltText(seite, gesamt))}">
        </div>
      </section>`;
}

export function baueTextfassung(katalog: Katalog): string {
  const titel = maskiere(katalog.titel);
  const farbe = /^#[0-9a-fA-F]{6}$/.test(katalog.akzentfarbe) ? katalog.akzentfarbe : '#0057a0';

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
      <a href="/katalog/${maskiere(katalog.download_pdf)}" download>PDF herunterladen</a>
    </p>
  </header>

  <main id="inhalt">
${baueInhaltsverzeichnis(katalog)}
${seiten}
  </main>

  <footer>
    <p>${katalog.seitenzahl} Seiten · erzeugt am ${maskiere(katalog.erzeugt_am.slice(0, 10))}</p>
  </footer>
</body>
</html>
`;
}
