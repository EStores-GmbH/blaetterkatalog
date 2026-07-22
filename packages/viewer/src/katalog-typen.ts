/**
 * Shape of `katalog.json`, from the viewer's side.
 *
 * Deliberately a separate declaration from the generator's `types.ts`: in
 * phase 1 the data no longer comes from the generator's file system but from
 * the Storyblok API. The viewer must depend on the shape, not on the producer.
 */

export type Ausrichtung = 'hoch' | 'quer';

export interface Seite {
  nr: number;
  bild: string;
  breite: number;
  hoehe: number;
  text_html: string;
}

export interface TocEintrag {
  label: string;
  /** Gedruckte Seitenzahl — was der Leser sieht. */
  seite: number;
  /**
   * 1-basierte Position in der Datei — das Sprungziel.
   *
   * Optional, weil Kataloge aus früheren Läufen das Feld nicht kennen; dann
   * ist die gedruckte Seitenzahl das Beste, was zur Verfügung steht.
   */
  index?: number;
}

export interface Katalog {
  slug: string;
  titel: string;
  seitenzahl: number;
  ausrichtung: Ausrichtung;
  akzentfarbe: string;
  /** Preset name or hex colour. Optional — ältere Kataloge kennen das Feld nicht. */
  hintergrund?: string;
  download_pdf: string;
  seiten: Seite[];
  toc: TocEintrag[];
  erzeugt_am: string;
}
