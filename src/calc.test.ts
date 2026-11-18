import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS as S,
  computeDays,
  computeSummary,
  cashRate,
  cardRate,
  daysLeft,
  formatDollars,
  formatRate,
  formatYen,
  tripDates,
  tripLength,
  type Data,
} from './calc';

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

const today = '2026-11-28';
const sum = computeSummary(data, S, today);
const days = computeDays(data, S);
const day = (d: string) => days.find((x) => x.date === d)!;

describe('trip dates', () => {
  it('is 25 days, inclusive', () => {
    expect(tripLength(S)).toBe(25);
    const d = tripDates(S);
    expect(d).toHaveLength(25);
    expect(d[0]).toBe('2026-11-26');
    expect(d[4]).toBe('2026-11-30');
    expect(d[5]).toBe('2026-12-01');
    expect(d[24]).toBe('2026-12-20');
  });
  it('days left: before, during, after', () => {
    expect(daysLeft('2026-11-01', S)).toBe(25);
    expect(daysLeft('2026-11-26', S)).toBe(24);
    expect(daysLeft('2026-12-20', S)).toBe(0);
    expect(daysLeft('2027-01-01', S)).toBe(0);
  });
});

describe('rates', () => {
  it('cash rate 150.00', () => expect(formatRate(cashRate(data.cashBought))).toBe('150.00'));
  it('card rates 160.00', () => {
    expect(formatRate(cardRate(data.cardCharges))).toBe('160.00');
    expect(formatRate(cardRate(data.cardCharges, 'Apple Card'))).toBe('160.00');
    expect(formatRate(cardRate(data.cardCharges, 'Capital One'))).toBe('160.00');
  });
  it('card rate ignores charges missing yen or dollars', () => {
    const extra = [...data.cardCharges, { id: 'x', date: S.tripStart, category: 'Misc' as const, card: 'Apple Card', yen: 5000 }];
    expect(formatRate(cardRate(extra))).toBe('160.00');
  });
  it('cash rate is undefined with no cash bought', () => expect(cashRate([])).toBeUndefined());
});

describe('per day', () => {
  it('11/26', () => {
    const d = day('2026-11-26');
    expect(formatYen(d.totalYen)).toBe('¥10,400');
    expect(formatDollars(d.totalCents)).toBe('$65.33');
    expect(formatRate(d.rate)).toBe('159.18');
  });
  it('11/27', () => {
    const d = day('2026-11-27');
    expect(formatYen(d.totalYen)).toBe('¥19,200');
    expect(formatDollars(d.totalCents)).toBe('$121.33');
    expect(formatRate(d.rate)).toBe('158.24');
  });
  it('11/28', () => {
    const d = day('2026-11-28');
    expect(formatYen(d.totalYen)).toBe('¥1,600');
    expect(formatDollars(d.totalCents)).toBe('$10.67');
    expect(formatRate(d.rate)).toBe('150.00');
  });
  it('limit, over/under, running totals', () => {
    expect(formatDollars(day('2026-11-26').limitCents)).toBe('$400.00');
    expect(day('2026-11-26').overUnderCents!).toBeLessThan(0); // under
    expect(formatDollars(day('2026-11-28').runningCents)).toBe('$197.33');
    expect(formatDollars(day('2026-11-28').runningLimitCents)).toBe('$1,200.00');
  });
  it('days with no entries are blank', () => {
    const d = day('2026-11-29');
    expect(d.hasEntries).toBe(false);
    expect(d.rate).toBeUndefined();
    expect(d.overUnderCents).toBeUndefined();
  });
  it('yen by category combines card and cash', () => {
    expect(day('2026-11-26').yenByCategory.Food).toBe(2400);
  });
});

