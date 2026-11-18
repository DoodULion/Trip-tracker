import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup, toCsv, type BackupTrip } from './backup';
import { DEFAULT_SETTINGS as S, type Data } from './calc';

const data: Data = {
  cardCharges: [
    { id: 'a', date: '2026-11-26', category: 'Food', card: 'Apple Card', yen: 1600, cents: 1000 },
    { id: 'b', date: '2026-11-26', category: 'Misc', card: '', yen: 500, note: 'gift, "nice"' },
  ],
  cashPurchases: [{ id: 'c', date: '2026-11-27', category: 'Suica', yen: 3200 }],
  cashBought: [{ id: 'd', date: '2026-11-26', yen: 30000, cents: 20000, where: '=ATM' }],
};
const empty: Data = { cardCharges: [], cashPurchases: [], cashBought: [] };

const japan: BackupTrip = { trip: { id: 't1', name: 'Japan', ...S }, data };
const korea: BackupTrip = {
  trip: { id: 't2', name: 'Korea', tripStart: '2027-03-01', tripEnd: '2027-03-10', budgetCeilingCents: 300000, cards: ['Visa'] },
  data: { ...empty, cashPurchases: [{ id: 'c', date: '2027-03-02', category: 'Food', yen: 900 }] }, // same entry id as Japan's: fine across trips
};

describe('backup round trip (v2)', () => {
  it('restores every trip exactly', () => {
    const back = parseBackup(JSON.stringify(buildBackup([japan, korea])));
    expect(back.version).toBe(2);
    expect(back.trips).toEqual(JSON.parse(JSON.stringify([japan, korea])));
  });
  it('accepts a backup with no trips', () => {
    expect(parseBackup(JSON.stringify(buildBackup([]))).trips).toEqual([]);
  });
  it('rejects bad input with a readable message', () => {
    expect(() => parseBackup('nope')).toThrow(/not valid JSON/);
    expect(() => parseBackup('{"app":"other"}')).toThrow(/not a Trip Tracker backup/);
    expect(() => parseBackup('{"app":"japan-trip","version":9}')).toThrow(/newer version/);

    const mut = (fn: (b: any) => void) => {
      const b = JSON.parse(JSON.stringify(buildBackup([japan, korea])));
      fn(b);
      return JSON.stringify(b);
    };
    expect(() => parseBackup(mut((b) => (b.trips[0].data.cashPurchases[0].date = '2026/11/27')))).toThrow(/bad date/);
    expect(() => parseBackup(mut((b) => (b.trips[0].data.cashPurchases[0].category = '  ')))).toThrow(/missing category/);
    expect(() => parseBackup(mut((b) => b.trips[0].data.cashBought.push(b.trips[0].data.cashBought[0])))).toThrow(/duplicate id/);
    expect(() => parseBackup(mut((b) => (b.trips[0].data.cashBought[0].cents = 12.5)))).toThrow(/whole number/);
    expect(() => parseBackup(mut((b) => (b.trips[1].id = 't1')))).toThrow(/duplicate id/);
    expect(() => parseBackup(mut((b) => (b.trips[1].name = '  ')))).toThrow(/no name/);
    expect(() => parseBackup(mut((b) => (b.trips[1].tripEnd = '2027-02-01')))).toThrow(/bad trip dates/);
  });
});

describe('trip country', () => {
  it('round-trips and is optional', () => {
    const withCountry: BackupTrip = { trip: { ...japan.trip, country: 'JP' }, data };
    const back = parseBackup(JSON.stringify(buildBackup([withCountry, korea])));
    expect(back.trips[0].trip.country).toBe('JP');
    expect(back.trips[1].trip.country).toBeUndefined();
  });
  it('rejects a bad country code', () => {
    const b = JSON.parse(JSON.stringify(buildBackup([japan])));
    b.trips[0].country = 'Japan';
    expect(() => parseBackup(JSON.stringify(b))).toThrow(/two-letter code/);
  });
});

describe('importing an old single-trip (v1) backup', () => {
  const v1 = JSON.stringify({ app: 'japan-trip', version: 1, exportedAt: '2026-11-20T00:00:00Z', settings: S, data });
  it('becomes one trip named Japan Trip', () => {
    const back = parseBackup(v1);
    expect(back.trips).toHaveLength(1);
    expect(back.trips[0].trip.name).toBe('Japan Trip');
    expect(back.trips[0].trip.id).not.toBe('');
    expect(back.trips[0].trip.tripStart).toBe(S.tripStart);
    expect(back.trips[0].data).toEqual(JSON.parse(JSON.stringify(data)));
  });
});

describe('toCsv', () => {
  const csv = toCsv([japan, korea]).replace('﻿', '').split('\r\n');
  it('has a header and one line per entry, trips in order, oldest first', () => {
    expect(csv[0]).toBe('Trip,Type,Date,Category,Card,Amount,Currency,Dollars,Note');
    expect(csv).toHaveLength(1 + 4 + 1 + 1);
    expect(csv[1]).toBe('Japan,Card,2026-11-26,Food,Apple Card,1600,JPY,10.00,');
    expect(csv[4]).toBe('Japan,Cash,2026-11-27,Suica,,3200,JPY,,');
    expect(csv[5]).toBe('Korea,Cash,2027-03-02,Food,,900,JPY,,');
  });
  it('quotes commas and quotes, and defuses formulas', () => {
    expect(csv[2]).toBe('Japan,Card,2026-11-26,Misc,,500,JPY,,"gift, ""nice"""');
    expect(csv[3]).toBe("Japan,Cash bought,2026-11-26,,,30000,JPY,200.00,'=ATM");
  });
});

describe('category list', () => {
  it('keeps the owner\u2019s list (built-ins deleted, own added) and entries in any category', () => {
    const withGift: BackupTrip = { ...japan, data: { ...japan.data, cashPurchases: [{ id: 'c', date: '2026-11-27', category: 'Gifts', yen: 3200 }] } };
    const back = parseBackup(JSON.stringify(buildBackup([withGift], new Date(), ['Food', 'Gifts', 'Snacks'])));
    expect(back.categories).toEqual(['Food', 'Gifts', 'Snacks']);
    expect(back.trips[0].data.cashPurchases[0].category).toBe('Gifts');
  });
  it('gives older backups the six built-ins, plus any extras they listed', () => {
    const plain = JSON.parse(JSON.stringify(buildBackup([japan])));
    delete plain.categoryList;
    expect(parseBackup(JSON.stringify(plain)).categories).toEqual(['Food', 'Shopping', 'Suica', 'Activities', 'Transportation', 'Misc']);
    plain.categories = ['Gifts'];
    expect(parseBackup(JSON.stringify(plain)).categories).toEqual(['Food', 'Shopping', 'Suica', 'Activities', 'Transportation', 'Misc', 'Gifts']);
  });
});
