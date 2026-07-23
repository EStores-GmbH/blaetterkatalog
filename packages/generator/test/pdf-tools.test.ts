import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { werteAusPdfInfo } from '../src/pdf-tools.ts';

// So sieht echte pdfinfo-Ausgabe aus (gekürzt auf die genutzten Felder).
const ECHTE_AUSGABE = [
  'Title:          HoReCa Table Top Q3/26',
  'Creator:        Adobe InDesign 21.4 (Macintosh)',
  'Pages:          46',
  'Encrypted:      no',
  'Page size:      595.276 x 841.89 pts (A4)',
  'Tagged:         yes',
  'File size:      13276048 bytes',
].join('\n');

describe('werteAusPdfInfo', () => {
  test('liest alle Felder aus echter Ausgabe', () => {
    assert.deepEqual(werteAusPdfInfo(ECHTE_AUSGABE), {
      seitenzahl: 46,
      breitePt: 595.276,
      hoehePt: 841.89,
      titel: 'HoReCa Table Top Q3/26',
      getaggt: true,
      verschluesselt: false,
    });
  });

  test('meldet ein verschlüsseltes PDF', () => {
    const aus = ECHTE_AUSGABE.replace('Encrypted:      no', 'Encrypted:      yes');
    assert.equal(werteAusPdfInfo(aus).verschluesselt, true);
  });

  test('gilt als verschlüsselt, wenn das Feld ganz fehlt (fail-closed)', () => {
    const ohne = ECHTE_AUSGABE.split('\n').filter((z) => !z.startsWith('Encrypted')).join('\n');
    assert.equal(werteAusPdfInfo(ohne).verschluesselt, true);
  });

  test('erkennt ein ungetaggtes PDF', () => {
    assert.equal(werteAusPdfInfo(ECHTE_AUSGABE.replace('yes', 'no')).getaggt, false);
  });

  test('lässt den Titel weg, wenn er fehlt', () => {
    const ohne = ECHTE_AUSGABE.split('\n').filter((z) => !z.startsWith('Title')).join('\n');
    assert.equal(werteAusPdfInfo(ohne).titel, undefined);
  });

  test('wirft bei fehlender Seitenzahl', () => {
    const kaputt = ECHTE_AUSGABE.replace('Pages:          46', 'Pages:          0');
    assert.throws(() => werteAusPdfInfo(kaputt), /Seitenzahl/);
  });

  test('wirft bei unlesbarem Seitenformat', () => {
    const kaputt = ECHTE_AUSGABE.replace(/Page size:.*/, 'Page size:      unbekannt');
    assert.throws(() => werteAusPdfInfo(kaputt), /Seitenformat/);
  });

  test('versteht A3 im Querformat', () => {
    const a3 = ECHTE_AUSGABE.replace(/Page size:.*/, 'Page size:      1190.55 x 841.89 pts (A3)');
    const info = werteAusPdfInfo(a3);
    assert.equal(info.breitePt, 1190.55);
    assert.equal(info.hoehePt, 841.89);
  });
});
