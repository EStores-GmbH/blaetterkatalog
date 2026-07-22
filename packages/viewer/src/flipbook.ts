/**
 * Phase 0 viewer. Reads katalog.json and drives the vendored flip engine.
 *
 * Three things the engine does not do, which live here instead:
 *   - keyboard operation and ARIA (the engine registers mouse and touch only)
 *   - lazy loading (we own the page elements in HTML mode, so we own the src)
 *   - single-page enforcement for landscape catalogues
 *
 * See packages/flip-engine/HERKUNFT.md, PATCH 3.
 */
import { ladeEngine } from './engine.ts';
import { HINTERGRUND_NOTNAGEL, bildDarstellung, waehleHintergrund } from './hintergrund.ts';
import type { Katalog } from './katalog-typen.ts';
import { baueAltText } from './textfassung.ts';

/** Pages either side of the current spread that get their image loaded. */
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
 * Applies the backdrop.
 *
 * The image is loaded before it is applied. A missing or broken file therefore
 * leaves the drawn wood in place instead of a blank stage — and says so in the
 * console rather than failing silently.
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
 * Builds one page element per catalogue page.
 *
 * The image carries `data-src` rather than `src` — nothing is fetched until
 * the page comes within the preload window. With 46 pages at ~300 KB that is
 * the difference between 300 KB and 14 MB on first paint.
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

/** Swaps data-src to src for everything inside the window, once. */
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
  // seite is the engine's 0-based index of the left-hand page.
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
  document.documentElement.style.setProperty('--akzent', katalog.akzentfarbe);
  // Nicht abgewartet: Der Katalog soll nicht auf das Hintergrundbild warten.
  void setzeHintergrund(el.buehne, katalog.hintergrund);

  const erste = katalog.seiten[0];
  if (!erste) throw new Error('Der Katalog enthält keine Seiten.');

  const seiten = baueSeiten(katalog);
  el.katalog.append(...seiten);
  ladeFenster(seiten, 0);

  /*
   * Landscape catalogues must never show a spread. Two 16:9 pages side by side
   * are 32:9 — a strip no screen can show usefully. The engine has no explicit
   * "single page only" switch; it decides by comparing the container width
   * against minWidth * 2. Setting minWidth beyond any real viewport makes that
   * comparison always choose the single-page layout.
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
    flippingTime: magAnimation() ? 700 : 0,
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
  window.addEventListener('pagehide', () => flip.destroy(), { once: true });
}

start().catch((fehler: unknown) => {
  const meldung = fehler instanceof Error ? fehler.message : String(fehler);
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<p class="fehler" role="alert">Der Katalog konnte nicht geladen werden: ${meldung}
     <a href="/text/">Zur Textfassung</a></p>`,
  );
  console.error(fehler);
});
