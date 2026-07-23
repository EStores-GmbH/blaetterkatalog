# POC-Status & Übergabe — Blätterkatalog Phase 0

> **Was ist dieses Dokument?** Der Einstieg für alle, die diesen Proof of Concept
> weiterbauen. Es beschreibt, **was Phase 0 tatsächlich liefert**, in welchem
> Zustand es ist, was bewusst provisorisch bleibt, und was der Weg zu einem
> produktiven Phase-1-System ist.
>
> **Stand:** 2026-07-23, nach Merge von PR #3. Alle Angaben am Code verifiziert.
>
> Für das *Warum* hinter den Entscheidungen: `decisions/log.md`.
> Für die *Zielarchitektur*: `docs/Blaetterkatalog_Projektbrief.md` + `docs/ARCHITECTURE.md`.

---

## 1. In einem Satz

Aus einem druckfertigen PDF entsteht per Kommandozeile ein interaktiver
Blätterkatalog (Page-Flip) samt barrierefreier HTML-Textfassung, lokal lauffähig
im Browser — **noch ohne Storyblok und ohne Astro**. Das ist der Prototyp, an dem
Look, Bedienung und Datenstruktur bewiesen wurden.

## 2. Was der POC liefert

Zwei npm-Pakete plus ein einvendorter Fork:

| Paket | Rolle | Zustand |
|---|---|---|
| `packages/generator` | PDF → Seitenbilder, Text, Inhaltsverzeichnis, Suchindex, `katalog.json` | **tragfähig** — Datenstruktur ist der Vertrag zu Phase 1 |
| `packages/viewer` | Liest `katalog.json`, zeigt Blätterkatalog + Textfassung | **tragfähig als Logik**, Dev-Server ist Wegwerf (siehe §4) |
| `packages/flip-engine` | StPageFlip 2.0.7 (MIT), einvendort, 4 eigene Patches | **dauerhaft** — wir pflegen ihn selbst, siehe `HERKUNFT.md` |

### Was nachweislich funktioniert (im Browser durchgeklickt)

- PDF → 46 Seitenbilder in ~8,6 s, Textextraktion auf 45/46 Seiten
- Blättern per Maus, Wischgeste und Tastatur (←/→/↑/↓/Bild-auf/-ab/Pos1/Ende)
- Doppelseite am Desktop, Einzelseite mobil; Querformat nie als Doppelseite
- Nachladen der Bilder im Fenster ±2 Seiten (10 von 46 beim Öffnen statt allen)
- Inhaltsverzeichnis wird automatisch aus der gedruckten Inhaltsseite gelesen,
  anklickbar, mit korrekten Sprungzielen (auch bei versetzten Seitenzahlen)
- Screenreader-Ansage der Seitenzahl, Link zur Textfassung als erster Tabstopp
- Holz-Untergrund als Bilddatei, je Katalog austauschbar
- HTML-Textfassung unter `/text/`: voller Katalogtext, Alt-Texte, TOC-Sprungmarken
- PDF-Download

### Zahlen

- **129 Tests** (11 Dateien), grün · **3 Typprüfungen** sauber
- **Null Laufzeit-Abhängigkeiten** — Node 22 bringt alles mit
- Systemvoraussetzung: **Poppler** (`pdftoppm`, `pdftotext`, `pdfinfo`)

## 3. Wie man es startet

```bash
brew install poppler          # einmalig, Systemvoraussetzung
npm install                   # nur Dev-Werkzeuge (typescript, @types/node, lefthook)

npm run katalog-build -- fixtures/<katalog>.pdf
npm run viewer                # http://localhost:4321/  ·  Textfassung: /text/
```

Weitere Befehle:

```bash
npm test           # alle 129 Tests
npm run type-check # drei tsconfig-Kontexte (Wurzel, flip-engine, viewer)
npm run katalog-build -- --hilfe   # alle Generator-Optionen
```

Node führt die TypeScript-Dateien direkt aus (`--experimental-strip-types`).
**Es gibt keinen Bauschritt.** Deshalb auch kein `build`-Script — das würde die
Web-Quality-Gates in der CI scharf schalten, bevor es ein Frontend gibt.

## 4. Was bewusst provisorisch ist (nicht weiterverwenden)

Das ist der wichtigste Abschnitt für einen POC. Diese Teile haben ihren Zweck
erfüllt und werden in Phase 1 **ersetzt**, nicht ausgebaut:

| Provisorium | Warum es reicht | Was es in Phase 1 ablöst |
|---|---|---|
| **`viewer/src/dev-server.ts`** | Liefert `out/` lokal aus, damit man den Viewer sieht | **Astro** übernimmt Auslieferung, Routing, TypeScript-Bündelung |
| **Viewer lädt `katalog.json` von Platte** | Beweist den Datenfluss | Astro liest die Daten zur Build-Zeit aus der **Storyblok CDA** |
| **`out/<slug>/` als Ausgabeziel** | Lokaler Ordner, für sich vollständig | Generator lädt via **Storyblok Management API** hoch |
| **Gezeichnetes CSS-Holz** (`flipbook.css`) | Rückfall, falls das Bild fehlt | bleibt als Notnagel; Standard ist die Bilddatei |
| **`--experimental-strip-types`** | Kein Bauschritt nötig in Phase 0 | Astros Build-Pipeline übersetzt TypeScript |

