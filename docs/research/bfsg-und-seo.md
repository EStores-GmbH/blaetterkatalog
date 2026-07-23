# Recherche: BFSG (Barrierefreiheit) und SEO

> Erhoben am 22.07.2026. Frage: Gilt das BFSG für den Katalog, und wie wird ein
> bildbasierter Blätterkatalog konform bzw. bei Google auffindbar?
>
> **Kein Rechtsrat.** Markiert, wo die Rechtslage unklar oder strittig ist.

## BFSG — gilt es für uns?

**Kurz: Ja, mit hoher Wahrscheinlichkeit — es sei denn, der Shop ist nachweisbar rein B2B.**

1. **Scharf seit 28.06.2025, ohne Übergangsfrist** für Websites/Dienstleistungen.
   Die Übergangsregel § 38 (bis 2030) betrifft nur *Produkte*/Altverträge; ein 2026
   neu gebauter Viewer fällt nicht darunter.
2. **Erfasste Kategorie:** „Dienstleistung im elektronischen Geschäftsverkehr"
   (§ 2 Nr. 26) — digitale Dienste für **Verbraucherverträge**.
3. **Einziger Ausweg: reines B2B.** Bundesfachstelle + Noerr: reine B2B-Shops fallen
   nicht darunter. Aber Mischangebote fallen darunter, sobald Verbraucher Verträge
   schließen können. Ein AGB-Hinweis reicht nicht — nötig sind wirksame technische
   Vorkehrungen. → **entscheidende Vorfrage (T-001).**
4. **Kleinstunternehmen-Ausnahme** (§ 3 Abs. 3: < 10 MA UND ≤ 2 Mio. €) greift nicht.
5. **Archiv-Ausnahme** greift nicht: Überführung eines Alt-PDFs in einen neuen Viewer
   ist Neu-Veröffentlichung.

**Strittig (als Risiko führen):** Ob die *gesamte* Website oder nur der Bestellprozess
barrierefrei sein muss — Bundesfachstelle/Noerr (ganze Website) contra HÄRTING (nur
vertragsrelevante Teile). Für einen Produktkatalog praktisch unerheblich, da
Kaufanbahnung; mit Produkt-Hotspots (Phase 3) unstreitig erfasst.

**Durchsetzung:** MLBF (Magdeburg, ~70 MA), aktive Kontrollphase seit 29.01.2026,
reaktiv mit Fokus auf reichweitenstarke Angebote. Prüfmaßstab **WCAG 2.1 AA**.
Bußgeldrahmen § 37: bis 10.000 € / 100.000 €. Öffentliche Einzelbußgelder bislang
nicht bekannt. Ob BFSG Marktverhaltensregel (§ 3a UWG) ist, hat **kein Gericht
entschieden** — erste Urteile H2/2026 erwartet. EU-Kommission: begründete
Stellungnahme gegen DE (März 2026) → Nachschärfung wahrscheinlich.

## Anforderungen

**Norm heute:** EN 301 549 V3.2.1 → WCAG 2.1 AA. **Empfehlung: gegen WCAG 2.2 AA
bauen** (abwärtskompatibel, V4.1.1 mit 2.2 ca. Okt. 2026 erwartet). Die neuen 2.2-
Kriterien treffen einen Flip-Viewer ins Mark:

- **2.5.7 Dragging Movements** — Blättern muss auch per Klick/Tastatur gehen.
- **2.4.11 Focus Not Obscured** — Fokus nicht unter Sticky-Toolbar/Cookie-Banner.
- **2.5.8 Target Size (24×24 px)** — Buttons, Thumbnails, TOC-Einträge.

**Viewer-Chrome:** 2.1.1 Tastatur, 2.1.2 keine Falle, 2.4.3/2.4.7 Fokus, 4.1.2/4.1.3
Name/Rolle/Status (aria-live), 1.4.3/1.4.11 Kontrast, 1.4.4 Zoom 200 %, 1.4.10 Reflow,
2.2.2/2.3.1 Animation pausierbar, `prefers-reduced-motion`.

