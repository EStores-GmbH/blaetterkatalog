import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  baueSuchindex,
  bereinigeText,
  baueTextHtml,
  findeToc,
  findeTocAufSeite,
  maskiereHtml,
  normalisiereFuerSuche,
} from '../src/extract.ts';

describe('maskiereHtml', () => {
  test('entschärft die vier gefährlichen Zeichen', () => {
    assert.equal(
      maskiereHtml('<script>a & b "c"</script>'),
      '&lt;script&gt;a &amp; b &quot;c&quot;&lt;/script&gt;',
    );
  });

  test('lässt Umlaute unangetastet', () => {
    assert.equal(maskiereHtml('Süße Grüße, Größe'), 'Süße Grüße, Größe');
  });
});

describe('baueTextHtml', () => {
  test('macht aus Leerzeilen Absatzgrenzen', () => {
    assert.equal(
      baueTextHtml('Erster Absatz.\n\nZweiter Absatz.'),
      '<p>Erster Absatz.</p>\n<p>Zweiter Absatz.</p>',
    );
  });

  test('fügt umbrochene Zeilen innerhalb eines Absatzes zusammen', () => {
    assert.equal(
      baueTextHtml('Ein Satz, der über\nzwei Zeilen geht.'),
      '<p>Ein Satz, der über zwei Zeilen geht.</p>',
    );
  });

  test('maskiert Sonderzeichen aus dem PDF', () => {
    assert.equal(baueTextHtml('Maße: b < h & t'), '<p>Maße: b &lt; h &amp; t</p>');
  });

  test('liefert bei leeren Seiten einen leeren String statt eines leeren Absatzes', () => {
    assert.equal(baueTextHtml('   \n\n  \t \n'), '');
  });

  test('räumt Tabulatoren weg, wie sie aus InDesign-Exporten kommen', () => {
    assert.equal(baueTextHtml('Vorwort\t\t\t\t'), '<p>Vorwort</p>');
  });
});

describe('normalisiereFuerSuche', () => {
  test('presst jede Art von Leerraum auf einzelne Leerzeichen', () => {
    assert.equal(normalisiereFuerSuche('  a\t\tb\n\n c  '), 'a b c');
  });
});

describe('baueSuchindex', () => {
  test('nummeriert ab 1 und lässt leere Seiten weg', () => {
    assert.deepEqual(baueSuchindex(['Seite eins', '   ', 'Seite drei']), [
      { seite: 1, text: 'Seite eins' },
      { seite: 3, text: 'Seite drei' },
    ]);
  });
});

// Genau so liefert pdftotext die Inhaltsverzeichnis-Seite des Referenzkatalogs:
// Label mit Tabulatoren, Leerzeile, Zeile mit nur der Seitenzahl.
const ECHTE_TOC_SEITE = [
  'Inhalt',
  'Vorwort\t\t\t\t',
  '',
  '4',
  '',
  'Erläuterung Symbole\t\t\t',
  '',
  '5',
  '',
  '01 | Table Top für Hotellerie & Gastronomie\t\t\t',
  '',
  '6',
  '',
  '02 | Süße Momente stilvoll servieren\t\t\t',
  '',
  '30',
  '',
  'Impressum\t\t\t 45',
  'Seite 3',
].join('\n');

describe('findeTocAufSeite', () => {
  test('liest das Inhaltsverzeichnis des echten Katalogs', () => {
    const toc = findeTocAufSeite(ECHTE_TOC_SEITE);
    assert.deepEqual(toc.slice(0, 4), [
      { label: 'Vorwort', seite: 4 },
      { label: 'Erläuterung Symbole', seite: 5 },
      { label: '01 | Table Top für Hotellerie & Gastronomie', seite: 6 },
      { label: '02 | Süße Momente stilvoll servieren', seite: 30 },
    ]);
  });

  test('erkennt auch Label und Zahl auf derselben Zeile', () => {
    assert.deepEqual(findeTocAufSeite('Impressum   45'), [
      { label: 'Impressum', seite: 45 },
    ]);
  });

  test('entfernt Führungspunkte am Label-Ende', () => {
    assert.deepEqual(findeTocAufSeite('Kapitel eins .......  12'), [
      { label: 'Kapitel eins', seite: 12 },
    ]);
  });
});

describe('findeToc', () => {
  test('findet die Inhaltsseite unter mehreren Seiten', () => {
    // 46 Seiten wie im Referenzkatalog — das Inhaltsverzeichnis verweist auf
    // Seite 45, die Plausibilitätsprüfung braucht also einen echten Umfang.
    const seiten = ['Titelseite', 'Impressum-Text', ECHTE_TOC_SEITE, 'Vorwort …'];
    while (seiten.length < 46) seiten.push('Produktseite');

    const toc = findeToc(seiten);
    assert.ok(toc.length >= 4, `nur ${toc.length} Einträge gefunden`);
    assert.equal(toc[0]?.label, 'Vorwort');
    assert.deepEqual(toc.at(-1), { label: 'Impressum', seite: 45 });
  });

  test('liefert nichts, wenn keine Seite nach Inhaltsverzeichnis aussieht', () => {
    assert.deepEqual(findeToc(['Nur Fließtext', 'Noch mehr Fließtext']), []);
  });

  test('verwirft Seitenzahlen jenseits des Katalogumfangs', () => {
    // Eine Preisliste "Artikel 4711" darf nicht als Inhaltsverzeichnis durchgehen.
    const seiten = ['Inhalt\nArtikel\n\n4711\n\nArtikel\n\n4712\n\nArtikel\n\n4713'];
    assert.deepEqual(findeToc(seiten), []);
  });

  test('greift nur bei mindestens drei Einträgen', () => {
    assert.deepEqual(findeToc(['Inhalt\nVorwort\n\n4\n\nEnde\n\n9']), []);
  });
});

describe('bereinigeText', () => {
  test('entfernt weiche Trennzeichen — sonst findet die Suche das Wort nicht', () => {
    const mitTrennzeichen = 'zuver­lässige';
    assert.equal(bereinigeText(mitTrennzeichen), 'zuverlässige');
  });

  test('macht aus typografischen Leerzeichen gewöhnliche', () => {
    assert.equal(bereinigeText('a b c d'), 'a b c d');
  });

  test('normalisiert zerlegte Umlaute, damit Vergleiche greifen', () => {
    const zerlegt = 'Größe';
    const zusammen = 'Größe';
    assert.notEqual(zerlegt, zusammen);
    assert.equal(bereinigeText(zerlegt), zusammen);
  });

  test('lässt normalen Text unangetastet', () => {
    assert.equal(bereinigeText('Süße Momente – stilvoll'), 'Süße Momente – stilvoll');
  });
});
