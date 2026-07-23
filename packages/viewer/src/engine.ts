/**
 * Die einzige Stelle, die von der Flip-Engine weiß.
 *
 * Zwei Aufgaben:
 *
 *  1. Sie deklariert genau, auf welchen Teil der Engine wir uns stützen. Würde
 *     die Engine je ersetzt, ist diese Datei die gesamte neu zu
 *     implementierende Fläche — nicht der Viewer.
 *
 *  2. Sie hält den fremdbezogenen Code aus unserem Typprogramm heraus. Die
 *     Engine wurde ohne Strict Mode geschrieben (siehe flip-engine/HERKUNFT.md);
 *     sie statisch zu importieren würde den Viewer zwingen, die Strictness
 *     ebenfalls fallenzulassen. Sie über einen berechneten Specifier zu laden
 *     hält unseren Code strict und die Engine nach ihrer eigenen Konfiguration
 *     geprüft.
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
  /** Umschlag und Rückseite werden allein gezeigt, wie bei einem echten Magazin. */
  showCover: boolean;
  /** Erlaubt das Einzelseiten-Layout auf schmalen Bildschirmen. */
  usePortrait: boolean;
  mobileScrollSupport: boolean;
  /** Millisekunden. 0 schaltet die Animation für prefers-reduced-motion ab. */
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
 * Der Pfad wird zur Laufzeit gebaut, damit TypeScript ihm nicht in die
 * fremdbezogenen Quellen folgen kann. Der Browser löst ihn relativ zu diesem
 * Modul auf.
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