**Katalog-Inhalt (der harte Teil):**

- **1.4.5 Images of Text** — Text-in-Bildern verboten; Ausnahmen (customizable/
  essential) greifen bei Katalogseiten nicht.
- **1.1.1 Textalternativen** — 150 Seiten; ein `alt` ist das falsche Werkzeug.
- 1.3.1/1.3.2 Info/Reihenfolge — im Bild nicht vorhanden.

**Download-PDF:** EN 301 549 Kap. 10 (getaggt, Lesereihenfolge, Alt-Texte) — ein
Print-PDF erfüllt das praktisch nie.

**Formalpflicht § 14 + Anlage 3:** Eine **Barrierefreiheitserklärung** ist Pflicht,
barrierefrei zugänglich, mit Erfüllungsgrad. Häufigster automatisiert prüfbarer
Verstoß und häufigster Abmahn-/Bußgeldanlass. → T-024.

## Ist ein Flipbook konform möglich?

**Nur-mit-X.** Ein reiner Bild-Flipbook ist nicht konformitätsfähig (verletzt 1.4.5/
1.1.1 unheilbar) — **mit einer vollwertigen HTML-Textalternative aber schon.**

**Der belegte Weg: „Conforming Alternate Version" (WCAG-Konformitätsanforderung 1).**
Bedingungen (W3C, wörtlich):

1. erfüllt selbst voll AA;
2. bietet **alle** gleiche Information UND Funktionalität (also auch Suche, TOC, Download);
3. ist **so aktuell** wie das Original (aus derselben Pipeline);
4. erreichbar über einen zugänglichen Mechanismus (echter Link **am Anfang** der Tab-Reihenfolge).

**Fallstrick:** Konformitätsanforderung 5 (Non-Interference) gilt für den Flip-Viewer
**weiter** — er darf trotz Alternative keine Tastaturfalle sein, keine
unkontrollierbare Animation haben, 2.3.1 einhalten.

**Getaggtes PDF allein reicht NICHT** als Alternative (Print-PDF nicht getaggt;
Funktionen fehlen). Als *zusätzliches* Angebot sinnvoll.

