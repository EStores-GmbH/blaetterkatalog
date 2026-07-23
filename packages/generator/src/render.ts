/**
 * Rendert PDF-Seiten via `pdftoppm` zu JPEG-Bildern.
 *
 * Zwei Regeln bestimmen die Ausgabe, beide aus docs/ARCHITECTURE.md:
 *   1. Nur Einzelseiten — nie eine Doppelseite. Eine A4-Doppelseite bei 300 dpi
 *      ist 4961 px breit und überschreitet das Limit des Storyblok Image
 *      Service von 4000 px.
 *   2. Die längste Kante bleibt auf oder unter diesem Limit, die Auflösung wird
 *      also aus der Seitengröße abgeleitet statt fest verdrahtet.
 */
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fuehreAus } from './pdf-tools.ts';
import type { Ausrichtung } from './types.ts';

/** Der Storyblok Image Service weist alles Größere auf einer der Kanten ab. */
export const MAX_KANTE_PX = 4000;

/** Darüber gewinnen die eingebetteten Fotos eines Druck-PDFs keine Details mehr. */
export const STANDARD_DPI = 200;

const PT_PRO_ZOLL = 72;

export interface RenderErgebnis {
  dateien: string[];
  dpi: number;
  breite: number;
  hoehe: number;
  ausrichtung: Ausrichtung;
}

/**
 * Höchste Auflösung, deren längste Kante noch unter das Limit passt.
 * Liefert den Wunschwert unverändert, wenn er bereits passt.
 */
export function begrenzeDpi(breitePt: number, hoehePt: number, wunschDpi: number): number {
  const laengsteKantePt = Math.max(breitePt, hoehePt);
  const maxDpi = Math.floor((MAX_KANTE_PX * PT_PRO_ZOLL) / laengsteKantePt);
  return Math.min(wunschDpi, maxDpi);
}

export function bestimmeAusrichtung(breitePt: number, hoehePt: number): Ausrichtung {
  return breitePt > hoehePt ? 'quer' : 'hoch';
}

export function pixelMasse(breitePt: number, hoehePt: number, dpi: number): {
  breite: number;
  hoehe: number;
} {
  return {
    breite: Math.round((breitePt / PT_PRO_ZOLL) * dpi),
    hoehe: Math.round((hoehePt / PT_PRO_ZOLL) * dpi),
  };
}

export interface RenderOptionen {
  dpi?: number;
  /** JPEG-Qualität 1–100. Bei 85 hören die Artefakte auf, sichtbar zu sein. */
  qualitaet?: number;
}

export async function rendereSeiten(
  pdfPfad: string,
  zielVerzeichnis: string,
  breitePt: number,
  hoehePt: number,
  optionen: RenderOptionen = {},
): Promise<RenderErgebnis> {
  const wunschDpi = optionen.dpi ?? STANDARD_DPI;
  const qualitaet = optionen.qualitaet ?? 85;
  const dpi = begrenzeDpi(breitePt, hoehePt, wunschDpi);

  await mkdir(zielVerzeichnis, { recursive: true });

  // Alte Seitenbilder eines früheren Laufs entfernen. Sonst zählt readdir()
  // unten sie mit — hatte der vorige Katalog mehr Seiten, bricht der Generator
  // wegen falscher Bildanzahl ab oder übernimmt veraltete Seiten.
  await entferneAlteSeiten(zielVerzeichnis);

  // pdftoppm hängt "-<n>.jpg" an und füllt die Zahl auf die Breite der Seitenzahl auf.
  const praefix = join(zielVerzeichnis, 'seite');
  await fuehreAus('pdftoppm', [
    '-jpeg',
    '-jpegopt',
    `quality=${qualitaet}`,
    '-r',
    String(dpi),
    pdfPfad,
    praefix,
  ]);

  const dateien = (await readdir(zielVerzeichnis)).filter(istSeitenbild).sort(nachSeitennummer);

  if (dateien.length === 0) {
    throw new Error(
      `pdftoppm hat keine Bilder erzeugt. Ist "${pdfPfad}" wirklich ein PDF?`,
    );
  }

  return {
    dateien,
    dpi,
    ...pixelMasse(breitePt, hoehePt, dpi),
    ausrichtung: bestimmeAusrichtung(breitePt, hoehePt),
  };
}

/** Entfernt übrig gebliebene "seite-*.jpg" aus einem früheren Lauf. Ignoriert alles andere. */
async function entferneAlteSeiten(verzeichnis: string): Promise<void> {
  const vorhanden = await readdir(verzeichnis).catch(() => [] as string[]);
  await Promise.all(
    vorhanden
      .filter(istSeitenbild)
      .map((datei) => rm(join(verzeichnis, datei), { force: true })),
  );
}

/** "seite-9.jpg" muss vor "seite-10.jpg" einsortieren — reine String-Sortierung täte das nicht. */
export function nachSeitennummer(a: string, b: string): number {
  return nummerAus(a) - nummerAus(b);
}

export function istSeitenbild(dateiname: string): boolean {
  return dateiname.startsWith('seite-') && dateiname.endsWith('.jpg');
}

function nummerAus(dateiname: string): number {
  return Number(dateiname.match(/-(\d+)\.jpg$/)?.[1] ?? 0);
}
