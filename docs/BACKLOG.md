# Backlog — Blätterkatalog

> Einzige Quelle für offene Tasks. Wird von `/session-start` gelesen und von `/create-feature`
> aktualisiert. Committed — für das ganze Team sichtbar.
> Task-IDs fortlaufend vergeben (`T-001`, `T-002`, …) und in Branches/Commits referenzieren.

## Format

`- [ ] T-XXX  Kurzbeschreibung  (Prio: hoch/mittel/niedrig · abhängig von: T-YYY)`
Status: `[ ]` offen · `[~]` in Arbeit (+ Branch nennen) · `[x]` fertig (+ Datum)

---

## Blockierend — vor Phase 0 zu klären

- [ ] T-001  B2B-Status rechtlich klären: greift das BFSG?  (Prio: hoch · Verantwortlich: Armin/Rechtsberatung)
      Ein Ausschluss nur in den AGB trägt nicht. Bis zur Klärung gilt: BFSG greift.
      Entscheidet, ob HTML-Textfassung + Barrierefreiheitserklärung Pflicht oder Empfehlung sind.
- [ ] T-032  **Druckfassung des Beispiel-PDF besorgen**  (Prio: hoch · Verantwortlich: Armin)
      Die vorliegende Datei ist der Web-Export mit 72-ppi-Fotos. Text bleibt scharf (Vektor),
      Produktfotos werden beim Vergrößern weich. Für die Beurteilung der Bildqualität brauchen
      wir die Fassung vor dem Herunterrechnen.

## Aktueller Sprint — Phase 0 (Prototyp, ohne Storyblok)

- [ ] T-014  Messpunkt echte Hardware: 150-Seiten-Katalog auf iPhone + Mid-Range-Android  (Prio: hoch · abhängig von: T-013)
      Misst Speicher, Wischqualität, Ladezeit. Ergebnis entscheidet, ob der Fork so bleibt.
      Der vorliegende Katalog hat nur 46 Seiten — für den Belastungstest brauchen wir einen
      größeren oder einen künstlich verlängerten.
- [ ] T-033  Querformat-Katalog gegenprüfen  (Prio: mittel)
      Die Einzelseiten-Regel für Querformat ist umgesetzt, aber nur mit Hochformat getestet.
      Sobald ein 16:9-PDF vorliegt: prüfen, dass der Viewer nicht auf Doppelseite schaltet.

## Nächster Sprint — Phase 1 (Kernfunktionen + Storyblok)

- [ ] T-015  Volltext-Suche (Fuse.js) im Web Worker, Index erst beim Öffnen laden, `aria-live`-Trefferzahl
- [ ] T-016  Inhaltsverzeichnis-Navigation + Download-Button
- [ ] T-017  `storyblok.ts`: Assets-Upload + Story, Ratenbremse ≤ 5 req/s, 429-Retry
- [ ] T-018  Content-Type „katalog" in Storyblok definieren (ohne Suchindex-Feld)
- [ ] T-019  Astro-Block `Flipbook.astro` + Island; erste Doppelseite serverseitig gerendert (LCP)
- [ ] T-020  HTML-Textrouten `/kataloge/[slug]/seite-[nr]/` und `/text/` (a11y-Alternativfassung + SEO)
- [ ] T-021  Link „Katalog als Textversion öffnen" als erster fokussierbarer Inhalt im Viewer
- [ ] T-022  Sitemap-Einträge + `rel="canonical"`-HTTP-Header auf der PDF-Auslieferung
- [ ] T-023  Webhook `story.published` → Rebuild
- [ ] T-024  Barrierefreiheitserklärung nach § 14 BFSG verfassen und verlinken  (abhängig von: T-001)
- [ ] T-025  axe/pa11y in CI grün auf den Textrouten + manueller Tastatur-/NVDA-Durchlauf
- [ ] T-026  CI-Theme final (Logo, Farben, Schrift)

## Übernächster Sprint — Phase 2 (erfolgskritisch, nicht optional)

> Erst hier wird das Erfolgskriterium aus `docs/DISCOVERY.md` eingelöst: Zeitersparnis für
> die Redaktion. Solange nur der Kommandozeilen-Befehl existiert, delegiert die Redaktion
> ihre Arbeit an die Entwicklung, statt Zeit zu sparen.

- [ ] T-027  Interne Upload-Oberfläche: PDF reinziehen → Generator läuft → veröffentlicht
- [ ] T-028  Statusanzeige während der Verarbeitung (2–8 Minuten je Katalog)
- [ ] T-029  Authentifizierung fürs Team  (abhängig von: T-027)
- [ ] T-030  Bedienanleitung für die Redaktion — Zielgruppe Nicht-Entwickler
- [ ] T-031  Abnahme: jemand aus der Redaktion veröffentlicht einen echten Katalog selbst

## Icebox

<!-- Ideen ohne Termin — bewusst geparkt -->

- Phase 3: Zoom/Lupe, Thumbnail-Leiste, Produkt-Hotspots, Teilen-Links, Aufruf-Statistik,
  Treffer-Highlighting via unsichtbarer Textebene
- Eigener Objektspeicher (R2/S3) statt Storyblok-Assets — erst relevant bei Tarifwechsel
  nach unten oder deutlich mehr Katalogen als erwartet
