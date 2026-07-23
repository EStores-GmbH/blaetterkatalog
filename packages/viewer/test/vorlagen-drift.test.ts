import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HINTERGRUND_VORLAGEN as VIEWER_VORLAGEN } from '../src/hintergrund.ts';
import { HINTERGRUND_VORLAGEN as GENERATOR_VORLAGEN } from '../../generator/src/cli.ts';

// Generator und Viewer sind bewusst getrennte Pakete (kein gemeinsamer Import
// im Produktivcode). Damit die doppelt gepflegte Vorlagenliste nicht
// auseinanderläuft — der Generator würde sonst eine Vorlage ablehnen, die der
// Viewer kennt, oder umgekehrt — hält dieser Test beide Seiten deckungsgleich.
// Drei Reviewer haben genau diese Drift-Gefahr angemerkt.
describe('Hintergrund-Vorlagen: Generator und Viewer deckungsgleich', () => {
  test('beide Pakete führen dieselben Vorlagennamen', () => {
    assert.deepEqual([...VIEWER_VORLAGEN].sort(), [...GENERATOR_VORLAGEN].sort());
  });

  test('erwartete Namen sind vorhanden', () => {
    // Ändert jemand die Liste, muss er auch flipbook.css anpassen — dieser
    // Wert erinnert im Diff daran (CSS kann ein TS-Test nicht prüfen).
    assert.deepEqual([...VIEWER_VORLAGEN].sort(), ['dunkel', 'grau', 'holz', 'holz-dunkel']);
  });
});
