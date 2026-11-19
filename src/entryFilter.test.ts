import { describe, expect, it } from 'vitest';
import { activeFilterCount, matchesRow, NO_FILTERS, type Row } from './entryFilter';

const fmt = { local: (m: number) => `¥${m.toLocaleString('en-US')}`, dollars: (c: number) => `$${(c / 100).toFixed(2)}` };
const rows: Row[] = [
  { kind: 'card', e: { id: 'a', date: '2026-11-26', category: 'Food', card: 'Apple Card', yen: 1600, cents: 1000, note: 'ramen' } },
  { kind: 'card', e: { id: 'b', date: '2026-11-27', category: 'Shopping', card: 'Capital One', yen: 8000 } },
  { kind: 'cash', e: { id: 'c', date: '2026-11-27', category: 'Suica', yen: 3200 } },
  { kind: 'bought', e: { id: 'd', date: '2026-11-26', yen: 30000, cents: 20000, where: 'Narita ATM' } },
];
const ids = (f = NO_FILTERS, q = '') => rows.filter((r) => matchesRow(r, f, q, fmt)).map((r) => r.e.id);

describe('entry filters', () => {
  it('shows everything with no filters', () => expect(ids()).toEqual(['a', 'b', 'c', 'd']));
  it('filters by payment type', () => {
    expect(ids({ ...NO_FILTERS, kinds: ['cash'] })).toEqual(['c']);
    expect(ids({ ...NO_FILTERS, kinds: ['card', 'bought'] })).toEqual(['a', 'b', 'd']);
  });
  it('filters by category and hides cash bought then', () => expect(ids({ ...NO_FILTERS, categories: ['Food', 'Suica'] })).toEqual(['a', 'c']));
  it('filters by card', () => expect(ids({ ...NO_FILTERS, cards: ['Capital One'] })).toEqual(['b']));
  it('filters by price range (inclusive)', () => {
    expect(ids({ ...NO_FILTERS, minMinor: 3200, maxMinor: 8000 })).toEqual(['b', 'c']);
    expect(ids({ ...NO_FILTERS, maxMinor: 1600 })).toEqual(['a']);
  });
  it('filters by date range', () => {
    expect(ids({ ...NO_FILTERS, from: '2026-11-27', to: '2026-11-27' })).toEqual(['b', 'c']);
  });
  it('finds charges missing dollars and entries with notes', () => {
    expect(ids({ ...NO_FILTERS, missingOnly: true })).toEqual(['b']);
    expect(ids({ ...NO_FILTERS, hasNote: true })).toEqual(['a', 'd']);
  });
  it('searches words in category, note, place and amounts', () => {
    expect(ids(NO_FILTERS, 'ramen')).toEqual(['a']);
    expect(ids(NO_FILTERS, 'narita')).toEqual(['d']);
    expect(ids(NO_FILTERS, '1600')).toEqual(['a']);
    expect(ids(NO_FILTERS, '$10.00')).toEqual(['a']);
    expect(ids(NO_FILTERS, 'capital shopping')).toEqual(['b']);
    expect(ids(NO_FILTERS, '11/27')).toEqual(['b', 'c']);
  });
  it('combines search and filters', () => expect(ids({ ...NO_FILTERS, kinds: ['card'] }, '11/27')).toEqual(['b']));
  it('counts active filters', () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...NO_FILTERS, kinds: ['card'], minMinor: 1, maxMinor: 2, from: '2026-11-26' })).toBe(3);
  });
});
