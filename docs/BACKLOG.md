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
- [ ] T-002  Poppler installieren (`brew install poppler`)  (Prio: hoch)
      Liefert `pdftoppm`, `pdftotext`, `pdfinfo`. Aktuell ist keines davon auf dem Rechner.
- [ ] T-003  Beispiel-PDF nach `fixtures/` legen  (Prio: hoch · Verantwortlich: Armin)
      Möglichst realistische Seitenzahl, damit T-013 aussagekräftig ist. Klärt zugleich Format
      (A4 hoch? A3? Querformat) — siehe Projektbrief Abschnitt 8, Frage 3.

## Aktueller Sprint — Phase 0 (Prototyp, ohne Storyblok)

- [ ] T-004  `pdf-tools.ts`: CLI-Verfügbarkeit prüfen, Fehlermeldung mit Installationsbefehl  (Prio: hoch · abhängig von: T-002)
- [ ] T-005  `render.ts`: PDF → JPEG pro Einzelseite, Auflösung parametrisierbar, längste Kante ≤ 4.000 px  (Prio: hoch · abhängig von: T-004)
- [ ] T-006  `extract.ts`: Seitentext → `text_html` **und** Suchindex  (Prio: hoch · abhängig von: T-004)
- [ ] T-007  `manifest.ts`: `katalog.json` schreiben (Scharnier zu Phase 1)  (Prio: hoch · abhängig von: T-005, T-006)
- [ ] T-008  StPageFlip nach `packages/flip-engine/` forken, Herkunft + Version in `HERKUNFT.md`  (Prio: hoch)
- [ ] T-009  Patch 1: Animationsschleife stoppbar machen (`cancelAnimationFrame` aus `destroy()`)  (Prio: hoch · abhängig von: T-008)
- [ ] T-010  Patch 2: Bild-Fehlerbehandlung (`onerror`) gegen Endlos-Ladekringel  (Prio: mittel · abhängig von: T-008)
- [ ] T-011  Patch 3: Tastatur- und ARIA-Ebene (←/→/Pos1/Ende, `role`, `aria-live`, Fokusring)  (Prio: hoch · abhängig von: T-008)
- [ ] T-012  Standalone-Viewer im HTML-Modus, liest `katalog.json`  (Prio: hoch · abhängig von: T-007, T-009)
- [ ] T-013  Doppelseite Desktop / Einzelseite mobil, Nachladefenster ±2 Seiten  (Prio: hoch · abhängig von: T-012)
- [ ] T-014  Messpunkt echte Hardware: 150-Seiten-Katalog auf iPhone + Mid-Range-Android  (Prio: hoch · abhängig von: T-013)
      Misst Speicher, Wischqualität, Ladezeit. Ergebnis entscheidet, ob der Fork so bleibt.

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

## Icebox

<!-- Ideen ohne Termin — bewusst geparkt -->

- Phase 2: Interne Upload-Seite (PDF reinziehen → veröffentlichen) + Auth fürs Team
- Phase 3: Zoom/Lupe, Thumbnail-Leiste, Produkt-Hotspots, Teilen-Links, Aufruf-Statistik,
  Treffer-Highlighting via unsichtbarer Textebene
- Eigener Objektspeicher (R2/S3) statt Storyblok-Assets — erst relevant bei Tarifwechsel
  nach unten oder deutlich mehr Katalogen als erwartet
- Getaggtes PDF beim Layouter mitbeauftragen (Alternative: HTML-Textfassung als offizielle
  barrierefreie Fassung deklarieren — siehe Projektbrief Abschnitt 8, Frage 7)

## Erledigt

<!-- Abgeschlossene Tasks hierher verschieben: [x] T-XXX ... (2026-07-07) -->

- [x] T-000  Projektbrief Fassung 2 nach technischer Prüfung (Engine, Storyblok, BFSG/SEO)  (2026-07-22)
