import { formatLocal, getCurrency, rateUnit, scaleOf } from './currency';
/**
 * Pure calculation module. No UI, no storage, no clock (callers pass `today`).
 *
 * Money rules: yen are integer yen, dollars are integer cents when entered.
 * Dollar amounts derived from cash purchases are fractional cents (yen ÷ rate)
 * and are only rounded for display. Rates are yen per $ and are only rounded
 * when displayed.
 */

/** The six built-in categories, in their default order. The owner can delete any of them and add their own. */
export const CATEGORIES = ['Food', 'Shopping', 'Suica', 'Activities', 'Transportation', 'Misc'] as const;
/** A category name: one of the built-ins or one the owner added. */
export type Category = string;

/** The given category list (the owner's, or the built-ins), then any other name found on entries (e.g. one since deleted). */
export function allCategories(data: Data | undefined, list: readonly string[] = CATEGORIES): string[] {
  const out: string[] = [];
  const add = (c: string) => {
    if (c && !out.includes(c)) out.push(c);
  };
  list.forEach(add);
  if (data) {
    data.cardCharges.forEach((c) => add(c.category));
    data.cashPurchases.forEach((c) => add(c.category));
  }
  return out;
}

export interface Settings {
  tripStart: string; // YYYY-MM-DD
  tripEnd: string; // YYYY-MM-DD
  budgetCeilingCents: number;
  cards: string[];
}

/** A trip: its own dates, budget and cards. Entries belong to exactly one trip. */
export interface Trip extends Settings {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 code of the country travelled to (sets the flag and main color). Optional. */
  country?: string;
  /** Position on the trips list (lower first), set when the owner reorders. Optional. */
  order?: number;
  /** When the trip was created (ms since 1970), for newest-first ordering. Optional (older trips lack it). */
  createdAt?: number;
  /** The categories this trip offers on Add, in order (chosen in its trip settings). Older trips lack it: they offer the whole list. */
  categories?: string[];
}

/**
 * The categories a trip offers for new entries: its own choice, limited to categories that still exist
 * in the owner's list. A trip with no choice (or none left) offers the whole list.
 */
export function tripCategories(trip: Pick<Trip, 'categories'>, library: readonly string[]): string[] {
  const own = trip.categories?.filter((c) => library.includes(c));
  return own && own.length > 0 ? own : [...library];
}

/** How many entries (card charges and cash purchases) use each category, across the given trips' data. */
export function categoryUsage(datas: Data[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of datas) for (const e of [...d.cardCharges, ...d.cashPurchases]) out[e.category] = (out[e.category] ?? 0) + 1;
  return out;
}

/**
 * The owner's categories ordered for picking: most used on past trips first, then the rest in list order.
 * `usual` is just the ones used before, in that order (empty when there is no history yet).
 */
export function suggestCategories(library: readonly string[], usage: Record<string, number>): { ordered: string[]; usual: string[] } {
  const ordered = [...library].sort((a, b) => (usage[b] ?? 0) - (usage[a] ?? 0) || library.indexOf(a) - library.indexOf(b));
  return { ordered, usual: ordered.filter((c) => (usage[c] ?? 0) > 0) };
}

export const DEFAULT_SETTINGS: Settings = {
  tripStart: '2026-11-26',
  tripEnd: '2026-12-20',
  budgetCeilingCents: 1_000_000,
  cards: ['Apple Card', 'Capital One'],
};

export interface CardCharge {
  id: string;
  date: string;
  category: Category;
  card: string; // '' = no card picked
  yen?: number; // blank = priced in dollars
  cents?: number; // may be filled in later
  note?: string;
  /** Derived, never stored: the dollars are an estimate from that day's spot rate (see applyEstimates). */
  estimated?: boolean;
}

export interface CashPurchase {
  id: string;
  date: string;
  category: Category;
  yen: number;
  /** Optional: the dollars actually paid for this purchase. When set it replaces yen ÷ cash rate. */
  cents?: number;
  note?: string;
}

