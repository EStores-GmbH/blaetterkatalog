# Compliance: Blätterkatalog

> Profil: **headless-cms-site** — öffentliche Website mit Headless-CMS.
> Quelle: Skills `accessibility`, `seo-performance`, `headless-cms` (estores-web)
> und `security` (estores-core). Cookie-/Consent-Pflichten unten.

**Profil:** headless-cms-site
**Verarbeitet Personendaten:** teilweise (Cookies / Analytics — keine Nutzer-Accounts)
**Letztes Audit:** —

---

## 1. Datenschutz / Cookies (leicht)

Kein Account-System, keine Speicherung von Nutzerprofilen geplant. Relevanz:
Consent vor nicht-essenziellen Cookies/Tracking, Impressum, Datenschutzerklärung.

### Auftragsverarbeiter (Art. 28) — sobald gewählt

| Dienst | Zweck | Hosting-Region | AVV vorhanden | Drittland-Grundlage |
|---|---|---|---|---|
| [CMS, z.B. Storyblok] | Inhalte | | ☐ | |
| [Hosting] | Auslieferung | | ☐ | |
| [Analytics, falls ja] | Reichweite | | ☐ | |

### Checkliste

- [ ] Consent vor nicht-essenziellem Tracking (Opt-in, widerrufbar, Nachweis)
- [ ] Cookie-Banner / Consent-Management korrekt (falls Tracking)
- [ ] Keine PII in Logs / URLs / Analytics-Events
- [ ] Impressum vorhanden
- [ ] Datenschutzerklärung vorhanden + aktuell
- [ ] AVV mit CMS-/Hosting-Anbietern dokumentiert

> Volle DSGVO-Account-Checkliste (Auskunft, Löschung, Art. 30) greift erst bei
> Nutzer-Accounts oder speichernden Formularen — dann Profil auf `public-app-pii` prüfen.

## 2. Barrierefreiheit / BFSG  (Pflicht — öffentliche Website)

- [ ] Semantik: Heading-Struktur, Landmarks, echte Buttons/Links
- [ ] Komplett per Tastatur bedienbar, Fokus sichtbar, keine Traps
- [ ] Alt-Texte; Kontrast ≥ 4.5:1; nicht nur über Farbe informieren
- [ ] Formular-Labels + Fehler programmatisch verknüpft (falls Formulare)
- [ ] axe/pa11y/Lighthouse-a11y in CI grün
- [ ] Manueller Tastatur- + Screenreader-Stichproben-Durchlauf
- [ ] Blätterkatalog-UI: Seitenwechsel, Zoom, Suche per Tastatur erreichbar
- [ ] **HTML-Textfassung je Katalogseite** als „Conforming Alternate Version" (T-020)
- [ ] Link zur Textfassung als **erster fokussierbarer Inhalt** im Viewer (T-021)
- [ ] **Erklärung zur Barrierefreiheit nach § 14 BFSG** veröffentlicht und verlinkt (T-024)
- [ ] Kein `user-scalable=no` — Pinch-Zoom muss funktionieren (WCAG 1.4.4)

> **Zielnorm: WCAG 2.2 AA** (nicht 2.1) — Begründung in `decisions/log.md`.
> Besonders einschlägig: 2.5.7 Dragging Movements (Blättern darf nicht nur per Ziehen gehen),
> 2.4.11 Focus Not Obscured, 2.5.8 Target Size (24 px).
>
> **Geltung noch ungeklärt:** Der Shop gilt intern als B2B, der Ausschluss steht aber nur in den
> AGB — das trägt nach derzeitigem Stand nicht. Bis zur rechtlichen Klärung (T-001) wird das
> BFSG als geltend angenommen. Ein bildbasierter Katalog ohne Textfassung ist nicht
> konformitätsfähig; automatisierte Tests decken nur rund 30 % der Kriterien ab.

## 3. Security  (alle Profile — siehe Skill `security`)

- [ ] Input-Validierung an allen Eingängen (CMS-Webhooks, Preview-Tokens, Forms)
- [ ] Preview/Draft-Routen nur mit Token / Auth
- [ ] Security-Header + CORS korrekt
- [ ] Secrets nur in Env, Rotation geplant (CMS-Token, Webhook-Secrets)
- [ ] Dependency-Audit grün (CI)
- [ ] Secret-Scan grün (CI)

## 4. SEO / Performance  (Pflicht — Web-Profil)

- [ ] Meta/OG/Canonical je Seite, robots.txt + sitemap.xml
- [ ] Core Web Vitals in Budget (LCP/INP/CLS) — Katalog-Assets (PDF/Bilder) budgetieren
- [ ] Strukturierte Daten (JSON-LD) valide, wo sinnvoll
- [ ] CMS-Bilder: Größen, Formate (AVIF/WebP), lazy loading

## 5. Headless-CMS

- [ ] Content-Modell dokumentiert (`docs/ARCHITECTURE.md`)
- [ ] Preview / Draft vs. Published getrennt
- [ ] Revalidation / Webhook bei Publish
- [ ] Redakteurs-Rechte und Token-Scopes minimal