- Getaggtes PDF beim Layouter mitbeauftragen (Alternative: HTML-Textfassung als offizielle
  barrierefreie Fassung deklarieren — siehe Projektbrief Abschnitt 8, Frage 7)

## Erledigt

<!-- Abgeschlossene Tasks hierher verschieben: [x] T-XXX ... (2026-07-07) -->

- [x] T-000  Projektbrief Fassung 2 nach technischer Prüfung (Engine, Storyblok, BFSG/SEO)  (2026-07-22)
- [x] T-002  Poppler installiert (26.07.0) und mit einem Test-PDF durchgeprüft  (2026-07-22)
- [x] T-003  Beispiel-PDF geliefert und analysiert — HoReCa Table Top Q3/26, 46 Seiten, A4 hoch  (2026-07-22)
      Befunde, die T-005 und T-006 bestimmen:
      · Textextraktion funktioniert — 40 von 46 Seiten, 28.433 Zeichen gesamt
      · `pdftotext` OHNE `-layout` verwenden: fügt getrennte Wörter wieder zusammen.
        Mit `-layout` bleiben 21 Wörter am Zeilenende zerrissen.
      · Inhaltsverzeichnis steht maschinenlesbar auf Seite 3 (Kapitel + Seitenzahl) —
        die im Brief vorgesehene manuelle Config je Katalog entfällt damit
      · PDF ist getaggt (InDesign) — relevant für Projektbrief Abschnitt 8, Frage 7
      · Fotos liegen bei 72 ppi vor, Text ist Vektor. Rendern bei 200 dpi ergibt
        1654 × 2339 px und ~305 KB je Seite, also ~14 MB für den ganzen Katalog.
- [x] T-004  `pdf-tools.ts` — Werkzeugprüfung mit Installationshinweis, `pdfinfo`-Auswertung  (2026-07-22)
- [x] T-005  `render.ts` — Einzelseiten als JPEG, Auflösung aus dem Seitenformat abgeleitet  (2026-07-22)
      A4 verträgt volle 300 dpi; der 4.000-px-Deckel greift erst ab 342 dpi. A3 wird früher begrenzt.
- [x] T-006  `extract.ts` — Seitentext, Suchindex, Inhaltsverzeichnis  (2026-07-22)
      Inhaltsverzeichnis wird von der gedruckten Inhaltsseite gelesen; die manuelle Config
      je Katalog aus dem Brief entfällt. Weiche Trennzeichen aus InDesign werden entfernt —
      im Wortinneren hätten sie die Volltextsuche unbrauchbar gemacht.
- [x] T-007  `manifest.ts` — `katalog.json` + getrennte `suchindex.json`  (2026-07-22)
      Erster Durchlauf am echten Katalog: 46 Seiten in 8,6 s, 13 MB Bilder,
      katalog.json 45 KB, suchindex.json 33 KB. 44 Tests grün, Typprüfung sauber.
- [x] T-008  StPageFlip 2.0.7 einvendort nach `packages/flip-engine/`  (2026-07-22)
      Herkunft, Lizenz und jede Änderung dokumentiert in `packages/flip-engine/HERKUNFT.md`.
      Unerwarteter Zusatzaufwand: Der Code enthielt sieben `const enum`, Parameter-
      Eigenschaften und einen CSS-Import — alles Konstrukte, die Node nicht direkt
      ausführen kann. Als PATCH 0 umgeschrieben, ohne Verhaltensänderung.
- [x] T-009  Patch 1 — Animationsschleife anhaltbar  (2026-07-22)
      `destroy()` hielt die Schleife nie an. Mit Browser-Attrappe nachgewiesen,
      dass sie sich nach `stop()` nicht neu einplant.
- [x] T-010  Patch 2 — Bild-Fehlerbehandlung gegen Endlos-Ladekringel  (2026-07-22)
- [x] T-011  Tastatur- und ARIA-Ebene — im Viewer statt im Fork  (2026-07-22)
      ←/→/↑/↓/Bild-auf/Bild-ab/Pos1/Ende, Fokus auf dem Katalog, `aria-live`-Ansage
      der Seitenzahl, Link zur Textfassung als erster Tabstopp, kein `user-scalable=no`.
      Im Browser durchgeprüft: Pos1 und Ende springen korrekt, die Ansage folgt.
- [x] T-012  Standalone-Viewer im HTML-Modus, liest `katalog.json`  (2026-07-22)
      Dazu ein Entwicklungsserver ohne Fremdpakete, der TypeScript im laufenden
      Betrieb für den Browser übersetzt. `npm run viewer`.
      Zusätzlich entstanden: die HTML-Textfassung unter `/text/` — 33.000 Zeichen
      Katalogtext im Quelltext, 46 Bilder mit Alt-Text, Inhaltsverzeichnis mit Sprungmarken.
- [x] T-013  Doppelseite Desktop / Einzelseite mobil, Nachladefenster ±2 Seiten  (2026-07-22)
      Im Browser gemessen: nach dem Durchblättern waren 10 von 46 Bildern geladen,
      36 warteten noch. Beim Öffnen also unter 1 MB statt 13 MB.
