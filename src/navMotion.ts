import { flushSync } from 'react-dom';

export type Dir = 'push' | 'pop';

/**
 * Change screens with a full-screen slide (the whole page, band and tab bar included), like a phone app:
 * push slides the new screen in from the right, pop slides the current one away to the right.
 * Uses the View Transitions API (iOS 18+, current Chrome). Returns false when the browser can't do it
 * or the user asked for reduced motion; the change is then applied right away and the caller may animate another way.
 */
export function navigate(dir: Dir, update: () => void): boolean {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce) {
    update();
    return false;
  }
  const root = document.documentElement;
  root.dataset.nav = dir;
  const t = doc.startViewTransition(() => {
    flushSync(update);
    window.scrollTo(0, 0);
  });
  t.finished.finally(() => {
    if (root.dataset.nav === dir) delete root.dataset.nav;
  });
  return true;
}
