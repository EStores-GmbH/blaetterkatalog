/**
 * Struktur von `katalog.json`, aus Sicht des Viewers.
 *
 * Bewusst eine eigene Deklaration, getrennt von der `types.ts` des Generators:
 * In Phase 1 stammen die Daten nicht mehr aus dem Dateisystem des Generators,
 * sondern aus der Storyblok-API. Der Viewer muss von der Struktur abhängen,
 * nicht vom Erzeuger.
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
  /** Vorlagenname oder Hex-Farbe. Optional — ältere Kataloge kennen das Feld nicht. */
  hintergrund?: string;
  download_pdf: string;
  seiten: Seite[];
  toc: TocEintrag[];
  erzeugt_am: string;
}