describe('summary', () => {
  it('totals', () => {
    expect(formatDollars(sum.totalSpentCents)).toBe('$197.33');
    expect(formatYen(sum.totalYen)).toBe('¥31,200');
    expect(formatRate(sum.overallRate)).toBe('158.11');
    expect(formatYen(sum.cashOnHandYen)).toBe('¥24,400');
    expect(sum.daysWithSpending).toBe(3);
    expect(formatDollars(sum.averagePerDayCents!)).toBe('$65.78');
    expect(formatDollars(sum.dailyLimitCents)).toBe('$400.00');
    expect(formatDollars(sum.remainingCents)).toBe('$9,802.67');
  });
  it('status, days left, left per day', () => {
    expect(sum.status).toBe('On pace');
    expect(sum.daysLeft).toBe(22);
    expect(formatDollars(sum.leftPerDayCents!)).toBe('$445.58');
    expect(sum.daysOver).toBe(0);
    expect(sum.daysUnder).toBe(3);
  });
  it('biggest / smallest day and day rates', () => {
    expect(sum.biggestDay!.date).toBe('2026-11-27');
    expect(sum.smallestDay!.date).toBe('2026-11-28');
    expect(sum.bestDayRate!.date).toBe('2026-11-26');
    expect(sum.worstDayRate!.date).toBe('2026-11-28');
  });
  it('category dollars', () => {
    const c = Object.fromEntries(sum.byCategory.map((x) => [x.category, formatDollars(x.cents)]));
    expect(c).toEqual({
      Food: '$15.33',
      Shopping: '$50.00',
      Suica: '$21.33',
      Activities: '$10.67',
      Transportation: '$100.00',
      Misc: '$0.00',
    });
    const pct = sum.byCategory.reduce((t, x) => t + (x.pct ?? 0), 0);
    expect(pct).toBeCloseTo(100, 6);
  });
  it('by payment', () => {
    expect(formatDollars(sum.byPayment.cards['Apple Card'])).toBe('$110.00');
    expect(formatDollars(sum.byPayment.cards['Capital One'])).toBe('$50.00');
    expect(formatDollars(sum.byPayment.cash)).toBe('$37.33');
    expect(sum.byPayment.noCard).toBe(0);
  });
  it('not started when nothing is logged', () => {
    const s = computeSummary({ cardCharges: [], cashPurchases: [], cashBought: [] }, S, '2026-11-01');
    expect(s.status).toBe('Not started');
    expect(s.daysLeft).toBe(25);
    expect(s.totalSpentCents).toBe(0);
  });
  it('over pace when projection exceeds the ceiling', () => {
    const big: Data = {
      ...data,
      cardCharges: [{ id: 'z', date: '2026-11-26', category: 'Misc', card: 'Apple Card', yen: 1, cents: 100_000 }],
      cashPurchases: [],
    };
    expect(computeSummary(big, S, today).status).toBe('Over pace'); // $1,000/day × 25 > $10,000
  });
  it('entries outside trip dates are reported, not counted', () => {
    const d: Data = {
      ...data,
      cardCharges: [...data.cardCharges, { id: 'o', date: '2026-11-20', category: 'Misc', card: '', yen: 1000, cents: 700 }],
    };
    const s = computeSummary(d, S, today);
    expect(s.outside.cardCharges).toHaveLength(1);
    expect(formatDollars(s.totalSpentCents)).toBe('$197.33');
  });
  it('card charge with no card is its own bucket', () => {
    const d: Data = {
      ...data,
      cardCharges: [...data.cardCharges, { id: 'n', date: '2026-11-26', category: 'Misc', card: '', cents: 500 }],
    };
    expect(computeSummary(d, S, today).byPayment.noCard).toBe(500);
  });
});

describe('no cash bought', () => {
  const noCash: Data = { ...data, cashBought: [] };
  const s = computeSummary(noCash, S, today);
  it('sets the banner flag and leaves cash dollars undefined', () => {
    expect(s.cashRateMissing).toBe(true);
    expect(s.cashRate).toBeUndefined();
    const d = computeDays(noCash, S).find((x) => x.date === '2026-11-28')!;
    expect(d.cashYen).toBe(1600);
    expect(d.cashCents).toBeUndefined();
  });
  it('does not guess a rate: totals count card dollars only', () => {
    expect(formatDollars(s.totalSpentCents)).toBe('$160.00');
  });
  it('flag is clear once cash is bought', () => expect(sum.cashRateMissing).toBe(false));
});

describe('formatting', () => {
  it('yen and dollars', () => {
    expect(formatYen(1600)).toBe('¥1,600');
    expect(formatDollars(1000)).toBe('$10.00');
    expect(formatDollars(1_000_000)).toBe('$10,000.00');
    expect(formatDollars(-5)).toBe('-$0.05');
  });
});

