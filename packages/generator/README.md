# @blaetterkatalog/generator

Verwandelt ein PDF in die Bausteine eines Blätterkatalogs: Seitenbilder,
Seitentext (HTML), Inhaltsverzeichnis, Suchindex und die beschreibende
`katalog.json`.

> Gesamtüberblick und Einordnung: `../../docs/POC-STATUS.md`.

## Ausführen

```bash
npm run katalog-build -- <pfad-zum-pdf> [Optionen]
npm run katalog-build -- --hilfe
```

Ergebnis landet in `out/<slug>/` (oder `--out <pfad>`):

```text
out/<slug>/
├── pages/seite-01.jpg …   Seitenbilder (JPEG)
├── katalog.json           Beschreibung — das Scharnier zum Viewer
├── suchindex.json         Volltext je Seite, bewusst getrennt
└── <original>.pdf         Download-Kopie
```

**Systemvoraussetzung:** Poppler (`brew install poppler`) — liefert `pdftoppm`,
`pdftotext`, `pdfinfo`. `pdf-tools.ts` prüft das beim Start und meldet klar, wenn
etwas fehlt.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `src/cli.ts` | Einstieg, Argument-Auswertung, orchestriert den Ablauf |
| `src/pdf-tools.ts` | Poppler-Aufrufe; `werteAusPdfInfo` parst die Metadaten |
| `src/render.ts` | PDF → JPEG pro Einzelseite; Auflösung aus dem Seitenformat |
| `src/extract.ts` | Seitentext, Suchindex, Inhaltsverzeichnis, Seitenversatz |
| `src/manifest.ts` | schreibt `katalog.json` + `suchindex.json`, Slug, Prüfsumme |
| `src/types.ts` | Typen der `katalog.json` (Erzeuger-Seite) |

## Was man beim Erweitern wissen muss

- **Keine Fremdpakete.** Node 22 bringt alles mit (`node:child_process`,
  `node:test`, `util.parseArgs`). Bewusste Entscheidung — bitte beibehalten.
- **Poppler nur über `execFile`** (Argument-Arrays, keine Shell) — Dateinamen mit
  Sonderzeichen bleiben ungefährlich.
- **Auflösung wird gedeckelt** (`begrenzeDpi`): längste Kante ≤ 4.000 px wegen
  des Storyblok Image Service. Nicht fest verdrahten.
- **`pdftotext` ohne `-layout`**, sonst bleiben Wörter über Zeilen zerrissen.
- **Seitenversatz** (`findeSeitenversatz` / `versetzeToc`): `toc[].seite` ist die
  gedruckte Zahl, `toc[].index` die Dateiposition. Beide werden gebraucht.

## Phase 1

Der gesamte Code bleibt. Nur die **Ausgabe-Senke** wechselt: statt in `out/` zu
schreiben, lädt ein neues `src/storyblok.ts` die Assets via Management API hoch
und legt die „katalog"-Story an. Die `katalog.json`-Struktur wird dabei zur
Story. Siehe `docs/BACKLOG.md` T-017/T-018.

## Tests

```bash
npm test   # aus dem Repo-Wurzelverzeichnis, prüft alle Pakete
```

Testdateien liegen in `test/`. Reine Logik ist abgedeckt; die Subprozess-Aufrufe
(Poppler) sind dünn gehalten und über ihre Parser getestet (z. B.
`werteAusPdfInfo`).