Was **bleibt** und in Phase 1 übernommen wird: der gesamte `generator`-Code
(nur die Ausgabe-Senke wechselt von Platte zu Storyblok), die `flip-engine`, und
die Viewer-Logik (`flipbook.ts`, `textfassung.ts`, `hintergrund.ts`, `farbe.ts`,
`engine.ts`) — nur eingebettet in Astro-Komponenten statt in den Dev-Server.

## 5. Wie die Teile zusammenspielen

```text
PDF ─► generator ─┬─► pages/seite-NN.jpg   (Seitenbilder)
                  ├─► katalog.json          (Beschreibung — das Scharnier)
                  ├─► suchindex.json        (Volltext je Seite, getrennt)
                  └─► <original>.pdf        (Download-Kopie)
                              │
                              ▼  Phase 0: von Platte gelesen
                          viewer
                              ├─► /            Blätterkatalog (flipbook.ts + flip-engine)
                              └─► /text/       HTML-Textfassung (textfassung.ts)
```

### Das Scharnier: `katalog.json`

Diese Datei ist der **Vertrag zwischen Generator und Viewer** — und in Phase 1
wird aus genau dieser Struktur die Storyblok-Story. Deshalb ist sie zweimal
typisiert: `generator/src/types.ts` (Erzeuger) und `viewer/src/katalog-typen.ts`
(Verbraucher), bewusst getrennt, weil die Datenquelle in Phase 1 wechselt.

```jsonc
{
  "slug": "horeca-q3-26",
  "titel": "HoReCa Table Top Q3/26",
  "seitenzahl": 46,
  "ausrichtung": "hoch",              // "hoch" | "quer" — steuert Doppelseite
  "akzentfarbe": "#0057a0",
  "hintergrund": "holz",              // Vorlage, Hex oder Bildpfad
  "download_pdf": "<dateiname>.pdf",
  "erzeugt_am": "2026-07-23T…",
  "seiten": [
    { "nr": 1, "bild": "pages/seite-01.jpg",
      "breite": 1654, "hoehe": 2339,
      "text_html": "<p>…</p>" }        // barrierefreie Fassung + SEO
  ],
  "toc": [
    { "label": "Vorwort", "seite": 4, "index": 4 }
    // seite = gedruckte Zahl (Anzeige), index = Dateiposition (Sprungziel)
  ],
  "quelle": { "pruefsumme": "sha256…", "gerendert_dpi": 200, … }
}
```

Der **Suchindex liegt bewusst getrennt** (`suchindex.json`), nicht in der Story:
er würde sonst bei jedem Abruf mitgeladen und Ladezeit und Traffic belasten.

## 6. Wichtige Einzelentscheidungen, die man kennen muss

Diese sind subtil und im Code kommentiert, aber leicht zu übersehen:

- **HTML-Modus, nie Canvas** (`viewer/src/engine.ts`): Nur so bleiben Text,
  Alt-Texte und Nachladen erhalten. Der Canvas-Modus der Engine würde alle Seiten
  sofort laden und Barrierefreiheit + SEO unmöglich machen.
- **Auflösung wird begrenzt** (`generator/src/render.ts`): Der Storyblok Image
  Service deckelt bei 4.000 px. A4 verträgt 300 dpi, A3 weniger. Einzelseiten,
  nie Doppelseiten rendern.
- **Seitenversatz** (`generator/src/extract.ts`): Kataloge mit unnummerierten
  Vorsatzblättern nennen im Inhaltsverzeichnis andere Zahlen als die
  Dateiposition. Der Generator ermittelt den Versatz per Mehrheitsentscheid aus
  den Fußzeilen. `toc[].seite` ≠ `toc[].index` ist Absicht.
- **`prefers-reduced-motion`** (`viewer/src/flipbook.ts`): `flippingTime` darf
  nie 0 sein — die Engine wirft sonst im Konstruktor. Bei reduzierter Bewegung
  wird 1 (praktisch sofort) genutzt.
- **Fork-Patches** (`flip-engine`): 14 Stellen mit `PATCH <n>` markiert. Vor
  jedem Upstream-Abgleich `grep -rn "PATCH " src/`. Details in `HERKUNFT.md`.

## 7. Bekannte Grenzen & offene Punkte

**Blockierend / erfolgskritisch (liegen beim Auftraggeber, nicht am Code):**

- **T-001 — BFSG-Rechtsfrage.** Ist der Shop belastbar rein B2B? Entscheidet, ob
  Barrierefreiheit Pflicht ist. Bis geklärt: als geltend angenommen. → Rechtsberatung.
