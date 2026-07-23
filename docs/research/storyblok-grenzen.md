# Recherche: Storyblok-Grenzen

> Erhoben am 22.07.2026 aus der Live-Doku storyblok.com/docs und /pricing.
> Frage: Welche harten Limits brechen den Plan „150 Seitenbilder + PDF + Suchindex je Katalog"?

## Harte Grenzen

| Limit | Wert (22.07.2026) | Quelle |
|---|---|---|
| Management API Rate Limit | **3 req/s** (Starter) · **6 req/s** (Growth+) | /docs/api/management |
| Verhalten bei Überschreitung | HTTP 429; Backoff empfohlen; Header nicht dokumentiert | ebd. |
| Asset-Upload | 3-stufig (signed request → S3 → finish_upload); **kein Bulk-Upload** | /docs/api/management/assets |
| Max. Upload-Größe | 500 MB (Starter) · 1 GB (Growth) · 5 GB (Premium+) | /pricing/technical-limits |
| **Max. Story-JSON** | **5 MB** — alle Pläne | /pricing/technical-limits |
| Auflösbare Relations/Request | **50** (dann nur `rel_uuids`) | /docs/api/content-delivery/v2 |
| Stories pro Space | 20.000 / 25.000 / 100.000+ | /pricing/technical-limits |
| **Assets pro Space (Hard Cap)** | **2.000** (Starter) · **2.500** (Growth) · unbegrenzt ab Growth Plus (10.000 inkl., +5 $/Mon./10k) | /pricing/technical-limits |
| **Traffic/Monat** | 0,1 TB (Starter, **kein Zukauf**) · 0,4 TB (Growth) · 1 TB (Growth Plus); Zukauf 75 $/250 GB | /pricing |
| Was zählt als Traffic | Asset-Auslieferung UND API-Responses | /docs/manuals/space-dashboard |
| **Erlaubte Asset-MIME-Types** | Bilder, PDF, `text/plain`, docx — **`application/json` NICHT**; unverifizierte Spaces nur `image/*` | /docs/concepts/assets |
| Image Service max. Auflösung | **4.000 × 4.000 px** | /pricing/technical-limits |
| Image Service Formate | WebP (Accept), AVIF explizit (außer China); nur Bild-MIME | /docs/api/image-service |
| CDA Rate Limits | cached 1.000/s · uncached Single 50/s · Listing 75–100 = 6/s | /docs/api/content-delivery/v2 |
| Public vs. Preview Token | Public = nur published, „für Production-Frontends"; Preview = draft, **nicht in den Browser** | /docs/concepts/access-tokens |
| `cv` (Cache-Version) | space-weiter Timestamp, ändert sich bei **jedem** Publish | /docs/concepts/caching |
| Asset-CDN/CORS | EU `a.storyblok.com`/`a2.storyblok.com`; für CORS **`a2` nutzen** | /docs/concepts/assets |

**Realistische Upload-Dauer für 150 Assets:** 150 MAPI-Calls ≈ 25 s (6/s) bis
50 s (3/s); real 2–8 Minuten, dominiert vom Upstream (60 MB Bilder + PDF).

## Risiken für den Plan

1. **Asset-Hard-Cap — BLOCKIEREND.** 2.000/2.500 sind Obergrenzen, kein Kontingent.
   Starter kann nicht zukaufen. Nach ~13–16 Katalogen endgültig voll.
   → **Growth Plus** einplanen oder Bilder außerhalb Storyblok hosten (R2/S3).
2. **Traffic durch das PDF — ERNST bis BLOCKIEREND.** 100-MB-PDF: Starter 0,1 TB =
   ~1.000 Downloads/Monat, kein Zukauf. → PDF nicht über Storyblok ausliefern.
3. **`application/json` kein Asset-Type — ERNST.** Der Ausweichplan „Suchindex als
   JSON-Asset" scheitert. → Suchindex als statische Datei neben dem Astro-Build.
4. **Suchindex in der Story — GERING fürs 5-MB-Limit, ERNST für Performance.**
   Passt (0,4–0,9 MB), wird aber bei jedem Request mitausgeliefert. → auslagern.
5. **Client-seitiges Fetchen — ERNST.** Public Token exponiert den **gesamten**
   veröffentlichten Space, nicht nur den Katalog; uncached 50/s vs. cached 1.000/s.
   → SSG statt Laufzeit-Fetch.
6. **Image Service 4.000-px-Deckel — ERNST.** A4-Doppelseite @300 dpi = 4.961 px.
   → Einzelseiten rendern, längste Kante ≤ 4.000 px.
7. **Astro SSR vs. SSG — GERING.** Offizieller Guide: `output: "server"`, Token
   serverseitig. → SSG + Rebuild-Webhook.

## Empfohlene Datenstruktur

- **Story `katalog` schlank** (< 150 KB): titel, slug, akzentfarbe, cover,
  seitenzahl, seiten[] (Asset oder kompaktes JSON-Textarea), toc[] (nur Kapitel),
  download_pdf (URL), suchindex_url (URL).
- **Suchindex raus aus der Story** — statische Datei, lazy beim Öffnen der Suche.
- **PDF nicht als Storyblok-Asset ausliefern** — Traffic-Engpass.
- **Nicht in 150 Einzel-Stories splitten** — scheitert am 50er-Relations-Limit.
- **Seitenbilder als Assets ok — sofern Plan ≥ Growth Plus.** Auslieferung über
  `a2.storyblok.com` + `/m/<breite>x0/filters:quality(75)`, längste Kante ≤ 4.000 px.

## Ausdrücklich widerlegte Annahmen des Briefs

1. „Suchindex als JSON-Asset" → `application/json` nicht auf der Whitelist.
2. „150 Assets/Katalog, mehrere/Jahr" → harter Deckel nach ~13–16 Katalogen (Starter/Growth).
3. „Bulk-Upload" → existiert nicht.
4. „Bilder über Image Service /m/" → nur Bild-MIME, nur bis 4.000 px; PDF nicht.
5. „Katalog-Story inkl. Suchindex unproblematisch" → 5-MB-Limit hält, aber Traffic/LCP-Last.
6. „Frontend liest zur Laufzeit clientseitig" → offizieller Guide macht es serverseitig.
7. „MAPI-Limit pro Space" → dokumentiert ist **pro Plan** (3/6 req/s).
8. „100-MB-PDF als Asset" → Upload erlaubt, **Auslieferung** ist der Engpass.

**Nicht dokumentiert (nicht geschätzt):** Verhalten bei 5-MB-Überschreitung ·
max. Bloks-Einträge · Rate-Limit-Header · ob S3-POST gegens MAPI-Limit zählt ·
ob gecachte CDA-Responses gegens API-Kontingent zählen · Verhalten bei
Traffic-Überschreitung · Abrechnung pro Image-Transformation.

## Quellen

storyblok.com/pricing/technical-limits · /pricing · /docs/api/management(/assets) ·
/docs/api/content-delivery/v2 · /docs/concepts/{assets,access-tokens,caching,fields} ·
/docs/api/image-service · /docs/guides/astro · /docs/manuals/space-dashboard
(Doku-Seiten sind unter `<url>.md` als Markdown abrufbar.)
