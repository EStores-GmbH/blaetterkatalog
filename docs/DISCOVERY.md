# Discovery: Blätterkatalog

> Ausgefüllt am 2026-07-22 im Gespräch mit Armin.
> Die technischen Entscheidungen waren zu diesem Zeitpunkt bereits getroffen
> (siehe `decisions/log.md`) — dieses Dokument hält Zweck und Erfolgsmaßstab nach.

---

## Problem-Statement

Die Redaktion verliert bei jeder Katalog-Veröffentlichung Zeit mit einer Kette manueller
Schritte — PDF durch ein kommerzielles Desktop-Werkzeug schicken, das Ergebnis hochladen,
irgendwo einbetten, Links pflegen. Der Blätterkatalog-Generator soll aus dem fertigen PDF
in einem Durchgang einen veröffentlichten, gestalterisch passenden und barrierefreien
Online-Katalog machen.

## Zielgruppe

- **Primär:** Redaktion / Marketing — sie veröffentlichen die Kataloge. Sie sind **keine
  Entwickler**; das Werkzeug muss ohne Kommandozeile bedienbar sein, um seinen Zweck zu
  erfüllen.
- **Sekundär:** Website-Besucher, die im Katalog blättern, suchen und das PDF herunterladen.
  Darunter Menschen, die auf Tastaturbedienung oder einen Screenreader angewiesen sind.
- **Technisch:** Armin (Entwicklung und Betrieb, mit Claude Code).

## Kern-Features (MVP)

1. **Aus PDF wird ein Blätterkatalog** — Seiten werden gerendert, Text extrahiert, alles
   automatisch in Storyblok veröffentlicht und im Astro-Frontend als Block platzierbar.
2. **Im Katalog navigieren** — Blättern per Maus, Finger und Tastatur, Inhaltsverzeichnis
   mit Seitensprung, Volltextsuche mit Sprung zum Treffer, PDF-Download.
3. **HTML-Textfassung je Seite** — gleichwertige Textversion des Katalogs. Grundlage für
   Barrierefreiheit und Google-Indexierung gleichermaßen.

## Out of Scope (MVP)

- Zoom/Lupe, Thumbnail-Leiste, Teilen-Links je Seite
- Produkt-Hotspots mit Verlinkung in Shop und Warenkorb
- Aufruf-Statistik
- Trefferhervorhebung im Seitenbild
- Mehrsprachige Kataloge
- Getaggtes, barrierefreies Download-PDF (stattdessen gilt die HTML-Textfassung als
  offizielle barrierefreie Fassung — siehe Projektbrief Abschnitt 8, Frage 7)

## Erfolgs-Kriterien

**Das eine Kriterium, an dem sich das Projekt messen lässt: Die Redaktion spart Zeit.**

- **Leitgröße:** Zeit vom fertigen PDF bis zum veröffentlichten Katalog.
  Heute: mehrere manuelle Schritte über Desktop-Werkzeug, Upload und Einbettung.
  Ziel: ein Vorgang ohne Entwicklerbeteiligung.
- **Bedingung dafür:** Die Redaktion muss den Vorgang **selbst** auslösen können. Ein
  Kommandozeilen-Befehl erfüllt das Kriterium nicht — siehe „Spannungsfeld" unten.
- Nachgeordnet, aber ausdrücklich **nicht** als Erfolgsmaßstab benannt: eingesparte
  Lizenzkosten, Sichtbarkeit bei Google, Rechtssicherheit. Diese Punkte werden mitgenommen,
  entscheiden aber nicht über Erfolg oder Misserfolg.

## Constraints

- **Budget:** nicht beziffert. Laufende Kosten bleiben gering: Storyblok besteht bereits
  (Growth Plus), Poppler ist kostenlos, es kommt keine Datenbank hinzu.
- **Timeline:** erste produktive Fassung in **2–3 Monaten** (ab 2026-07-22, also bis etwa
  Ende September / Mitte Oktober 2026).
- **Team:** Armin entwickelt und betreibt. Redaktion und Marketing nutzen das Ergebnis,
  entwickeln aber nicht mit. → Bedienanleitung ist Liefergegenstand, keine Kür.
- **Technisch:**
  - Storyblok ist gesetzt (Bestandssystem, Tarif Growth Plus)
  - Astro als Frontend
  - **Gemischte Seitenformate:** A4-Hochformat *und* Querformat/Präsentationen (16:9).
    Der Generator liest das Format aus dem PDF; der Viewer richtet sich danach.
  - BFSG wird als geltend angenommen, bis rechtlich geklärt (T-001)

## Spannungsfeld — bewusst festgehalten

Das Erfolgskriterium ist **Zeitersparnis für die Redaktion**. Der Phasenplan stellt die
Upload-Oberfläche aber ans Ende (Phase 2). Solange es nur den Kommandozeilen-Befehl gibt,
läuft jede Veröffentlichung weiterhin über Armin — die Redaktion spart dann **keine Zeit**,
sie delegiert sie nur.

**Konsequenz:** Phase 2 ist nicht optional und nicht „später". Sie ist der Punkt, an dem
das Projekt sein Ziel überhaupt erreicht. Das ist in der Roadmap entsprechend vermerkt.

## Offene Fragen

- [ ] Ist der Shop rechtlich belastbar rein B2B? Entscheidet über den BFSG-Pflichtumfang.
      — Verantwortlich: Armin / Rechtsberatung — siehe `docs/BACKLOG.md` T-001
- [ ] Wie viele Kataloge pro Jahr? Bestimmt, wie sehr Phase 2 drängt und wann die
      Storyblok-Assetgrenze relevant wird. — Verantwortlich: Armin
- [ ] Download: Original-PDF oder web-optimiert? — Verantwortlich: Armin
- [ ] Wer aus der Redaktion testet die Upload-Oberfläche vor dem Rollout?
      — Verantwortlich: Armin
