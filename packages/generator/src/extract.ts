/**
 * Pulls text out of the PDF — twice, for two different consumers.
 *
 *   text_html  → the accessible text route and what search engines index
 *   Suchindex  → plain text for client-side full-text search
 *
 * Both come from one `pdftotext` run per page. This is the reason the whole
 * project can afford an HTML text version at all: the text is extracted for
 * search anyway, the first draft of the brief merely threw it away.
 */
import { fuehreAus } from './pdf-tools.ts';
import type { SuchindexEintrag, TocEintrag } from './types.ts';

/** Table of contents as parsed — the file position is added later. */
export type TocRoheintrag = Omit<TocEintrag, 'index'>;

/**
 * `-layout` is deliberately NOT used. It preserves the visual column layout but
 * leaves words broken across lines — 21 of them in the reference catalogue
 * ("rich-\ntigen"). Without it Poppler rejoins them.
 */
export async function extrahiereSeitentext(
  pdfPfad: string,
  seitenNr: number,
): Promise<string> {
  return await fuehreAus('pdftotext', [
    '-f',
    String(seitenNr),
    '-l',
    String(seitenNr),
    '-enc',
    'UTF-8',
    pdfPfad,
    '-',
  ]);
}

export async function extrahiereAlleSeiten(
  pdfPfad: string,
  seitenzahl: number,
): Promise<string[]> {
  const texte: string[] = [];
  for (let nr = 1; nr <= seitenzahl; nr++) {
    texte.push(bereinigeText(await extrahiereSeitentext(pdfPfad, nr)));
  }
  return texte;
}

/** Invisible in print, poison for a search index. */
const WEICHES_TRENNZEICHEN = /­/g;
/** Typographic spaces that should compare equal to a plain one. */
const SONDER_LEERZEICHEN = /[    ]/g;

/**
 * Removes typesetting artefacts that InDesign leaves in the text layer.
 *
 * A soft hyphen inside a word is invisible on screen but splits the word for
 * any string comparison — searching for "zuverlässige" would silently miss a
 * page containing "zuver­lässige". Unicode is normalised to NFC so that
 * composed and decomposed umlauts compare equal.
 */
export function bereinigeText(rohText: string): string {
  return rohText
    .replace(WEICHES_TRENNZEICHEN, '')
    .replace(SONDER_LEERZEICHEN, ' ')
    .normalize('NFC');
}

const HTML_ERSATZ: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

