import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS as S, computeDays, computeSummary, type Data } from './calc';
import { DEFAULT_LAYOUT, dailySeries, formatStat, formulaLabel, formulaUnit, formulaValue, parseLayout, statCatalog, statValue } from './summaryCards';

// The spec's test data (CLAUDE.md).
const data: Data = {
  cardCharges: [
    { id: 'a', date: '2026-11-26', category: 'Food', yen: 1600, cents: 1000, card: 'Apple Card' },
    { id: 'b', date: '2026-11-26', category: 'Shopping', yen: 8000, cents: 5000, card: 'Capital One' },
    { id: 'c', date: '2026-11-27', category: 'Transportation', yen: 16000, cents: 10000, card: 'Apple Card' },
  ],
  cashPurchases: [
    { id: 'd', date: '2026-11-26', category: 'Food', yen: 800 },
    { id: 'e', date: '2026-11-27', category: 'Suica', yen: 3200 },
    { id: 'f', date: '2026-11-28', category: 'Activities', yen: 1600 },
  ],
  cashBought: [{ id: 'g', date: '2026-11-26', yen: 30000, cents: 20000 }],
};
const s = computeSummary(data, S, '2026-11-28');
const C = S.budgetCeilingCents;
const v = (id: string) => formatStat(statValue(id, s, C));

describe('summary card figures', () => {
  it('reads the same numbers as the rest of the app', () => {
    expect(v('totalSpent')).toBe('$197.33');
    expect(v('remaining')).toBe('$9,802.67');
    expect(v('dailyLimit')).toBe('$400.00');
    expect(v('cashOnHand')).toBe('¥24,400');
    expect(v('overallRate')).toBe('158.11');
    expect(v('cat:Food')).toBe('$15.33');
    expect(v('catyen:Food')).toBe('¥2,400');
    expect(v('card:Apple Card')).toBe('$110.00');
    expect(v('daysWithSpending')).toBe('3');
    expect(v('status')).toBe('On pace');
  });
  it('is blank for an unknown figure', () => {
    expect(v('nope')).toBe('—');
  });
  it('offers one figure per category and card', () => {
    const ids = statCatalog(['Food'], ['Apple Card']).map((d) => d.id);
    expect(ids).toContain('cat:Food');
    expect(ids).toContain('card:Apple Card');
  });
});

describe('formulas', () => {
  const f = (a: string, op: '+' | '-' | '*' | '/', b: string | number) => formatStat(formulaValue({ a, op, b }, s, C));
  it('divides dollars by a count of days', () => {
    expect(f('remaining', '/', 'daysLeft')).toBe('$445.58'); // $9,802.67 over 22 days left
  });
  it('gives a percent for like ÷ like', () => {
    expect(f('cat:Food', '/', 'totalSpent')).toBe('7.8%');
  });
  it('gives a rate for yen ÷ dollars', () => {
    expect(f('totalYen', '/', 'totalSpent')).toBe('158.11');
  });
  it('adds plain dollars to a dollar figure', () => {
    expect(f('totalSpent', '+', 2.67)).toBe('$200.00');
  });
  it('multiplies by a plain number', () => {
    expect(f('dailyLimit', '*', 2)).toBe('$800.00');
  });
  it('refuses units that do not mix, and division by zero', () => {
    expect(formulaUnit('usd', '+', 'yen')).toBeUndefined();
    expect(f('totalSpent', '+', 'totalYen')).toBe('—');
    expect(f('totalSpent', '/', 0)).toBe('—');
  });
  it('has a readable name', () => {
    expect(formulaLabel({ a: 'remaining', op: '/', b: 'daysLeft' })).toBe('Remaining ÷ Days left');
  });
});

describe('summary layout', () => {
  it('falls back to the built-in cards', () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout('x')).toEqual(DEFAULT_LAYOUT);
  });
  it('keeps valid cards and drops broken ones and duplicates', () => {
    const out = parseLayout([
      { id: 'budget', kind: 'builtin' },
      { id: 'budget', kind: 'builtin' },
      { id: 'x', kind: 'builtin' },
      { id: 'c1', kind: 'custom', title: 'Mine', items: [{ stat: 'remaining' }, { formula: { a: 'remaining', op: '%', b: 1 } }, { formula: { a: 'remaining', op: '/', b: 'daysLeft' } }] },
    ]);
    expect(out.map((c) => c.id)).toEqual(['budget', 'c1']);
    expect(out[1].kind === 'custom' && out[1].items.length).toBe(2);
  });
});

describe('daily series', () => {
  const days = computeDays(data, S);
  it('gives each day its spending, blank on days with no entries', () => {
    const pts = dailySeries('daySpend', days, '2026-11-28');
    expect(pts).toHaveLength(25);
    expect(pts[0].value).toBeCloseTo(6533.33, 1); // $65.33
    expect(pts[0].ref).toBe(40000);
    expect(pts[3].value).toBeUndefined();
  });
  it('runs the running total only up to today', () => {
    const pts = dailySeries('running', days, '2026-11-27');
    expect(pts[1].value).toBeCloseTo(18666.67, 1); // $186.67
    expect(pts[2].value).toBeUndefined();
    expect(pts[2].ref).toBe(120000);
  });
  it('shows a real zero for a category on a day that has other entries', () => {
    const pts = dailySeries('catday:Food', days, '2026-11-28');
    expect(pts[0].value).toBe(2400);
    expect(pts[1].value).toBe(0);
    expect(pts[4].value).toBeUndefined();
  });
  it('keeps a card display and series, and drops unknown ones', () => {
    const out = parseLayout([
      { id: 'a', kind: 'custom', title: 'A', items: [], display: 'daily', series: 'daySpend' },
      { id: 'b', kind: 'custom', title: 'B', items: [], display: 'spiral', series: 'nope' },
    ]);
    expect(out[0]).toMatchObject({ display: 'daily', series: 'daySpend' });
    expect(out[1]).not.toHaveProperty('display');
    expect(out[1]).not.toHaveProperty('series');
  });
});
