/**
 * The one place that knows about the flip engine.
 *
 * Two jobs:
 *
 *  1. It declares exactly which part of the engine we depend on. Should the
 *     engine ever be replaced, this file is the whole surface to reimplement —
 *     not the viewer.
 *
 *  2. It keeps the vendored code out of our type program. The engine was
 *     written without strict mode (see flip-engine/HERKUNFT.md); importing it
 *     statically would force the viewer to drop strictness too. Loading it
 *     through a computed specifier keeps our code strict and the engine
 *     checked by its own configuration.
 */

export type EngineAusrichtung = 'portrait' | 'landscape';

export interface FlipEngine {
  loadFromHTML(seiten: HTMLElement[]): void;
  flipNext(): void;
  flipPrev(): void;
  turnToPage(nr: number): void;
  getCurrentPageIndex(): number;
  getOrientation(): EngineAusrichtung;
  on(ereignis: 'flip' | 'changeOrientation', rueckruf: () => void): void;
  destroy(): void;
}

export interface FlipOptionen {
  width: number;
  height: number;
  size: 'fixed' | 'stretch';
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  /** Cover and back cover are shown alone, like a real magazine. */
  showCover: boolean;
  /** Allows the single-page layout on narrow screens. */
  usePortrait: boolean;
  mobileScrollSupport: boolean;
  /** Milliseconds. 0 turns the animation off for prefers-reduced-motion. */
  flippingTime: number;
  maxShadowOpacity: number;
  drawShadow: boolean;
  useMouseEvents: boolean;
  swipeDistance: number;
  clickEventForward: boolean;
  disableFlipByClick: boolean;
  startPage: number;
  startZIndex: number;
  autoSize: boolean;
  showPageCorners: boolean;
}

type EngineKonstruktor = new (behaelter: HTMLElement, optionen: FlipOptionen) => FlipEngine;

/**
 * Path is built at runtime so TypeScript cannot follow it into the vendored
 * sources. The browser resolves it relative to this module.
 */
const ENGINE_PFAD = ['..', '..', 'flip-engine', 'src', 'PageFlip.ts'].join('/');

export async function ladeEngine(): Promise<EngineKonstruktor> {
  const modul: unknown = await import(ENGINE_PFAD);
  const konstruktor = (modul as { PageFlip?: unknown }).PageFlip;

  if (typeof konstruktor !== 'function') {
    throw new Error('Die Blätter-Engine liefert keinen PageFlip-Konstruktor.');
  }

  return konstruktor as EngineKonstruktor;
}
