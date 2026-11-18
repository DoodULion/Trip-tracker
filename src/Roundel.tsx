import type { CSSProperties } from 'react';
import type { Category } from './calc';

/** Color and letter code for each category. Fixed for every trip. */
const BUILT_IN_CODE: Record<string, string> = {
  Food: 'F',
  Shopping: 'S',
  Suica: 'IC',
  Activities: 'A',
  Transportation: 'T',
  Misc: 'M',
};

const BUILT_IN_COLOR: Record<string, string> = {
  Food: 'var(--cat-food)',
  Shopping: 'var(--cat-shopping)',
  Suica: 'var(--cat-suica)',
  Activities: 'var(--cat-activities)',
  Transportation: 'var(--cat-transport)',
  Misc: 'var(--cat-misc)',
};

/** Six extra tile colors for the owner's own categories, picked by name so a category always keeps its color. */
const EXTRA_COLORS = ['var(--cat-x1)', 'var(--cat-x2)', 'var(--cat-x3)', 'var(--cat-x4)', 'var(--cat-x5)', 'var(--cat-x6)'];

function hash(s: string): number {
  let h = 0;
  for (const ch of s.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Tile color for a category: fixed for the built-ins, stable per name for the owner's own. */
export function categoryColor(c: Category): string {
  return BUILT_IN_COLOR[c] ?? EXTRA_COLORS[hash(c) % EXTRA_COLORS.length];
}

/** Letter code: fixed for the built-ins; the first letter otherwise (two when the first is a built-in's code). */
export function categoryCode(c: Category): string {
  if (BUILT_IN_CODE[c]) return BUILT_IN_CODE[c];
  const letters = c.replace(/[^\p{L}\p{N}]/gu, '');
  const one = (letters[0] ?? '?').toUpperCase();
  return Object.values(BUILT_IN_CODE).includes(one) ? one + (letters[1] ?? '').toLowerCase() : one;
}

/** A soft tinted category tile with its letter code. Decorative; the name is always beside it. */
export function Roundel({ category, small }: { category: Category; small?: boolean }) {
  return (
    <span className={`rd${small ? ' sm' : ''}`} style={{ '--c': categoryColor(category) } as CSSProperties} aria-hidden="true">
      {categoryCode(category)}
    </span>
  );
}

/** Tile for cash-bought entries: a yen sign in the neutral color. */
export function CashRoundel() {
  return (
    <span className="rd" style={{ '--c': 'var(--cat-misc)' } as CSSProperties} aria-hidden="true">
      ¥
    </span>
  );
}
