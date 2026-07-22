# Blätterkatalog — Claude Code Kontext

## Projekt-Profil

> Per `/project-type` gesetzt. Bestimmt Pflicht-Skills und Compliance-Checklisten.

- **Profil:** headless-cms-site
- **Verarbeitet Personendaten:** teilweise (Cookies / Analytics — ohne Nutzer-Accounts)
- **Pflicht-Skills:** security, testing, accessibility, seo-performance, headless-cms
- **Compliance:** siehe `docs/COMPLIANCE.md` (BFSG/a11y, SEO/CWV, Cookie-Consent)
- **Claude-Bausteine:** Skills, Agents, Commands, Hooks und Verhaltens-Rules kommen aus den
  **estores-Plugins** (Marketplace, via `.claude/settings.json`) — nicht lokal im Repo. Siehe `.claude/PLUGINS.md`.
- **Aktive Plugins:** `estores-core@estores`, `estores-web@estores`

## Verhaltensregeln (einzige Quelle: AGENTS.md)

@AGENTS.md

## Projekt-Überblick

- **Produkt**: Generator, der aus einem druckfertigen PDF einen interaktiven Blätterkatalog
  (Page-Flip) erzeugt, ihn automatisch in Storyblok veröffentlicht und im Astro-Frontend als
  platzierbaren Block ausliefert. Ersetzt das kommerzielle „Flip PDF Plus Pro".
- **Leitprinzip**: Die **HTML-Textfassung ist das Fundament**, der Blätterkatalog die Oberfläche
  darüber. Barrierefreiheit, Google-Indexierung und Tastaturbedienung hängen alle daran.
- **Stack**: Node.js 22 + TypeScript (Generator) · Astro (Frontend) · Storyblok (Headless CMS)
- **Sprache(n)**: TypeScript (strict)
- **CSS/Styling**: noch offen — wird mit dem CI-Theme in Phase 1 entschieden (T-026)
- **Datenbank**: keine. Inhalte liegen in Storyblok, Bilder als Storyblok-Assets.
- **ORM**: keiner — entfällt mangels Datenbank
- **Deployment**: noch offen. SSG-Build + Rebuild-Webhook; Zielplattform in Phase 1 festlegen.
- **Team**: Armin Trunk

## Wichtige Befehle

```bash
# Systemvoraussetzung (einmalig, siehe docs/BACKLOG.md T-002):
brew install poppler          # liefert pdftoppm, pdftotext, pdfinfo

# Ab Phase 0 (packages/ existiert noch nicht — Befehle entstehen mit T-004 ff.):
npm run katalog-build <pdf>   # Generator: PDF → Bilder + Text + katalog.json
npm run dev                   # Astro-Dev-Server (Port 4321)
npm run build                 # Production-Build (SSG)
npm run preview               # gebauten Stand lokal ansehen
npm test                      # Tests
npm run lint                  # Linting
npx tsc --noEmit              # Typ-Prüfung
```

> **Achtung:** Ein `build`-Script in `package.json` schaltet die Web-Quality-Gates in der CI
> scharf (Lighthouse, pa11y, size-limit). Erst anlegen, wenn es auch etwas zu bauen gibt.

## Code-Konventionen

- Sprache: TypeScript strict — kein `any` ohne begründenden Kommentar
- Komponenten/Module: funktional; Astro-Komponenten serverseitig, Interaktivität nur in Islands
- Naming: `camelCase` für Werte und Funktionen, `PascalCase` für Typen und Komponenten,
  `kebab-case` für Dateinamen
- Imports: absolute Pfade innerhalb eines Pakets, Pakete untereinander über den Workspace-Namen
- Fachbegriffe im Code auf Englisch, Kommentare auf Englisch, Nutzertexte auf Deutsch
- Error Handling: Immer explizit — keine stillen Failures. Der Generator bricht mit
  verständlicher Meldung ab, statt halbe Kataloge zu veröffentlichen.
- Tests: Für jede neue Funktion mind. ein Unit-Test

## Architektur-Entscheidungen

> Vollständig mit Begründung in `decisions/log.md`, Überblick in `docs/ARCHITECTURE.md`.

- **Blätter-Engine**: StPageFlip als **einvendorter Fork** in `packages/flip-engine/`,
  betrieben im **HTML-Modus** (`loadFromHTML`) — nie im Canvas-Modus
- **Datenabruf**: zur **Build-Zeit** (SSG), Rebuild per Storyblok-Webhook. Kein CMS-Token im Browser.
- **State Management**: keins — der Viewer hält seinen Zustand lokal in der Island
- **Suche**: Fuse.js im Web Worker, Index als statische Datei, erst beim Öffnen der Suche geladen
- **Auth**: erst in Phase 2 relevant (interne Upload-Seite)
- **API-Layer**: keiner — Storyblok Management API im Generator, Content Delivery API beim Build

## Aktuelle Prioritäten & Backlog

- Sprint-Fokus (persönlich, gitignored):
@context/current-priorities.md

- Team-Backlog: `docs/BACKLOG.md` — einzige Task-Quelle, Status dort pflegen
- Vollständiger Projektkontext: `docs/Blaetterkatalog_Projektbrief.md`
