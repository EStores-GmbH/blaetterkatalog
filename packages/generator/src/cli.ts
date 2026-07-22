#!/usr/bin/env node --experimental-strip-types
/**
 * katalog-build — turns a PDF into page images, page text, a table of contents
 * and a search index.
 *
 * Phase 0: everything lands in a local directory. Phase 1 adds the Storyblok
 * upload on top without changing what is produced here.
 */
import { access, constants, copyFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  baueSuchindex,
  baueTextHtml,
  extrahiereAlleSeiten,
  findeSeitenversatz,
  findeToc,
  versetzeToc,
} from './extract.ts';
import { baueSlug, baueTitel, pruefsumme, schreibeKatalog } from './manifest.ts';
import { leseInfo, pruefeWerkzeuge, WerkzeugFehlt } from './pdf-tools.ts';
import { rendereSeiten, STANDARD_DPI } from './render.ts';
import type { Katalog, Seite } from './types.ts';

const HILFE = `
katalog-build — PDF in einen Blätterkatalog verwandeln

  npm run katalog-build -- <pdf> [Optionen]

Optionen
  --out <pfad>     Zielverzeichnis          (Standard: out/<slug>)
  --dpi <zahl>     Render-Auflösung         (Standard: ${STANDARD_DPI})
  --slug <text>    Kurzname für die URL     (Standard: aus dem Dateinamen)
  --titel <text>   Anzeigetitel             (Standard: aus den PDF-Metadaten)
  --farbe <hex>    Akzentfarbe              (Standard: #0057a0)
  --hintergrund    Untergrund des Katalogs  (Standard: mitgeliefertes Holzbild)
                   Pfad zu einem Bild · holz · holz-dunkel · grau · dunkel
                   · oder ein Hex-Wert. Ein Bild wird in die Ausgabe kopiert.
  --hilfe          Diese Übersicht

Beispiel
  npm run katalog-build -- fixtures/katalog.pdf --dpi 200
`;

interface Optionen {
  pdf: string;
  out: string | undefined;
  dpi: number;
  slug: string | undefined;
  titel: string | undefined;
  farbe: string;
  hintergrund: string;
}

/**
 * Backdrops the viewer ships with. Kept here only to reject typos early — the
 * generator stores the string, the viewer decides what it looks like.
 */
export const HINTERGRUND_VORLAGEN = ['holz', 'holz-dunkel', 'grau', 'dunkel'] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;
const BILDENDUNG = /\.(jpe?g|png|webp|avif)$/i;

export function istBildpfad(wert: string): boolean {
  return BILDENDUNG.test(wert);
}

export function istGueltigerHintergrund(wert: string): boolean {
  if ((HINTERGRUND_VORLAGEN as readonly string[]).includes(wert)) return true;
  if (HEX.test(wert)) return true;
  return istBildpfad(wert);
}

export function leseArgumente(argv: string[]): Optionen | 'hilfe' {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      dpi: { type: 'string' },
      slug: { type: 'string' },
      titel: { type: 'string' },
      farbe: { type: 'string' },
      hintergrund: { type: 'string' },
      hilfe: { type: 'boolean', default: false },
    },
  });

  if (values.hilfe || positionals.length === 0) return 'hilfe';

  const pdf = positionals[0];
  if (!pdf) return 'hilfe';

  const dpi = values.dpi === undefined ? STANDARD_DPI : Number(values.dpi);
  if (!Number.isFinite(dpi) || dpi < 36 || dpi > 1200) {
    throw new Error(`--dpi muss zwischen 36 und 1200 liegen, war "${values.dpi}"`);
  }

  const farbe = values.farbe ?? '#0057a0';
  if (!HEX.test(farbe)) {
    throw new Error(`--farbe muss ein Hex-Wert wie #0057a0 sein, war "${farbe}"`);
  }

  const hintergrund = values.hintergrund ?? 'holz';
  if (!istGueltigerHintergrund(hintergrund)) {
    throw new Error(
      `--hintergrund muss ein Bildpfad (.jpg/.png/.webp/.avif), eine Vorlage ` +
        `(${HINTERGRUND_VORLAGEN.join(', ')}) oder ein Hex-Wert wie #3b2a1a sein, ` +
        `war "${hintergrund}"`,
    );
  }

  return {
    pdf,
    out: values.out,
    dpi,
    slug: values.slug,
    titel: values.titel,
    farbe,
    hintergrund,
  };
}

