import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_KANTE_PX,
  begrenzeDpi,
  bestimmeAusrichtung,
  nachSeitennummer,
  pixelMasse,
} from '../src/render.ts';

const A4_BREITE = 595.276;
const A4_HOEHE = 841.89;
const A3_BREITE = 841.89;
const A3_HOEHE = 1190.55;

describe('begrenzeDpi', () => {
  test('lässt A4 bei 300 dpi unangetastet — passt unter das Limit', () => {
    assert.equal(begrenzeDpi(A4_BREITE, A4_HOEHE, 300), 300);
  });

  test('deckelt A4 oberhalb von 342 dpi', () => {
    const dpi = begrenzeDpi(A4_BREITE, A4_HOEHE, 600);
    const { hoehe } = pixelMasse(A4_BREITE, A4_HOEHE, dpi);
    assert.ok(hoehe <= MAX_KANTE_PX, `${hoehe} px überschreitet ${MAX_KANTE_PX}`);
    assert.equal(dpi, 342);
  });

  test('deckelt A3 deutlich früher als A4', () => {
    const a3 = begrenzeDpi(A3_BREITE, A3_HOEHE, 300);
    assert.ok(a3 < 300, 'A3 muss bei 300 dpi begrenzt werden');
    const { hoehe } = pixelMasse(A3_BREITE, A3_HOEHE, a3);
    assert.ok(hoehe <= MAX_KANTE_PX);
  });

  test('rechnet bei Querformat mit der Breite als längster Kante', () => {
    // 16:9 quer — die Breite ist hier die kritische Kante.
    const dpi = begrenzeDpi(1920, 1080, 600);
    const { breite } = pixelMasse(1920, 1080, dpi);
    assert.ok(breite <= MAX_KANTE_PX, `${breite} px überschreitet ${MAX_KANTE_PX}`);
  });
});

describe('bestimmeAusrichtung', () => {
  test('erkennt Hochformat', () => {
    assert.equal(bestimmeAusrichtung(A4_BREITE, A4_HOEHE), 'hoch');
  });

  test('erkennt Querformat', () => {
    assert.equal(bestimmeAusrichtung(A4_HOEHE, A4_BREITE), 'quer');
  });

  test('behandelt quadratische Seiten als Hochformat', () => {
    // Doppelseite ergäbe 2:1 — vertretbar, aber Einzelseite ist die sichere Wahl.
    assert.equal(bestimmeAusrichtung(500, 500), 'hoch');
  });
});

describe('pixelMasse', () => {
  test('rechnet A4 bei 200 dpi korrekt um', () => {
    // Gegengeprüft an einem echten pdftoppm-Lauf über den Referenzkatalog.
    assert.deepEqual(pixelMasse(A4_BREITE, A4_HOEHE, 200), {
      breite: 1654,
      hoehe: 2339,
    });
  });
});

describe('nachSeitennummer', () => {
  test('sortiert numerisch, nicht alphabetisch', () => {
    const dateien = ['seite-10.jpg', 'seite-2.jpg', 'seite-1.jpg', 'seite-21.jpg'];
    assert.deepEqual(dateien.toSorted(nachSeitennummer), [
      'seite-1.jpg',
      'seite-2.jpg',
      'seite-10.jpg',
      'seite-21.jpg',
    ]);
  });

  test('sortiert auch mit führenden Nullen richtig', () => {
    const dateien = ['seite-09.jpg', 'seite-10.jpg', 'seite-01.jpg'];
    assert.deepEqual(dateien.toSorted(nachSeitennummer), [
      'seite-01.jpg',
      'seite-09.jpg',
      'seite-10.jpg',
    ]);
  });
});
