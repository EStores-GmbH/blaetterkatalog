/**
 * Dünne Hülle um die Poppler-Kommandozeilenwerkzeuge.
 *
 * Poppler ist eine Systemabhängigkeit, kein npm-Paket. Fehlt es, muss der
 * Generator das in klarer Sprache sagen, statt tief in einem Kindprozess mit
 * ENOENT abzubrechen.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Jedes Poppler-Binary, auf das sich der Generator stützt, mit seinem Zweck. */
export const BENOETIGTE_WERKZEUGE = [
  { name: 'pdfinfo', zweck: 'Seitenzahl und Seitenformat auslesen' },
  { name: 'pdftoppm', zweck: 'Seiten zu Bildern rendern' },
  { name: 'pdftotext', zweck: 'Seitentext für Suche und Textfassung extrahieren' },
] as const;

export class WerkzeugFehlt extends Error {
  readonly fehlend: string[];

  constructor(fehlend: string[]) {
    const liste = BENOETIGTE_WERKZEUGE.filter((w) => fehlend.includes(w.name))
      .map((w) => `  ${w.name.padEnd(10)} ${w.zweck}`)
      .join('\n');

    super(
      `Es fehlen Programme, die der Generator braucht:\n\n${liste}\n\n` +
        `Sie gehören alle zum Paket "poppler". Installation:\n\n` +
        `  macOS          brew install poppler\n` +
        `  Debian/Ubuntu  sudo apt-get install poppler-utils\n` +
        `  Fedora         sudo dnf install poppler-utils\n`,
    );
    this.name = 'WerkzeugFehlt';
    this.fehlend = fehlend;
  }
}

/**
 * Prüft, dass jedes benötigte Binary aufrufbar ist. Wird einmal beim Start
 * aufgerufen, damit der Nutzer von einer fehlenden Abhängigkeit erfährt, bevor
 * wir 46 Seiten rendern.
 */
export async function pruefeWerkzeuge(): Promise<void> {
  const ergebnisse = await Promise.all(
    BENOETIGTE_WERKZEUGE.map(async (w) => ({
      name: w.name,
      da: await istVerfuegbar(w.name),
    })),
  );

  const fehlend = ergebnisse.filter((e) => !e.da).map((e) => e.name);
  if (fehlend.length > 0) throw new WerkzeugFehlt(fehlend);
}

async function istVerfuegbar(programm: string): Promise<boolean> {
  try {
    // -v endet bei manchen Poppler-Builds mit Nicht-null, beweist aber trotzdem,
    // dass das Binary existiert; nur ein Spawn-Fehler (ENOENT) heißt, dass es wirklich fehlt.
    await execFileAsync(programm, ['-v']);
    return true;
  } catch (fehler) {
    const code = (fehler as NodeJS.ErrnoException).code;
    return code !== 'ENOENT';
  }
}

export interface PdfInfo {
  seitenzahl: number;
  /** Seitengröße in PostScript-Punkten (1 pt = 1/72 Zoll). */
  breitePt: number;
  hoehePt: number;
  titel: string | undefined;
  getaggt: boolean;
  verschluesselt: boolean;
}

export async function leseInfo(pdfPfad: string): Promise<PdfInfo> {
  // -enc UTF-8: pdfinfo gibt sonst Latin1 aus, Node dekodiert stdout aber als
  // UTF-8 — ein Titel mit Umlauten käme sonst verstümmelt in der katalog.json an.
  const { stdout } = await execFileAsync('pdfinfo', ['-enc', 'UTF-8', pdfPfad], {
    maxBuffer: 1024 * 1024,
  });

  try {
    return werteAusPdfInfo(stdout);
  } catch (fehler) {
    const grund = fehler instanceof Error ? fehler.message : String(fehler);
    throw new Error(`${grund} für ${pdfPfad}`);
  }
}

/**
 * Parst die pdfinfo-Ausgabe. Von leseInfo getrennt, damit sie gegen feste
 * Ausgabe getestet werden kann — einschließlich der fail-closed
 * Verschlüsselungssperre, auf die sich cli.ts verlässt, um kopiergeschützte
 * PDFs abzuweisen.
 */
export function werteAusPdfInfo(stdout: string): PdfInfo {
  const feld = (name: string): string | undefined =>
    stdout.match(new RegExp(`^${name}:[ \\t]*(.+)$`, 'm'))?.[1]?.trim();

  const seitenzahl = Number(feld('Pages'));
  if (!Number.isInteger(seitenzahl) || seitenzahl < 1) {
    throw new Error('pdfinfo liefert keine brauchbare Seitenzahl');
  }

  // "595.276 x 841.89 pts (A4)"
  const masse = feld('Page size')?.match(/([\d.]+)\s*x\s*([\d.]+)\s*pts/);
  if (!masse?.[1] || !masse[2]) {
    throw new Error('pdfinfo liefert kein lesbares Seitenformat');
  }

  return {
    seitenzahl,
    breitePt: Number(masse[1]),
    hoehePt: Number(masse[2]),
    titel: feld('Title'),
    getaggt: feld('Tagged') === 'yes',
    // Fail-closed: fehlt das Feld, gilt das PDF als verschlüsselt.
    verschluesselt: feld('Encrypted') !== 'no',
  };
}

/** Führt ein Poppler-Binary aus und liefert stdout. Fehler behalten die Meldung des Werkzeugs. */
export async function fuehreAus(
  programm: string,
  argumente: string[],
  maxBuffer = 64 * 1024 * 1024,
): Promise<string> {
  try {
    const { stdout } = await execFileAsync(programm, argumente, { maxBuffer });
    return stdout;
  } catch (fehler) {
    const e = fehler as NodeJS.ErrnoException & { stderr?: string };
    const detail = e.stderr?.trim() || e.message;
    throw new Error(`${programm} ist fehlgeschlagen: ${detail}`);
  }
}
