import { afterEach, describe, expect, it } from 'vitest';
import { applyEstimates, computeSummary, formatRate, formatYen, type Data, type Settings } from './calc';
import { CURRENCIES, DEFAULT_CURRENCY, currencyFor, formatLocal, minorToInput, parseLocal, scaleOf, setCurrency } from './currency';
import { COUNTRIES } from './countries';
import { toCsv } from './backup';

afterEach(() => setCurrency(DEFAULT_CURRENCY));

describe('which currency a trip uses', () => {
  it('follows the country, with yen when there is none', () => {
    expect(currencyFor('JP').code).toBe('JPY');
    expect(currencyFor('FR').code).toBe('EUR');
    expect(currencyFor('GB').code).toBe('GBP');
    expect(currencyFor('MX').code).toBe('MXN');
    expect(currencyFor(undefined).code).toBe('JPY');
    expect(currencyFor('ZZ').code).toBe('JPY');
  });
  it('covers every country in the list', () => {
    for (const c of COUNTRIES) expect(CURRENCIES[currencyFor(c.code).code], c.name).toBeDefined();
    expect(COUNTRIES.filter((c) => currencyFor(c.code).code === 'JPY').map((c) => c.code)).toEqual(['JP']);
  });
});

describe('formatting and parsing local amounts', () => {
  const eur = CURRENCIES.EUR;
  const yen = CURRENCIES.JPY;
  it('shows yen whole and euros with cents', () => {
    expect(formatLocal(1600, yen)).toBe('¥1,600');
    expect(formatLocal(1250, eur)).toBe('€12.50');
    expect(formatLocal(123456, eur)).toBe('€1,234.56');
    expect(formatLocal(-500, eur)).toBe('-€5.00');
    expect(formatLocal(1000, CURRENCIES.JOD)).toBe('JD 1.000');
  });
  it('reads typed amounts into whole minor units', () => {
    expect(parseLocal('1,600', yen)).toBe(1600);
    expect(parseLocal('¥800', yen)).toBe(800);
    expect(parseLocal('12.5', yen)).toBeUndefined(); // yen has no decimals
    expect(parseLocal('12.5', eur)).toBe(1250);
    expect(parseLocal('€12.50', eur)).toBe(1250);
    expect(parseLocal('12.555', eur)).toBeUndefined();
    expect(parseLocal('7', eur)).toBe(700);
    expect(parseLocal('', eur)).toBeUndefined();
    expect(parseLocal('abc', eur)).toBeUndefined();
  });
  it('puts a stored amount back into an input box', () => {
    expect(minorToInput(1600, yen)).toBe('1600');
    expect(minorToInput(1205, eur)).toBe('12.05');
    expect(minorToInput(undefined, eur)).toBe('');
  });
});

describe('a euro trip', () => {
  const trip: Settings = { tripStart: '2026-06-01', tripEnd: '2026-06-10', budgetCeilingCents: 200000, cards: ['Visa'] };
  // €92.00 of card spending for $100.00 (rate 0.92 €/$), €46.00 cash bought for $50.00.
  const data: Data = {
    cardCharges: [{ id: 'a', date: '2026-06-01', category: 'Food', card: 'Visa', yen: 9200, cents: 10000 }],
    cashPurchases: [{ id: 'b', date: '2026-06-02', category: 'Misc', yen: 2300 }],
    cashBought: [{ id: 'c', date: '2026-06-01', yen: 4600, cents: 5000 }],
  };
  it('keeps the math in minor units and shows the rate in euros per dollar', () => {
    setCurrency(CURRENCIES.EUR);
    const s = computeSummary(data, trip, '2026-06-03');
    expect(s.cashRate).toBeCloseTo(92, 5); // internal: euro cents per $
    expect(formatRate(s.cashRate)).toBe('0.92'); // shown as euros per $
    expect(s.totalSpentCents).toBe(12500); // $100 card + €23.00 cash at 0.92 = $25
  });
  it('estimates a missing-dollar charge from the market rate on the same scale', () => {
    const missing: Data = { ...data, cardCharges: [{ id: 'm', date: '2026-06-01', category: 'Food', card: 'Visa', yen: 4600 }] };
    const spot = { '2026-06-01': 0.92 * scaleOf(CURRENCIES.EUR) }; // 0.92 € per $ → 92 euro cents per $
    expect(applyEstimates(missing, spot).cardCharges[0].cents).toBe(5000); // €46.00 → $50.00
  });
  it('still formats yen when nothing else is set', () => {
    expect(formatYen(1600)).toBe('¥1,600');
  });
  it('writes the CSV amount in the trip\u2019s own currency', () => {
    const csv = toCsv([{ trip: { id: 't', name: 'Paris', country: 'FR', ...trip }, data }]).replace('﻿', '').split('\r\n');
    expect(csv[1]).toBe('Paris,Card,2026-06-01,Food,Visa,92.00,EUR,100.00,');
    expect(csv[3]).toBe('Paris,Cash,2026-06-02,Misc,,23.00,EUR,,');
  });
});
