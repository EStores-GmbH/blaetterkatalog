/**
 * Backdrop the book sits on.
 *
 * Kept apart from flipbook.ts on purpose: that module boots the viewer on
 * import and therefore needs a browser. The decision itself is pure and has to
 * be testable without one.
 *
 * A catalogue may specify:
 *   - an image — a path or URL ("hintergrund.jpg", "/assets/holz.jpg",
 *     or in phase 1 a Storyblok asset URL)
 *   - a preset name ("holz", "holz-dunkel", "grau", "dunkel")
 *   - a plain hex colour
 *
 * Nothing specified means the shipped default image.
 */
import { HEX_FARBE } from './farbe.ts';

/** Backdrops with a matching rule in flipbook.css. */
export const HINTERGRUND_VORLAGEN = new Set(['holz', 'holz-dunkel', 'grau', 'dunkel']);

/** Ships with the viewer. Overridable per catalogue. */
export const HINTERGRUND_STANDARD_BILD = '/assets/hintergrund-holz.jpg';

/** Used when neither the catalogue nor the default image yields anything. */
export const HINTERGRUND_NOTNAGEL = 'holz';

const BILDENDUNG = /\.(jpe?g|png|webp|avif)$/i;

export type HintergrundArt = 'bild' | 'vorlage' | 'farbe';

export interface HintergrundWahl {
  art: HintergrundArt;
  /** Value for the data attribute the stylesheet keys off. */
  kennung: string;
  /** Image URL, for art === 'bild'. */
  bild: string | undefined;
  /** Colour, for art === 'farbe'. */
  farbe: string | undefined;
}

/** Anything that looks like a path or URL to an image file. */
export function istBildangabe(wert: string): boolean {
  if (BILDENDUNG.test(wert.split('?')[0] ?? '')) return true;
  return wert.startsWith('http://') || wert.startsWith('https://') || wert.startsWith('//');
}

/**
 * Turns the stored value into a URL the browser can fetch.
 *
 * The generator stores a path relative to katalog.json — exactly like it does
 * for page images — so the catalogue directory stays movable. Absolute paths
 * and full URLs (phase 1: Storyblok assets) are passed through untouched.
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
 * Small textures are meant to tile, large photographs to fill.
 *
 * Deciding this from the loaded image spares the catalogue an extra setting
 * that would be wrong half the time.
 */
export const KACHEL_SCHWELLE_PX = 600;

export function bildDarstellung(breite: number, hoehe: number): 'kachel' | 'fuellend' {
  return Math.max(breite, hoehe) < KACHEL_SCHWELLE_PX ? 'kachel' : 'fuellend';
}
