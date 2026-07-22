# Herkunft dieses Codes

Dieser Ordner enthält **fremden Code**, den wir bewusst ins Repo übernommen haben
(„vendoring"). Er wird nicht über npm aktualisiert — wir pflegen ihn selbst.

## Quelle

| | |
| --- | --- |
| Projekt | StPageFlip |
| npm-Paket | `page-flip` |
| Übernommene Version | **2.0.7** |
| Veröffentlicht am | 18.04.2021 |
| Herkunft | <https://github.com/Nodlik/StPageFlip> |
| Lizenz | MIT (siehe `LICENSE`, Copyright 2020 Nodlik) |
| Übernommen am | 2026-07-22 |
| Übernommen wurde | `src/` und `LICENSE` aus dem npm-Tarball |

Nicht übernommen: `dist/`, `README.md`, die Build-Konfigurationen und
`video.gif` — eine **8,8 MB große** Demo-Animation, die im npm-Paket mitreist.

## Warum ein Fork und kein Paket

Das Projekt ist verwaist: seit dem 18.04.2021 kein Commit, kein gemergter Pull
Request, keine Antwort auf Issues. Ein offenes Issue „Mark this project as
abandoned" ist seit Mai 2024 unbeantwortet.

Neun Alternativen wurden geprüft (Details in `decisions/log.md`). Ergebnis: Was
gepflegt wird, kann nicht blättern; was blättern kann, ist tot, GPL-belastet oder
kostet 25–40 k$ im Jahr. StPageFlip wird trotz Stillstand 82.500-mal pro Woche
heruntergeladen — es ist der Standard ohne Nachfolger.

Der Fork ist vertretbar, weil das Paket klein und abhängigkeitsfrei ist:
rund 4.000 Zeilen TypeScript, MIT, keine Fremdpakete, 10 KB komprimiert.

**Der Preis: Ab hier sind wir der Wartende.** Niemand behebt Fehler für uns.

## Unsere Änderungen

Jede Änderung ist im Code mit `PATCH <n>` markiert. Vor einem Abgleich mit einer
neueren Upstream-Fassung: `grep -rn "PATCH " src/`.

### PATCH 0 — lauffähig ohne Bauschritt

Rein technisch, ohne Verhaltensänderung. Notwendig, weil Node die TypeScript-
Dateien direkt ausführt (`--experimental-strip-types`) und dabei nur Syntax
verarbeiten kann, die sich restlos entfernen lässt.

| Was | Wo | Warum |
| --- | --- | --- |
| 7 × `const enum` → `const`-Objekt + Typ-Alias | `Settings.ts`, `Page/Page.ts`, `Render/Render.ts`, `Flip/Flip.ts` | `const enum` erzeugt Code, ist also nicht entfernbar |
| Parameter-Eigenschaften ausgeschrieben | `Flip/FlipCalculation.ts` | `constructor(private x)` erzeugt Zuweisungen |
| 79 Import-Pfade um `.ts` ergänzt | alle Dateien | Node-ESM verlangt vollständige Pfade |
| 16 Importe in `import type` aufgeteilt | 12 Dateien | Node kann Typ- und Wert-Importe nicht unterscheiden |
| `let orientation: Orientation` annotiert | `Render/Render.ts` | Folge der `const enum`-Umwandlung: der Typ wäre sonst auf `"landscape"` verengt |
| CSS-Import entfernt | `PageFlip.ts` | `import './Style/stPageFlip.css'` kann nur ein Bundler auflösen. Der Viewer bindet die Datei selbst ein. |

### PATCH 1 — Animationsschleife anhaltbar machen

**Fehler:** `Render.start()` startete eine Endlosschleife ohne Abbruchmöglichkeit.
`destroy()` entfernte das DOM, **die Schleife lief weiter** — dauerhaft, gegen ein
Element, das es nicht mehr gibt.

**Auswirkung bei uns:** In Astro wechseln Besucher die Seite, ohne dass neu
geladen wird. Jeder Katalogaufruf hätte eine weitere Schleife hinterlassen. Nach
ein paar Aufrufen wird der Browser spürbar langsam, ohne erkennbare Ursache.

**Änderung:** `Render` bekommt `stop()` und `isRunning()`; die Schleife prüft ein
Abbruch-Flag und `PageFlip.destroy()` ruft `stop()` als Erstes auf.

**Betroffen:** `Render/Render.ts`, `PageFlip.ts` · **Test:** `test/patches.test.ts`

### PATCH 2 — fehlendes Seitenbild

**Fehler:** `ImagePage` setzte nur `onload`. Schlug das Laden fehl, blieb
`isLoad` für immer `false`, die Seite zeichnete endlos ihren Ladekringel — und die
Schleife aus Patch 1 animierte ihn unermüdlich weiter.

**Auswirkung bei uns:** Ein einziges fehlendes Bild unter 150 hätte wie eine App
ausgesehen, die nie fertig lädt. Ohne Hinweis in der Konsole.

**Änderung:** `onerror` setzt `isLoad`, merkt den Fehlschlag in `loadFailed`
(abfragbar über `hasLoadFailed()`) und schreibt eine Meldung in die Konsole.

**Betroffen:** `Page/ImagePage.ts` · **Test:** `test/patches.test.ts`

### PATCH 3 — Tastatur und ARIA: **bewusst nicht hier**

Der Engine fehlen Tastaturbedienung, ARIA-Auszeichnung und Fokusverwaltung
vollständig — `UI.setHandlers()` kennt nur Maus und Touch.

Wir rüsten das **nicht im Fork** nach, sondern im Viewer. Grund: Im HTML-Modus
liefern **wir** die Seitenelemente. Beschriftung, Fokusreihenfolge und
Tastaturbedienung gehören damit ohnehin in unseren Code, und jede Zeile, die wir
nicht am Fremdcode ändern, erleichtert einen späteren Abgleich.

Siehe `docs/BACKLOG.md`, T-011.

## Fallstricke

**Der Modulgraph ist ringförmig.** `Render.ts` importiert `PageFlip.ts`, das
wiederum `CanvasRender.ts` importiert, das von `Render` erbt. Bündler lösen das
auf, Node nicht: Wer `Render.ts` zuerst importiert, bekommt

```text
ReferenceError: Cannot access 'Render' before initialization
```

**Immer `PageFlip.ts` zuerst importieren.** Der Test macht das vor.

**Der Code läuft ohne Strict-Modus.** Das Original nutzt weder `strict` noch
`strictNullChecks` — Felder wie `protected leftPage: Page = null` sind sonst
Fehler. Deshalb hat dieser Ordner eine eigene `tsconfig.json`, und die
Wurzel-Konfiguration schließt ihn aus. **Unser eigener Code bleibt streng
geprüft.** `npm run type-check` prüft beide.

## Abgleich mit dem Upstream

Falls das Projekt je wiederbelebt wird:

```bash
npm pack page-flip@<neue-version>
tar -xzf page-flip-<neue-version>.tgz
diff -ru package/src packages/flip-engine/src | less
```

Die Unterschiede sind ausschließlich die oben aufgeführten Patches plus die
`.ts`-Endungen in den Importen. Alles andere ist unveränderter Originalcode.
