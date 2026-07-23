/**
 * Untergrund, auf dem das Buch liegt.
 *
 * Bewusst von flipbook.ts getrennt: Jenes Modul startet den Viewer beim Import
 * und braucht daher einen Browser. Die Entscheidung selbst ist pur und muss
 * ohne einen testbar sein.
 *
 * Ein Katalog kann angeben:
 *   - ein Bild — ein Pfad oder eine URL ("hintergrund.jpg", "/assets/holz.jpg",
 *     oder in Phase 1 eine Storyblok-Asset-URL)
 *   - einen Vorlagennamen ("holz", "holz-dunkel", "grau", "dunkel")
 *   - eine reine Hex-Farbe
 *
 * Nichts angegeben bedeutet das mitgelieferte Standardbild.
 */
import { HEX_FARBE } from './farbe.ts';

/** Hintergründe mit einer passenden Regel in flipbook.css. */
export const HINTERGRUND_VORLAGEN = new Set(['holz', 'holz-dunkel', 'grau', 'dunkel']);

/** Wird mit dem Viewer mitgeliefert. Pro Katalog überschreibbar. */
export const HINTERGRUND_STANDARD_BILD = '/assets/hintergrund-holz.jpg';

/** Wird verwendet, wenn weder der Katalog noch das Standardbild etwas liefert. */
export const HINTERGRUND_NOTNAGEL = 'holz';

const BILDENDUNG = /\.(jpe?g|png|webp|avif)$/i;

export type HintergrundArt = 'bild' | 'vorlage' | 'farbe';

export interface HintergrundWahl {
  art: HintergrundArt;
  /** Wert für das data-Attribut, an dem das Stylesheet ansetzt. */
  kennung: string;
  /** Bild-URL, für art === 'bild'. */
  bild: string | undefined;
  /** Farbe, für art === 'farbe'. */
  farbe: string | undefined;
}

/** Alles, was wie ein Pfad oder eine URL zu einer Bilddatei aussieht. */
export function istBildangabe(wert: string): boolean {
  if (BILDENDUNG.test(wert.split('?')[0] ?? '')) return true;
  return wert.startsWith('http://') || wert.startsWith('https://') || wert.startsWith('//');
}

/**
 * Wandelt den gespeicherten Wert in eine URL, die der Browser laden kann.
 *
 * Der Generator speichert einen Pfad relativ zu katalog.json — genau wie bei
 * den Seitenbildern — damit das Katalogverzeichnis verschiebbar bleibt.
 * Absolute Pfade und vollständige URLs (Phase 1: Storyblok-Assets) werden
 * unverändert durchgereicht.
 */
export function loeseBildUrl(wert: string, basis = '/katalog/'): string {
  if (wert.startsWith('/') || wert.includes('://')) return wert;
  return basis + wert;
}

export function waehleHintergrund(wunsch: string | undefined): HintergrundWahl {
  const wert = wunsch?.trim();

  if (!wert) {
    return { art: 'bild', kennung: 'bild', bild: HINTERGRUND_STANDARD_BILD, farbe: undefined };
  }

  if (HEX_FARBE.test(wert)) {
    return { art: 'farbe', kennung: 'eigen', bild: undefined, farbe: wert };
  }

  if (HINTERGRUND_VORLAGEN.has(wert)) {
    // "holz" meint das mitgelieferte Bild; die anderen sind reine CSS-Flächen.
    if (wert === 'holz') {
      return { art: 'bild', kennung: 'bild', bild: HINTERGRUND_STANDARD_BILD, farbe: undefined };
    }
    return { art: 'vorlage', kennung: wert, bild: undefined, farbe: undefined };
  }

  if (istBildangabe(wert)) {
    return { art: 'bild', kennung: 'bild', bild: loeseBildUrl(wert), farbe: undefined };
  }

  // Tippfehler und unbekannte Werte: gezeichnetes Holz statt leerer Bühne.
  return { art: 'vorlage', kennung: HINTERGRUND_NOTNAGEL, bild: undefined, farbe: undefined };
}

/**
 * Kleine Texturen sollen kacheln, große Fotos füllen.
 *
 * Das aus dem geladenen Bild zu entscheiden erspart dem Katalog eine
 * zusätzliche Einstellung, die die Hälfte der Zeit falsch wäre.
 */
export const KACHEL_SCHWELLE_PX = 600;

export function bildDarstellung(breite: number, hoehe: number): 'kachel' | 'fuellend' {
  return Math.max(breite, hoehe) < KACHEL_SCHWELLE_PX ? 'kachel' : 'fuellend';
}
