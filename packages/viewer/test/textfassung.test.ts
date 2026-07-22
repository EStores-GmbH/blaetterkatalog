import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { baueAltText, maskiere } from '../src/textfassung.ts';
import type { Seite } from '../src/katalog-typen.ts';

function seite(text_html: string, nr = 3): Seite {
  return { nr, bild: 'pages/seite-03.jpg', breite: 100, hoehe: 140, text_html };
}

describe('maskiere', () => {
  test('entschärft die vier gefährlichen Zeichen', () => {
    assert.equal(maskiere('<b>a & "b"</b>'), '&lt;b&gt;a &amp; &quot;b&quot;&lt;/b&gt;');
  });

  test('lässt Umlaute unangetastet', () => {
    assert.equal(maskiere('Süße Größe'), 'Süße Größe');
  });
});

describe('baueAltText', () => {
  test('nennt Seitenzahl und Gesamtzahl', () => {
    assert.match(baueAltText(seite('<p>Kurzer Text</p>'), 46), /^Seite 3 von 46: Kurzer Text$/);
  });

  test('entfernt die Auszeichnung', () => {
    assert.equal(baueAltText(seite('<p>A</p>\n<p>B</p>'), 9), 'Seite 3 von 9: A B');
  });

  test('sagt es, wenn eine Seite keinen Text hat', () => {
    assert.match(baueAltText(seite(''), 46), /ohne Text$/);
  });

  test('kürzt am Wortende, nicht mitten im Wort', () => {
    const lang = `<p>${'Donaudampfschiff '.repeat(20)}</p>`;
    const alt = baueAltText(seite(lang), 46);
    assert.ok(alt.endsWith(' …'), 'kein Auslassungszeichen');
    assert.ok(!/\w…/.test(alt), 'mitten im Wort abgeschnitten');
    assert.ok(alt.length < 160, `zu lang: ${alt.length}`);
  });

  test('kommt mit unvollständigen Tags zurecht, ohne hängenzubleiben', () => {
    // Kaputte Auszeichnung darf nicht in eine Endlosprüfung laufen.
    const kaputt = seite('<p>Text ohne Ende <<<<<<<<<<'.repeat(50));
    const alt = baueAltText(kaputt, 46);
    assert.match(alt, /^Seite 3 von 46/);
  });
});
