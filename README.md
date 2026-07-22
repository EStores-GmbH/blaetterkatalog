# Blätterkatalog

Erzeugt aus einem druckfertigen PDF einen interaktiven Blätterkatalog, veröffentlicht ihn
automatisch in Storyblok und liefert ihn im Astro-Frontend als platzierbaren Block aus.
Ersetzt das kommerzielle „Flip PDF Plus Pro" durch einen eigenen, CI-konformen Workflow.

## Überblick

- **Zweck:** Kataloge ohne manuelles Hochladen und Einbetten veröffentlichen — PDF rein,
  fertiger Katalog raus. Volle Kontrolle über Gestaltung, Barrierefreiheit und Auffindbarkeit.
- **Profil:** headless-cms-site
- **Status:** in Entwicklung — Phase 0 (Prototyp)

## Leitprinzip

> Die **HTML-Textfassung ist das Fundament**, der Blätterkatalog die Oberfläche darüber.

Drei Anforderungen verlangen dasselbe: Barrierefreiheit nach BFSG, Auffindbarkeit bei Google
und Bedienbarkeit ohne Maus. Alle drei brauchen den Katalogtext als echtes HTML statt als Pixel.
Der Text fällt beim Erzeugen des Suchindex ohnehin an.

## Stack

- **Generator:** Node.js 22 + TypeScript, PDF-Verarbeitung über Poppler
- **Frontend:** Astro (statisch gebaut), Viewer als Client-Island
- **Blätter-Engine:** StPageFlip als einvendorter Fork, HTML-Modus
- **CMS:** Storyblok (Management API zum Veröffentlichen, Content Delivery API beim Bauen)
- **Datenbank:** keine

> Details und Begründung: `docs/ARCHITECTURE.md` · Entscheidungen: `decisions/log.md`

## Lokal starten

```bash
brew install poppler            # Systemvoraussetzung: pdftoppm, pdftotext, pdfinfo
cp .env.example .env.local      # Storyblok-Tokens eintragen
npm install
```

Der Generator und das Frontend entstehen in Phase 0 — bis dahin gibt es keine Start-Befehle.
Aktueller Stand und nächste Schritte: `docs/BACKLOG.md`.

## Projektstruktur

```text
packages/generator/    → PDF → Bilder, Text, katalog.json
packages/flip-engine/  → einvendorter StPageFlip-Fork + eigene Patches
packages/viewer/       → Astro-Block, Viewer-Island, HTML-Textrouten
fixtures/              → Test-PDFs (gitignored)
out/                   → Generator-Ausgabe (gitignored)
docs/                  → Projektbrief, Architektur, Roadmap, Compliance
decisions/             → Entscheidungs-Log + ADRs
```

## Entwicklung

- Branching: `feature/[ticket-id]-[name]` → PR → `develop` → `staging` → `main`
- Neues Feature in Claude Code: `/create-feature`
- Vor dem Commit: `/local-review`
- Projektstand und nächster Schritt: `/session-start`
- „Fertig" heißt: `templates/definition-of-done.md` erfüllt

## Qualitäts-Gates

Die CI prüft bei jedem PR verbindlich — Budgets in `.lighthouserc.json`, `.pa11yci.json`,
`.size-limit.json`. **Zielnorm ist WCAG 2.2 AA**; die Textrouten müssen grün sein.
Der Viewer wird zusätzlich manuell mit Tastatur und Screenreader geprüft, weil automatisierte
Werkzeuge nur rund 30 % der Kriterien abdecken.

> Die Gates schalten sich erst scharf, sobald `package.json` ein `build`-Script enthält.

## Deployment

- Staging: `/deploy-staging` · Production: `/release`
- Zielplattform noch nicht festgelegt — siehe `docs/BACKLOG.md`

## Dokumentation

- Vollständiger Projektkontext → `docs/Blaetterkatalog_Projektbrief.md`
- Produkt & Scope → `docs/DISCOVERY.md`
- Architektur → `docs/ARCHITECTURE.md`
- Roadmap → `docs/ROADMAP.md`
- Compliance (DSGVO/BFSG) → `docs/COMPLIANCE.md`
- Entscheidungen → `decisions/log.md`
- Offene Tasks → `docs/BACKLOG.md`
