/** Searching and filtering the Entries list. Pure: no UI. */
import type { CardCharge, CashBought, CashPurchase } from './calc';

export type Row =
  | { kind: 'card'; e: CardCharge }
  | { kind: 'cash'; e: CashPurchase }
  | { kind: 'bought'; e: CashBought };

export type Kind = Row['kind'];

export interface EntryFilters {
  /** Payment types to show (empty = all). */
  kinds: Kind[];
  /** Categories to show (empty = all). Cash bought has no category, so it is hidden while any are chosen. */
  categories: string[];
  /** Card names to show (empty = all). '' is a charge with no card. Only card charges have one. */
  cards: string[];
  /** Price range in the trip's local currency, in minor units (inclusive). An entry with no local amount is hidden. */
  minMinor?: number;
  maxMinor?: number;
  /** Domestic trip: the price range is in dollars (cents), matched against each entry's dollars. */
  dollarPrices?: boolean;
  /** Date range, inclusive, YYYY-MM-DD. The same day twice means one day. */
  from?: string;
  to?: string;
  /** Only card charges still missing their dollars. */
  missingOnly: boolean;
  /** Only entries that have a note (or, for cash bought, a place). */
  hasNote: boolean;
}

export const NO_FILTERS: EntryFilters = { kinds: [], categories: [], cards: [], missingOnly: false, hasNote: false };

/** How many separate filters are switched on (a price range or a date range counts once). */
export function activeFilterCount(f: EntryFilters): number {
  return (
    (f.kinds.length ? 1 : 0) +
    (f.categories.length ? 1 : 0) +
    (f.cards.length ? 1 : 0) +
    (f.minMinor !== undefined || f.maxMinor !== undefined ? 1 : 0) +
    (f.from || f.to ? 1 : 0) +
    (f.missingOnly ? 1 : 0) +
    (f.hasNote ? 1 : 0)
  );
}

/** The words people can search by: category, card, note, place, payment type, date and the amounts. */
function haystack(r: Row, format: { local: (minor: number) => string; dollars: (cents: number) => string }): string {
  const parts: (string | undefined)[] = [r.e.date, r.e.date.slice(5).replace(/^0/, '').replace('-0', '-').replace('-', '/')];
  if (r.kind === 'card') {
    parts.push(r.e.category, r.e.card || 'no card', 'card', r.e.note);
    if (r.e.yen !== undefined) parts.push(format.local(r.e.yen), String(r.e.yen));
    if (r.e.cents !== undefined) parts.push(format.dollars(r.e.cents));
  } else if (r.kind === 'cash') {
    parts.push(r.e.category, 'cash', r.e.note, format.local(r.e.yen), String(r.e.yen));
    if (r.e.cents !== undefined) parts.push(format.dollars(r.e.cents));
  } else {
    parts.push('cash bought', 'atm', 'exchange', r.e.where, format.local(r.e.yen), String(r.e.yen), format.dollars(r.e.cents));
  }
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/** Whether an entry passes the search words (every word must appear) and every filter that is on. */
export function matchesRow(
  r: Row,
  f: EntryFilters,
  query: string,
  format: { local: (minor: number) => string; dollars: (cents: number) => string },
): boolean {
  if (f.kinds.length && !f.kinds.includes(r.kind)) return false;
  if (f.categories.length && (r.kind === 'bought' || !f.categories.includes(r.e.category))) return false;
  if (f.cards.length && (r.kind !== 'card' || !f.cards.includes(r.e.card))) return false;
  if (f.minMinor !== undefined || f.maxMinor !== undefined) {
    const y = f.dollarPrices ? ('cents' in r.e ? r.e.cents : undefined) : r.e.yen;
    if (y === undefined) return false;
    if (f.minMinor !== undefined && y < f.minMinor) return false;
    if (f.maxMinor !== undefined && y > f.maxMinor) return false;
  }
  if (f.from && r.e.date < f.from) return false;
  if (f.to && r.e.date > f.to) return false;
  if (f.missingOnly && !(r.kind === 'card' && r.e.cents === undefined)) return false;
  if (f.hasNote && !(r.kind === 'bought' ? r.e.where : r.e.note)) return false;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) {
    const h = haystack(r, format);
    // "$" and "," are ignored in both the search and the text so "1600" finds ¥1,600.
    const flat = h.replace(/[,$¥€£]/g, '');
    if (!words.every((w) => h.includes(w) || flat.includes(w.replace(/[,$¥€£]/g, '')))) return false;
  }
  return true;
}
