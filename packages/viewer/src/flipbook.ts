/**
 * Phase-0-Viewer. Liest katalog.json und steuert die fremdbezogene Flip-Engine.
 *
 * Drei Dinge, die die Engine nicht tut und die stattdessen hier liegen:
 *   - Tastaturbedienung und ARIA (die Engine registriert nur Maus und Touch)
 *   - Lazy Loading (im HTML-Modus gehören uns die Seitenelemente, also auch das src)
 *   - Erzwingen der Einzelseite bei Querformat-Katalogen
 *
 * Siehe packages/flip-engine/HERKUNFT.md, PATCH 3.
 */
import { ladeEngine } from './engine.ts';
import { sichereAkzentfarbe } from './farbe.ts';
import { HINTERGRUND_NOTNAGEL, bildDarstellung, waehleHintergrund } from './hintergrund.ts';
import type { Katalog } from './katalog-typen.ts';
import { baueAltText } from './textfassung.ts';

/** Seiten beiderseits der aktuellen Doppelseite, deren Bild geladen wird. */
const VORLADEFENSTER = 2;

interface Elemente {
  katalog: HTMLElement;
  buehne: HTMLElement;
  titel: HTMLElement;
  seitenstand: HTMLElement;
  ansage: HTMLElement;
  download: HTMLAnchorElement;
}

/**
 * Wendet den Untergrund an.
 *
 * Das Bild wird geladen, bevor es angewandt wird. Eine fehlende oder kaputte
 * Datei lässt daher das gezeichnete Holz stehen statt einer leeren Bühne — und
 * sagt das in der Konsole, statt still zu scheitern.
 */
async function setzeHintergrund(buehne: HTMLElement, wunsch: string | undefined): Promise<void> {
  const wahl = waehleHintergrund(wunsch);

  buehne.style.removeProperty('background-color');
  buehne.style.removeProperty('background-image');

  if (wahl.art === 'farbe' && wahl.farbe) {
    buehne.dataset['hintergrund'] = wahl.kennung;
    buehne.style.backgroundColor = wahl.farbe;
    return;
  }

  if (wahl.art !== 'bild' || !wahl.bild) {
    buehne.dataset['hintergrund'] = wahl.kennung;
    return;
  }

  // Bis das Bild da ist, steht das gezeichnete Holz — so bleibt die Bühne nie leer.
  buehne.dataset['hintergrund'] = HINTERGRUND_NOTNAGEL;

  const bild = await ladeBild(wahl.bild);
  if (!bild) {
    console.warn(
      `[viewer] Hintergrundbild "${wahl.bild}" nicht ladbar — gezeichnetes Holz bleibt stehen.`,
    );
    return;
  }

  buehne.dataset['hintergrund'] = 'bild';
  buehne.dataset['darstellung'] = bildDarstellung(bild.naturalWidth, bild.naturalHeight);

  // Der Wert kommt aus katalog.json, in Phase 1 aus Storyblok. Anführungs-
  // zeichen und Rückstriche maskieren, damit er die url()-Angabe nicht
  // verlassen kann.
  const sicher = wahl.bild.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`);
  buehne.style.backgroundImage = `url("${sicher}")`;
}

/**
 * Baut das anklickbare Inhaltsverzeichnis.
 *
 * Jeder Eintrag ist ein echter `<button>`, kein gestyltes `<div>` — das gibt
 * Tastaturbedienung, die richtige Screenreader-Rolle und Fokusbehandlung
 * kostenlos.
 *
 * Das Panel bleibt ganz verborgen, wenn der Generator keine Inhaltsseite fand.
 * Ein leerer "Inhalt"-Knopf, der ins Nichts öffnet, ist schlimmer als kein Knopf.
 */
function richteInhaltsverzeichnisEin(katalog: Katalog, springeZu: (index: number) => void): void {
  const knopf = document.getElementById('toc-knopf');
  const panel = document.getElementById('toc');
  const liste = document.getElementById('toc-liste');
  if (!knopf || !panel || !liste) return;

  if (katalog.toc.length === 0) return;

  for (const eintrag of katalog.toc) {
    // Ältere Kataloge kennen `index` noch nicht — dann ist die gedruckte
    // Seitenzahl das Beste, was wir haben.
    const ziel = eintrag.index ?? eintrag.seite;

    const label = document.createElement('span');
    label.className = 'toc-label';
    label.textContent = eintrag.label;

    const seite = document.createElement('span');
    seite.className = 'toc-seite';
    seite.textContent = `Seite ${eintrag.seite}`;

    const knopfEintrag = document.createElement('button');
    knopfEintrag.type = 'button';
    knopfEintrag.className = 'toc-eintrag';
    knopfEintrag.append(label, seite);
    knopfEintrag.addEventListener('click', () => {
      springeZu(ziel);
      schliesse();
    });

    const punkt = document.createElement('li');
    punkt.append(knopfEintrag);
    liste.append(punkt);
  }

  function oeffne(): void {
    panel!.hidden = false;
    knopf!.setAttribute('aria-expanded', 'true');
    liste!.querySelector<HTMLButtonElement>('.toc-eintrag')?.focus();
  }

  function schliesse(zurueckZumKnopf = false): void {
    panel!.hidden = true;
    knopf!.setAttribute('aria-expanded', 'false');
    if (zurueckZumKnopf) knopf!.focus();
  }

  knopf.hidden = false;
  knopf.addEventListener('click', () => {
    if (panel.hidden) oeffne();
    else schliesse(true);
  });

  // Escape schließt und gibt den Fokus zurück — sonst landet er im Nirgendwo.
  panel.addEventListener('keydown', (ereignis: KeyboardEvent) => {
    if (ereignis.key !== 'Escape') return;
    ereignis.preventDefault();
    schliesse(true);
  });

  document.addEventListener('click', (ereignis: MouseEvent) => {
    if (panel.hidden) return;
    const ziel = ereignis.target as Node;
    if (panel.contains(ziel) || knopf.contains(ziel)) return;
    schliesse();
  });
}

function ladeBild(quelle: string): Promise<HTMLImageElement | undefined> {
  return new Promise((fertig) => {
    const bild = new Image();
    bild.addEventListener('load', () => fertig(bild), { once: true });
    bild.addEventListener('error', () => fertig(undefined), { once: true });
    bild.src = quelle;
  });
}

function hole<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} fehlt im HTML`);
  return el as T;
}

