/**
 * Appearance: light (the default), dark, or follow the system.
 * The choice is a per-device preference kept in localStorage (not trip data, so it is not in backups).
 * index.html applies it before the first paint; this module keeps it current afterwards.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'trip-tracker-theme';
const COLORS = { light: '#f1edea', dark: '#1b1715' };
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : undefined;

export function getThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'system' ? v : 'light'; // nothing chosen yet: light
  } catch {
    return 'light';
  }
}

export function setThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // Storage blocked: the choice still applies for this session.
  }
  applyTheme(choice);
}

/** Set `data-theme` on <html> (the stylesheet keys off it) and the status-bar color. */
export function applyTheme(choice: ThemeChoice = getThemeChoice()): void {
  const mode = choice === 'system' ? (media?.matches ? 'dark' : 'light') : choice;
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[mode]);
}

/** Follow system light/dark changes while the choice is "system". Call once at startup. */
export function watchSystemTheme(): void {
  media?.addEventListener('change', () => {
    if (getThemeChoice() === 'system') applyTheme('system');
  });
  applyTheme();
}
