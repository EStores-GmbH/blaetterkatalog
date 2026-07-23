/**
 * Guards for the dev server's path handling.
 *
 * CodeQL flagged three "uncontrolled data used in path expression" findings
 * here. The escape never actually succeeded, but the old check *repaired*
 * malicious input into a valid path instead of refusing it — an attack
 * answered with 200 tells you nothing. These tests pin the fail-closed
 * behaviour.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sichererPfad } from '../src/dev-server.ts';

const WURZEL = '/srv/katalog';

describe('sichererPfad — erlaubte Pfade', () => {
  test('lässt eine einfache Datei durch', () => {
    assert.equal(sichererPfad(WURZEL, 'katalog.json'), '/srv/katalog/katalog.json');
  });

  test('lässt Unterverzeichnisse durch', () => {
    assert.equal(sichererPfad(WURZEL, 'pages/seite-01.jpg'), '/srv/katalog/pages/seite-01.jpg');
  });

  test('verträgt führende Schrägstriche und Punkt-Segmente', () => {
    assert.equal(sichererPfad(WURZEL, '/./pages/./seite-01.jpg'), '/srv/katalog/pages/seite-01.jpg');
  });

  test('dekodiert Prozentkodierung in Dateinamen', () => {
    assert.equal(sichererPfad(WURZEL, 'Gr%C3%B6%C3%9Fe.pdf'), '/srv/katalog/Größe.pdf');
  });

  test('erlaubt die Wurzel selbst', () => {
    assert.equal(sichererPfad(WURZEL, ''), WURZEL);
  });
});

describe('sichererPfad — abgewiesene Pfade', () => {
  test('weist einfaches Aufwärtsgehen ab', () => {
    assert.equal(sichererPfad(WURZEL, '../etc/passwd'), undefined);
  });

  test('weist mehrfaches Aufwärtsgehen ab', () => {
    assert.equal(sichererPfad(WURZEL, '../../../etc/passwd'), undefined);
  });

  test('weist prozentkodiertes Aufwärtsgehen ab (%2e%2e%2f)', () => {
    // Genau der Fall aus dem CodeQL-Befund: curl normalisiert unkodierte
    // Punkte selbst weg, kodierte kommen beim Server an.
    assert.equal(sichererPfad(WURZEL, '%2e%2e%2f%2e%2e%2fpackage.json'), undefined);
  });

  test('weist gemischt kodiertes Aufwärtsgehen ab (..%2f)', () => {
    assert.equal(sichererPfad(WURZEL, '..%2f..%2fetc%2fpasswd'), undefined);
  });

  test('weist absolute Pfade mit Aufwärtsgehen ab, statt sie zu reparieren', () => {
    // Die alte Fassung machte daraus stillschweigend /srv/katalog/package.json
    // und antwortete mit 200.
    assert.equal(sichererPfad(WURZEL, '/../../package.json'), undefined);
  });

  test('weist NUL-Bytes ab', () => {
    assert.equal(sichererPfad(WURZEL, 'katalog.json\0.jpg'), undefined);
  });

  test('weist kaputte Prozentkodierung ab, statt zu werfen', () => {
    assert.equal(sichererPfad(WURZEL, '%ZZ'), undefined);
  });

  test('weist ein Verzeichnis daneben ab, das mit demselben Namen beginnt', () => {
    // /srv/katalog-geheim darf nicht als "innerhalb von /srv/katalog" gelten.
    assert.equal(sichererPfad('/srv/katalog', '../katalog-geheim/x'), undefined);
  });
});
