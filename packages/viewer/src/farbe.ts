/**
 * Colour helpers shared inside the viewer.
 *
 * The hex check and the accent default were duplicated across textfassung.ts
 * (server render) and flipbook.ts (client), and flipbook set the accent from
 * catalogue data without validating it at all. One place now.
 */

export const HEX_FARBE = /^#[0-9a-fA-F]{6}$/;

export const STANDARD_AKZENT = '#0057a0';

/** Returns the value if it is a valid hex colour, otherwise the fallback. */
export function sichereAkzentfarbe(wert: string | undefined): string {
  return wert && HEX_FARBE.test(wert) ? wert : STANDARD_AKZENT;
}
