import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HINTERGRUND_VORLAGEN, waehleHintergrund } from '../src/hintergrund.ts';

describe('waehleHintergrund', () => {
  test('nimmt Holz als Voreinstellung', () => {
    assert.deepEqual(waehleHintergrund('holz'), { kennung: 'holz', farbe: undefined });
  });

  test('kennt alle Vorlagen aus flipbook.css', () => {
    for (const vorlage of HINTERGRUND_VORLAGEN) {
      assert.equal(waehleHintergrund(vorlage).kennung, vorlage, `Vorlage ${vorlage} fehlt`);
    }
  });

  test('führt dieselben Vorlagen wie der Generator', () => {
    // Läuft der Generator auseinander, nimmt er Werte an, die der Viewer
    // nicht kennt — und die Bühne fiele stillschweigend auf Holz zurück.
    assert.deepEqual([...HINTERGRUND_VORLAGEN].sort(), ['dunkel', 'grau', 'holz', 'holz-dunkel']);
  });

  test('reicht einen freien Hex-Wert durch', () => {
    assert.deepEqual(waehleHintergrund('#1e3a5f'), { kennung: 'eigen', farbe: '#1e3a5f' });
  });

  test('akzeptiert Hex-Werte in Großschreibung', () => {
    assert.equal(waehleHintergrund('#AABBCC').farbe, '#AABBCC');
  });

  test('fällt bei unbekannten Werten auf Holz zurück, statt die Bühne leer zu lassen', () => {
    assert.equal(waehleHintergrund('marmor').kennung, 'holz');
    assert.equal(waehleHintergrund('#xyz').kennung, 'holz');
    assert.equal(waehleHintergrund('').kennung, 'holz');
  });

  test('fällt bei fehlendem Feld auf Holz zurück', () => {
    // Kataloge, die vor der Einführung des Feldes erzeugt wurden.
    assert.equal(waehleHintergrund(undefined).kennung, 'holz');
  });

  test('setzt für Vorlagen keine Farbe — die steht im Stylesheet', () => {
    assert.equal(waehleHintergrund('dunkel').farbe, undefined);
  });
});