export interface CashBought {
  id: string;
  date: string;
  yen: number;
  cents: number; // paid, including fees
  where?: string;
}

export interface Data {
  cardCharges: CardCharge[];
  cashPurchases: CashPurchase[];
  cashBought: CashBought[];
}

// ---------- dates (calendar strings, no time zones) ----------

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

export function tripLength(s: Pick<Settings, 'tripStart' | 'tripEnd'>): number {
  return daysBetween(s.tripStart, s.tripEnd) + 1;
}

export function tripDates(s: Pick<Settings, 'tripStart' | 'tripEnd'>): string[] {
  const start = dayNumber(s.tripStart);
  const n = tripLength(s);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date((start + i) * 86_400_000);
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

export function inTrip(date: string, s: Pick<Settings, 'tripStart' | 'tripEnd'>): boolean {
  return date >= s.tripStart && date <= s.tripEnd;
}

// ---------- rates ----------

/** Yen per $ from integer yen and integer cents. Undefined unless both are positive. */
export function rateOf(yen: number, cents: number): number | undefined {
  if (yen > 0 && cents > 0) return (yen * 100) / cents;
  return undefined;
}

/** Cash rate = total yen received ÷ total dollars paid, over all cash bought. */
export function cashRateParts(bought: CashBought[]): { yen: number; cents: number } | undefined {
  const yen = sum(bought.map((b) => b.yen));
  const cents = sum(bought.map((b) => b.cents));
  return yen > 0 && cents > 0 ? { yen, cents } : undefined;
}

export function cashRate(bought: CashBought[]): number | undefined {
  const p = cashRateParts(bought);
  return p ? rateOf(p.yen, p.cents) : undefined;
}

/** Dollars (in fractional cents) for a cash yen amount. Undefined if no cash rate. */
export function cashYenToCents(yen: number, bought: CashBought[]): number | undefined {
  const p = cashRateParts(bought);
  if (!p) return undefined;
  return (yen * p.cents) / p.yen; // yen ÷ (p.yen / p.cents)
}

/**
 * Dollars (fractional cents) for a set of cash purchases: each purchase's own dollars when given,
 * otherwise its yen ÷ the cash rate. Undefined when some purchase needs the cash rate and there is none
 * (and, with no purchases at all, undefined when no cash has been bought, as before).
 */
export function cashPurchasesCents(purchases: CashPurchase[], bought: CashBought[]): number | undefined {
  if (purchases.length === 0) return cashYenToCents(0, bought);
  const fixed = sum(purchases.filter((p) => p.cents !== undefined).map((p) => p.cents!));
  const rateYen = sum(purchases.filter((p) => p.cents === undefined).map((p) => p.yen));
  if (rateYen === 0) return fixed;
  const converted = cashYenToCents(rateYen, bought);
  return converted === undefined ? undefined : fixed + converted;
}

/** Card rate over charges that have both real yen and dollars (estimates excluded); optionally for one card. */
export function cardRate(charges: CardCharge[], card?: string): number | undefined {
  let yen = 0;
  let cents = 0;
  for (const c of charges) {
    if (card !== undefined && c.card !== card) continue;
    if (c.yen && c.cents && !c.estimated) {
      yen += c.yen;
      cents += c.cents;
    }
  }
  return rateOf(yen, cents);
}

function sum(xs: number[]): number {
  let t = 0;
  for (const x of xs) t += x;
  return t;
}

// ---------- per-day ----------

export interface DayRow {
  date: string;
  hasEntries: boolean;
  cardYen: number;
  cardCents: number;
  cashYen: number;
  /** undefined when cash was spent but no cash has been bought (rate unknown). */
  cashCents: number | undefined;
  totalYen: number;
  /** Card dollars + cash dollars. Cash counts as 0 while its rate is unknown. */
  totalCents: number;
  /** Total ¥ ÷ Total $, only when both are present. */
  rate: number | undefined;
  yenByCategory: Record<Category, number>;
  limitCents: number;
  /** Total $ − daily limit. Positive = over (red), negative = under (green). Undefined on blank days. */
  overUnderCents: number | undefined;
  runningCents: number;
  runningLimitCents: number;
}

function emptyCategoryMap(names: string[]): Record<Category, number> {
  return Object.fromEntries(names.map((c) => [c, 0])) as Record<Category, number>;
}

export function dailyLimitCents(s: Settings): number {
  return s.budgetCeilingCents / tripLength(s);
}

export function computeDays(data: Data, s: Settings): DayRow[] {
  const limit = dailyLimitCents(s);
  const names = allCategories(data);
  let running = 0;
  return tripDates(s).map((date, i) => {
    const charges = data.cardCharges.filter((c) => c.date === date);
    const cash = data.cashPurchases.filter((c) => c.date === date);
    const cardYen = sum(charges.map((c) => c.yen ?? 0));
    const cardCents = sum(charges.map((c) => c.cents ?? 0));
    const cashYen = sum(cash.map((c) => c.yen));
    const cashCents = cash.length === 0 ? 0 : cashPurchasesCents(cash, data.cashBought);
    const hasEntries = charges.length + cash.length > 0;
    const totalYen = cardYen + cashYen;
    const totalCents = cardCents + (cashCents ?? 0);
    // The day rate uses real amounts only: a card charge still waiting for its dollars (estimated or not)
    // is left out on both sides, so a market-rate estimate never shows up as one of the owner's rates.
    const pending = charges.filter((c) => c.yen && (c.cents === undefined || c.estimated));
    const rateYen = cardYen + cashYen - sum(pending.map((c) => c.yen ?? 0));
    const rateCents = totalCents - sum(pending.map((c) => (c.estimated ? (c.cents ?? 0) : 0)));
    const yenByCategory = emptyCategoryMap(names);
    for (const c of charges) yenByCategory[c.category] += c.yen ?? 0;
    for (const c of cash) yenByCategory[c.category] += c.yen;
    running += totalCents;
    return {
      date,
      hasEntries,
      cardYen,
      cardCents,
      cashYen,
      cashCents,
      totalYen,
      totalCents,
      rate: rateYen > 0 && rateCents > 0 ? (rateYen * 100) / rateCents : undefined,
      yenByCategory,
      limitCents: limit,
      overUnderCents: hasEntries ? totalCents - limit : undefined,
      runningCents: running,
      runningLimitCents: limit * (i + 1),
    };
  });
}

// ---------- trip summary ----------

export type Status = 'Not started' | 'On pace' | 'Over pace';

export interface CategoryTotal {
  category: Category;
  cents: number;
  yen: number;
  /** Share of total spent, 0–100. Undefined when nothing is spent. */
  pct: number | undefined;
}

export interface Summary {
  tripLength: number;
  dailyLimitCents: number;
  totalSpentCents: number;
  /** Total spent divided by every day of the trip (used by the completed-trip summary). */
  tripAverageCents: number;
  totalYen: number;
  remainingCents: number;
  daysLeft: number;
  /** Undefined when no days are left. */
  leftPerDayCents: number | undefined;
  /**
   * The day the Today block describes: today during the trip, the first day before it starts,
   * the last day after it ends. Always defined.
   */
  focusDay: { date: string; kind: 'today' | 'upcoming' | 'past'; spentCents: number; leftCents: number };
  /** Dollars spent today. Undefined when today is outside the trip dates. */
  spentTodayCents: number | undefined;
  /** Today's daily limit minus today's spending. Undefined when today is outside the trip dates. Negative = over. */
  leftTodayCents: number | undefined;
  daysWithSpending: number;
  averagePerDayCents: number | undefined;
  projectedCents: number | undefined;
  status: Status;
  byCategory: CategoryTotal[];
  byPayment: {
    cards: Record<string, number>; // cents per card name
    noCard: number;
    cash: number;
  };
  cashOnHandYen: number;
  cashRate: number | undefined;
  cardRate: number | undefined;
  cardRateByCard: Record<string, number | undefined>;
  overallRate: number | undefined;
  /** True when cash was spent (or could be) but no cash has been bought: show "Add the cash you bought". */
  cashRateMissing: boolean;
  biggestDay: { date: string; cents: number } | undefined;
  smallestDay: { date: string; cents: number } | undefined;
  daysOver: number;
  daysUnder: number;
  bestDayRate: { date: string; rate: number } | undefined;
  worstDayRate: { date: string; rate: number } | undefined;
  outside: { cardCharges: CardCharge[]; cashPurchases: CashPurchase[]; cashBought: CashBought[] };
}

export function daysLeft(today: string, s: Settings): number {
  if (today < s.tripStart) return tripLength(s);
  if (today > s.tripEnd) return 0;
  return daysBetween(today, s.tripEnd);
}

/**
 * Spending totals count only entries dated within the trip. Rates and cash on
 * hand use everything entered (cash bought is real money no matter its date).
 * Entries outside the trip dates are returned in `outside`.
 */
export function computeSummary(data: Data, s: Settings, today: string, categories: readonly string[] = CATEGORIES): Summary {
  const days = computeDays(data, s);
  const length = tripLength(s);
  const limit = dailyLimitCents(s);

  const trip = {
    cardCharges: data.cardCharges.filter((c) => inTrip(c.date, s)),
    cashPurchases: data.cashPurchases.filter((c) => inTrip(c.date, s)),
  };
  const outside = {
    cardCharges: data.cardCharges.filter((c) => !inTrip(c.date, s)),
    cashPurchases: data.cashPurchases.filter((c) => !inTrip(c.date, s)),
    cashBought: data.cashBought.filter((c) => !inTrip(c.date, s)),
  };

  const cardCents = sum(trip.cardCharges.map((c) => c.cents ?? 0));
  const cardYen = sum(trip.cardCharges.map((c) => c.yen ?? 0));
  const cashYen = sum(trip.cashPurchases.map((c) => c.yen));
  const cashCents = cashPurchasesCents(trip.cashPurchases, data.cashBought); // undefined if a rate is needed and missing (or nothing bought)
  const totalSpentCents = cardCents + (cashCents ?? 0);
  const remainingCents = s.budgetCeilingCents - totalSpentCents;

  const left = daysLeft(today, s);
  const spendingDays = days.filter((d) => d.hasEntries);
  const daysWithSpending = spendingDays.length;
  const averagePerDayCents = daysWithSpending > 0 ? totalSpentCents / daysWithSpending : undefined;
  // Once the trip is over there is nothing left to project: the final total is what was actually spent.
  const finished = today > s.tripEnd;
  const projectedCents =
    averagePerDayCents === undefined ? undefined : finished ? totalSpentCents : averagePerDayCents * length;
  const status: Status =
    projectedCents === undefined
      ? 'Not started'
      : projectedCents > s.budgetCeilingCents
        ? 'Over pace'
        : 'On pace';

  // By category
  const byCategory: CategoryTotal[] = allCategories(data, categories).map((category) => {
    const cc = trip.cardCharges.filter((c) => c.category === category);
    const ch = trip.cashPurchases.filter((c) => c.category === category);
    const chYen = sum(ch.map((c) => c.yen));
    const cents = sum(cc.map((c) => c.cents ?? 0)) + (ch.length ? (cashPurchasesCents(ch, data.cashBought) ?? 0) : 0);
    return {
      category,
      cents,
      yen: sum(cc.map((c) => c.yen ?? 0)) + chYen,
      pct: totalSpentCents > 0 ? (cents / totalSpentCents) * 100 : undefined,
    };
  });

  // By payment
  const cards: Record<string, number> = {};
  for (const name of s.cards) cards[name] = 0;
  let noCard = 0;
  for (const c of trip.cardCharges) {
    if (c.card === '') noCard += c.cents ?? 0;
    else cards[c.card] = (cards[c.card] ?? 0) + (c.cents ?? 0);
  }

  // Rates
  const allCardNames = new Set([...s.cards, ...data.cardCharges.map((c) => c.card).filter((n) => n !== '')]);
  const cardRateByCard: Record<string, number | undefined> = {};
  for (const name of allCardNames) cardRateByCard[name] = cardRate(data.cardCharges, name);

  const rateParts = cashRateParts(data.cashBought);
  const cashYenAll = sum(data.cashPurchases.map((c) => c.yen));
  const cashFixed = data.cashPurchases.filter((c) => c.cents !== undefined);
  const cashRated = data.cashPurchases.filter((c) => c.cents === undefined);
  const cashRatedYen = sum(cashRated.map((c) => c.yen));
  const cardWithBoth = data.cardCharges.filter((c) => c.yen && c.cents && !c.estimated);
  const overallYen = sum(cardWithBoth.map((c) => c.yen!)) + sum(cashFixed.map((c) => c.yen)) + (rateParts ? cashRatedYen : 0);
  const overallCents =
    sum(cardWithBoth.map((c) => c.cents!)) + sum(cashFixed.map((c) => c.cents!)) + (cashYenToCents(cashRatedYen, data.cashBought) ?? 0);

  // Day extremes (days with spending only)
  const withTotals = spendingDays.filter((d) => d.totalCents > 0);
  let biggestDay: Summary['biggestDay'];
  let smallestDay: Summary['smallestDay'];
  for (const d of withTotals) {
    if (!biggestDay || d.totalCents > biggestDay.cents) biggestDay = { date: d.date, cents: d.totalCents };
    if (!smallestDay || d.totalCents < smallestDay.cents) smallestDay = { date: d.date, cents: d.totalCents };
  }
  let bestDayRate: Summary['bestDayRate'];
  let worstDayRate: Summary['worstDayRate'];
  for (const d of days) {
    if (d.rate === undefined) continue;
    if (!bestDayRate || d.rate > bestDayRate.rate) bestDayRate = { date: d.date, rate: d.rate };
    if (!worstDayRate || d.rate < worstDayRate.rate) worstDayRate = { date: d.date, rate: d.rate };
  }

  return {
    tripLength: length,
    dailyLimitCents: limit,
    totalSpentCents,
    tripAverageCents: totalSpentCents / length,
    totalYen: cardYen + cashYen,
    remainingCents,
    daysLeft: left,
    leftPerDayCents: left > 0 ? remainingCents / left : undefined,
    focusDay: (() => {
      const kind = today < s.tripStart ? 'upcoming' : today > s.tripEnd ? 'past' : 'today';
      const date = kind === 'upcoming' ? s.tripStart : kind === 'past' ? s.tripEnd : today;
      const spentCents = days.find((d) => d.date === date)?.totalCents ?? 0;
      return { date, kind: kind as 'today' | 'upcoming' | 'past', spentCents, leftCents: limit - spentCents };
    })(),
    spentTodayCents: days.find((d) => d.date === today)?.totalCents,
    leftTodayCents: (() => {
      const todayRow = days.find((d) => d.date === today);
      return todayRow ? limit - todayRow.totalCents : undefined;
    })(),
    daysWithSpending,
    averagePerDayCents,
    projectedCents,
    status,
    byCategory,
    byPayment: { cards, noCard, cash: cashCents ?? 0 },
    cashOnHandYen: sum(data.cashBought.map((b) => b.yen)) - cashYenAll,
    cashRate: cashRate(data.cashBought),
    cardRate: cardRate(data.cardCharges),
    cardRateByCard,
    overallRate: rateOf(overallYen, overallCents),
    cashRateMissing: !rateParts,
    biggestDay,
    smallestDay,
    daysOver: spendingDays.filter((d) => d.overUnderCents! > 0).length,
    daysUnder: spendingDays.filter((d) => d.overUnderCents! < 0).length,
    bestDayRate,
    worstDayRate,
    outside,
  };
}

// ---------- estimates for card charges still missing dollars ----------

/**
 * The yen-per-dollar rate to estimate a charge on `date` with: that day's market (spot) rate when known,
 * else the closest earlier known day, else the latest known, else the owner's own card rate.
 * `spot` maps YYYY-MM-DD to yen per $.
 */
export function estimateRateFor(date: string, spot: Record<string, number>, fallback: number | undefined): number | undefined {
  if (spot[date]) return spot[date];
  const days = Object.keys(spot).sort();
  let best: string | undefined;
  for (const d of days) if (d <= date) best = d;
  if (best) return spot[best];
  if (days.length) return spot[days[days.length - 1]];
  return fallback;
}

/**
 * The data with an estimated dollar amount on every card charge that has yen but no dollars yet
 * (marked `estimated`), so totals and today's left-over reflect it. Real entries are never changed.
 */
export function applyEstimates(data: Data, spot: Record<string, number>): Data {
  if (!data.cardCharges.some((c) => c.cents === undefined && c.yen)) return data;
  const fallback = cardRate(data.cardCharges);
  return {
    ...data,
    cardCharges: data.cardCharges.map((c) => {
      if (c.cents !== undefined || !c.yen) return c;
      const rate = estimateRateFor(c.date, spot, fallback);
      return rate ? { ...c, cents: Math.round((c.yen * 100) / rate), estimated: true } : c;
    }),
  };
}

// ---------- display helpers ----------

/** A local-currency amount (whole minor units) in the currency of the trip being viewed: yen by default. */
export function formatYen(minor: number): string {
  return formatLocal(minor);
}

/** `cents` may be fractional (cash dollars); rounds to the nearest cent for display only. */
export function formatDollars(cents: number): string {
  const r = Math.round(Math.abs(cents));
  const s = `$${Math.floor(r / 100).toLocaleString('en-US')}.${String(r % 100).padStart(2, '0')}`;
  return cents < 0 && r !== 0 ? `-${s}` : s;
}

/** A rate (local currency per $) to 2 decimals. Rates are held on the minor-unit scale, so euros divide by 100. */
export function formatRate(rate: number | undefined): string {
  return rate === undefined ? '' : (rate / scaleOf(getCurrency())).toFixed(2);
}

/** A rate with its unit, for display: "155.34 ¥/$" (blank when there is no rate). */
export function formatRateUnit(rate: number | undefined): string {
  return rate === undefined ? '' : `${formatRate(rate)} ${rateUnit()}`;
}

/** Where "today" falls relative to a trip, as short text: "Starts in 9 days", "Day 3 / 25", "Finished". */
export function tripPhase(t: Pick<Settings, 'tripStart' | 'tripEnd'>, today: string): string {
  if (today < t.tripStart) {
    const n = daysBetween(today, t.tripStart);
    return `Starts in ${n} ${n === 1 ? 'day' : 'days'}`;
  }
  if (today > t.tripEnd) return 'Finished';
  return `Day ${daysBetween(t.tripStart, today) + 1} / ${tripLength(t)}`;
}

/** How far along the trip is, 0 to 1 (for the route bar on the trips list). */
export function tripFraction(t: Pick<Settings, 'tripStart' | 'tripEnd'>, today: string): number {
  if (today < t.tripStart) return 0;
  if (today > t.tripEnd) return 1;
  return (daysBetween(t.tripStart, today) + 1) / tripLength(t);
}