function magAnimation(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Blätterdauer in Millisekunden.
 *
 * NICHT 0 bei reduzierter Bewegung: Die Engine weist `flippingTime <= 0` in
 * ihrem Konstruktor mit "Invalid flipping time" zurück, was genau jene Nutzer —
 * die, die die Einstellung schützt — ganz ohne Katalog ließe. 1 ms ist
 * praktisch sofort und besteht die Prüfung.
 */
function blaetterDauer(): number {
  return magAnimation() ? 700 : 1;
}

/**
 * Baut ein Seitenelement je Katalogseite.
 *
 * Das Bild trägt `data-src` statt `src` — nichts wird geladen, bis die Seite
 * ins Vorladefenster gerät. Bei 46 Seiten à ~300 KB ist das der Unterschied
 * zwischen 300 KB und 14 MB beim ersten Paint.
 */
function baueSeiten(katalog: Katalog): HTMLElement[] {
  return katalog.seiten.map((seite) => {
    const element = document.createElement('div');
    element.className = 'seite';
    element.dataset['nr'] = String(seite.nr);

    const bild = document.createElement('img');
    bild.dataset['src'] = `/katalog/${seite.bild}`;
    bild.width = seite.breite;
    bild.height = seite.hoehe;
    bild.alt = baueAltText(seite, katalog.seitenzahl);
    bild.decoding = 'async';

    element.append(bild);
    return element;
  });
}

/** Tauscht data-src einmalig gegen src für alles innerhalb des Fensters. */
function ladeFenster(seiten: HTMLElement[], aktuelleSeite: number): void {
  const von = Math.max(0, aktuelleSeite - VORLADEFENSTER);
  const bis = Math.min(seiten.length - 1, aktuelleSeite + VORLADEFENSTER + 1);

  for (let i = von; i <= bis; i++) {
    const bild = seiten[i]?.querySelector('img');
    const quelle = bild?.dataset['src'];
    if (bild && quelle) {
      bild.src = quelle;
      delete bild.dataset['src'];
    }
  }
}

function beschreibeStand(seite: number, gesamt: number, doppelseite: boolean): string {
  // seite ist der 0-basierte Index der linken Seite in der Engine.
  const erste = seite + 1;
  if (!doppelseite || erste === 1 || erste >= gesamt) return `Seite ${erste} von ${gesamt}`;
  return `Seite ${erste}–${Math.min(erste + 1, gesamt)} von ${gesamt}`;
}

async function start(): Promise<void> {
  const buehne = document.querySelector<HTMLElement>('.buehne');
  if (!buehne) throw new Error('Die Bühne fehlt im HTML');

  const el: Elemente = {
    katalog: hole('katalog'),
    buehne,
    titel: hole('katalog-titel'),
    seitenstand: hole('seitenstand'),
    ansage: hole('ansage'),
    download: hole<HTMLAnchorElement>('download'),
  };

  const antwort = await fetch('/katalog/katalog.json');
  if (!antwort.ok) throw new Error(`katalog.json nicht ladbar (${antwort.status})`);
  const katalog = (await antwort.json()) as Katalog;

  document.title = `${katalog.titel} — Blätterkatalog`;
  el.titel.textContent = katalog.titel;
  el.download.href = `/katalog/${katalog.download_pdf}`;
  document.documentElement.style.setProperty('--akzent', sichereAkzentfarbe(katalog.akzentfarbe));
  // Nicht abgewartet: Der Katalog soll nicht auf das Hintergrundbild warten.
  void setzeHintergrund(el.buehne, katalog.hintergrund);

  const erste = katalog.seiten[0];
  if (!erste) throw new Error('Der Katalog enthält keine Seiten.');

  const seiten = baueSeiten(katalog);
  el.katalog.append(...seiten);
  ladeFenster(seiten, 0);

  /*
   * Querformat-Kataloge dürfen nie eine Doppelseite zeigen. Zwei 16:9-Seiten
   * nebeneinander sind 32:9 — ein Streifen, den kein Bildschirm sinnvoll zeigen
   * kann. Die Engine hat keinen expliziten "nur Einzelseite"-Schalter; sie
   * entscheidet durch Vergleich der Containerbreite mit minWidth * 2. Ein
   * minWidth jenseits jedes realen Viewports lässt diesen Vergleich immer das
   * Einzelseiten-Layout wählen.
   */
  const quer = katalog.ausrichtung === 'quer';
  const minBreite = quer ? 100_000 : 320;

  const PageFlip = await ladeEngine();
  const flip = new PageFlip(el.katalog, {
    width: erste.breite,
    height: erste.hoehe,
    size: 'stretch',
    minWidth: minBreite,
    maxWidth: 2000,
    minHeight: 300,
    maxHeight: 2400,
    showCover: true,
    usePortrait: true,
    mobileScrollSupport: true,
    flippingTime: blaetterDauer(),
    maxShadowOpacity: 0.5,
    drawShadow: true,
    useMouseEvents: true,
    swipeDistance: 30,
    clickEventForward: true,
    disableFlipByClick: false,
    startPage: 0,
    startZIndex: 0,
    autoSize: true,
    showPageCorners: true,
  });

  flip.loadFromHTML(seiten);

  const melde = (): void => {
    const nr = flip.getCurrentPageIndex();
    const doppelseite = flip.getOrientation() === 'landscape';
    const text = beschreibeStand(nr, katalog.seitenzahl, doppelseite);

    el.seitenstand.textContent = text;
    el.ansage.textContent = text;
    ladeFenster(seiten, nr);
  };

  flip.on('flip', melde);
  flip.on('changeOrientation', melde);
  melde();

  richteInhaltsverzeichnisEin(katalog, (index) => {
    flip.turnToPage(index - 1);
    el.katalog.focus();
  });

  // --- Bedienung, die die Engine nicht mitbringt --------------------------

  for (const knopf of document.querySelectorAll<HTMLButtonElement>('.blaettern')) {
    knopf.addEventListener('click', () => {
      if (knopf.dataset['richtung'] === 'vor') flip.flipNext();
      else flip.flipPrev();
      el.katalog.focus();
    });
  }

  el.katalog.addEventListener('keydown', (ereignis: KeyboardEvent) => {
    const aktionen: Record<string, () => void> = {
      ArrowRight: () => flip.flipNext(),
      ArrowDown: () => flip.flipNext(),
      PageDown: () => flip.flipNext(),
      ArrowLeft: () => flip.flipPrev(),
      ArrowUp: () => flip.flipPrev(),
      PageUp: () => flip.flipPrev(),
      Home: () => flip.turnToPage(0),
      End: () => flip.turnToPage(katalog.seitenzahl - 1),
    };

    const aktion = aktionen[ereignis.key];
    if (!aktion) return;

    ereignis.preventDefault();
    aktion();
  });

  // Der Katalog bekommt den Fokus, damit die Pfeiltasten sofort greifen —
  // ohne den Fokus dem Skiplink wegzunehmen, der davor steht.
  if (document.activeElement === document.body) el.katalog.focus();

  // PATCH 1 wirkt nur, wenn destroy() auch aufgerufen wird.
  // Aber NICHT bei event.persisted: Dann legt der Browser die Seite in den
  // Vor-/Zurück-Zwischenspeicher und zeigt sie später unverändert wieder.
  // Ein destroy() dort hinterließe beim Zurückblättern einen leeren Viewer.
  window.addEventListener('pagehide', (ereignis: PageTransitionEvent) => {
    if (!ereignis.persisted) flip.destroy();
  });
}

start().catch((fehler: unknown) => {
  const meldung = fehler instanceof Error ? fehler.message : String(fehler);

  // Elemente bauen statt insertAdjacentHTML: `meldung` kann in Phase 1 aus einer
  // Storyblok/CDN-Antwort stammen; textContent kann keinen Markup einschleusen.
  const box = document.createElement('p');
  box.className = 'fehler';
  box.setAttribute('role', 'alert');
  box.textContent = `Der Katalog konnte nicht geladen werden: ${meldung} `;

  const zurText = document.createElement('a');
  zurText.href = '/text/';
  zurText.textContent = 'Zur Textfassung';
  box.append(zurText);

  document.body.prepend(box);
  console.error(fehler);
});
