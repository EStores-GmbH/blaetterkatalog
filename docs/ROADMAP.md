# Roadmap: Blätterkatalog

> Letzte Aktualisierung: 2026-07-22
> Aufgaben im Detail: `docs/BACKLOG.md` (einzige Task-Quelle). Diese Datei zeigt die grobe Linie.
> **Zieltermin erste produktive Fassung: Ende September / Mitte Oktober 2026** (2–3 Monate).

## Was diese Roadmap steuert

Erfolgsmaßstab des Projekts ist laut `docs/DISCOVERY.md` **die Zeitersparnis der Redaktion** —
nicht Lizenzkosten, nicht SEO, nicht Rechtssicherheit. Daraus folgt eine Priorisierung, die
vom ursprünglichen Phasenplan abweicht:

> **Phase 2 (Upload-Oberfläche) ist nicht optional.** Solange nur der Kommandozeilen-Befehl
> existiert, läuft jede Veröffentlichung über die Entwicklung — die Redaktion spart dann keine
> Zeit, sie delegiert sie. Erst mit Phase 2 erreicht das Projekt sein erklärtes Ziel.

Phase 0 und 1 bleiben trotzdem zuerst dran: Ohne funktionierenden Generator und Viewer gibt es
nichts, was eine Oberfläche auslösen könnte.

## Status-Legende

- 🟢 Abgeschlossen
- 🟡 In Arbeit
- 🔵 Geplant (nächster Sprint)
- ⚪ Backlog
- ❌ Gestrichen

## Aufwand-Schätzung

**S** = ~1 Tag | **M** = ~3 Tage | **L** = ~1 Woche | **XL** = >1 Woche

> Die Schätzungen sind bewusst konservativ. Phase 1 ist gegenüber der ersten Briefing-Fassung
> etwa anderthalb- bis doppelt so groß, weil Textrouten, Tastaturebene und die
> Barrierefreiheitserklärung dazugekommen sind.

---

## Vorgelagert: Klärungen

| Punkt | Status | Aufwand | Verantwortlich | Notizen |
| --- | --- | --- | --- | --- |
| B2B-Status rechtlich klären (BFSG?) | ⚪ | S | Armin/Recht | Blockiert nichts, entscheidet aber den Pflichtumfang. Bis dahin gilt: BFSG greift |
| Poppler installieren | ⚪ | S | Armin | Blockiert Phase 0 vollständig |
| Beispiel-PDF bereitstellen | ⚪ | S | Armin | Klärt zugleich Format und Seitenzahl |

## Milestone 1: Phase 0 — Prototyp (Ziel: offen)

Beweist Optik, Bedienung und Datenstruktur an einem echten PDF. Ohne Storyblok.

| Feature | Status | Aufwand | Notizen |
| --- | --- | --- | --- |
| Generator: PDF → Einzelseiten-Bilder | ⚪ | M | Poppler, längste Kante ≤ 4.000 px |
| Generator: Seitentext + Suchindex | ⚪ | M | **Risiko:** Druckdaten mit Text als Kurven — dann OCR nötig |
| `katalog.json` als Scharnier zu Phase 1 | ⚪ | S | Struktur bestimmt später die Storyblok-Story |
| StPageFlip forken + drei Pflicht-Patches | ⚪ | M | Schleife stoppbar, Bildfehler, Tastatur/ARIA |
| Standalone-Viewer im HTML-Modus | ⚪ | M | Doppelseite Desktop, Einzelseite mobil |
| Messpunkt auf echter Hardware | ⚪ | S | Entscheidet, ob der Fork bestehen bleibt |

**Ergebnis:** Lokal lauffähiger, tastaturbedienbarer Blätterkatalog aus einem Beispiel-PDF.

## Milestone 2: Phase 1 — Kernfunktionen + Storyblok (Ziel: offen)

| Feature | Status | Aufwand | Notizen |
| --- | --- | --- | --- |
| Volltext-Suche im Web Worker | ⚪ | M | Index erst beim Öffnen laden |
| Inhaltsverzeichnis + Download | ⚪ | S | |
| Storyblok-Anbindung (Assets + Story) | ⚪ | L | Ratenbremse, 429-Retry, kein Bulk-Upload |
| Content-Type „katalog" definieren | ⚪ | S | |
| Astro-Block + Viewer-Island | ⚪ | L | Erste Doppelseite serverseitig für LCP |
| **HTML-Textrouten je Seite** | ⚪ | L | Barrierefreie Alternativfassung **und** SEO-Träger |
| Sitemap + Canonical auf PDF | ⚪ | S | |
| Rebuild-Webhook | ⚪ | S | |
| CI-Theme final | ⚪ | M | Logo, Farben, Schrift |
| Barrierefreiheitserklärung § 14 BFSG | ⚪ | S | Pflicht-Liefergegenstand |
| a11y-Gates grün + manueller Durchlauf | ⚪ | M | Automatik deckt nur ~30 % ab |

**Ergebnis:** `katalog-build kunde-q3.pdf` → Katalog in Storyblok, im Visual Editor platzierbar.

## Milestone 3: Phase 2 — Upload-Seite (**erfolgskritisch**)

Hier wird das Erfolgskriterium erst eingelöst. Nicht als „optional" behandeln.

| Feature | Status | Aufwand | Notizen |
| --- | --- | --- | --- |
| Interne Weboberfläche für PDF-Upload | ⚪ | L | Statusanzeige während der Verarbeitung |
| Authentifizierung fürs Team | ⚪ | M | Erst hier wird das Threat Model scharf |
| Bedienanleitung für die Redaktion | ⚪ | S | Zielgruppe sind Nicht-Entwickler — Liefergegenstand, keine Kür |
| Abnahme durch die Redaktion | ⚪ | S | Jemand aus dem Team veröffentlicht einen echten Katalog selbst |

## Backlog (noch nicht eingeplant)

| Feature | Priorität | Aufwand | Notizen |
| --- | --- | --- | --- |
| Zoom / Lupe | P1 | M | Fehlt der Engine komplett |
| Thumbnail-Leiste | P2 | M | Eigene kleine Bildgrößen, nie skalierte Vollbilder |
| Produkt-Hotspots / Shop-Links | P1 | L | Aus PDF-Annotationen ableitbar. Macht den Katalog unstreitig zur Kaufanbahnung |
| Teilen-Links je Seite | P2 | S | |
| Aufruf-Statistik | P2 | M | Consent beachten |
| Treffer-Hervorhebung im Bild | P2 | L | Als Bedienkomfort, **nicht** als SEO- oder a11y-Lösung |
| Mehrsprachige Kataloge | P2 | L | Offene Frage 4 im Projektbrief |
| Eigener Objektspeicher statt Storyblok-Assets | P3 | M | Erst bei Tarifwechsel oder deutlich mehr Katalogen |
