/** Parsing and date helpers for form input. No float money math. */

/** "1,600" -> 1600. Blank or invalid -> undefined. */
export function parseYen(input: string): number | undefined {
  const s = input.replace(/[,\s¥]/g, '');
  if (!/^\d+$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : undefined;
}

/** "10", "10.5", "$1,234.56" -> integer cents, by string handling only. Blank or invalid -> undefined. */
export function parseCents(input: string): number | undefined {
  const s = input.replace(/[,\s$]/g, '');
  const m = /^(\d*)(?:\.(\d{0,2}))?$/.exec(s);
  if (!m || (m[1] === '' && !m[2])) return undefined;
  const whole = m[1] === '' ? 0 : Number(m[1]);
  const frac = Number((m[2] ?? '').padEnd(2, '0'));
  const cents = whole * 100 + frac;
  return Number.isSafeInteger(cents) ? cents : undefined;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** The device's local calendar date as YYYY-MM-DD. */
export function todayLocal(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Clamp a YYYY-MM-DD string into [start, end] (string comparison). */
export function clampDate(date: string, start: string, end: string): string {
  return date < start ? start : date > end ? end : date;
}

/** Works on plain http (LAN dev server) where crypto.randomUUID is unavailable. */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Integer cents -> text for an input box, e.g. 1050 -> "10.50". */
export function centsToInput(cents: number | undefined): string {
  if (cents === undefined) return '';
  return `${Math.floor(cents / 100)}.${pad2(cents % 100)}`;
}

/** "2026-11-26" -> "Thu 11/26" (calendar math only, no time zones). */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${wd} ${m}/${d}`;
}
