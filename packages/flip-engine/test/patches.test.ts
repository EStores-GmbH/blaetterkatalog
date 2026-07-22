/**
 * Guards for our patches against the vendored StPageFlip fork.
 *
 * These do not test the upstream engine — they test that the three defects
 * documented in HERKUNFT.md stay fixed. If a future upstream comparison
 * reintroduces one, these fail loudly.
 *
 * The engine targets the browser, so the few globals it touches are stubbed.
 */
import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

interface RafFenster {
  requestAnimationFrame: (cb: (t: number) => void) => number;
  cancelAnimationFrame: (id: number) => void;
  window: { navigator: { userAgent: string } };
  Image: unknown;
}

const g = globalThis as unknown as RafFenster;

let geplanteFrames: Map<number, (t: number) => void>;
let naechsteId: number;
let abgebrocheneFrames: number;

/** Minimal stand-in for the browser's Image, with controllable outcome. */
class BildAttrappe {
  public src = '';
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;
}

/** Only the surface these tests touch — Render's constructor is protected. */
interface RenderUnterTest {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

type RenderKlasse = new (app: unknown, setting: unknown) => RenderUnterTest;

interface SeiteUnterTest {
  load(): void;
  hasLoadFailed(): boolean;
}

type ImagePageKlasse = new (render: unknown, href: string, density: string) => SeiteUnterTest;

// Loaded lazily: the upstream module graph is circular, so the package entry
// point has to be imported first. See HERKUNFT.md.
let Render: RenderKlasse;
let ImagePage: ImagePageKlasse;
let PageDensity: { SOFT: string; HARD: string };

before(async () => {
  g.requestAnimationFrame = (cb) => {
    const id = ++naechsteId;
    geplanteFrames.set(id, cb);
    return id;
  };
  g.cancelAnimationFrame = (id) => {
    if (geplanteFrames.delete(id)) abgebrocheneFrames++;
  };
  g.window = { navigator: { userAgent: 'node' } };
  g.Image = BildAttrappe;

  geplanteFrames = new Map();
  naechsteId = 0;
  abgebrocheneFrames = 0;

  await import('../src/PageFlip.ts');
  Render = (await import('../src/Render/Render.ts')).Render as unknown as RenderKlasse;
  ImagePage = (await import('../src/Page/ImagePage.ts')).ImagePage as unknown as ImagePageKlasse;
  PageDensity = (await import('../src/Page/Page.ts')).PageDensity;
});

beforeEach(() => {
  geplanteFrames = new Map();
  naechsteId = 0;
  abgebrocheneFrames = 0;
});

function baueRender(): RenderUnterTest {
  const app = {
    updateOrientation: (): void => undefined,
    getSettings: (): { usePortrait: boolean } => ({ usePortrait: true }),
  };
  const setting = { width: 100, height: 100, size: 'fixed', minWidth: 0, maxWidth: 1000 };

  // Render is abstract; fill in only what start()/update() actually call.
  class TestRender extends Render {
    protected drawFrame(): void {}
    public reload(): void {}
    public getBlockWidth(): number {
      return 200;
    }
    public getBlockHeight(): number {
      return 200;
    }
    public convertToBook(p: unknown): unknown {
      return p;
    }
    public convertToPage(p: unknown): unknown {
      return p;
    }
    public convertToGlobal(p: unknown): unknown {
      return p;
    }
    public convertRectToGlobal(r: unknown): unknown {
      return r;
    }
  }

  return new TestRender(app, setting);
}

describe('PATCH 1 — Animationsschleife anhaltbar', () => {
  test('start() plant einen Frame ein', () => {
    const render = baueRender();
    render.start();
    assert.equal(render.isRunning(), true);
    assert.equal(geplanteFrames.size, 1);
  });

  test('stop() bricht den geplanten Frame ab', () => {
    const render = baueRender();
    render.start();
    render.stop();
    assert.equal(render.isRunning(), false);
    assert.equal(abgebrocheneFrames, 1);
  });

  test('die Schleife plant sich nach stop() nicht neu ein', () => {
    const render = baueRender();
    render.start();

    const laufenderFrame = [...geplanteFrames.values()][0];
    assert.ok(laufenderFrame, 'kein Frame eingeplant');

    render.stop();
    geplanteFrames.clear();

    // Genau der Fall aus dem Original: ein bereits laufender Frame feuert nach
    // dem Aufräumen. Er darf sich nicht erneut einplanen.
    laufenderFrame(16);
    assert.equal(geplanteFrames.size, 0, 'Schleife hat sich neu eingeplant');
  });

  test('stop() mehrfach aufzurufen ist unschädlich', () => {
    const render = baueRender();
    render.start();
    render.stop();
    render.stop();
    assert.equal(abgebrocheneFrames, 1);
    assert.equal(render.isRunning(), false);
  });

  test('stop() ohne vorheriges start() wirft nicht', () => {
    const render = baueRender();
    assert.doesNotThrow(() => render.stop());
  });
});

describe('PATCH 2 — fehlendes Seitenbild', () => {
  test('ein Ladefehler beendet den Ladezustand statt endlos zu drehen', () => {
    const render = baueRender();
    const seite = new ImagePage(render, '/gibt-es-nicht.jpg', PageDensity.SOFT);
    seite.load();

    const bild = (seite as unknown as { image: BildAttrappe }).image;
    assert.ok(bild.onerror, 'kein onerror-Handler gesetzt');

    bild.onerror();
    assert.equal(seite.hasLoadFailed(), true);
  });

  test('der Erfolgsfall bleibt unverändert', () => {
    const render = baueRender();
    const seite = new ImagePage(render, '/seite-1.jpg', PageDensity.SOFT);
    seite.load();

    const bild = (seite as unknown as { image: BildAttrappe }).image;
    bild.onload?.();
    assert.equal(seite.hasLoadFailed(), false);
  });
});
