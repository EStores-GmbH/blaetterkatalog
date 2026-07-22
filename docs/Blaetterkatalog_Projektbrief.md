# Projekt-Brief: Blätterkatalog-Generator (Storyblok + Astro)

> **Zweck dieses Dokuments:** Vollständiger, eigenständiger Kontext für die Umsetzung in Claude Code / Cursor.
> Enthält alle getroffenen Entscheidungen, die Zielarchitektur, den phasierten Umsetzungsplan, offene Fragen
> und einen Kickoff-Prompt. Der Coding-Agent braucht keinen weiteren Kontext außer diesem Dokument.
>
> **Fassung 2 — 22.07.2026.** Überarbeitet nach technischer Prüfung der Fassung 1 (siehe Abschnitt 11).
> Sechs Festlegungen der Erstfassung haben der Prüfung nicht standgehalten und wurden ersetzt.

---

## 1. Kurzfassung

Wir bauen einen **eigenen Blätterkatalog-Generator**: Aus einem druckfertigen **PDF** entsteht per Automatik ein
**interaktiver Blätterkatalog** (Page-Flip, wie FlipBuilder/„Flip PDF Plus Pro"), der **automatisch in Storyblok**
veröffentlicht und im **Astro-Frontend** als Block platziert wird. Ziel ist Unabhängigkeit vom kommerziellen Tool,
volle CI-Kontrolle und ein Workflow ohne manuelles Hochladen/Einbetten.

**Referenz-Look (Ziel):** https://www.igefa.de/sites/default/files/media/catalogs/igefa-Broschuere/index.html
Optisch das Ziel — **technisch ausdrücklich kein Vorbild** (Details in Abschnitt 11).

### Das Leitprinzip dieser Fassung

> **Die HTML-Textfassung des Katalogs ist das Fundament, der Blätterkatalog ist die Oberfläche darüber.**

Drei unabhängige Anforderungen — Barrierefreiheit (BFSG), Auffindbarkeit bei Google, und Bedienbarkeit ohne Maus —
verlangen dieselbe Sache: den Katalogtext als **echtes HTML**, nicht als Pixel. Der Text fällt in der Pipeline
ohnehin an (er wird für die Volltextsuche extrahiert); die Erstfassung hat ihn nur verworfen. Ein Artefakt löst
drei Probleme.

---

## 2. Getroffene Entscheidungen (fix)

| Thema | Entscheidung |
|---|---|
| Auslieferung | Über **Storyblok** (Headless CMS) + **Astro**-Frontend, als platzierbarer Block. Kein manueller Datei-Upload/iframe. |
| Automatisierung | **Vollautomatisiert**: PDF rein → Katalog in Storyblok. |
| Kernfunktionen (must-have) | **Inhaltsverzeichnis**, **Volltext-Suche**, **PDF-Download**, **HTML-Textfassung** |
| Frontend | **Astro** |
| Blätter-Engine | **StPageFlip** — **als einvendorter Fork im eigenen Repo**, betrieben im **HTML-Modus** (`loadFromHTML`), nicht im Canvas-Modus |
| Datenhaltung | Seitenbilder + PDF als **Storyblok-Assets** (Tarif Growth Plus). Suchindex als **statische Datei** neben dem Astro-Build. |
| Viewer-Aktualität | **Zur Build-Zeit** gelesen (SSG), Neubau per **Storyblok-Webhook** auf `story.published`. Kein Token im Browser. |
| Barrierefreiheit | Zielnorm **WCAG 2.2 AA**. HTML-Textfassung als „Conforming Alternate Version". Erklärung nach § 14 BFSG als Liefergegenstand. |
| Auslöser-Strategie | **Zweistufig**: (1) Ein-Befehl-Skript zuerst, (2) kleine Upload-Seite als Alltags-Workflow. |

**Noch offen (bewusst nicht entschieden):** genaue Auslöser-Endstufe (eigene Upload-Seite vs. Webhook);
Produkt-Hotspots/Shop-Links (Roadmap); Download = Original- vs. web-optimiertes PDF. Siehe Abschnitt 8.

---

## 3. Zielarchitektur

```
        ┌─────────────┐
  PDF → │  Generator  │
        │  (Node CLI) │
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
 (Bilder     (schlank: Titel, Seitenliste,         │
  + PDF)      TOC, Text, Farbe)                    │
     │                │                            │
     └────────┬───────┘                            │
              ▼  zur Build-Zeit gelesen            │
        ┌─────────────────────────┐                │
        │     Astro-Frontend      │◄───────────────┘
        │                         │   statische Datei
        │  /kataloge/xyz/         │   im Build
        │    → Blätterkatalog     │
        │  /kataloge/xyz/seite-N/ │
        │    → HTML-Textseite     │
        │  /kataloge/xyz/text/    │
        │    → Gesamttextfassung  │
        └─────────────────────────┘
              ▲
              │  Webhook `story.published` → Rebuild
        Storyblok
```

**Datenfluss:**
1. Generator rendert PDF-Seiten zu Bildern (**Einzelseiten**, nie Doppelseiten — siehe Abschnitt 4),
   extrahiert **strukturierten Seitentext** und das Inhaltsverzeichnis (aus PDF-Lesezeichen).
2. Generator lädt via **Storyblok Management API** Seitenbilder + Download-PDF als Assets hoch und legt eine
   **„Katalog"-Story** an (Titel, Seitenliste, TOC, Seitentext, Download-Link, Akzentfarbe).
   Der **Suchindex bleibt außen vor** und wird als statische Datei ausgeliefert.
3. Astro liest die Stories **zur Build-Zeit** und erzeugt drei Routentypen: Viewer, Einzelseiten-Textseiten,
   Gesamttextfassung. Bildgrößen/WebP/AVIF liefert der **Storyblok Image Service** per URL.
4. Redaktion platziert den Block im **Visual Editor** und wählt den Katalog. Publish löst per Webhook den
   Neubau aus (Verzögerung ein bis zwei Minuten).

---

## 4. Tech-Stack

| Bereich | Wahl | Notiz |
|---|---|---|
| PDF → Bilder | **Poppler `pdftoppm`** | Ein Werkzeug deckt alle Phasen ab (Rendern, Text, Metadaten). GPL-2. MuPDF wäre AGPL — bei der späteren Upload-Seite (Phase 2, serverseitig) unnötiges Risiko. |
| Text/Suche | **`pdftotext`** (Poppler) zum Extrahieren; **Fuse.js** clientseitig | Zwei Artefakte: Suchindex `[{page, text}]` **und** strukturierter Seitentext fürs HTML |
| TOC | PDF-Outline/Bookmarks (`pdftotext`/`pdfinfo`) | Fallback: manuelle Config je Katalog |
| Blätter-Viewer | **StPageFlip-Fork im Repo**, HTML-Modus | ~2.000 Zeilen TypeScript, MIT, null Abhängigkeiten. Upstream seit 04/2021 verwaist. |
| CMS-Publish | **Storyblok Management API** (`storyblok-js-client`) | Assets-Upload (signed request) + Story create/update. **Kein Bulk-Upload** — Ratenbremse nötig. |
| Bildoptimierung | **Storyblok Image Service** (`/m/`) | **Harte Grenze 4.000 × 4.000 px.** Deshalb Einzelseiten statt Doppelseiten rendern. |
| Frontend | **Astro** + `@storyblok/astro`, **SSG** | Viewer als `client:visible`-Island; erste Doppelseite serverseitig als `<img>` (LCP + Crawlbarkeit) |
| Generator-Runtime | **Node.js + TypeScript** | Später hinter der Upload-Seite wickelbar |

### Warum Einzelseiten statt Doppelseiten gerendert werden

Eine A4-Doppelseite in Druckauflösung misst 4.961 × 3.508 px und liegt damit **über** dem 4.000-px-Deckel des
Storyblok Image Service. Wir rendern deshalb **einzelne Seiten** und legen sie im Viewer nebeneinander. Das ist
ohnehin die bessere Lösung: Auf dem Handy braucht der Viewer die Einzelseitenansicht, und wir müssten sie sonst
zweimal vorhalten.

### Relevante Doku
- Storyblok Management API – Assets: https://www.storyblok.com/docs/api/management/assets
- Storyblok Image Service: https://www.storyblok.com/docs/api/image-service
- Storyblok technische Limits: https://www.storyblok.com/pricing/technical-limits
- Storyblok + Astro: https://www.storyblok.com/docs/guides/astro
- StPageFlip: https://github.com/Nodlik/StPageFlip
- WCAG 2.2 Conforming Alternate Version: https://www.w3.org/WAI/WCAG22/Understanding/conformance

---

## 5. Funktionsumfang

**Must-have (Phase 1):**
Blättern (Maus/Touch/**Tastatur**, Einzel-/Doppelseite), Inhaltsverzeichnis mit Seitensprung, Volltext-Suche mit
Sprung zum Treffer, PDF-Download, **HTML-Textfassung je Seite**, responsive, feste CI (Theme),
**WCAG 2.2 AA auf den Textrouten**, **Barrierefreiheitserklärung nach § 14 BFSG**.

**Nice-to-have / Roadmap (Phase 3):**
Zoom/Lupe, Thumbnail-Leiste, Produkt-Hotspots (Links in Shop/Warenkorb, aus PDF-Annotationen ableitbar),
Teilen-Links, Aufruf-Statistik, Treffer-Highlighting via unsichtbarer Textebene, Webhook-Automatik.

> **Zur unsichtbaren Textebene (Phase 3):** legitim als Bedien-Komfort (Textauswahl, Treffer-Hervorhebung),
> **nicht** als SEO-Träger und **nicht** als Barrierefreiheits-Lösung. Ein absolut positionierter Textlayer über
> einem Bild ist für Screenreader unbrauchbar; als SEO-Instrument wäre er ein Richtlinienverstoß.

---

## 6. Repo-Struktur

```
blaetterkatalog/
├── packages/
│   ├── generator/                # Node/TS CLI: PDF → Storyblok
│   │   ├── src/
│   │   │   ├── cli.ts            # CLI-Einstieg: katalog-build <pdf>
│   │   │   ├── pdf-tools.ts      # Prüft CLI-Verfügbarkeit, klare Fehlermeldung
│   │   │   ├── render.ts         # PDF-Seiten → JPEG (pdftoppm), Auflösung parametrisierbar
│   │   │   ├── extract.ts        # Seitentext (HTML-Struktur) + Suchindex + TOC
│   │   │   ├── storyblok.ts      # Management API: Assets + Story, mit Ratenbremse
│   │   │   ├── manifest.ts       # katalog.json — das Scharnier (siehe unten)
│   │   │   └── config.ts
│   │   ├── test/
│   │   └── package.json
│   ├── flip-engine/              # einvendorter StPageFlip-Fork + eigene Patches
│   │   ├── src/                  # Herkunft, Version und Patches in HERKUNFT.md dokumentiert
│   │   └── package.json
│   └── viewer/                   # Astro-Komponenten
│       ├── Flipbook.astro        # Storyblok-Block-Wrapper
│       ├── FlipbookIsland.ts     # client:visible, Engine + Suche + Tastatur
│       ├── seiten/               # HTML-Textrouten
│       └── styles/               # CI-Theme
├── fixtures/                     # Test-PDFs (gitignored)
├── out/                          # Generator-Ausgabe (gitignored)
└── docs/
    └── Blaetterkatalog_Projektbrief.md
```

### Das Scharnier: `katalog.json`

Der Generator schreibt neben den Seitenbildern eine Beschreibungsdatei. **In Phase 0 liest der Viewer sie direkt
von der Festplatte; in Phase 1 wird aus derselben Struktur die Storyblok-Story.** Der Viewer merkt den Unterschied
nicht — er bekommt nur eine andere Quelle. Deshalb ist Phase 0 kein Wegwerf-Prototyp.

```jsonc
{
  "slug": "hygiene-q3-2026",
  "titel": "Hygiene-Katalog Q3 2026",
  "seitenzahl": 84,
  "seiten": [
    { "nr": 1, "bild": "pages/seite-001.jpg", "breite": 2480, "hoehe": 3508, "text_html": "<h2>…</h2><p>…</p>" }
  ],
  "toc": [{ "label": "Reinigungsmittel", "seite": 12 }],
  "download_pdf": "original.pdf",
  "akzentfarbe": "#0057a0"
}
```

Der **Suchindex** wird bewusst getrennt geschrieben (`suchindex.json`) und erst beim Öffnen der Suche nachgeladen.

---

## 7. Phasenplan mit konkreten Aufgaben

### Phase 0 — Prototyp (standalone, ohne Storyblok)
Ziel: Look, Bedienung und Datenstruktur an einem echten PDF beweisen.
- [ ] `pdf-tools.ts`: Prüfung auf `pdftoppm`/`pdftotext`, verständliche Fehlermeldung samt Installationsbefehl.
- [ ] `render.ts`: PDF → JPEG pro **Einzelseite**, Auflösung parametrisierbar, längste Kante ≤ 4.000 px erzwungen.
- [ ] `extract.ts`: Seitentext extrahieren → `text_html` **und** Suchindex.
- [ ] `manifest.ts`: `katalog.json` schreiben.
- [ ] StPageFlip forken nach `packages/flip-engine/`, Herkunft und Version dokumentieren.
- [ ] **Drei Pflicht-Patches am Fork** (Details Abschnitt 11): Animationsschleife stoppbar machen,
      Bild-Fehlerbehandlung, Tastatur- und ARIA-Ebene.
- [ ] Minimaler Standalone-Viewer im **HTML-Modus**, lädt die gerenderten Seiten aus `katalog.json`.
- [ ] Doppelseiten-Layout Desktop / Einzelseite mobil, Nachladefenster ±2 Seiten, Touch auf echtem Gerät testen.
- [ ] **Messpunkt:** 150-Seiten-Katalog auf echtem iPhone und Mid-Range-Android — Speicher, Wischqualität,
      Ladezeit. Ergebnis entscheidet, ob der Fork so bleibt.
- [ ] Ergebnis: lokal lauffähiger Blätterkatalog aus einem Beispiel-PDF, tastaturbedienbar.

### Phase 1 — Kernfunktionen + Storyblok-Anbindung
- [ ] Suche im Viewer (Fuse.js) **im Web Worker**, Index erst beim Öffnen der Suche laden, Trefferzahl per `aria-live`.
- [ ] Inhaltsverzeichnis-Navigation; Download-Button.
- [ ] `storyblok.ts`: Assets-Upload (signed request) + Story anlegen/aktualisieren, **Ratenbremse ≤ 5 req/s + 429-Retry**.
- [ ] Storyblok-Content-Type „katalog" definieren (Felder siehe `katalog.json`, ohne Suchindex).
- [ ] `viewer/`: Astro-Block `Flipbook.astro` + `client:visible`-Island; Daten **zur Build-Zeit**;
      Bilder über Image Service mit expliziten Breiten; **erste Doppelseite serverseitig gerendert**.
- [ ] **HTML-Textrouten** `/kataloge/[slug]/seite-[nr]/` und `/kataloge/[slug]/text/`:
      sichtbarer Text, Seitenbild, Vor-/Zurück-Links als echte `<a>`, self-referencing Canonical, Breadcrumb.
- [ ] Link „Katalog als Textversion öffnen" als **erster fokussierbarer Inhalt** im Viewer-Container.
- [ ] Sitemap-Einträge für alle Seiten-URLs; `rel="canonical"`-HTTP-Header auf der PDF-Auslieferung.
- [ ] Webhook `story.published` → Rebuild.
- [ ] CI-Theme final (Logo, Farben, Schrift).
- [ ] **Barrierefreiheitserklärung nach § 14 BFSG** verfassen und verlinken.
- [ ] axe/pa11y in CI auf den Textrouten **grün**; manueller Tastatur- + NVDA-Durchlauf für den Viewer.
- [ ] Ergebnis: `katalog-build kunde-q3.pdf` → Katalog in Storyblok, im Visual Editor platzierbar.

### Phase 2 — Upload-Seite (Alltags-Workflow)
- [ ] Kleine interne Weboberfläche: PDF hochladen/reinziehen → ruft Generator → veröffentlicht; Statusanzeige.
- [ ] Auth für internes Team.

### Phase 3 — optional
- [ ] Zoom, Thumbnails, Produkt-Hotspots/Shop-Links, Teilen, Statistik, Treffer-Highlight, Webhook-Auslöser.

---

## 8. Offene Fragen

| # | Frage | Verantwortlich | Status |
|---|---|---|---|
| 1 | **Ist der Shop rechtlich belastbar rein B2B?** Ein Ausschluss nur in den AGB trägt nicht — nötig wären wirksame technische Vorkehrungen gegen Verbraucherbestellungen. Antwort entscheidet, ob BFSG **Pflicht** oder **Qualitätsempfehlung** ist. | Armin / Rechtsberatung | **offen — bis dahin gilt: BFSG greift** |
| 2 | Download: Original-PDF oder web-optimiert (kleiner)? Bei 100 MB × vielen Downloads wird das Traffic-Budget relevant. | Armin | offen |
| 3 | Typische Seitenzahl und Seitenformat (A4 hoch? A3? Querformat)? Bestimmt Auflösung, Dateigröße und Doppelseiten-Logik. | Armin | offen |
| 4 | Mehrsprachige Kataloge? | Armin | offen |
| 5 | Produkt-Links in Shop/Warenkorb gewünscht? (→ Phase 3, aus PDF-Annotationen) | Armin | offen |
| 6 | Auslöser-Endstufe: eigene Upload-Seite oder Webhook? | Armin | offen (Phase 2) |
| 7 | Getaggtes PDF beim Layouter mitbeauftragen — oder HTML-Textfassung als offizielle barrierefreie Fassung deklarieren? | Armin | offen (Empfehlung: HTML-Fassung) |

**Geklärt:** Storyblok-Tarif = Growth Plus (10.000 Assets inkl., 1 TB Traffic) → Seitenbilder und PDF können in
Storyblok bleiben, ein eigener Objektspeicher ist erst eine spätere Kostenoptimierung.

---

## 9. Kickoff-Prompt für Claude Code

```
Lies docs/Blaetterkatalog_Projektbrief.md — das ist der vollständige Kontext.

Wir bauen einen Blätterkatalog-Generator: PDF → interaktiver Page-Flip-Katalog,
automatisch veröffentlicht in Storyblok, angezeigt als Block im Astro-Frontend.
Leitprinzip: Die HTML-Textfassung ist das Fundament, der Blätterkatalog die Oberfläche.

Starte mit Phase 0 (Abschnitt 7). Arbeite die Punkte der Reihe nach ab und
zeige mir nach jedem überprüfbaren Zwischenstand das Ergebnis.

Beachte insbesondere:
- StPageFlip im HTML-Modus (loadFromHTML), NICHT im Canvas-Modus (loadFromImages)
- Einzelseiten rendern, längste Kante ≤ 4.000 px
- katalog.json ist das Scharnier zu Phase 1 — Struktur nicht ändern ohne Grund

Stelle mir Rückfragen zu allem aus Abschnitt 8, was die Umsetzung blockiert.
```

---

## 10. Nächster konkreter Schritt

Ein **Beispiel-PDF** (igefa oder aktueller Kunde) nach `fixtures/` legen — daraus entsteht der erste lauffähige
Viewer, an dem CI und Funktionen abgestimmt werden, bevor die Storyblok-Anbindung (Phase 1) verdrahtet wird.
Idealerweise ein Katalog mit realistischer Seitenzahl, damit der Messpunkt aus Phase 0 aussagekräftig ist.

---

## 11. Was sich gegenüber Fassung 1 geändert hat — und warum

Die Erstfassung wurde am 22.07.2026 technisch geprüft (Blätter-Engine, Storyblok-Grenzen, BFSG/SEO).
Sechs als „fix" markierte Festlegungen haben der Prüfung nicht standgehalten.

| # | Fassung 1 | Fassung 2 | Grund |
|---|---|---|---|
| 1 | Seiten als Bilder (`loadFromImages`, Canvas) | **HTML-Modus** (`loadFromHTML`) | Der Canvas-Modus lädt alle Seiten sofort (150 Seiten ≈ 85 MB) und macht Textebene, Screenreader-Unterstützung und SEO **strukturell unmöglich**. Der HTML-Modus sieht identisch aus. |
| 2 | StPageFlip als npm-Abhängigkeit | **Einvendorter Fork** | Upstream seit 18.04.2021 ohne Commit; Issue „Mark this project as abandoned" seit Mai 2024 unbeantwortet. Ein Blocker-Bug (unten) ist nur im Fork behebbar. |
| 3 | Viewer zieht Daten zur Laufzeit aus der CDA | **SSG + Webhook-Rebuild** | Der öffentliche Token im Browser gibt die **komplette Inhaltsstruktur** des Space frei, nicht nur den Katalog. Der offizielle Storyblok-Astro-Guide arbeitet serverseitig. Preis: ein bis zwei Minuten Verzögerung. |
| 4 | Suchindex in der Katalog-Story | **Statische Datei** | Passt zwar ins 5-MB-Story-Limit, würde aber bei **jedem** Abruf mitausgeliefert — belastet Ladezeit, Traffic- und API-Kontingent ohne Nutzen. |
| 5 | Bilder skaliert der Image Service, „keine eigene Pipeline nötig" | Gilt — **aber Deckel bei 4.000 px** | A4-Doppelseite @300 dpi = 4.961 × 3.508 px, liegt darüber. Deshalb Einzelseiten rendern. |
| 6 | Barrierefreiheit nicht erwähnt | **WCAG 2.2 AA + HTML-Textfassung + § 14-Erklärung** | `docs/COMPLIANCE.md` fordert es bereits ausdrücklich, inkl. grüner axe/pa11y-Prüfung in der CI. Ein Bildkatalog ist ohne Textfassung nicht konformitätsfähig. |

### Warum StPageFlip trotz Stillstand bleibt

Neun Alternativen wurden geprüft. Das Ergebnis ist ein Marktloch: Was **gepflegt** wird (PDF.js, EmbedPDF,
Nutrient), kann **nicht blättern**. Was **blättern** kann, ist tot (turn.js: 393 offene Issues), GPL-lizenziert
(Copyleft-Risiko) oder kostet 25.000–40.000 $ im Jahr. Keiner der 178 Forks hat mehr als einen Stern.
Gleichzeitig wird StPageFlip 82.500-mal pro Woche heruntergeladen — De-facto-Standard ohne Nachfolger.

Der Fork ist vertretbar: ~2.000 Zeilen TypeScript, MIT-Lizenz, **null Fremdabhängigkeiten**, 10 KB komprimiert.
**Preis: Ab dem Fork sind wir der Wartende.**

### Die drei Pflicht-Patches am Fork

1. **Animationsschleife stoppbar machen.** `Render.start()` startet eine bedingungslose Endlosschleife ohne
   Abbruchmöglichkeit. `destroy()` räumt das DOM auf — **die Schleife läuft weiter, dauerhaft**. In Astro, wo
   Besucher ohne Neuladen zwischen Seiten wechseln, hinterlässt jeder Katalogaufruf eine laufende Schleife.
2. **Bild-Fehlerbehandlung.** Ein fehlendes Seitenbild führt zu einem **Endlos-Ladekringel**, den die Schleife
   dauerhaft weiteranimiert.
3. **Tastatur- und ARIA-Ebene.** Die Engine registriert ausschließlich Maus- und Touch-Ereignisse — **kein
   einziger Tastatur-Handler**, keine ARIA-Auszeichnung, keine Fokusverwaltung, kein Zoom.

### Was die Prüfung des Referenz-Katalogs ergeben hat

Der igefa-Katalog stammt aus *FlipPDFPlusPro für Mac v6.9.9*. Messwerte: 21 Seiten, je 3000 × 1688 px / 565 KB,
zusammen ~12 MB — hochgerechnet auf 150 Seiten rund 85 MB. **Nachladen ist damit Pflicht, nicht Kür.**

Zwei Schwächen, die wir nicht übernehmen:
- `user-scalable=no` im Viewport verbietet Zoomen per Fingergeste — ein dokumentiertes WCAG-Versagensmuster
  (1.4.4), das ausgerechnet Menschen mit Sehbehinderung trifft.
- Eine vollständige HTML-Textfassung **existiert** (`files/basic-html/`), ist aber nur über `<noscript>`
  erreichbar und halbfertig: Seitentitel „Page 1 – Demo", unersetzte Platzhalter `${meta.description}` und
  `${body.tocURL}`. Google sieht diesen Text vermutlich nie.

**Genau das ist unsere Chance zur Differenzierung:** Wir machen die Textfassung zu einer erstklassigen,
verlinkten, indexierbaren Route — statt zu einem Notbehelf im Keller.

### Was ausdrücklich **nicht** verifiziert wurde

- Wischqualität auf echten iOS-/Android-Geräten (keine Hardware verfügbar) → Messpunkt in Phase 0.
- Speicherverbrauch bei 150 Seiten (kein Benchmark durchgeführt) → Messpunkt in Phase 0.
- Ob das BFSG die gesamte Website oder nur den Bestellprozess erfasst — **Quellen widersprechen sich**
  (Bundesfachstelle und Noerr contra HÄRTING). Für einen Produktkatalog praktisch unerheblich, da Kaufanbahnung.
- Zu Blätterkatalogen gibt es **kein Urteil und keine dokumentierte Beanstandung**. Die Rechtslage ist unerprobt,
  die WCAG-Analyse dagegen eindeutig.
