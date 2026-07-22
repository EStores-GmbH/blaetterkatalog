/**
 * Backdrop the book sits on.
 *
 * Kept apart from flipbook.ts on purpose: that module boots the viewer on
 * import and therefore needs a browser. The decision itself is pure and has to
 * be testable without one.
 */

/** Backdrops with a matching rule in flipbook.css. */
export const HINTERGRUND_VORLAGEN = new Set(['holz', 'holz-dunkel', 'grau', 'dunkel']);

export const HINTERGRUND_STANDARD = 'holz';

const HEX = /^#[0-9a-fA-F]{6}$/;

export interface HintergrundWahl {
  /** Value for the data attribute the stylesheet keys off. */
  kennung: string;
  /** Set only for a free hex colour — presets live in the stylesheet. */
  farbe: string | undefined;
}

/**
 * Decides which backdrop to use.
 *
 * Anything unknown — including catalogues generated before the field existed —
 * falls back to wood rather than to a blank stage.
 */
export function waehleHintergrund(wunsch: string | undefined): HintergrundWahl {
  if (wunsch && HEX.test(wunsch)) return { kennung: 'eigen', farbe: wunsch };

  const vorlage = wunsch && HINTERGRUND_VORLAGEN.has(wunsch) ? wunsch : HINTERGRUND_STANDARD;
  return { kennung: vorlage, farbe: undefined };
}
