# @blaetterkatalog/viewer

Zeigt einen erzeugten Katalog an: den Blätterkatalog (Page-Flip) und die
barrierefreie HTML-Textfassung. Liest die `katalog.json` aus dem
Generator-Ausgabeordner.

> Gesamtüberblick und Einordnung: `../../docs/POC-STATUS.md`.

## Ausführen

```bash
npm run viewer                         # nimmt den einzigen Ordner in out/
npm run viewer -- --katalog out/<name> # bei mehreren
```

- Blätterkatalog: <http://localhost:4321/>
- Textfassung: <http://localhost:4321/text/>

## Aufbau

| Datei | Aufgabe |
|---|---|
| `index.html` | Gerüst des Blätterkatalogs (Bedienelemente, ARIA) |
| `src/dev-server.ts` | **Provisorium** — liefert `out/` lokal aus, übersetzt `.ts` on-the-fly |
| `src/flipbook.ts` | Kern: lädt `katalog.json`, treibt die Engine, Tastatur, Nachladen, TOC |
| `src/engine.ts` | schmale Fassade um die Flip-Engine (isoliert den Fremdcode) |
| `src/textfassung.ts` | baut die HTML-Textfassung (Vorlage für die Astro-Routen) |
| `src/hintergrund.ts` | wählt den Untergrund (Bild / Vorlage / Farbe) |
| `src/farbe.ts` | Hex-Prüfung + Akzentfarben-Standard |
| `src/katalog-typen.ts` | Typen der `katalog.json` (Verbraucher-Seite) |
| `src/flipbook.css`, `src/textfassung.css` | Gestaltung (schlicht — CI-Theme kommt in Phase 1) |
| `assets/hintergrund-holz.jpg` | Standard-Untergrund (siehe `assets/LIESMICH.md`) |

## Was man beim Erweitern wissen muss

- **HTML-Modus der Engine**, nie Canvas (`engine.ts`). Sonst brechen Textebene,
  Nachladen und Barrierefreiheit weg.
- **`flippingTime` nie 0.** Bei `prefers-reduced-motion` wird 1 genutzt — 0 lässt
  die Engine im Konstruktor werfen (`blaetterDauer()`).
- **`engine.ts` lädt die Engine über einen zur Laufzeit gebauten Pfad.** Das hält
  den ohne Strict-Mode geschriebenen Fremdcode aus unserer strengen Typprüfung
  heraus — und ein Engine-Tausch beträfe nur diese Datei.
- **`pagehide` prüft `event.persisted`** — sonst zerstört der Vor/Zurück-Cache
  den Viewer.
- **Alles, was aus `katalog.json` ins DOM/CSS geht, wird maskiert bzw. validiert**
  (`maskiereHtml`, `sichereAkzentfarbe`, `setzeHintergrund`). In Phase 1 kommt die
  Datei aus Storyblok und ist nicht mehr vertrauenswürdig.

## Phase 1

**`dev-server.ts` wird weggeworfen.** Astro übernimmt Auslieferung, Routing und
TypeScript-Bündelung. Die Viewer-*Logik* (`flipbook.ts`, `textfassung.ts`,
`hintergrund.ts`, `farbe.ts`, `engine.ts`) wird in Astro-Komponenten eingebettet;
die Daten kommen zur Build-Zeit aus der Storyblok CDA statt von der Platte.
`textfassung.ts` ist die Vorlage für die HTML-Textrouten. Siehe `docs/BACKLOG.md`
T-019/T-020.

## Tests

```bash
npm test   # aus dem Repo-Wurzelverzeichnis
```

Reine Logik (Pfad-Sicherheit, Hintergrund-Auswahl, Textfassung, Farbe) ist per
Unit-Test abgedeckt. Der browserabhängige Teil (`flipbook.ts`-DOM) wird per
`agent-browser` manuell geprüft, nicht per Unit-Test.
