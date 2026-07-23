/**
 * Struktur von `katalog.json` — das Scharnier zwischen Phase 0 und Phase 1.
 *
 * In Phase 0 liest der eigenständige Viewer diese Datei von der Platte. In
 * Phase 1 wird genau dieselbe Struktur zur Storyblok-Story. Sie zu ändern heißt,
 * beide Seiten zu ändern — also als Vertrag behandeln.
 */

/** Hochformat-Seiten lassen sich als Doppelseite zeigen, Querformat-Seiten nicht. */
export type Ausrichtung = 'hoch' | 'quer';

export interface Seite {
  /** 1-basiert, entspricht der PDF-Seitenreihenfolge. */
  nr: number;
  /** Pfad zum gerenderten Bild, relativ zu katalog.json. */
  bild: string;
  breite: number;
  hoehe: number;
  /** Strukturiertes Markup für die barrierefreie Textroute und für Suchmaschinen. */
  text_html: string;
}

export interface TocEintrag {
  label: string;
  /** Gedruckte Seitenzahl — was der Leser sieht. */
  seite: number;
  /**
   * 1-basierte Position in der Datei — wohin ein Klick springen muss.
   *
   * Meist gleich `seite`, aber Kataloge mit unnummerierten Vorsatzblättern
   * schieben beide auseinander. Gesetzt von `versetzeToc` in extract.ts.
   */
  index: number;
}

export interface Quelle {
  datei: string;
  /** SHA-256 des Quell-PDFs — lässt uns erkennen, ob ein Neuaufbau nötig ist. */
  pruefsumme: string;
  seitenformat_pt: { breite: number; hoehe: number };
  gerendert_dpi: number;
}

export interface Katalog {
  slug: string;
  titel: string;
  seitenzahl: number;
  /**
   * Aus dem Seitenverhältnis abgeleitet, nicht konfigurierbar. Zwei 16:9-Seiten
   * nebeneinander wären 32:9 — auf keinem Bildschirm brauchbar. Siehe
   * docs/ARCHITECTURE.md.
   */
  ausrichtung: Ausrichtung;
  akzentfarbe: string;
  /**
   * Untergrund, auf dem das Buch liegt. Entweder ein dem Viewer bekannter
   * Vorlagenname ("holz", "holz-dunkel", "grau", "dunkel") oder ein reiner
   * Hex-Wert.
   *
   * Der Generator speichert nur den Wert — welche Vorlagen es gibt, ist Sache
   * des Viewers, und in Phase 1 wählt ein Redakteur sie in Storyblok.
   */
  hintergrund: string;
  download_pdf: string;
  seiten: Seite[];
  toc: TocEintrag[];
  erzeugt_am: string;
  quelle: Quelle;
}

/** Getrennt geschrieben — es darf nie mit der Katalog-Nutzlast mitreisen. */
export interface SuchindexEintrag {
  seite: number;
  text: string;
}
