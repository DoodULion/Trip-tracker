import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS as S, computeDays, computeSummary, isDomestic, type Data, type Trip } from './calc';
import { buildBackup, parseBackup, toCsv } from './backup';
import { US_STATES, findCountry, findState, forLight, tripPlace, tripThemeOf } from './countries';
import { tripCurrency } from './currency';
import { matchesRow, NO_FILTERS, type Row } from './entryFilter';
import { domesticCard, isLocalStat, seriesCatalog, statCatalog } from './summaryCards';

// A domestic trip keeps dollars only: card charges have cents and no local amount; a cash purchase
// keeps its dollars as both its amount and its cents (the trip's currency is USD).
const trip: Trip = { id: 'd1', name: 'Austin', ...S, scope: 'domestic', country: 'US', state: 'TX' };
const data: Data = {
  cardCharges: [
    { id: 'a', date: '2026-11-26', category: 'Food', card: 'Apple Card', cents: 4250 },
    { id: 'b', date: '2026-11-27', category: 'Shopping', card: 'Capital One', cents: 10000 },
  ],
  cashPurchases: [{ id: 'c', date: '2026-11-26', category: 'Food', yen: 1200, cents: 1200 }],
  cashBought: [],
};

describe('domestic trips', () => {
  it('are told apart from international ones', () => {
    expect(isDomestic(trip)).toBe(true);
    expect(isDomestic({ scope: 'international' })).toBe(false);
    expect(isDomestic({})).toBe(false); // older trips
  });

  it('are kept in dollars', () => {
    expect(tripCurrency(trip).code).toBe('USD');
    expect(tripCurrency({ country: 'JP' }).code).toBe('JPY');
    expect(tripCurrency({ country: 'FR', scope: 'international' }).code).toBe('EUR');
  });

  it('total their dollars without any cash bought or rates', () => {
    const s = computeSummary(data, S, '2026-11-28');
    expect(s.totalSpentCents).toBe(15450);
    expect(s.byPayment.cash).toBe(1200);
    expect(s.byPayment.cards).toEqual({ 'Apple Card': 4250, 'Capital One': 10000 });
    const day = computeDays(data, S).find((d) => d.date === '2026-11-26')!;
    expect(day.totalCents).toBe(5450);
  });

  it('take their main color from the state (US colors with none)', () => {
    expect(US_STATES).toHaveLength(50);
    expect(new Set(US_STATES.map((s) => s.code)).size).toBe(50);
    expect(findState('TX')?.name).toBe('Texas');
    expect(findState('ZZ')).toBeUndefined();
    const t = tripThemeOf(trip) as Record<string, string>;
    expect(t['--brand']).toBe(forLight(findState('TX')!.color));
    const none = tripThemeOf({ scope: 'domestic' }) as Record<string, string>;
    expect(none['--brand']).toBe(forLight(findCountry('US')!.color));
    // International trips are unchanged: their country's color.
    expect((tripThemeOf({ country: 'JP' }) as Record<string, string>)['--brand']).toBe(forLight(findCountry('JP')!.color));
  });

  it('show the US flag, named by the state', () => {
    expect(tripPlace(trip)).toEqual({ flag: '🇺🇸', label: 'Texas' });
    expect(tripPlace({ scope: 'domestic' })?.label).toBe('United States');
    expect(tripPlace({ country: 'JP' })).toEqual({ flag: '🇯🇵', label: 'Japan' });
    expect(tripPlace({})).toBeUndefined();
  });

  it('keep their type and state through a backup', () => {
    const back = parseBackup(JSON.stringify(buildBackup([{ trip, data }])));
    expect(back.trips[0].trip.scope).toBe('domestic');
    expect(back.trips[0].trip.state).toBe('TX');
  });

  it('export card charges with their dollars as the amount', () => {
    const csv = toCsv([{ trip, data }]);
    expect(csv).toContain('Austin,Card,2026-11-26,Food,Apple Card,42.50,USD,42.50,');
    expect(csv).toContain('Austin,Cash,2026-11-26,Food,,12.00,USD,12.00,');
  });

  it('filter prices by dollars', () => {
    const rows: Row[] = [...data.cardCharges.map((e) => ({ kind: 'card' as const, e })), ...data.cashPurchases.map((e) => ({ kind: 'cash' as const, e }))];
    const fmt = { local: (m: number) => String(m), dollars: (c: number) => String(c) };
    const ids = rows.filter((r) => matchesRow(r, { ...NO_FILTERS, minMinor: 1000, maxMinor: 5000, dollarPrices: true }, '', fmt)).map((r) => r.e.id);
    expect(ids).toEqual(['a', 'c']);
  });

  it('offer only dollar figures and charts on Summary cards', () => {
    const ids = statCatalog(['Food'], ['Visa'], true).map((d) => d.id);
    expect(ids).toContain('totalSpent');
    expect(ids).toContain('cat:Food');
    expect(ids.some(isLocalStat)).toBe(false);
    expect(statCatalog(['Food'], ['Visa']).map((d) => d.id)).toContain('catyen:Food');
    expect(seriesCatalog(['Food'], true).map((d) => d.id)).toEqual(['daySpend', 'running']);
  });

  it('drop local-currency items from custom cards, and cards left with none', () => {
    const mixed = { id: 'x', kind: 'custom' as const, title: 'Mix', items: [{ stat: 'totalSpent' }, { stat: 'overallRate' }, { formula: { a: 'totalYen', op: '/' as const, b: 'totalSpent' } }] };
    expect(domesticCard(mixed)?.items).toEqual([{ stat: 'totalSpent' }]);
    expect(domesticCard({ ...mixed, items: [{ stat: 'cashRate' }] })).toBeUndefined();
    expect(domesticCard({ id: 'y', kind: 'custom', title: 'Rate', items: [], display: 'daily', series: 'dayRate' })).toBeUndefined();
    const spend = { id: 'z', kind: 'custom' as const, title: 'Spend', items: [], display: 'daily' as const, series: 'daySpend' };
    expect(domesticCard(spend)).toBe(spend);
  });
});
