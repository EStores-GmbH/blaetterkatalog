# Threat Model: Blätterkatalog

> Für Profil **headless-cms-site** nicht vorgeschrieben — bewusst trotzdem geführt, weil der
> Generator ein Token mit Schreibrechten auf den gesamten Storyblok-Space hält.
> Lebendiges Dokument — bei Architektur-Änderungen aktualisieren.
> Stand: 2026-07-22. Wird mit Phase 2 (Upload-Seite mit Anmeldung) neu bewertet.

## 1. Datenklassifizierung

| Daten | Klasse | Speicherort | Verschlüsselung |
| --- | --- | --- | --- |
| Katalogseiten (Bilder, Text) | öffentlich | Storyblok-Assets + CDN | in transit: TLS |
| Original-PDF | öffentlich | Storyblok-Asset | in transit: TLS |
| Storyblok **Management-Token** | Geheimnis (kritisch) | `.env.local`, CI-Secret | at rest: Betriebssystem/CI-Tresor |
| Storyblok Content-Token | Geheimnis (gering) | `.env.local`, Build-Umgebung | dito |
| Webhook-Secret | Geheimnis | dito | dito |
| Besucher-Daten | PII (minimal) | nur Analytics, falls eingesetzt | — |

**Es gibt keine Nutzerkonten und keine Formulare.** Der Katalog ist reines Lesen. Das entschärft
die meisten klassischen Bedrohungen — der wunde Punkt ist der Veröffentlichungsweg.

## 2. Trust Boundaries & Datenfluss

```text
[Redaktion/Entwickler]
        │  PDF, lokal
        ▼
┌───────────────────┐   ╔═══ Grenze 1: Management-Token, Schreibrechte auf den ganzen Space
│    Generator      │───╫──────────────► [Storyblok]
└───────────────────┘   ╚
                                            │  ╔═══ Grenze 2: Webhook, von außen aufrufbar
                                            ▼  ╚
                                     [Build/Deploy]
                                            │
                                            ▼
[Besucher/Browser] ◄──(HTTPS)── [CDN: statische Seiten + Bilder]
                                            ╚═══ Grenze 3: alles hier ist öffentlich
```

Grenze 3 ist unkritisch — dort liegt nur, was ohnehin veröffentlicht werden soll.
Die Risiken liegen an Grenze 1 und 2.

## 3. Bedrohungen (STRIDE-lite)

| Kategorie | Bedrohung | Komponente | Gegenmaßnahme | Status |
| --- | --- | --- | --- | --- |
| Info Disclosure | Management-Token gelangt ins Frontend-Bundle → Fremde können den ganzen Space überschreiben | Generator / Astro-Build | Token nie mit `PUBLIC_`-Präfix; Generator und Viewer sind getrennte Pakete; gitleaks in Hook und CI | offen (Phase 1) |
| Info Disclosure | Content-Token im Browser gibt die komplette Space-Struktur frei | Astro | Durch SSG vermieden — es wird gar kein Token ausgeliefert | **entschärft** (Architekturentscheidung) |
| Spoofing | Gefälschter Rebuild-Aufruf löst beliebig viele Builds aus | Webhook-Endpunkt | Signatur mit `STORYBLOK_WEBHOOK_SECRET` prüfen, Aufrufe drosseln | offen (T-023) |
| DoS | Build-Minuten durch wiederholte Webhook-Aufrufe verbrannt | CI/Hosting | Entprellen, gleichzeitige Builds begrenzen | offen (T-023) |
| Tampering | Manipuliertes PDF bringt den Generator zum Absturz oder führt Code aus | Generator, Phase 2 | Poppler läuft als eigener Prozess ohne Netzzugriff; Dateigröße und Seitenzahl begrenzen; Ausgabepfade nicht aus PDF-Metadaten ableiten | offen (Phase 2) |
| Elevation | Unbefugter erreicht die interne Upload-Seite | Upload-Seite, Phase 2 | Anmeldung, Rechte minimal, kein öffentlicher Zugang | offen (Phase 2) |
| Repudiation | Unklar, wer welchen Katalog veröffentlicht hat | Storyblok | Storyblok-Versionshistorie; Generator schreibt PDF-Prüfsumme in die Story | offen (Phase 1) |

## 4. Öffentliche Endpoints

Es gibt genau **einen** schreibenden Endpunkt: den Rebuild-Webhook.

- [ ] Signaturprüfung gegen `STORYBLOK_WEBHOOK_SECRET`
- [ ] Entprellung und Begrenzung gleichzeitiger Builds
- [ ] Keine internen Fehlerdetails in der Antwort
- [ ] Nur `POST`, kein Auslösen per Link-Aufruf

## 5. Top-Risiken & Maßnahmen

| Risiko | Wahrscheinlichkeit | Impact | Maßnahme | Verantwortlich |
| --- | --- | --- | --- | --- |
| Management-Token landet im ausgelieferten JavaScript | gering | **sehr hoch** — Vollzugriff auf alle Inhalte | Trennung Generator/Viewer als Paketgrenze; gitleaks; Review-Punkt in der Definition of Done | Armin |
| Ungeschützter Webhook | mittel | mittel — Build-Kosten, keine Datenpreisgabe | Signaturprüfung ab T-023 | Armin |
| Token-Rotation nie durchgeführt | mittel | hoch | Rotationsintervall festlegen, sobald produktiv | Armin |
