# Architektur: Blätterkatalog

> Stand: 2026-07-22. Begründungen im Detail: `decisions/log.md`.
> Vollständiger Kontext: `docs/Blaetterkatalog_Projektbrief.md`.

---

## Stack-Entscheidung

| Bereich | Gewählt | Alternativen geprüft | Begründung |
|---------|---------|---------------------|-----------|
| Frontend | Astro, statisch gebaut (SSG) | Astro SSR, Laufzeit-Fetch im Browser | Kein CMS-Token im Browser; keine Laufzeit-Ratenlimits. Rebuild per Webhook hält das Ziel „kein manueller Schritt". |
| Sprache | TypeScript strict | JavaScript | Generator verarbeitet fremde PDFs — Typfehler sollen beim Bauen auffallen, nicht beim Kunden. |
| Blätter-Engine | StPageFlip, einvendorter Fork, HTML-Modus | turn.js, react-pageflip, DearFlip, 3D FlipBook, PDF.js-Eigenbau, EmbedPDF, Nutrient, CSS-3D | Neun Alternativen geprüft: Was gepflegt wird, kann nicht blättern; was blättern kann, ist tot, GPL-belastet oder kostet 25–40 k$/Jahr. MIT, null Abhängigkeiten, ~2.000 Zeilen. |
| PDF → Bilder | Poppler `pdftoppm` | MuPDF `mutool draw` | Ein Werkzeug deckt Rendern, Textextraktion und Metadaten ab. GPL-2 statt AGPL — relevant für die serverseitige Upload-Seite in Phase 2. |
| CMS | Storyblok | — (gesetzt) | Bestandssystem. Tarif Growth Plus. |
| Bildspeicher | Storyblok-Assets + Image Service | Eigener Objektspeicher (R2/S3) | Growth Plus bietet 10.000 Assets inkl. (≈ 66 Kataloge). Eigener Speicher wäre unnötige Infrastruktur. **Bei Tarifwechsel nach unten neu bewerten.** |
| Suche | Fuse.js im Web Worker | Serverseitige Suche, Storyblok-Suche | Kataloge sind statisch; ein vorberechneter Index reicht. Worker hält die Eingabe flüssig (INP). |
| Datenbank | keine | — | Es gibt keinen veränderlichen Zustand. Inhalte liegen im CMS. |
| Auth | keine (bis Phase 2) | — | Erst die interne Upload-Seite braucht Anmeldung. |
| Testing | noch offen | Vitest, Node test runner, Playwright (E2E) | Wird mit dem ersten Test in Phase 0 entschieden. |
| CSS / Styling | noch offen | — | Wird mit dem CI-Theme in Phase 1 entschieden (T-026). |
| Deployment | noch offen | — | SSG-Build + Rebuild-Webhook; Zielplattform in Phase 1. |

## System-Diagramm

```text
        ┌─────────────┐
  PDF → │  Generator  │  Node + TypeScript, lokal oder in Phase 2 serverseitig
        │   (CLI)     │
        └──────┬──────┘
               │
     ┌─────────┼──────────────┬────────────────────┐
     ▼         ▼              ▼                    ▼
 Seiten-    Seiten-      Inhalts-             Suchindex
 bilder     text (HTML)  verzeichnis          (JSON)
     │         │              │                    │
     ▼         └──────┬───────┘                    │
 Storyblok           ▼                             │
 Assets      Storyblok-Story „katalog"             │
     │                │                            │
     └────────┬───────┘                            │
              ▼  beim Bauen gelesen                │
        ┌─────────────────────────┐                │
        │     Astro-Frontend      │◄───────────────┘
        │                         │   statische Datei
        │  /kataloge/xyz/         │   im Build
        │  /kataloge/xyz/seite-N/ │
        │  /kataloge/xyz/text/    │
        └─────────────────────────┘
              ▲
              │  Webhook `story.published` → Rebuild
        Storyblok
```

## Datenmodell

Es gibt keine Datenbank. Das Datenmodell ist die Storyblok-Story plus zwei Dateien.

**Story `katalog`** (eine pro Katalog):

```text
titel            Text
slug             Text
akzentfarbe      Text (Hex)
cover            Asset
seitenzahl       Number
seiten           Bloks[] → katalogseite { bild: Asset, breite, hoehe, text_html }
toc              Bloks[] → { label: Text, seite: Number }
download_pdf     Asset
suchindex_url    Text (URL auf die statische Datei)
```

