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

import { baueTextfassung } from '../src/textfassung.ts';
import type { Katalog } from '../src/katalog-typen.ts';

function katalog(teil: Partial<Katalog> = {}): Katalog {
  return {
    slug: 'test',
    titel: 'Test-Katalog',
    seitenzahl: 2,
    ausrichtung: 'hoch',
    akzentfarbe: '#0057a0',
    download_pdf: 'original.pdf',
    seiten: [
      { nr: 1, bild: 'pages/seite-01.jpg', breite: 100, hoehe: 140, text_html: '<p>Erste Seite</p>' },
      { nr: 2, bild: 'pages/seite-02.jpg', breite: 100, hoehe: 140, text_html: '' },
    ],
    toc: [],
    erzeugt_am: '2026-07-23T10:00:00.000Z',
    ...teil,
  };
}

describe('baueTextfassung', () => {
  test('erzeugt valides Grundgerüst mit Sprache und genau einer h1', () => {
    const html = baueTextfassung(katalog());
    assert.match(html, /<html lang="de">/);
    assert.equal(html.match(/<h1>/g)?.length, 1);
    assert.match(html, /Test-Katalog/);
  });

  test('Inhaltsverzeichnis-Link zeigt auf die Dateiposition, nicht die gedruckte Zahl', () => {
    // Genau die Viewer-Hälfte des Seitenversatzes: Anzeige gedruckt, Sprung Position.
    const html = baueTextfassung(katalog({
      toc: [{ label: 'Vorwort', seite: 4, index: 6 }],
    }));
    assert.match(html, /href="#seite-6"/);   // Sprungziel = index
    assert.match(html, /Seite 4/);            // Anzeige = gedruckte Zahl
    assert.doesNotMatch(html, /href="#seite-4"/);
  });

  test('fällt ohne index auf die gedruckte Seitenzahl zurück (Altkataloge)', () => {
    const html = baueTextfassung(katalog({ toc: [{ label: 'X', seite: 7 }] }));
    assert.match(html, /href="#seite-7"/);
  });

  test('lässt das Inhaltsverzeichnis weg, wenn keins da ist', () => {
    assert.doesNotMatch(baueTextfassung(katalog({ toc: [] })), /class="toc"/);
  });

  test('kennzeichnet Seiten ohne Text statt einen leeren Absatz zu bauen', () => {
    const html = baueTextfassung(katalog());
    assert.match(html, /kein.*auslesbaren Text|ohne-text/i);
  });

  test('maskiert einen Titel mit Sonderzeichen', () => {
    const html = baueTextfassung(katalog({ titel: 'A & B <script>' }));
    assert.match(html, /A &amp; B &lt;script&gt;/);
    assert.doesNotMatch(html, /<script>/);
  });

  test('fällt bei ungültiger Akzentfarbe auf den Standard zurück', () => {
    const html = baueTextfassung(katalog({ akzentfarbe: 'javascript:alert(1)' }));
    assert.match(html, /--akzent: #0057a0/);
    assert.doesNotMatch(html, /javascript:/);
  });
});
