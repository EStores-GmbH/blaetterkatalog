# Projekt-Brief: Blätterkatalog-Generator (Storyblok + Astro)

> **Zweck dieses Dokuments:** Vollständiger, eigenständiger Kontext für die Weiterplanung in Claude Code / Cursor. Enthält alle bisher getroffenen Entscheidungen, die Zielarchitektur, einen phasierten Umsetzungsplan mit konkreten Aufgaben, offene Fragen und einen Kickoff-Prompt. Der Coding-Agent braucht keinen weiteren Kontext außer diesem Dokument.

---

## 1. Kurzfassung

Wir bauen einen **eigenen Blätterkatalog-Generator**: Aus einem druckfertigen **PDF** entsteht per Automatik ein **interaktiver Blätterkatalog** (Page-Flip, wie FlipBuilder/„Flip PDF Plus Pro"), der **automatisch in Storyblok** veröffentlicht und im **Astro-Frontend** als Block platziert wird. Ziel ist Unabhängigkeit vom kommerziellen Tool, volle CI-Kontrolle und ein Workflow ohne manuelles Hochladen/Einbetten.

**Referenz-Look (Ziel):** https://www.igefa.de/sites/default/files/media/catalogs/igefa-broschuere-q3/index.html (gebaut mit FlipBuilder — genau diesen Look mit Open-Source-Stack nachbilden).

---

## 2. Getroffene Entscheidungen (fix)

| Thema | Entscheidung |
|---|---|
| Auslieferung | Über **Storyblok** (Headless CMS) + **Astro**-Frontend, als platzierbarer Block. Kein manueller Datei-Upload/iframe. |
| Automatisierung | **Vollautomatisiert**: PDF rein → Katalog in Storyblok. |
| Kernfunktionen (must-have) | **Inhaltsverzeichnis**, **Volltext-Suche**, **PDF-Download** |
| Frontend | **Astro** |
| Blätter-Engine | **StPageFlip** (Open Source; Alternative turn.js verworfen) |
| Auslöser-Strategie | **Zweistufig**: (1) Ein-Befehl-Skript zuerst, (2) kleine Upload-Seite als Alltags-Workflow. Storyblok-Plugin/Webhook optional später. |
| Viewer-Aktualität | Astro **Client-Island**, die Katalogdaten **zur Laufzeit** aus der Storyblok Content Delivery API zieht → neue Kataloge ohne Rebuild sichtbar. |

**Noch offen (bewusst nicht entschieden):** genaue Auslöser-Endstufe (eigene Upload-Seite vs. „Veröffentlichen-per-Webhook in Storyblok"); Produkt-Hotspots/Shop-Links (Roadmap); Download = Original- vs. web-optimiertes PDF.

---

## 3. Zielarchitektur

```
        ┌─────────────┐        ┌──────────────────────────┐        ┌──────────────────┐
  PDF → │  Generator  │  ───►  │        Storyblok         │  ───►  │  Astro-Frontend  │
        │  (Node CLI) │        │  Assets + Katalog-Story  │        │  Katalog-Block   │
        └─────────────┘        └──────────────────────────┘        │  (Client-Island) │
             │                          ▲                          └──────────────────┘
             │  Management API          │  Content Delivery API +          │
             └──────────────────────────┘  Image Service ──────────────────┘
```

**Datenfluss:**
1. Generator rendert PDF-Seiten zu Bildern, extrahiert Text (Suchindex) und Inhaltsverzeichnis (aus PDF-Lesezeichen).
2. Generator lädt via **Storyblok Management API** die Seitenbilder + Download-PDF als Assets hoch und legt eine **„Katalog"-Story** an (Titel, Seiten-Liste, TOC, Suchindex, Download-Link, Akzentfarbe).
3. Astro-**Katalog-Block** liest die Story via **Content Delivery API**, rendert den StPageFlip-Viewer; Bildgrößen/WebP/Retina liefert der **Storyblok Image Service** on-the-fly per URL.
4. Redaktion platziert den Block im **Visual Editor** und wählt den Katalog.

---

## 4. Tech-Stack

| Bereich | Wahl | Notiz |
|---|---|---|
| PDF → Bilder | MuPDF (`mutool draw`) **oder** Poppler (`pdftoppm`) | Eine hoch aufgelöste Fassung pro Seite genügt (Image Service skaliert) |
| Text/Suche | `pdftotext` (Poppler) oder pdf.js zum Extrahieren; **Fuse.js** clientseitig | Index: `[{page, text}]` |
| TOC | PDF-Outline/Bookmarks auslesen (pdf.js `getOutline()` / `mutool`) | Fallback: manuelle Config je Katalog |
| Blätter-Viewer | **StPageFlip** (`page-flip`, npm) | Touch, Einzel-/Doppelseite, dynamisches Laden |
| CMS-Publish | **Storyblok Management API** (`storyblok-js-client` / Management-Token) | Assets-Upload (signed request) + Story create/update |
| Bildoptimierung | **Storyblok Image Service** (`/m/`-Transformationen) | Keine eigene WebP-Pipeline nötig |
| Frontend | **Astro** + `@storyblok/astro` | Katalog-Block als Komponente, Viewer als `client:visible`-Island |
| Generator-Runtime | **Node.js** (TypeScript empfohlen) | Später hinter kleiner Upload-Seite wickelbar |

**Relevante Doku:**
- Storyblok Management API – Assets: https://www.storyblok.com/docs/api/management/assets
- Storyblok Image Service: https://www.storyblok.com/docs/api/image-service
- Storyblok + Astro: https://www.storyblok.com/docs/guides/astro
- StPageFlip: https://github.com/Nodlik/StPageFlip

---

## 5. Funktionsumfang

**Must-have (Phase 1):** Blättern (Maus/Touch, Einzel-/Doppelseite), Inhaltsverzeichnis mit Seitensprung, Volltext-Suche mit Sprung zum Treffer, PDF-Download, responsive, feste CI (Theme).

**Nice-to-have / Roadmap (Phase 3):** Zoom/Lupe, Thumbnail-Leiste, Produkt-Hotspots (Links in Shop/Warenkorb, aus PDF-Annotationen ableitbar), Teilen-Links, Aufruf-Statistik, Treffer-Highlighting via unsichtbarer Textebene, Webhook-Automatik.

---

## 6. Vorgeschlagene Repo-Struktur

```
blaetterkatalog/
├── packages/
│   ├── generator/            # Node/TS CLI: PDF → Storyblok
│   │   ├── src/
│   │   │   ├── render.ts     # PDF-Seiten → Bilder (mutool/pdftoppm)
│   │   │   ├── extract.ts    # Text + TOC extrahieren
│   │   │   ├── storyblok.ts  # Management API: Assets + Story
│   │   │   ├── config.ts     # pro-Katalog-Config (JSON)
│   │   │   └── index.ts      # CLI-Einstieg: katalog-build <pdf>
│   │   └── package.json
│   └── viewer/               # Astro-Block-Komponente + StPageFlip-Island
│       ├── Flipbook.astro        # Storyblok-Block-Wrapper
│       ├── FlipbookIsland.ts     # client:visible, StPageFlip + Suche
│       └── styles/               # CI-Theme
├── docs/
│   └── Blaetterkatalog_Projektbrief.md   # dieses Dokument
└── README.md
```

(Struktur ist ein Vorschlag — der Agent darf sie anpassen.)

---

## 7. Phasenplan mit konkreten Aufgaben

### Phase 0 — Prototyp (standalone, ohne Storyblok)
Ziel: Look & Bedienung an einem echten PDF beweisen.
- [ ] `render.ts`: PDF → PNG/JPG pro Seite (mutool oder pdftoppm), Auflösung parametrisierbar.
- [ ] Minimaler Standalone-Viewer (HTML + StPageFlip), lädt die gerenderten Seiten.
- [ ] Doppelseiten-Layout Desktop / Einzelseite mobil, Touch testen.
- [ ] Ergebnis: lokal lauffähiger Blätterkatalog aus einem Beispiel-PDF.

### Phase 1 — Kernfunktionen + Storyblok-Anbindung
- [ ] `extract.ts`: Volltext pro Seite → Suchindex (JSON); TOC aus PDF-Bookmarks, Fallback Config.
- [ ] Suche im Viewer (Fuse.js), Trefferliste → Seitensprung; Inhaltsverzeichnis-Navigation; Download-Button.
- [ ] `storyblok.ts`: Assets-Upload (signed request) + „Katalog"-Story anlegen/aktualisieren via Management API.
- [ ] Storyblok-Content-Type „katalog" definieren (Felder: titel, seiten[], toc[], suchindex, download_pdf, akzentfarbe).
- [ ] `viewer/`: Astro-Block `Flipbook.astro` + `client:visible`-Island; Katalogdaten aus CDA; Bilder über Image Service (`/m/`), Lazy-Loading.
- [ ] CI-Theme final (Logo, Farben, Schrift).
- [ ] Ergebnis: `katalog-build kunde-q3.pdf` → Katalog in Storyblok, im Visual Editor platzierbar.

### Phase 2 — Upload-Seite (Alltags-Workflow)
- [ ] Kleine interne Weboberfläche: PDF hochladen/reinziehen → ruft Generator → veröffentlicht in Storyblok; Statusanzeige.
- [ ] Auth für internes Team.

### Phase 3 — optional
- [ ] Zoom, Thumbnails, Produkt-Hotspots/Shop-Links, Teilen, Statistik, Treffer-Highlight, ggf. Webhook-Auslöser.

---

## 8. Offene Fragen (vor/ während Umsetzung klären)

1. **Storyblok-Zugang:** Management-API-Token + Space-ID; wie sind Blöcke/Stories organisiert? Wo sollen Katalog-Stories liegen (eigener Ordner)?
2. **Astro-Repo:** Ist `@storyblok/astro` schon integriert? SSR oder statisch (SSG)? → bestimmt, ob Client-Fetch nötig oder Rebuild-Webhook.
3. **Auslöser-Endstufe:** eigene Upload-Seite **oder** „Veröffentlichen-in-Storyblok-per-Webhook"? (Beide ohne eigenes Plugin möglich.)
4. **Download:** Original-PDF oder web-optimiert (kleiner)?
5. **Produkt-Links:** Shop/Warenkorb-Verlinkung gewünscht? (→ Phase 3, aus PDF-Annotationen)
6. **Umfang:** typische Seitenzahl (Lazy-Loading-Bedarf)? Mehrsprachige Kataloge?

---

## 9. Kickoff-Prompt für Claude Code

> Kopiere das folgende als erste Anweisung in Claude Code (dieses Dokument liegt idealerweise als `docs/Blaetterkatalog_Projektbrief.md` im Repo):

```
Lies docs/Blaetterkatalog_Projektbrief.md — das ist der vollständige Kontext für dieses Projekt.

Wir bauen einen Blätterkatalog-Generator: PDF → interaktiver Page-Flip-Katalog,
automatisch veröffentlicht in Storyblok, angezeigt als Block im Astro-Frontend.

Starte mit Phase 0 (Prototyp, standalone, ohne Storyblok):
1. Schlage die konkrete Umsetzung und Ordnerstruktur für den `generator` vor.
2. Implementiere das PDF-Rendering (mutool oder pdftoppm) und einen minimalen
   StPageFlip-Viewer, der die gerenderten Seiten lädt (Doppelseite Desktop /
   Einzelseite mobil, Touch).
3. Erkläre offene Abhängigkeiten (z. B. installierte CLI-Tools) und wie ich es
   lokal mit einem Test-PDF starte.

Stelle mir Rückfragen zu allem, was im Brief unter „Offene Fragen" steht und die
Umsetzung blockiert. Arbeite in kleinen, überprüfbaren Schritten.
```

---

## 10. Nächster konkreter Schritt

Ein **Beispiel-PDF** (igefa oder aktueller Kunde) an Phase 0 geben — daraus entsteht der erste lauffähige Viewer, an dem CI und Funktionen final abgestimmt werden, bevor die Storyblok-Anbindung (Phase 1) verdrahtet wird.
