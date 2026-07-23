# Recherche: Blätter-Engine (StPageFlip vs. Alternativen)

> Erhoben am 22.07.2026 gegen die Live-Stände von GitHub, npm, Bundlephobia.
> Frage: Ist StPageFlip die richtige Blätter-Engine — beibehalten, ersetzen oder forken?

## Befund StPageFlip

| Kennzahl | Wert | Quelle |
|---|---|---|
| Letzter Commit auf `master` | **18.04.2021** (`ab30ecc`, „2.0.7") | GitHub Commits-API |
| Letztes npm-Release | **2.0.7 / 18.04.2021** | registry.npmjs.org/page-flip |
| Downloads/Woche | **82.502** (15.–21.07.2026) | api.npmjs.org |
| Stars / Forks | 818 / 178 | GitHub-API |
| Offene Issues / PRs | 42 / 4 (ältester PR #30 seit 11.06.2022) | GitHub Search-API |
| Maintainer-Aktivität (Nodlik) | **0 öffentliche Events** im Feed | GitHub Events-API |
| Issue #54 „Mark this project as abandoned" | offen seit 25.05.2024, keine Antwort | Issue-Comments-API |
| Lizenz | MIT | package.json |
| Bundle | 43,5 KB min / 10,3 KB gzip, **0 Dependencies** | Bundlephobia |
| TypeScript-Typen | **nein** (kein `.d.ts` im Paket; `src/*.ts` mitgeliefert) | jsDelivr |
| npm-Tarball-Macke | enthält `video.gif` mit **9,17 MB** | jsDelivr |
| Gepflegte Forks? | **nein** — kein Fork mit > 1 Star | Forks-API |

**Bewertung:** Upstream ist seit über 5 Jahren tot. Gleichzeitig mit 82k Dl/Woche
der De-facto-Standard ohne Nachfolger.

### Ungefixte Bugs, die uns treffen (im Quellcode verifiziert)

1. **Render-Loop wird nie gestoppt** (Issue #71, 20.07.2026). `Render.start()` ist
   eine bedingungslose Endlosschleife ohne `cancelAnimationFrame`/Stop-Flag.
   `destroy()` entfernt DOM + Listener, **die rAF-Schleife läuft weiter** — für immer.
   Bei Astro mit Client-Side-Navigation leakt jeder Katalogaufruf eine Schleife.
   → als PATCH 1 im Fork behoben.
2. **Kein `onerror` auf Bildern.** Ein 404 ⇒ `isLoad` bleibt `false` ⇒ Endlos-Spinner,
   den die Render-Schleife dauerhaft weiteranimiert. → PATCH 2.

## Fähigkeiten (im Quellcode geprüft)

| Fähigkeit | Status | Beleg |
|---|---|---|
| Rendering-Modus | **Canvas UND HTML-DOM** | `CanvasRender.ts` + `HTMLRender.ts` |
| HTML-Modus = echtes DOM? | ja — CSS-3D + `clip-path` auf dem Originalelement | `HTMLPage.ts` |
| Lazy-Loading Canvas | **nein** — alle Bilder sofort (150 Seiten = 150 Requests beim Init) | `ImagePageCollection.load()` |
| Lazy-Loading HTML | ja, aber selbst gebaut (wir liefern die Knoten) | ebd. |
| Nur aktueller Spread sichtbar | ja | `PageCollection.showSpread()` |
| Tastaturbedienung | **nein** — nur `resize`/`mouse`/`touch` | `UI.setHandlers()` |
| ARIA / Rollen / Fokus | **nein** | ebd. |
| Zoom | **nein** | `Settings.ts` (21 Settings, kein Zoom) |
| Doppel-/Einzelseite | ja — `usePortrait`, `showCover` | `Settings.ts` |
| Touch | eingeschränkt (kein Pinch/Pointer-Events) | `UI.ts` |

**Kernerkenntnis:** „Seiten als Bilder" ⇒ `loadFromImages()` ⇒ Canvas — und genau
dieser Modus killt Lazy-Loading, Textebene, SEO und Screenreader gleichzeitig.
Der HTML-Modus mit `<img>` je Seite liefert denselben Look, behält aber DOM,
Alt-Texte und Ladekontrolle.

## Referenz-Look igefa

`<meta name="Generator" content="FlipPDFPlusPro for mac v6.9.9">` — kommerzielles
Desktop-Export-Tool, kein Web-Stack. Lädt jQuery 3.5.1 + Vue-App. Zwei Fehler,
die wir nicht übernehmen:

- `user-scalable=no` im Viewport — verletzt WCAG 1.4.4 (Zoom unterbunden).
- SEO-Fallback nur in `<noscript>` → `files/basic-html/page1.html`, bei igefa
  **defekt** (unaufgelöste Platzhalter `${meta.description}`, Titel „Page 1 - Demo").

## Alternativen (alle am 22.07.2026 geprüft)

| Lösung | Lizenz | Wartung | Rendering | a11y | Kosten | Fazit |
|---|---|---|---|---|---|---|
| **StPageFlip** | MIT | tot 04/2021, 82k Dl/Wo | Canvas + HTML | nachrüstbar (HTML) | 0 € | **beste Basis** |
| turn.js | gemischt/kommerziell | tot, 393 offene Issues | DOM + jQuery | nichts | v4 kostenpflichtig | ❌ jQuery + Lizenz |
| react-pageflip | MIT | v2.0.3/2021, react ^17 | wie StPageFlip | nichts | 0 € | ❌ React-Zwang, erbt Bugs |
| react-pageflip-enhanced | MIT | aktiv (10.02.2026) | wie StPageFlip (einvendort) | nichts | 0 € | ⚠️ beweist Vendoring, React-only |
| DearFlip/dFlip | kommerziell | aktiv | WebGL + jQuery | Herstellerangabe | 49 $/J, 149 $ LT | ⚠️ Blackbox |
| 3d-flip-book (npm) | **GPL-2.0** | Stand 2020, three.js ^0.81 | WebGL | nichts | GPL | ❌ Copyleft-Risiko |
| Nutrient/PSPDFKit | kommerziell | sehr aktiv | Canvas + Textlayer | sehr gut | 25–40 k$/J | ❌ **kann keinen Flip-Effekt** |
| PDF.js-Eigenbau | Apache-2.0 | Mozilla, aktiv | Canvas + Textlayer | ja | 0 € + Eigenleistung | ⚠️ **kein Flip** |
| EmbedPDF | MIT | aktiv, ~4k Stars | eigene Pipeline | gut | 0 € | ⚠️ **kein Flip** |
| flipbook-viewer | MIT | tot (2022) | Canvas | nichts | 0 € | ❌ |
| CSS-3D-Eigenlösung | — | — | DOM/CSS | voll kontrollierbar | Eigenleistung | ⚠️ ~600 Zeilen `FlipCalculation.ts` selbst bauen |

**Kernbefund:** 2026 existiert **kein aktiv gepflegtes Open-Source-Projekt, das
realistisches Seitenblättern kann.** Die aktiven Projekte sind PDF-Viewer ohne
Flip; die Flip-Projekte sind tot, GPL oder kommerzielle Blackboxen.

## Empfehlung

**StPageFlip beibehalten — als einvendorter Fork im eigenen Repo, zwingend im
HTML-Modus.** Ersetzen scheidet aus (keine Alternative bietet Flip-Effekt,
freie Lizenz und Pflege zugleich). Externer Fork scheidet aus (keiner > 1 Star).
Vendoring ist vertretbar: ~2.000 Zeilen TS, MIT, 0 Dependencies, 10 KB gzip.

**Hauptrisiko:** Wir werden zum Maintainer — mit Katalogen von 30–150 Seiten in
einer Größenordnung, für die die Engine nie getestet wurde.

**Abfederung (umgesetzt):** Stop-Flag (PATCH 1), `onerror` (PATCH 2), Tastatur/
ARIA im Viewer, `FlipViewer`-Fassade (`engine.ts`), Lazy-Loading ±2 Seiten,
kein `user-scalable=no`.

**Nicht verifiziert:** reale Touch-Qualität auf iOS/Android, Speicher bei 150
Seiten. → Messpunkt T-014 vor Festschreiben des Forks.

## Quellen

- github.com/Nodlik/StPageFlip · Issues #54/#71/#67 · api.github.com/repos/Nodlik/StPageFlip
- registry.npmjs.org/page-flip · api.npmjs.org/downloads/point/last-week/page-flip
- cdn.jsdelivr.net/npm/page-flip@2.0.7/src/ · bundlephobia.com/package/page-flip
- github.com/blasten/turn.js · turnjs.com · js.dearflip.com/pricing
- nutrient.io/blog/top-5-javascript-pdf-viewers (15.07.2026) · embedpdf.com
- portalzine.de/open-source-page-flip-and-pdf-viewer-solutions-in-javascript-2026 (17.02.2026)