async function main(): Promise<void> {
  const optionen = leseArgumente(process.argv.slice(2));
  if (optionen === 'hilfe') {
    console.log(HILFE);
    return;
  }

  await pruefeWerkzeuge();

  const pdfPfad = resolve(optionen.pdf);
  try {
    await access(pdfPfad, constants.R_OK);
  } catch {
    throw new Error(`PDF nicht gefunden oder nicht lesbar: ${pdfPfad}`);
  }

  const info = await leseInfo(pdfPfad);
  if (info.verschluesselt) {
    throw new Error(
      'Das PDF ist verschlüsselt. Bitte eine Fassung ohne Kopierschutz bereitstellen.',
    );
  }

  const titel = optionen.titel ?? baueTitel(pdfPfad, info.titel);
  const slug = optionen.slug ?? baueSlug(basename(pdfPfad).replace(/\.pdf$/i, ''));
  const zielVerzeichnis = resolve(optionen.out ?? join('out', slug));

  console.log(`\nKatalog:   ${titel}`);
  console.log(`Slug:      ${slug}`);
  console.log(`Seiten:    ${info.seitenzahl}`);
  console.log(
    `Format:    ${Math.round(info.breitePt)} x ${Math.round(info.hoehePt)} pt` +
      `${info.getaggt ? ' (getaggt)' : ''}`,
  );
  console.log(`Ziel:      ${zielVerzeichnis}\n`);

  console.log('Seiten rendern …');
  const bilder = await rendereSeiten(
    pdfPfad,
    join(zielVerzeichnis, 'pages'),
    info.breitePt,
    info.hoehePt,
    { dpi: optionen.dpi },
  );

  if (bilder.dpi < optionen.dpi) {
    console.log(
      `  Auflösung auf ${bilder.dpi} dpi begrenzt — bei ${optionen.dpi} dpi ` +
        `überschritte die längste Kante das Limit von 4000 px.`,
    );
  }
  console.log(
    `  ${bilder.dateien.length} Seiten, ${bilder.breite} x ${bilder.hoehe} px, ` +
      `${bilder.ausrichtung === 'hoch' ? 'Hochformat' : 'Querformat'}`,
  );

  if (bilder.dateien.length !== info.seitenzahl) {
    throw new Error(
      `pdftoppm hat ${bilder.dateien.length} Bilder erzeugt, ` +
        `das PDF hat aber ${info.seitenzahl} Seiten.`,
    );
  }

  console.log('Text extrahieren …');
  const seitentexte = await extrahiereAlleSeiten(pdfPfad, info.seitenzahl);
  const suchindex = baueSuchindex(seitentexte);
  const versatz = findeSeitenversatz(seitentexte);
  const toc = versetzeToc(findeToc(seitentexte), versatz, info.seitenzahl);

  console.log(`  Text auf ${suchindex.length} von ${info.seitenzahl} Seiten`);
  console.log(
    toc.length > 0
      ? `  Inhaltsverzeichnis: ${toc.length} Einträge erkannt`
      : '  Kein Inhaltsverzeichnis erkannt — muss von Hand gepflegt werden',
  );
  if (versatz !== 0) {
    console.log(
      `  Gedruckte Seitenzahlen sind um ${versatz > 0 ? '+' : ''}${versatz} versetzt — ` +
        `Sprungziele entsprechend korrigiert`,
    );
  }

  // Ein Hintergrundbild wandert mit in die Ausgabe, damit der Katalogordner
  // für sich allein vollständig ist. In der katalog.json steht dann ein Pfad
  // relativ zu ihr — genau wie bei den Seitenbildern.
  let hintergrund = optionen.hintergrund;
  if (istBildpfad(hintergrund)) {
    const quelle = resolve(hintergrund);
    try {
      await access(quelle, constants.R_OK);
    } catch {
      throw new Error(`Hintergrundbild nicht gefunden oder nicht lesbar: ${quelle}`);
    }

    const zielname = `hintergrund${extname(quelle).toLowerCase()}`;
    await copyFile(quelle, join(zielVerzeichnis, zielname));
    hintergrund = zielname;
    console.log(`  Hintergrundbild übernommen: ${zielname}`);
  }

  const seiten: Seite[] = bilder.dateien.map((datei, i) => ({
    nr: i + 1,
    bild: join('pages', datei),
    breite: bilder.breite,
    hoehe: bilder.hoehe,
    text_html: baueTextHtml(seitentexte[i] ?? ''),
  }));

  const katalog: Katalog = {
    slug,
    titel,
    seitenzahl: info.seitenzahl,
    ausrichtung: bilder.ausrichtung,
    akzentfarbe: optionen.farbe,
    hintergrund,
    download_pdf: basename(pdfPfad),
    seiten,
    toc,
    erzeugt_am: new Date().toISOString(),
    quelle: {
      datei: basename(pdfPfad),
      pruefsumme: await pruefsumme(pdfPfad),
      seitenformat_pt: { breite: info.breitePt, hoehe: info.hoehePt },
      gerendert_dpi: bilder.dpi,
    },
  };

  const geschrieben = await schreibeKatalog(zielVerzeichnis, katalog, suchindex);
  console.log(`\nFertig.`);
  console.log(`  ${geschrieben.katalogPfad}`);
  console.log(`  ${geschrieben.suchindexPfad} (${geschrieben.indexGroesseKb} KB)`);
}

// Only run when invoked directly. Tests import leseArgumente from this file and
// must not kick off a render.
const direktAufgerufen =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (direktAufgerufen) {
  main().catch((fehler: unknown) => {
    const nachricht = fehler instanceof Error ? fehler.message : String(fehler);
    // A missing system tool is a setup problem, not a crash — no stack trace.
    console.error(fehler instanceof WerkzeugFehlt ? `\n${nachricht}` : `\nFehler: ${nachricht}`);
    process.exitCode = 1;
  });
}
