/**
 * Dev server for the phase 0 viewer. Zero dependencies.
 *
 * Serves three things:
 *   /                     the flipbook
 *   /text/                the HTML text version — the accessible alternative
 *   /katalog/*            the generator output for the selected catalogue
 *
 * TypeScript is stripped on the fly with Node's built-in `stripTypeScriptTypes`
 * and handed to the browser as plain JavaScript. That is what lets us keep the
 * viewer in TypeScript without adding a bundler in phase 0. Astro takes over
 * this job in phase 1.
 */
import { createServer } from 'node:http';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { baueTextfassung } from './textfassung.ts';
import type { Katalog } from './katalog-typen.ts';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ts': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

const VIEWER_WURZEL = resolve(import.meta.dirname, '..');

/**
 * The engine lives in a sibling package. The browser flattens the `../../`
 * in its import specifier against the server root, so it asks for
 * /flip-engine/… — this maps that back to the real directory.
 */
const ENGINE_WURZEL = resolve(VIEWER_WURZEL, '..', 'flip-engine');

/**
 * Resolves a request path inside a root directory, or rejects it.
 *
 * Fails closed at every step rather than repairing the input. The previous
 * version normalised first, which silently rewrote `/../../package.json` into
 * a valid in-root path instead of refusing it — the request never escaped, but
 * an attack that gets answered with 200 teaches you nothing.
 *
 * Symlink resolution happens in `sendeDatei`: a link inside the root pointing
 * outside would pass a purely textual check.
 */
export function sichererPfad(wurzel: string, angefragt: string): string | undefined {
  let dekodiert: string;
  try {
    dekodiert = decodeURIComponent(angefragt);
  } catch {
    return undefined; // kaputte Prozentkodierung
  }

  // NUL-Bytes können Pfadprüfungen in darunterliegenden Schichten aushebeln.
  if (dekodiert.includes('\0')) return undefined;

  const segmente = dekodiert.split('/').filter((s) => s.length > 0 && s !== '.');

  // Kein Segment darf aufwärts zeigen — auch nicht nach dem Dekodieren.
  if (segmente.includes('..')) return undefined;

  const ziel = resolve(wurzel, ...segmente);
  return ziel === wurzel || ziel.startsWith(wurzel + '/') ? ziel : undefined;
}

async function findeKatalog(vorgabe: string | undefined): Promise<string> {
  if (vorgabe) return resolve(vorgabe);

  const ausgabe = resolve('out');
  const eintraege = await readdir(ausgabe, { withFileTypes: true }).catch(() => []);
  const kataloge = eintraege.filter((e) => e.isDirectory()).map((e) => e.name);

  if (kataloge.length === 0) {
    throw new Error(
      'In out/ liegt kein Katalog. Erst erzeugen:\n' +
        '  npm run katalog-build -- <pfad-zum-pdf>',
    );
  }
  if (kataloge.length > 1) {
    console.log(`Mehrere Kataloge gefunden, nehme "${kataloge[0]}".`);
    console.log(`Anderen wählen: npm run viewer -- --katalog out/<name>\n`);
  }
  return join(ausgabe, kataloge[0] as string);
}

async function ladeKatalog(verzeichnis: string): Promise<Katalog> {
  const roh = await readFile(join(verzeichnis, 'katalog.json'), 'utf8').catch(() => {
    throw new Error(`Keine katalog.json in ${verzeichnis}`);
  });
  return JSON.parse(roh) as Katalog;
}