- **T-032 — Druckfassung des Beispiel-PDF.** Die vorliegende Datei hat 72-ppi-Fotos;
  Text ist scharf, Bilder werden beim Zoomen weich.
- **T-014 — Belastungstest.** Bisher nur mit 46 Seiten geprüft. Für die Sorge
  „150 Seiten auf Mid-Range-Android" (Speicher, Wischqualität) fehlt ein großer Katalog.

**Technisch offen:**

- **Zoom fehlt** der Engine komplett (Roadmap Phase 3).
- **Querformat** ist implementiert, aber nur mit Hochformat getestet (T-033).
- **Testschuld aus Phase 0** (bewusst aufgeschoben, jetzt im Backlog): CLI-Integrationstest
  (T-037), `flipbook.ts`-DOM-Test (T-038) — beide vom Code-Review als P1-Coverage benannt.
- **Holzbild-Lizenz** (`assets/LIESMICH.md`) ist nicht eingetragen (T-040).
- **`develop`/`staging`-Branches** existieren im Remote nicht, obwohl `AGENTS.md`
  sie als Weg beschreibt. Anlegen oder Regel anpassen.
- **CI-Plumbing** (T-039): GitHub Code Security aktiviert (kostet bei privaten Repos);
  gitleaks läuft ohne Lizenz über das Release-Binary; CodeQL braucht `actions: read`.
  Bisher nur in Commit-Messages, nicht in den Docs.
- **Cross-Repo:** estores-marketplace PR #2/#3 noch offen — `/session-start` greift erst
  nach deren Merge.

## 8. Der Weg vom POC zu Phase 1

Reihenfolge und Aufgaben stehen in `docs/BACKLOG.md` (T-015 ff.) und
`docs/ROADMAP.md`. Die Kernschritte:

1. **Storyblok-Anbindung** (`generator`): `storyblok.ts` ergänzen — Assets-Upload
   (signed request, Ratenbremse ≤ 5 req/s, 429-Retry) + „katalog"-Story. Der
   restliche Generator bleibt unverändert; nur die Ausgabe-Senke wechselt.
2. **Astro-Frontend** (`viewer` → Astro): Dev-Server wegwerfen. Viewer-Logik in
   `Flipbook.astro` + `client:visible`-Island. Daten zur Build-Zeit aus der CDA.
   Erste Doppelseite serverseitig für den LCP.
3. **HTML-Textrouten**: `/kataloge/[slug]/seite-[nr]/` je Seite — die
   Barrierefreiheits-Alternativfassung **und** der SEO-Träger. `textfassung.ts`
   ist die Vorlage.
4. **Suche im Viewer**: Fuse.js im Web Worker, Index erst beim Öffnen laden.
5. **Rebuild-Webhook**, **Barrierefreiheitserklärung § 14 BFSG**, **CI-Theme**.

**Wichtig:** Erfolgskriterium des Projekts ist laut `docs/DISCOVERY.md` die
**Zeitersparnis der Redaktion**. Das ist erst mit **Phase 2** (Upload-Oberfläche)
eingelöst — solange nur der CLI-Befehl existiert, läuft jede Veröffentlichung
über die Entwicklung. Phase 2 ist nicht optional.

## 9. Landkarte der Dokumentation

| Datei | Inhalt |
|---|---|
| **`docs/POC-STATUS.md`** | dieses Dokument — Einstieg, Ist-Zustand, Übergabe |
| `docs/Blaetterkatalog_Projektbrief.md` | vollständiger Kontext, Zielarchitektur, Phasenplan |
| `docs/ARCHITECTURE.md` | Stack-Entscheidungen, Datenmodell, harte Grenzen, Risiken |
| `docs/DISCOVERY.md` | Problem, Zielgruppe, Erfolgskriterium, Constraints |
| `docs/ROADMAP.md` | Meilensteine, Aufwände |
| `docs/BACKLOG.md` | einzige Task-Quelle (T-001 …), Status |
| `docs/COMPLIANCE.md` | BFSG/a11y, SEO/CWV, Datenschutz, Security |
| `docs/THREAT-MODEL.md` | Angriffsflächen (Management-Token, Rebuild-Webhook) |
| `decisions/log.md` | **das Warum** — append-only Entscheidungs-Log |
| `docs/research/` | **die Beweise** — Volltext der 3 Recherchen (Engine, Storyblok, BFSG/SEO) hinter den 6 gekippten Entscheidungen |
| `packages/flip-engine/HERKUNFT.md` | Fork-Herkunft, alle Patches, Abgleich-Anleitung |
| `packages/generator/README.md` | Generator: Aufbau, Ausführen, Erweitern |
| `packages/viewer/README.md` | Viewer: Aufbau, Ausführen, Erweitern |
| `README.md` | Projekt-Kurzüberblick |