export function maskiereHtml(text: string): string {
  return text.replace(/[&<>"]/g, (z) => HTML_ERSATZ[z] ?? z);
}

/**
 * Turns raw page text into paragraphs.
 *
 * Headings are not detected. Doing that properly needs the PDF's tag tree,
 * which pdftotext does not expose — guessing from line length would produce
 * wrong headings, and a wrong heading structure is worse for screen reader
 * users than none at all.
 */
export function baueTextHtml(rohText: string): string {
  // Blank-line split uses an explicit class instead of \s — \s matches \n too,
  // which makes the pattern ambiguous and prone to catastrophic backtracking.
  const absaetze = rohText
    .split(/\n[ \t\r]*\n/)
    .map((a) => a.replace(/\s+/g, ' ').trim())
    .filter((a) => a.length > 0);

  return absaetze.map((a) => `<p>${maskiereHtml(a)}</p>`).join('\n');
}

/** Collapses whitespace so the search index stays small and comparable. */
export function normalisiereFuerSuche(rohText: string): string {
  return rohText.replace(/\s+/g, ' ').trim();
}

export function baueSuchindex(seitentexte: string[]): SuchindexEintrag[] {
  return seitentexte
    .map((text, i) => ({ seite: i + 1, text: normalisiereFuerSuche(text) }))
    .filter((e) => e.text.length > 0);
}

/** A table of contents needs at least this many entries to be believable. */
const MIN_TOC_EINTRAEGE = 3;

/** How far into the document we look for the contents page. */
const TOC_SUCHTIEFE = 8;

/**
 * Reads the table of contents off the printed contents page.
 *
 * Poppler exposes no way to dump PDF bookmarks, and the reference catalogue
 * carries its contents as a normal page anyway. Layout there is:
 *
 *     Vorwort\t\t\t\t
 *     (blank)
 *     4
 *
 * so a line holding nothing but a number closes the entry that precedes it.
 * Returns an empty list when nothing convincing is found — a wrong table of
 * contents would be worse than none.
 */
export function findeTocAufSeite(seitentext: string): TocRoheintrag[] {
  const zeilen = seitentext
    .split('\n')
    .map((z) => z.trimEnd())
    .filter((z) => z.trim().length > 0);

  const eintraege: TocRoheintrag[] = [];
  let offenesLabel: string | undefined;

  for (const zeile of zeilen) {
    const inhalt = zeile.trim();
    const nurZahl = /^\d{1,4}$/.test(inhalt);

    if (nurZahl) {
      if (offenesLabel) {
        eintraege.push({ label: offenesLabel, seite: Number(inhalt) });
        offenesLabel = undefined;
      }
      continue;
    }

    // "Impressum   45" — label and number on the same line. Split by hand
    // rather than by regex: a pattern like /^(.*\S)\s+(\d+)$/ backtracks badly
    // on long lines, and page text can be arbitrarily long.
    const teile = inhalt.split(/[ \t]+/);
    const letztes = teile.at(-1);
    if (teile.length >= 2 && letztes !== undefined && ZAHL.test(letztes)) {
      const label = saubereLabel(teile.slice(0, -1).join(' '));
      if (label.length > 0) {
        eintraege.push({ label, seite: Number(letztes) });
        offenesLabel = undefined;
        continue;
      }
    }

    offenesLabel = saubereLabel(inhalt);
  }

  return eintraege;
}

const ZAHL = /^\d{1,4}$/;

/**
 * Strips the dot leaders that run towards the page number.
 *
 * Done as a loop rather than /[.…]+$/ — an anchored quantified class degrades
 * to quadratic time on a long run of dots, and dot leaders are exactly that.
 */
function saubereLabel(roh: string): string {
  const einzeilig = roh.replace(/\s+/g, ' ').trim();

  let ende = einzeilig.length;
  while (ende > 0) {
    const zeichen = einzeilig[ende - 1];
    if (zeichen !== '.' && zeichen !== '…') break;
    ende--;
  }

  return einzeilig.slice(0, ende).trim();
}

/**
 * Keeps only entries whose page numbers keep climbing.
 *
 * A table of contents counts upwards. Anything that does not is noise from the
 * same page — the running footer "Seite 3" for instance parses as a perfectly
 * valid entry and would otherwise end up in the navigation.
 *
 * Chapters that share a starting page are dropped as collateral. That is the
 * cheaper mistake: a missing entry is invisible, a wrong one sends readers to
 * the wrong page.
 */
function nurAufsteigend(eintraege: TocRoheintrag[]): TocRoheintrag[] {
  const behalten: TocRoheintrag[] = [];
  let letzteSeite = 0;

  for (const eintrag of eintraege) {
    if (eintrag.seite <= letzteSeite) continue;
    behalten.push(eintrag);
    letzteSeite = eintrag.seite;
  }

  return behalten;
}

/**
 * Difference between printed page numbers and PDF page positions.
 *
 * A table of contents cites the number printed on the page. Many catalogues
 * carry unnumbered front matter, so printed page 4 can be the 6th page of the
 * file — and a table of contents that jumps by the printed number would land
 * two pages off, on every single entry.
 *
 * Pages usually print their number in the footer ("Seite 12"). Comparing that
 * against the page's position gives the offset. A majority vote guards against
 * a stray number somewhere in the body text.
 *
 * Returns 0 when nothing can be determined — then printed number and position
 * are assumed to be the same, which is the common case.
 */
/** Zeilenweise statt per Sammelausdruck — der wäre auf langen Seiten anfällig. */
const FUSSZEILE = /^(?:Seite|Page)[ \t]+(\d{1,4})$/;

export function lesGedruckteSeitenzahl(seitentext: string): number | undefined {
  for (const zeile of seitentext.split('\n')) {
    const treffer = FUSSZEILE.exec(zeile.trim());
    if (treffer?.[1]) return Number(treffer[1]);
  }
  return undefined;
}

export function findeSeitenversatz(seitentexte: string[]): number {
  const stimmen = new Map<number, number>();

  seitentexte.forEach((text, i) => {
    const gedruckt = lesGedruckteSeitenzahl(text);
    if (gedruckt === undefined) return;

    const versatz = i + 1 - gedruckt;
    stimmen.set(versatz, (stimmen.get(versatz) ?? 0) + 1);
  });

  let besterVersatz = 0;
  let besteAnzahl = 0;
  for (const [versatz, anzahl] of stimmen) {
    if (anzahl > besteAnzahl) {
      besterVersatz = versatz;
      besteAnzahl = anzahl;
    }
  }

  // Ein einzelner Fund ist zu wenig — das kann eine Zahl im Fließtext sein.
  return besteAnzahl >= 2 ? besterVersatz : 0;
}

/** Maps printed page numbers to positions in the file. */
export function versetzeToc(
  toc: TocRoheintrag[],
  versatz: number,
  seitenzahl: number,
): TocEintrag[] {
  return toc.map((eintrag) => ({
    ...eintrag,
    index: Math.min(Math.max(eintrag.seite + versatz, 1), seitenzahl),
  }));
}

export function findeToc(seitentexte: string[]): TocRoheintrag[] {
  const tiefe = Math.min(TOC_SUCHTIEFE, seitentexte.length);

  for (let i = 0; i < tiefe; i++) {
    const text = seitentexte[i];
    if (!text || !/inhalt|content/i.test(text)) continue;

    const plausibel = findeTocAufSeite(text).filter(
      (e) => e.label.length > 1 && e.seite >= 1 && e.seite <= seitentexte.length,
    );
    const eintraege = nurAufsteigend(plausibel);
    if (eintraege.length >= MIN_TOC_EINTRAEGE) return eintraege;
  }

  return [];
}
