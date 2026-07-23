/**
 * Schreibt die beiden Ausgabedateien.
 *
 * `katalog.json` beschreibt den Katalog. `suchindex.json` wird daneben
 * geschrieben, aber bewusst getrennt gehalten: In Phase 1 wird der Katalog zu
 * einer Storyblok-Story, und den Index darin mitzuliefern würde bei jeder
 * einzelnen Anfrage den Volltext jeder Seite mitschicken. Siehe decisions/log.md.
 */
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { basename, join } from 'node:path';
import type { Katalog, SuchindexEintrag } from './types.ts';

export const KATALOG_DATEI = 'katalog.json';
export const SUCHINDEX_DATEI = 'suchindex.json';

export async function pruefsumme(pfad: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const stueck of createReadStream(pfad)) hash.update(stueck);
  return hash.digest('hex');
}

/**
 * Wandelt einen Dateinamen in einen URL-sicheren Slug. Deutsche Umlaute werden
 * transliteriert statt entfernt, sodass "Süße Momente" als "suesse-momente"
 * lesbar bleibt.
 */
export function baueSlug(text: string): string {
  const ersatz: Record<string, string> = {
    ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue', ß: 'ss',
  };
  return text
    .replace(/[äöüÄÖÜß]/g, (z) => ersatz[z] ?? z)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Weicht auf den Dateinamen aus, wenn das PDF keinen brauchbaren Titel trägt. */
export function baueTitel(pdfPfad: string, pdfTitel: string | undefined): string {
  const ausMetadaten = pdfTitel?.trim();
  if (ausMetadaten && ausMetadaten.length > 2) return ausMetadaten;
  return basename(pdfPfad).replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').trim();
}

export async function schreibeKatalog(
  zielVerzeichnis: string,
  katalog: Katalog,
  suchindex: SuchindexEintrag[],
): Promise<{ katalogPfad: string; suchindexPfad: string; indexGroesseKb: number }> {
  const katalogPfad = join(zielVerzeichnis, KATALOG_DATEI);
  const suchindexPfad = join(zielVerzeichnis, SUCHINDEX_DATEI);

  const indexJson = JSON.stringify(suchindex);

  await writeFile(katalogPfad, `${JSON.stringify(katalog, null, 2)}\n`, 'utf8');
  await writeFile(suchindexPfad, `${indexJson}\n`, 'utf8');

  return {
    katalogPfad,
    suchindexPfad,
    indexGroesseKb: Math.round(Buffer.byteLength(indexJson, 'utf8') / 1024),
  };
}
