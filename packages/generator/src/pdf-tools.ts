/**
 * Thin wrapper around the Poppler command line tools.
 *
 * Poppler is a system dependency, not an npm package. If it is missing the
 * generator must say so in plain language instead of failing with ENOENT
 * somewhere deep in a child process.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Every Poppler binary the generator relies on, with what we need it for. */
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
 * Verifies every required binary is callable. Called once at startup so the
 * user learns about a missing dependency before we render 46 pages.
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
    // -v exits non-zero on some Poppler builds but still proves the binary
    // exists; only a spawn error (ENOENT) means it is genuinely absent.
    await execFileAsync(programm, ['-v']);
    return true;
  } catch (fehler) {
    const code = (fehler as NodeJS.ErrnoException).code;
    return code !== 'ENOENT';
  }
}

export interface PdfInfo {
  seitenzahl: number;
  /** Page size in PostScript points (1 pt = 1/72 inch). */
  breitePt: number;
  hoehePt: number;
  titel: string | undefined;
  getaggt: boolean;
  verschluesselt: boolean;
}

export async function leseInfo(pdfPfad: string): Promise<PdfInfo> {
  const { stdout } = await execFileAsync('pdfinfo', [pdfPfad], {
    maxBuffer: 1024 * 1024,
  });

  const feld = (name: string): string | undefined =>
    stdout.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim();

  const seitenzahl = Number(feld('Pages'));
  if (!Number.isInteger(seitenzahl) || seitenzahl < 1) {
    throw new Error(`pdfinfo liefert keine brauchbare Seitenzahl für ${pdfPfad}`);
  }

  // "595.276 x 841.89 pts (A4)"
  const masse = feld('Page size')?.match(/([\d.]+)\s*x\s*([\d.]+)\s*pts/);
  if (!masse?.[1] || !masse[2]) {
    throw new Error(`pdfinfo liefert kein lesbares Seitenformat für ${pdfPfad}`);
  }

  return {
    seitenzahl,
    breitePt: Number(masse[1]),
    hoehePt: Number(masse[2]),
    titel: feld('Title'),
    getaggt: feld('Tagged') === 'yes',
    verschluesselt: feld('Encrypted') !== 'no',
  };
}

/** Runs a Poppler binary and returns stdout. Errors keep the tool's own message. */
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
