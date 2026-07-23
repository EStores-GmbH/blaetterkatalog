# Entscheidungs-Log

**Regel:** Niemals löschen oder ändern — nur neue Einträge anhängen (append-only).
**Format:** `[DATUM] [Name] Entscheidung — Begründung`

Für große Architektur-Entscheidungen: Separate ADR-Datei in `decisions/adr/` anlegen.

---

[2026-07-22] [Armin] Profil **headless-cms-site** — öffentliche Blätterkatalog-Website mit
redaktionellen Inhalten aus einem Headless-CMS; Personendaten nur teilweise (Cookies/Analytics,
keine Accounts). Pflicht-Plugins: estores-core + estores-web.

[2026-07-22] [Armin] **Leitprinzip: HTML-Textfassung ist das Fundament, der Blätterkatalog die
Oberfläche darüber.** — Drei unabhängige Anforderungen (BFSG-Barrierefreiheit, Google-Indexierung,
Bedienbarkeit ohne Maus) verlangen dieselbe Sache: Katalogtext als echtes HTML statt als Pixel.
Der Text fällt in der Pipeline ohnehin für die Volltextsuche an. Ein Artefakt löst drei Probleme.

[2026-07-22] [Armin] **StPageFlip im HTML-Modus (`loadFromHTML`), nicht im Canvas-Modus.** —
Der Canvas-Modus setzt die Bildquelle aller Seiten in einer Schleife auf einmal (150 Seiten ≈ 85 MB
beim Öffnen) und macht Textebene, Screenreader-Unterstützung und SEO strukturell unmöglich.
Der HTML-Modus animiert echte Seitenelemente per CSS-3D und sieht identisch aus.

[2026-07-22] [Armin] **StPageFlip wird einvendort (Fork in `packages/flip-engine/`) statt als
npm-Abhängigkeit genutzt.** — Upstream seit 18.04.2021 ohne Commit, Issue „Mark this project as
abandoned" seit Mai 2024 unbeantwortet. Neun Alternativen geprüft: Was gepflegt wird, kann nicht
blättern; was blättern kann, ist tot, GPL-belastet oder kostet 25–40 k$/Jahr. Vertretbar, weil
~2.000 Zeilen TypeScript, MIT, null Fremdabhängigkeiten. Preis: Wir sind ab dann der Wartende.
Drei Pflicht-Patches: Animationsschleife stoppbar (sonst Leck bei jeder Astro-Navigation),
Bild-Fehlerbehandlung (sonst Endlos-Ladekringel), Tastatur- und ARIA-Ebene (fehlt komplett).

[2026-07-22] [Armin] **Katalogdaten werden zur Build-Zeit gelesen (SSG) + Webhook-Rebuild,
nicht zur Laufzeit im Browser.** — Der öffentliche Storyblok-Token im Quelltext gibt die komplette
Inhaltsstruktur des Space frei, nicht nur den Katalog; dazu Faktor 20 Tempounterschied je nach
Cache-Handling. Der offizielle @storyblok/astro-Guide arbeitet serverseitig. Preis: ein bis zwei
Minuten Verzögerung nach dem Veröffentlichen — das Ziel „kein manueller Schritt" bleibt erfüllt.

[2026-07-22] [Armin] **Suchindex als statische Datei neben dem Astro-Build, nicht in der
Katalog-Story.** — Passt zwar ins 5-MB-Story-Limit, würde aber bei jedem Abruf mitausgeliefert und
Ladezeit, Traffic- und API-Kontingent ohne Nutzen belasten. Wird erst beim Öffnen der Suche geladen.

[2026-07-22] [Armin] **Einzelseiten rendern, nicht Doppelseiten.** — Der Storyblok Image Service
hat einen harten Deckel bei 4.000 × 4.000 px; eine A4-Doppelseite bei 300 dpi misst 4.961 × 3.508 px
und liegt darüber. Einzelseiten sind ohnehin nötig für die mobile Einzelseitenansicht.

[2026-07-22] [Armin] **Seitenbilder und PDF bleiben Storyblok-Assets** (kein eigener Objektspeicher).
— Gilt nur wegen Tarif **Growth Plus**: 10.000 Assets inklusive (≈ 66 Kataloge), danach 5 $/Monat je
weitere 10.000, 1 TB Traffic. Auf Starter/Growth wäre es eine harte Wand nach 13–16 Katalogen ohne
Zukaufmöglichkeit gewesen. **Bei Tarifwechsel nach unten neu bewerten.**

[2026-07-22] [Armin] **Zielnorm WCAG 2.2 AA statt 2.1 AA.** — 2.2 ist abwärtskompatibel und kostet
beim Neubau fast nichts. Ausgerechnet die neuen Kriterien treffen einen Blätterkatalog ins Mark:
2.5.7 (Blättern darf nicht nur per Ziehen gehen), 2.4.11 (Fokus nicht verdeckt), 2.5.8 (Zielgröße
24 px). Die für Oktober 2026 erwartete EN 301 549 V4.1.1 ist damit abgedeckt.

[2026-07-22] [Armin] **BFSG wird als geltend angenommen, bis das Gegenteil belastbar geklärt ist.**
— Der Shop gilt intern als B2B, der Ausschluss steht aber nur in den AGB. Laut Recherche
(Bundesfachstelle Barrierefreiheit, Noerr) trägt das nicht: nötig wären wirksame technische
Vorkehrungen gegen Verbraucherbestellungen. Klärung durch Rechtsberatung offen — siehe
docs/BACKLOG.md. Nachträglich weglassen ist einfacher als nachrüsten.