import { tripFraction, tripPhase } from './calc';
describe('status of a finished trip', () => {
  const after = '2027-01-02';
  it('judges by what was actually spent, not a projection', () => {
    // One expensive day logged out of 25: the old projection ($1,000/day x 25) wrongly said over pace.
    const oneDay: Data = {
      cardCharges: [{ id: 'z', date: '2026-11-26', category: 'Misc', card: '', yen: 1, cents: 80000 }],
      cashPurchases: [],
      cashBought: [],
    };
    expect(computeSummary(oneDay, S, '2026-11-27').status).toBe('Over pace'); // still in progress: projection applies
    expect(computeSummary(oneDay, S, after).status).toBe('On pace'); // finished: $800 of $10,000
    expect(computeSummary(oneDay, S, after).projectedCents).toBe(80000);
  });
  it('is over pace only if the real total passed the ceiling', () => {
    const over: Data = {
      cardCharges: [{ id: 'y', date: '2026-11-26', category: 'Misc', card: '', yen: 1, cents: 1_100_000 }],
      cashPurchases: [],
      cashBought: [],
    };
    expect(computeSummary(over, S, after).status).toBe('Over pace');
  });
  it('stays Not started with nothing logged', () => {
    expect(computeSummary({ cardCharges: [], cashPurchases: [], cashBought: [] }, S, after).status).toBe('Not started');
  });
});

describe('trip average', () => {
  it('is the total over every day of the trip', () => {
    expect(formatDollars(sum.tripAverageCents)).toBe('$7.89'); // $197.33 / 25 days
  });
  it('is zero with nothing logged', () => {
    expect(computeSummary({ cardCharges: [], cashPurchases: [], cashBought: [] }, S, '2027-01-02').tripAverageCents).toBe(0);
  });
});

describe('left today', () => {
  it('is the daily limit minus today\'s spending, during the trip only', () => {
    expect(formatDollars(computeSummary(data, S, '2026-11-28').leftTodayCents!)).toBe('$389.33'); // $400.00 - $10.67
    expect(formatDollars(computeSummary(data, S, '2026-11-29').leftTodayCents!)).toBe('$400.00'); // nothing logged today
    expect(formatDollars(computeSummary(data, S, '2026-11-28').spentTodayCents!)).toBe('$10.67');
    expect(computeSummary(data, S, '2026-11-17').spentTodayCents).toBeUndefined();
    expect(computeSummary(data, S, '2026-11-17').leftTodayCents).toBeUndefined(); // before the trip
    expect(computeSummary(data, S, '2026-12-21').leftTodayCents).toBeUndefined(); // after the trip
  });
  it('goes negative when today is over the limit', () => {
    const big: Data = { ...data, cardCharges: [{ id: 'z', date: '2026-11-28', category: 'Misc', card: '', yen: 1, cents: 45000 }], cashPurchases: [] };
    expect(computeSummary(big, S, '2026-11-28').leftTodayCents).toBe(-5000);
  });
});

describe('focus day (the Today block)', () => {
  it('is today during the trip', () => {
    const f = computeSummary(data, S, '2026-11-28').focusDay;
    expect(f.kind).toBe('today');
    expect(f.date).toBe('2026-11-28');
    expect(formatDollars(f.spentCents)).toBe('$10.67');
    expect(formatDollars(f.leftCents)).toBe('$389.33');
  });
  it('is the first day before the trip starts', () => {
    const f = computeSummary(data, S, '2026-11-17').focusDay;
    expect(f.kind).toBe('upcoming');
    expect(f.date).toBe('2026-11-26');
    expect(formatDollars(f.spentCents)).toBe('$65.33'); // entries logged on 11/26
    expect(formatDollars(f.leftCents)).toBe('$334.67');
  });
  it('is the last day after the trip ends', () => {
    const f = computeSummary(data, S, '2027-01-02').focusDay;
    expect(f.kind).toBe('past');
    expect(f.date).toBe('2026-12-20');
    expect(f.spentCents).toBe(0);
  });
});

describe('trip phase', () => {
  it('describes before, during and after', () => {
    expect(tripPhase(S, '2026-11-17')).toBe('Starts in 9 days');
    expect(tripPhase(S, '2026-11-25')).toBe('Starts in 1 day');
    expect(tripPhase(S, '2026-11-26')).toBe('Day 1 / 25');
    expect(tripPhase(S, '2026-11-28')).toBe('Day 3 / 25');
    expect(tripPhase(S, '2026-12-20')).toBe('Day 25 / 25');
    expect(tripPhase(S, '2026-12-21')).toBe('Finished');
  });
  it('fraction runs from 0 to 1', () => {
    expect(tripFraction(S, '2026-11-01')).toBe(0);
    expect(tripFraction(S, '2026-12-20')).toBe(1);
    expect(tripFraction(S, '2027-01-01')).toBe(1);
    expect(tripFraction(S, '2026-11-28')).toBeCloseTo(3 / 25, 10);
  });
});
