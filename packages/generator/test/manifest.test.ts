import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { baueSlug, baueTitel } from '../src/manifest.ts';

describe('baueSlug', () => {
  test('schreibt Umlaute aus statt sie zu verschlucken', () => {
    assert.equal(baueSlug('Süße Momente'), 'suesse-momente');
    assert.equal(baueSlug('Größenübersicht'), 'groessenuebersicht');
  });

  test('macht aus dem echten Dateinamen etwas Brauchbares', () => {
    assert.equal(
      baueSlug('260716_MKT-2091 HoReCa Table Top Kampagne Q3_26_v5_RZ_ES_WEB_72dpi'),
      '260716-mkt-2091-horeca-table-top-kampagne-q3-26-v5-rz-es-web-72dpi',
    );
  });

  test('lässt keine Trennstriche am Rand stehen', () => {
    assert.equal(baueSlug('  --Katalog!!  '), 'katalog');
  });

  test('begrenzt die Länge', () => {
    assert.ok(baueSlug('a'.repeat(200)).length <= 80);
  });
});

describe('baueTitel', () => {
  test('bevorzugt den Titel aus den PDF-Metadaten', () => {
    assert.equal(baueTitel('/pfad/egal.pdf', 'HoReCa Table Top Q3/26'), 'HoReCa Table Top Q3/26');
  });

  test('fällt auf den Dateinamen zurück, wenn Metadaten fehlen', () => {
    assert.equal(baueTitel('/pfad/Mein_Katalog.pdf', undefined), 'Mein Katalog');
  });

  test('ignoriert nichtssagende Metadaten-Titel', () => {
    // InDesign schreibt gelegentlich einen einzelnen Buchstaben ins Titelfeld.
    assert.equal(baueTitel('/pfad/Mein_Katalog.pdf', ' x '), 'Mein Katalog');
  });
});