export async function starte(port: number, katalogVerzeichnis: string): Promise<void> {
  const katalog = await ladeKatalog(katalogVerzeichnis);

  const server = createServer((anfrage, antwort) => {
    void (async (): Promise<void> => {
      const pfad = (anfrage.url ?? '/').split('?')[0] ?? '/';

      try {
        if (pfad === '/' || pfad === '/index.html') {
          const html = await readFile(join(VIEWER_WURZEL, 'index.html'), 'utf8');
          return sende(antwort, 200, MIME['.html'] as string, html);
        }

        if (pfad === '/text' || pfad === '/text/') {
          return sende(antwort, 200, MIME['.html'] as string, baueTextfassung(katalog));
        }

        if (pfad.startsWith('/katalog/')) {
          const ziel = sichererPfad(katalogVerzeichnis, pfad.slice('/katalog/'.length));
          if (!ziel) return sende(antwort, 403, 'text/plain', 'Verboten');
          return await sendeDatei(antwort, ziel, katalogVerzeichnis);
        }

        if (pfad.startsWith('/flip-engine/')) {
          const ziel = sichererPfad(ENGINE_WURZEL, pfad.slice('/flip-engine/'.length));
          if (!ziel) return sende(antwort, 403, 'text/plain', 'Verboten');
          return await sendeDatei(antwort, ziel, ENGINE_WURZEL);
        }

        const ziel = sichererPfad(VIEWER_WURZEL, pfad);
        if (!ziel) return sende(antwort, 403, 'text/plain', 'Verboten');
        return await sendeDatei(antwort, ziel, VIEWER_WURZEL);
      } catch {
        sende(antwort, 404, 'text/plain', `Nicht gefunden: ${pfad}`);
      }
    })();
  });

  // Ausdrücklich nur an localhost binden. Ohne Host-Angabe lauscht Node auf
  // allen Netzwerk-Schnittstellen — dann läge der Katalog samt PDF und
  // Textfassung für jeden im selben WLAN offen. Es ist ein Entwicklungsserver.
  await new Promise<void>((fertig) => server.listen(port, '127.0.0.1', fertig));

  console.log(`\nKatalog:  ${katalog.titel}`);
  console.log(`Seiten:   ${katalog.seitenzahl} (${katalog.ausrichtung}format)`);
  console.log(`\n  Blätterkatalog   http://localhost:${port}/`);
  console.log(`  Textfassung      http://localhost:${port}/text/`);
  console.log(`\nBeenden mit Strg+C\n`);
}

function sende(
  antwort: import('node:http').ServerResponse,
  status: number,
  typ: string,
  inhalt: string | Buffer,
): void {
  antwort.writeHead(status, {
    'Content-Type': typ,
    // Der Entwicklungsserver soll nie alte Stände ausliefern.
    'Cache-Control': 'no-store',
  });
  antwort.end(inhalt);
}

async function sendeDatei(
  antwort: import('node:http').ServerResponse,
  pfad: string,
  wurzel: string,
): Promise<void> {
  // Zweite Absicherung, diesmal gegen das Dateisystem statt gegen die
  // Zeichenkette: Ein Symlink innerhalb der Wurzel, der nach außen zeigt,
  // besteht jede rein textuelle Prüfung.
  const echterPfad = await realpath(pfad);
  if (echterPfad !== wurzel && !echterPfad.startsWith(wurzel + '/')) {
    throw new Error('Ziel liegt außerhalb des erlaubten Verzeichnisses');
  }

  const info = await stat(echterPfad);
  if (!info.isFile()) throw new Error('kein File');

  const endung = extname(echterPfad);
  const typ = MIME[endung] ?? 'application/octet-stream';

  // Ab hier nur noch der geprüfte Pfad — sonst wäre die Symlink-Prüfung
  // umsonst gewesen.
  // TypeScript wird zu JavaScript, damit der Browser es direkt laden kann.
  if (endung === '.ts') {
    const quelle = await readFile(echterPfad, 'utf8');
    return sende(antwort, 200, typ, stripTypeScriptTypes(quelle, { mode: 'strip' }));
  }

  return sende(antwort, 200, typ, await readFile(echterPfad));
}

if (import.meta.filename === process.argv[1]) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      port: { type: 'string', default: '4321' },
      katalog: { type: 'string' },
    },
  });

  findeKatalog(values.katalog)
    .then((verzeichnis) => starte(Number(values.port), verzeichnis))
    .catch((fehler: unknown) => {
      console.error(`\n${fehler instanceof Error ? fehler.message : String(fehler)}\n`);
      process.exitCode = 1;
    });
}
