/**
 * Renders PDF pages to JPEG images via `pdftoppm`.
 *
 * Two rules govern the output, both from docs/ARCHITECTURE.md:
 *   1. Single pages only — never a two-page spread. An A4 spread at 300 dpi is
 *      4961 px wide and exceeds the Storyblok Image Service ceiling of 4000 px.
 *   2. The longest edge stays at or below that ceiling, so the resolution is
 *      derived from the page size instead of being hard-coded.
 */
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fuehreAus } from './pdf-tools.ts';
import type { Ausrichtung } from './types.ts';

/** Storyblok Image Service refuses anything larger on either edge. */
export const MAX_KANTE_PX = 4000;

/** Above this the embedded photos of a print PDF stop gaining detail. */
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
 * Highest resolution whose longest edge still fits under the ceiling.
 * Returns the wish unchanged when it already fits.
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
  /** JPEG quality 1–100. 85 is the point where artefacts stop being visible. */
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

  // pdftoppm appends "-<n>.jpg" and pads the number to the page count's width.
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

  const dateien = (await readdir(zielVerzeichnis))
    .filter((d) => d.startsWith('seite-') && d.endsWith('.jpg'))
    .sort(nachSeitennummer);

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

/** "seite-9.jpg" must sort before "seite-10.jpg" — plain string sort would not. */
export function nachSeitennummer(a: string, b: string): number {
  return nummerAus(a) - nummerAus(b);
}

function nummerAus(dateiname: string): number {
  return Number(dateiname.match(/-(\d+)\.jpg$/)?.[1] ?? 0);
}
