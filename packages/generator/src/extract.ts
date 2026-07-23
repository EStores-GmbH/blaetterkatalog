/**
 * Holt Text aus dem PDF — zweimal, für zwei verschiedene Abnehmer.
 *
 *   text_html  → die barrierefreie Textroute und was Suchmaschinen indexieren
 *   Suchindex  → reiner Text für die clientseitige Volltextsuche
 *
 * Beide stammen aus einem `pdftotext`-Lauf je Seite — der Text wird ohnehin
 * für die Suche extrahiert, die HTML-Textfassung kostet also nichts extra.
 */
import { fuehreAus } from './pdf-tools.ts';
import type { SuchindexEintrag, TocEintrag } from './types.ts';

/** Inhaltsverzeichnis wie geparst — die Dateiposition wird später ergänzt. */
export type TocRoheintrag = Omit<TocEintrag, 'index'>;

/**
 * `-layout` wird bewusst NICHT verwendet. Es erhält das visuelle Spaltenlayout,
 * lässt aber Wörter über Zeilen getrennt — 21 davon im Referenzkatalog
 * ("rich-\ntigen"). Ohne die Option fügt Poppler sie wieder zusammen.
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

/** Im Druck unsichtbar, Gift für einen Suchindex. */
const WEICHES_TRENNZEICHEN = /­/g;
/** Typografische Leerzeichen, die einem gewöhnlichen gleichkommen sollen. */
const SONDER_LEERZEICHEN = /[    ]/g;

/**
 * Entfernt Satz-Artefakte, die InDesign in der Textebene hinterlässt.
 *
 * Ein weiches Trennzeichen innerhalb eines Wortes ist am Bildschirm unsichtbar,
 * zerteilt das Wort aber für jeden Zeichenkettenvergleich — die Suche nach
 * "zuverlässige" würde eine Seite mit "zuver­lässige" stillschweigend
 * übersehen. Unicode wird nach NFC normalisiert, damit zusammengesetzte und
 * zerlegte Umlaute gleich verglichen werden.
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
 * Wandelt rohen Seitentext in Absätze.
 *
 * Überschriften werden nicht erkannt. Das sauber zu machen bräuchte den
 * Tag-Baum des PDFs, den pdftotext nicht offenlegt — ein Raten nach Zeilenlänge
 * würde falsche Überschriften erzeugen, und eine falsche Überschriftenstruktur
 * ist für Screenreader-Nutzer schlimmer als gar keine.
 */
export function baueTextHtml(rohText: string): string {
  // Der Leerzeilen-Split nutzt eine explizite Zeichenklasse statt \s — \s passt
  // auch auf \n, was das Muster mehrdeutig und anfällig für katastrophales Backtracking macht.
  const absaetze = rohText
    .split(/\n[ \t\r]*\n/)
    .map((a) => a.replace(/\s+/g, ' ').trim())
    .filter((a) => a.length > 0);

  return absaetze.map((a) => `<p>${maskiereHtml(a)}</p>`).join('\n');
}

/** Fasst Whitespace zusammen, damit der Suchindex klein und vergleichbar bleibt. */
export function normalisiereFuerSuche(rohText: string): string {
  return rohText.replace(/\s+/g, ' ').trim();
}

export function baueSuchindex(seitentexte: string[]): SuchindexEintrag[] {
  return seitentexte
    .map((text, i) => ({ seite: i + 1, text: normalisiereFuerSuche(text) }))
    .filter((e) => e.text.length > 0);
}

/** So viele Einträge braucht ein Inhaltsverzeichnis mindestens, um glaubwürdig zu sein. */
const MIN_TOC_EINTRAEGE = 3;

/** Wie weit wir im Dokument nach der Inhaltsseite suchen. */
const TOC_SUCHTIEFE = 8;

/**
 * Liest das Inhaltsverzeichnis von der gedruckten Inhaltsseite ab.
 *
 * Poppler bietet keine Möglichkeit, PDF-Lesezeichen auszugeben, und der
 * Referenzkatalog trägt sein Inhaltsverzeichnis ohnehin als normale Seite.
 * Das Layout dort ist:
 *
 *     Vorwort\t\t\t\t
 *     (leer)
 *     4
 *
 * eine Zeile, die nur eine Zahl enthält, schließt also den vorangehenden
 * Eintrag ab. Liefert eine leere Liste, wenn nichts Überzeugendes gefunden
 * wird — ein falsches Inhaltsverzeichnis wäre schlimmer als keines.
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
    const nurZahl = ZAHL.test(inhalt);

    if (nurZahl) {
      if (offenesLabel) {
        eintraege.push({ label: offenesLabel, seite: Number(inhalt) });
        offenesLabel = undefined;
      }
      continue;
    }

    // "Impressum   45" — Label und Zahl auf derselben Zeile. Von Hand splitten
    // statt per Regex: ein Muster wie /^(.*\S)\s+(\d+)$/ backtrackt auf langen
    // Zeilen stark, und Seitentext kann beliebig lang sein.
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
 * Entfernt die Füllpunkte, die zur Seitenzahl hinlaufen.
 *
 * Als Schleife statt /[.…]+$/ — eine verankerte quantifizierte Zeichenklasse
 * wird bei einer langen Punktreihe quadratisch langsam, und Füllpunkte sind
 * genau das.
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
 * Behält nur Einträge, deren Seitenzahlen weiter steigen.
 *
 * Ein Inhaltsverzeichnis zählt aufwärts. Was das nicht tut, ist Rauschen von
 * derselben Seite — die laufende Fußzeile "Seite 3" etwa parst als völlig
 * gültiger Eintrag und landete sonst in der Navigation.
 *
 * Kapitel, die sich eine Anfangsseite teilen, fallen als Kollateralschaden
 * weg. Das ist der billigere Fehler: Ein fehlender Eintrag ist unsichtbar, ein
 * falscher schickt Leser auf die falsche Seite.
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
 * Unterschied zwischen gedruckten Seitenzahlen und PDF-Seitenpositionen.
 *
 * Ein Inhaltsverzeichnis nennt die auf der Seite gedruckte Zahl. Viele Kataloge
 * haben unnummerierte Vorsatzblätter, sodass die gedruckte Seite 4 die 6. Seite
 * der Datei sein kann — und ein Inhaltsverzeichnis, das nach der gedruckten
 * Zahl springt, läge bei jedem einzelnen Eintrag zwei Seiten daneben.
 *
 * Seiten drucken ihre Zahl meist in die Fußzeile ("Seite 12"). Der Vergleich
 * mit der Position der Seite ergibt den Versatz. Eine Mehrheitsentscheidung
 * schützt vor einer versprengten Zahl irgendwo im Fließtext.
 *
 * Liefert 0, wenn sich nichts bestimmen lässt — dann werden gedruckte Zahl und
 * Position als gleich angenommen, was der Normalfall ist.
 */
/** Zeilenweise statt per Sammelausdruck — der wäre auf langen Seiten anfällig. */
const FUSSZEILE = /^(?:Seite|Page)[ \t]+(\d{1,4})$/;

export function leseGedruckteSeitenzahl(seitentext: string): number | undefined {
  for (const zeile of seitentext.split('\n')) {
    const treffer = FUSSZEILE.exec(zeile.trim());
    if (treffer?.[1]) return Number(treffer[1]);
  }
  return undefined;
}

export function findeSeitenversatz(seitentexte: string[]): number {
  const stimmen = new Map<number, number>();

  seitentexte.forEach((text, i) => {
    const gedruckt = leseGedruckteSeitenzahl(text);
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

/** Bildet gedruckte Seitenzahlen auf Positionen in der Datei ab. */
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
