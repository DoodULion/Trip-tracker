import type { CSSProperties } from 'react';
import type { Category } from './calc';

/** Color and letter code for each category. Fixed for every trip. */
export const CATEGORY_CODE: Record<Category, string> = {
  Food: 'F',
  Shopping: 'S',
  Suica: 'IC',
  Activities: 'A',
  Transportation: 'T',
  Misc: 'M',
};

export const CATEGORY_COLOR: Record<Category, string> = {
  Food: 'var(--cat-food)',
  Shopping: 'var(--cat-shopping)',
  Suica: 'var(--cat-suica)',
  Activities: 'var(--cat-activities)',
  Transportation: 'var(--cat-transport)',
  Misc: 'var(--cat-misc)',
};

/** A soft tinted category tile with its letter code. Decorative; the name is always beside it. */
export function Roundel({ category, small }: { category: Category; small?: boolean }) {
  return (
    <span className={`rd${small ? ' sm' : ''}`} style={{ '--c': CATEGORY_COLOR[category] } as CSSProperties} aria-hidden="true">
      {CATEGORY_CODE[category]}
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
