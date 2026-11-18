/** Parsing and date helpers for form input. No float money math. */
import { parseLocal } from './currency';

/** A local-currency amount as typed ("1,600" → 1600 yen; "12.50" → 1250 euro cents), in the trip being viewed. */
export function parseYen(input: string): number | undefined {
  return parseLocal(input);
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

/**
 * Tidy a dollar amount as it is typed: keep digits and one decimal point (at most 2 decimals),
 * and group the whole dollars with commas. "10000" -> "10,000", "1234567.5" -> "1,234,567.5".
 */
export function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  const whole = (dot === -1 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, '');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dot === -1 ? grouped : `${grouped}.${cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)}`;
}

/** A stored amount shown in an amount field: "10,000" for whole dollars, "10,000.50" otherwise. */
export function centsToAmountInput(cents: number): string {
  return formatAmountInput(cents % 100 === 0 ? String(cents / 100) : centsToInput(cents));
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
