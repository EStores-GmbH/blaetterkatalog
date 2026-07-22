import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  HINTERGRUND_STANDARD_BILD,
  HINTERGRUND_VORLAGEN,
  bildDarstellung,
  istBildangabe,
  loeseBildUrl,
  waehleHintergrund,
} from '../src/hintergrund.ts';

describe('waehleHintergrund — Bild', () => {
  test('nimmt ohne Angabe das mitgelieferte Bild', () => {
    const w = waehleHintergrund(undefined);
    assert.equal(w.art, 'bild');
    assert.equal(w.bild, HINTERGRUND_STANDARD_BILD);
  });

  test('behandelt "holz" als das mitgelieferte Bild', () => {
    assert.equal(waehleHintergrund('holz').bild, HINTERGRUND_STANDARD_BILD);
  });

  test('nimmt einen relativen Bildpfad aus dem Katalogordner', () => {
    const w = waehleHintergrund('hintergrund.jpg');
    assert.equal(w.art, 'bild');
    assert.equal(w.bild, '/katalog/hintergrund.jpg');
  });

  test('reicht eine vollständige URL durch (Phase 1: Storyblok)', () => {
    const url = 'https://a2.storyblok.com/f/1/holz.jpg';
    assert.equal(waehleHintergrund(url).bild, url);
  });

  test('erkennt alle unterstützten Bildendungen', () => {
    for (const endung of ['jpg', 'jpeg', 'png', 'webp', 'avif', 'JPG']) {
      assert.equal(waehleHintergrund(`x.${endung}`).art, 'bild', `${endung} fehlt`);
    }
  });
});

describe('waehleHintergrund — Vorlagen und Farben', () => {
  test('kennt alle Vorlagen aus flipbook.css', () => {
    for (const vorlage of HINTERGRUND_VORLAGEN) {
      const w = waehleHintergrund(vorlage);
      assert.ok(w.kennung === vorlage || w.art === 'bild', `Vorlage ${vorlage} fehlt`);
    }
  });

  test('reicht einen freien Hex-Wert durch', () => {
    assert.deepEqual(waehleHintergrund('#1e3a5f'), {
      art: 'farbe',
      kennung: 'eigen',
      bild: undefined,
      farbe: '#1e3a5f',
    });
  });

  test('fällt bei unbekannten Werten auf gezeichnetes Holz zurück', () => {
    // Bewusst KEIN Bild: Ein Tippfehler soll nicht in einem 404 enden.
    for (const unsinn of ['marmor', '#xyz', 'holtz']) {
      const w = waehleHintergrund(unsinn);
      assert.equal(w.art, 'vorlage', `"${unsinn}" wurde falsch eingeordnet`);
      assert.equal(w.kennung, 'holz');
    }
  });

  test('behandelt einen leeren Wert wie "nichts angegeben"', () => {
    // Leer heißt nicht "kaputt", sondern "keine Wahl getroffen" —
    // also das mitgelieferte Bild, nicht der Notnagel.
    for (const leer of ['', '   ']) {
      assert.equal(waehleHintergrund(leer).bild, HINTERGRUND_STANDARD_BILD);
    }
  });
});

describe('istBildangabe', () => {
  test('erkennt Pfade mit Bildendung', () => {
    assert.equal(istBildangabe('holz.jpg'), true);
    assert.equal(istBildangabe('bilder/holz.webp'), true);
  });

  test('erkennt Bildendungen trotz Abfrageteil', () => {
    assert.equal(istBildangabe('/a/holz.jpg?v=2'), true);
  });

  test('erkennt URLs auch ohne Endung — Storyblok liefert sie so', () => {
    assert.equal(istBildangabe('https://a2.storyblok.com/f/1/x'), true);
  });

  test('hält Vorlagennamen und Farben nicht für Bilder', () => {
    assert.equal(istBildangabe('holz'), false);
    assert.equal(istBildangabe('#8a5a33'), false);
  });
});

describe('loeseBildUrl', () => {
  test('setzt den Katalogordner vor relative Pfade', () => {
    assert.equal(loeseBildUrl('hintergrund.jpg'), '/katalog/hintergrund.jpg');
  });

  test('lässt absolute Pfade unangetastet', () => {
    assert.equal(loeseBildUrl('/assets/holz.jpg'), '/assets/holz.jpg');
  });

  test('lässt vollständige URLs unangetastet', () => {
    assert.equal(loeseBildUrl('https://x.de/h.jpg'), 'https://x.de/h.jpg');
  });
});

describe('bildDarstellung', () => {
  test('kachelt kleine Texturen', () => {
    assert.equal(bildDarstellung(256, 256), 'kachel');
  });

  test('füllt mit großen Fotos', () => {
    assert.equal(bildDarstellung(2400, 1600), 'fuellend');
  });

  test('entscheidet anhand der längsten Kante', () => {
    assert.equal(bildDarstellung(120, 900), 'fuellend');
  });
});