**Was die Anbieter machen — alle über eine parallele Textebene:** Flipsnack
(„clean text view"), FlippingBook (HTML-Seite je Katalogseite, VPAT), DCatalog
(„partially"), 1000°ePaper (nur ARIA, keine Textansicht — erfüllt 1.4.5 NICHT).
**Kein Produkt bekommt einen Bild-Flipbook ohne parallele Textebene konform.**

**Urteile/Beanstandungen zu Flipbooks: keine.** Rechtslage unerprobt, WCAG-Analyse
aber eindeutig. Flipbooks gelten in der DE-Fachliteratur als Lehrbuchbeispiel für Barrieren.

## SEO

- **Text in Bildern wird von Google nicht als Seiteninhalt indexiert.** Auf OCR
  (Lens/Vision) für die Websuche zu setzen ist Spekulation.
- **Anbieter lösen es über extrahierte Textebene:** Publitas („Googlebot-friendly
  version"), FlippingBook (HTML-Seite je Seite). Issuu/Yumpu: auf fremder Domain —
  SEO-Wert landet dort, nicht bei uns.

**Empfohlenes Muster — eine echte HTML-Seite je Katalogseite, die zugleich die
WCAG-Alternativversion ist:**

```text
/kataloge/                → Übersicht (CollectionPage + ItemList)
/kataloge/<slug>/         → Viewer + Link „Textversion"
/kataloge/<slug>/text/    → Gesamttext („View All")
/kataloge/<slug>/seite-N/ → Einzelseite: HTML-Text + Bild + Link in den Viewer
```

- Self-referencing Canonical je Seite (**nicht** auf die Übersicht kanonisieren).
- Sequenzielle `<a>`-Links vor/zurück; alle URLs in `sitemap.xml`.
- `BreadcrumbList` + `CollectionPage`/`ItemList`; **kein `Product`-Schema** (nicht kaufbar).
- Größter Hebel: interne Verlinkung aus dem Katalog in bestehende Shop-Produktseiten.
- Download-PDF: `Link: <…>; rel="canonical"` als HTTP-Header auf die PDF-Auslieferung.

**Zu vermeiden:** Bot-Sniffing/Conditional Serving (**Cloaking**), `opacity:0`/
`font-size:0`/Off-Screen als SEO-Textträger (**Hidden Text**), weißer Text auf weiß.
Legitim: Accordion/Tab, „nur für Screenreader" sichtbarer Text. Der unsichtbare
Textlayer für Treffer-Highlight (Phase 3) ist als UX-Feature erlaubt, **nicht** als
SEO- oder a11y-Lösung.

## Core Web Vitals bei 150 großen Bildern

- LCP-Bild: `fetchpriority="high"`, `loading="eager"`, `preload` — nie lazy.
- Rest `loading="lazy"`, Vorladefenster ±2. Image Service mit expliziten Breiten, AVIF/WebP, q75–80.
- Suchindex + Bundle nicht in den kritischen Pfad; Suche im Web Worker; INP < 200 ms.
- CLS 0: `width`/`height`/`aspect-ratio` an jedes `<img>`, Container-Höhe vor Hydration reservieren.

## Konsequenzen für die Architektur (umgesetzt/geplant)

1. Vorfrage B2B klären, sonst BFSG annehmen (T-001).
2. Generator produziert **strukturierten Seitentext** als gleichrangiges Artefakt (`text_html`).
3. Eine HTML-Route je Seite (Phase 1, T-020) — Alternativversion UND SEO-Träger.
4. Link zur Textversion als erster fokussierbarer Inhalt (umgesetzt).
5. Erste Doppelseite serverseitig (Progressive Enhancement, LCP).
6. Suche im Web Worker, Index lazy (T-015).
7. Bildbudget hart; CLS 0.
8. Engine tastaturfähig, kein `user-scalable=no` (umgesetzt), 2.5.7/2.5.8/2.4.11.
9. Download-PDF: HTML-Textversion als offizielle barrierefreie Fassung deklarieren (T-007-Frage).
10. Barrierefreiheitserklärung § 14 als Pflicht-Liefergegenstand (T-024).
11. Gegen WCAG 2.2 AA bauen; axe/pa11y grün auf den Textrouten + manueller NVDA-Durchlauf.
12. Kein Bot-Sniffing, keine `opacity:0`-Textebene als SEO-Instrument.

## Wo die Lage unklar/strittig ist

1. Umfang der Pflicht (ganze Website vs. Vertragsprozess) — ungeklärt.
2. Formale Vermutungswirkung der EN 301 549 unter der EAA — noch nicht im Amtsblatt zitiert.
3. BFSG als § 3a UWG — kein Gericht entschieden, Abmahnungen oft angreifbar.
4. Archiv-Ausnahme bei Migration von Alt-Katalogen — keine Rechtsprechung.
5. Flipbooks speziell — keine Urteile/Beanstandungen.
6. Nachschärfung 2026/27 wahrscheinlich → gegen WCAG 2.2 AA bauen ist die robusteste Wette.

## Quellen (Auswahl)

gesetze-im-internet.de/bfsg (§§ 1/14/38) · bfsg-gesetz.de/anlage-3 ·
bundesfachstelle-barrierefreiheit.de (FAQ elektr. Geschäftsverkehr) ·
noerr.com · haerting.de · ms.sachsen-anhalt.de (MLBF) · axes4.com (Juni 2026) ·
w3.org/WAI/WCAG22/Understanding/{conformance,images-of-text} · EN 301 549 Kap. 10 ·
developers.google.com/search (Image SEO, Spam Policies, Pagination) ·
support.publitas.com · flippingbook.com/help · flipsnack.com · docs.astro.build/en/guides/images
