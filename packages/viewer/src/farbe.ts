/**
 * Farb-Helfer, die innerhalb des Viewers geteilt werden.
 *
 * Die Hex-Prüfung und der Akzent-Standardwert waren über textfassung.ts
 * (Server-Render) und flipbook.ts (Client) dupliziert, und flipbook setzte den
 * Akzent aus den Katalogdaten, ohne ihn überhaupt zu prüfen. Jetzt an einer Stelle.
 */

export const HEX_FARBE = /^#[0-9a-fA-F]{6}$/;

export const STANDARD_AKZENT = '#0057a0';

/** Liefert den Wert, wenn er eine gültige Hex-Farbe ist, sonst den Ersatzwert. */
export function sichereAkzentfarbe(wert: string | undefined): string {
  return wert && HEX_FARBE.test(wert) ? wert : STANDARD_AKZENT;
}
