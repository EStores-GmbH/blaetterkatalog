/**
 * Shape of `katalog.json` — the hinge between phase 0 and phase 1.
 *
 * In phase 0 the standalone viewer reads this file from disk. In phase 1 the
 * very same structure becomes the Storyblok story. Changing it means changing
 * both sides, so treat it as a contract.
 */

/** Portrait pages can be shown as a two-page spread, landscape ones cannot. */
export type Ausrichtung = 'hoch' | 'quer';

export interface Seite {
  /** 1-based, matches the PDF page order. */
  nr: number;
  /** Path to the rendered image, relative to katalog.json. */
  bild: string;
  breite: number;
  hoehe: number;
  /** Structured markup for the accessible text route and for search engines. */
  text_html: string;
}

export interface TocEintrag {
  label: string;
  /** Page number as printed in the table of contents. */
  seite: number;
}

export interface Quelle {
  datei: string;
  /** SHA-256 of the source PDF — lets us tell whether a rebuild is needed. */
  pruefsumme: string;
  seitenformat_pt: { breite: number; hoehe: number };
  gerendert_dpi: number;
}

export interface Katalog {
  slug: string;
  titel: string;
  seitenzahl: number;
  /**
   * Derived from the page aspect ratio, not configurable. Two 16:9 pages side
   * by side would be 32:9 — unusable on any screen. See docs/ARCHITECTURE.md.
   */
  ausrichtung: Ausrichtung;
  akzentfarbe: string;
  download_pdf: string;
  seiten: Seite[];
  toc: TocEintrag[];
  erzeugt_am: string;
  quelle: Quelle;
}

/** Written separately — it must never travel with the catalog payload. */
export interface SuchindexEintrag {
  seite: number;
  text: string;
}
