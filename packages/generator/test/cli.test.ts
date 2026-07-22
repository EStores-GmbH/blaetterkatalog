import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { leseArgumente } from '../src/cli.ts';
import { STANDARD_DPI } from '../src/render.ts';
import { WerkzeugFehlt } from '../src/pdf-tools.ts';

describe('leseArgumente', () => {
  test('nimmt das PDF als erstes Argument und setzt sinnvolle Standardwerte', () => {
    const o = leseArgumente(['katalog.pdf']);
    assert.notEqual(o, 'hilfe');
    if (o === 'hilfe') return;
    assert.equal(o.pdf, 'katalog.pdf');
    assert.equal(o.dpi, STANDARD_DPI);
    assert.equal(o.farbe, '#0057a0');
  });

  test('zeigt die Hilfe, wenn kein PDF genannt ist', () => {
    assert.equal(leseArgumente([]), 'hilfe');
    assert.equal(leseArgumente(['--hilfe']), 'hilfe');
  });

  test('übernimmt alle Optionen', () => {
    const o = leseArgumente([
      'k.pdf', '--dpi', '150', '--slug', 'q3', '--titel', 'Katalog Q3', '--farbe', '#ABCDEF',
    ]);
    if (o === 'hilfe') throw new Error('unerwartet Hilfe');
    assert.deepEqual(
      { dpi: o.dpi, slug: o.slug, titel: o.titel, farbe: o.farbe },
      { dpi: 150, slug: 'q3', titel: 'Katalog Q3', farbe: '#ABCDEF' },
    );
  });

  test('weist unsinnige Auflösungen zurück', () => {
    assert.throws(() => leseArgumente(['k.pdf', '--dpi', '5']), /zwischen 36 und 1200/);
    assert.throws(() => leseArgumente(['k.pdf', '--dpi', 'viel']), /zwischen 36 und 1200/);
  });

  test('weist Farben zurück, die kein Hex-Wert sind', () => {
    assert.throws(() => leseArgumente(['k.pdf', '--farbe', 'blau']), /Hex-Wert/);
    assert.throws(() => leseArgumente(['k.pdf', '--farbe', '#ABC']), /Hex-Wert/);
  });
});

describe('WerkzeugFehlt', () => {
  test('nennt das fehlende Programm, wofür es gebraucht wird und wie man es installiert', () => {
    const fehler = new WerkzeugFehlt(['pdftoppm']);
    assert.match(fehler.message, /pdftoppm/);
    assert.match(fehler.message, /Seiten zu Bildern rendern/);
    assert.match(fehler.message, /brew install poppler/);
    assert.match(fehler.message, /apt-get install poppler-utils/);
  });

  test('führt mehrere fehlende Programme einzeln auf', () => {
    const fehler = new WerkzeugFehlt(['pdfinfo', 'pdftotext']);
    assert.match(fehler.message, /pdfinfo/);
    assert.match(fehler.message, /pdftotext/);
    assert.deepEqual(fehler.fehlend, ['pdfinfo', 'pdftotext']);
  });
});