**Bewusst NICHT in der Story:** der Suchindex. Er würde bei jedem Abruf mitausgeliefert und
Ladezeit, Traffic- und API-Kontingent belasten, ohne gebraucht zu werden.

**`katalog.json`** ist das Scharnier zwischen Phase 0 und 1: In Phase 0 liest der Viewer sie
von der Festplatte, in Phase 1 wird aus derselben Struktur die Story. Aufbau siehe Projektbrief
Abschnitt 6.

## Seitenformate — Hoch- und Querformat

Es kommen **gemischte Formate** vor: klassische A4-Kataloge im Hochformat und Präsentationen
im Querformat 16:9 (wie die untersuchte igefa-Broschüre, 3000 × 1688 px).

Das ist keine Kleinigkeit für den Viewer. Zwei Hochformat-Seiten nebeneinander ergeben eine
Doppelseite mit etwa 1,4:1 — das entspricht einem aufgeschlagenen Heft und funktioniert.
**Zwei 16:9-Seiten nebeneinander ergäben 32:9** — ein Bildstreifen, der auf keinem Bildschirm
sinnvoll darstellbar ist.

**Regel:** Das Seitenverhältnis entscheidet über die Darstellung, nicht eine feste Einstellung.

| Format des PDF | Darstellung Desktop | Darstellung mobil |
| --- | --- | --- |
| Hochformat (A4, A5, Portrait) | Doppelseite | Einzelseite |
| Querformat (16:9, Präsentationen) | **Einzelseite** | Einzelseite |

Der Generator liest Breite und Höhe je Seite aus dem PDF und schreibt sie in `katalog.json`.
Der Viewer leitet daraus ab, ob Doppelseiten überhaupt in Frage kommen. Nichts davon wird
fest verdrahtet — auch nicht die Annahme „A4".

## Externe Abhängigkeiten

| Service | Zweck | Kosten/Monat | Fallback |
|---------|-------|-------------|---------|
| Storyblok (Growth Plus) | Inhalte, Bilder, Bildskalierung | Bestandsvertrag; +5 $ je weitere 10.000 Assets | Eigener Objektspeicher (R2/S3), in der Icebox vorbereitet |
| Poppler (lokal/CI) | PDF → Bilder und Text | kostenlos, GPL-2 | MuPDF (AGPL — nur wenn nötig) |
| Hosting/CDN | Auslieferung der gebauten Seiten | noch offen | — |

## Harte technische Grenzen

| Grenze | Wert | Konsequenz |
|---|---|---|
| Storyblok Image Service | 4.000 × 4.000 px | Einzelseiten rendern, nie Doppelseiten |
| Storyblok Story-JSON | 5 MB | Suchindex ausgelagert; Story bleibt < 150 KB |
| Storyblok Management API | 6 req/s (Growth Plus) | Ratenbremse ≤ 5 req/s + 429-Retry im Generator |
| Storyblok Asset-Upload | kein Bulk-Upload | 150 Einzel-Uploads, real 2–8 Minuten je Katalog |
| Erlaubte Asset-Dateitypen | kein `application/json` | Suchindex kann nicht als Storyblok-Asset abgelegt werden |

## Risiken

| Risiko | Wahrscheinlichkeit | Impact | Maßnahme |
|--------|-------------------|--------|---------|
| Wir sind alleiniger Wartender der Blätter-Engine | sicher | mittel | Fork klein halten, Abstraktionsschicht zwischen Island und Engine, damit ein Engine-Tausch eine Datei betrifft |
| Speicher/Tempo bei 150 Seiten auf Mobilgeräten unbekannt | mittel | hoch | Messpunkt T-014 auf echter Hardware, **bevor** der Fork festgeschrieben wird |
| BFSG-Geltung ungeklärt (B2B nur laut AGB) | mittel | hoch | Bis zur Klärung wird BFSG als geltend angenommen (T-001) |
| Print-PDF als barrierefreies Dokument untauglich | hoch | mittel | HTML-Textfassung als offizielle barrierefreie Fassung deklarieren (T-024) |
| Textextraktion scheitert an Druckdaten (Text als Kurven) | mittel | hoch | Früh am echten PDF prüfen (T-006). Fällt der Text weg, bricht das Leitprinzip — dann OCR nötig |
| Storyblok-Tarifwechsel nach unten | gering | hoch | Asset-Ablage ist hinter dem Generator gekapselt; Wechsel auf Objektspeicher betrifft eine Datei |
