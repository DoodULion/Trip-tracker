/**
 * The figures a custom Summary card can show, and simple formulas built from them.
 * Pure: no UI, no storage. Every figure comes from `computeSummary`, so it follows the same rules
 * as the rest of the app (real amounts, blanks instead of invented zeros).
 */
import { formatDollars, formatRateUnit, formatYen, type DayRow, type Summary } from './calc';
import { getCurrency } from './currency';
import { dayLabel } from './money';

/** What a figure measures. Formulas only combine units that make sense together. */
export type Unit = 'usd' | 'yen' | 'rate' | 'count' | 'pct' | 'text';

/** The trip's currency sign for labels: "¥", "€", "kr". */
const sym = () => getCurrency().symbol.trim();

/** A figure: dollars in cents, local currency, local currency per $, a count, a percent, or plain text. Undefined value = blank. */
export interface StatValue {
  value: number | undefined;
  unit: Unit;
  /** Shown instead of the number (status labels). */
  text?: string;
  /** A short note after the figure, such as the date of the biggest day. */
  note?: string;
}

export interface StatDef {
  id: string;
  label: string;
  group: 'Budget' | 'Today' | 'Days' | 'Rates and cash' | 'By category' | 'By payment';
}

/** Stat ids: fixed names, plus `cat:<category>` and `card:<card>` for each category and card. */
const FIXED: StatDef[] = [
  { id: 'totalSpent', label: 'Total spent', group: 'Budget' },
  { id: 'remaining', label: 'Remaining', group: 'Budget' },
  { id: 'ceiling', label: 'Budget ceiling', group: 'Budget' },
  { id: 'dailyLimit', label: 'Daily limit', group: 'Budget' },
  { id: 'leftPerDay', label: 'Left per day', group: 'Budget' },
  { id: 'averagePerDay', label: 'Average per spending day', group: 'Budget' },
  { id: 'tripAverage', label: 'Average per trip day', group: 'Budget' },
  { id: 'projected', label: 'Projected total', group: 'Budget' },
  { id: 'status', label: 'Pace', group: 'Budget' },
  { id: 'totalYen', label: 'Total spent (local)', group: 'Budget' },
  { id: 'spentToday', label: 'Spent today', group: 'Today' },
  { id: 'leftToday', label: 'Left today', group: 'Today' },
  { id: 'tripLength', label: 'Trip length (days)', group: 'Days' },
  { id: 'daysLeft', label: 'Days left', group: 'Days' },
  { id: 'daysWithSpending', label: 'Days with spending', group: 'Days' },
  { id: 'daysOver', label: 'Days over the limit', group: 'Days' },
  { id: 'daysUnder', label: 'Days under the limit', group: 'Days' },
  { id: 'biggestDay', label: 'Biggest day', group: 'Days' },
  { id: 'smallestDay', label: 'Smallest day', group: 'Days' },
  { id: 'cashOnHand', label: 'Cash on hand', group: 'Rates and cash' },
  { id: 'overallRate', label: 'Overall rate', group: 'Rates and cash' },
  { id: 'cashRate', label: 'Cash rate', group: 'Rates and cash' },
  { id: 'cardRate', label: 'Card rate', group: 'Rates and cash' },
  { id: 'bestDayRate', label: 'Best day rate', group: 'Rates and cash' },
  { id: 'worstDayRate', label: 'Worst day rate', group: 'Rates and cash' },
  { id: 'cashSpent', label: 'Cash spent ($)', group: 'By payment' },
  { id: 'cardSpent', label: 'All cards ($)', group: 'By payment' },
];

/** Every figure on offer for a trip: the fixed ones, one per category, one per card. */
export function statCatalog(categories: readonly string[], cards: readonly string[]): StatDef[] {
  return [
    ...FIXED.map((d) => (d.id === 'totalYen' ? { ...d, label: `Total spent (${sym()})` } : d)),
    ...categories.map((c): StatDef => ({ id: `cat:${c}`, label: `${c} ($)`, group: 'By category' })),
    ...categories.map((c): StatDef => ({ id: `catyen:${c}`, label: `${c} (${sym()})`, group: 'By category' })),
    ...cards.map((c): StatDef => ({ id: `card:${c}`, label: `${c} ($)`, group: 'By payment' })),
  ];
}

/** The label for a stat id, also for a category or card the trip no longer has. */
export function statLabel(id: string): string {
  const fixed = FIXED.find((d) => d.id === id);
  if (fixed) return id === 'totalYen' ? `Total spent (${sym()})` : fixed.label;
  if (id.startsWith('catyen:')) return `${id.slice(7)} (${sym()})`;
  if (id.startsWith('cat:')) return `${id.slice(4)} ($)`;
  if (id.startsWith('card:')) return `${id.slice(5)} ($)`;
  return id;
}

const usd = (value: number | undefined, note?: string): StatValue => ({ value, unit: 'usd', note });
const count = (value: number | undefined): StatValue => ({ value, unit: 'count' });
const rate = (value: number | undefined, note?: string): StatValue => ({ value, unit: 'rate', note });

/** The value of one figure for a trip. Unknown ids are blank. */
export function statValue(id: string, s: Summary, ceilingCents: number): StatValue {
  switch (id) {
    case 'totalSpent': return usd(s.totalSpentCents);
    case 'remaining': return usd(s.remainingCents);
    case 'ceiling': return usd(ceilingCents);
    case 'dailyLimit': return usd(s.dailyLimitCents);
    case 'leftPerDay': return usd(s.leftPerDayCents);
    case 'averagePerDay': return usd(s.averagePerDayCents);
    case 'tripAverage': return usd(s.tripAverageCents);
    case 'projected': return usd(s.projectedCents);
    case 'status': return { value: undefined, unit: 'text', text: s.status };
    case 'totalYen': return { value: s.totalYen, unit: 'yen' };
    case 'spentToday': return usd(s.spentTodayCents);
    case 'leftToday': return usd(s.leftTodayCents);
    case 'tripLength': return count(s.tripLength);
    case 'daysLeft': return count(s.daysLeft);
    case 'daysWithSpending': return count(s.daysWithSpending);
    case 'daysOver': return count(s.daysOver);
    case 'daysUnder': return count(s.daysUnder);
    case 'biggestDay': return usd(s.biggestDay?.cents, s.biggestDay && dayLabel(s.biggestDay.date));
    case 'smallestDay': return usd(s.smallestDay?.cents, s.smallestDay && dayLabel(s.smallestDay.date));
    case 'cashOnHand': return { value: s.cashOnHandYen, unit: 'yen' };
    case 'overallRate': return rate(s.overallRate);
    case 'cashRate': return rate(s.cashRate);
    case 'cardRate': return rate(s.cardRate);
    case 'bestDayRate': return rate(s.bestDayRate?.rate, s.bestDayRate && dayLabel(s.bestDayRate.date));
    case 'worstDayRate': return rate(s.worstDayRate?.rate, s.worstDayRate && dayLabel(s.worstDayRate.date));
    case 'cashSpent': return usd(s.cashRateMissing && s.byPayment.cash === 0 ? undefined : s.byPayment.cash);
    case 'cardSpent': return usd(Object.values(s.byPayment.cards).reduce((t, c) => t + c, 0) + s.byPayment.noCard);
  }
  if (id.startsWith('catyen:')) {
    const c = s.byCategory.find((x) => x.category === id.slice(7));
    return { value: c ? c.yen : undefined, unit: 'yen' };
  }
  if (id.startsWith('cat:')) return usd(s.byCategory.find((x) => x.category === id.slice(4))?.cents);
  if (id.startsWith('card:')) return usd(s.byPayment.cards[id.slice(5)]);
  return { value: undefined, unit: 'text' };
}

export type Op = '+' | '-' | '*' | '/';
export const OPS: { op: Op; label: string }[] = [
  { op: '+', label: '+' },
  { op: '-', label: '−' },
  { op: '*', label: '×' },
  { op: '/', label: '÷' },
];

/** A formula: one figure combined with another figure or with a plain number. */
export interface Formula {
  a: string;
  op: Op;
  /** A stat id, or a plain number (dollars when added to or taken from a dollar figure). */
  b: string | number;
}

/**
 * The unit of `a op b`, or undefined when the two don't combine (dollars plus yen, a status label, ...).
 * `b` is 'number' for a plain number.
 */
export function formulaUnit(a: Unit, op: Op, b: Unit | 'number'): Unit | undefined {
  if (a === 'text' || b === 'text') return undefined;
  if (op === '+' || op === '-') return b === 'number' || a === b ? a : undefined;
  if (op === '*') {
    if (b === 'number' || b === 'count' || b === 'pct') return a;
    if (a === 'count') return b;
    return undefined;
  }
  // division
  if (b === 'number' || b === 'count') return a;
  if (a === b) return 'pct';
  if (a === 'yen' && b === 'usd') return 'rate';
  return undefined;
}

/** Work out a formula. Blank when a figure is blank, the units don't combine, or it divides by zero. */
export function formulaValue(f: Formula, s: Summary, ceilingCents: number): StatValue {
  const A = statValue(f.a, s, ceilingCents);
  const B: StatValue | number = typeof f.b === 'number' ? f.b : statValue(f.b, s, ceilingCents);
  const unit = formulaUnit(A.unit, f.op, typeof B === 'number' ? 'number' : B.unit);
  if (!unit) return { value: undefined, unit: 'text' };
  const a = A.value;
  let b = typeof B === 'number' ? B : B.value;
  if (a === undefined || b === undefined || !Number.isFinite(b)) return { value: undefined, unit };
  // A plain number added to dollars is in dollars; figures in dollars are held in cents.
  if (typeof B === 'number' && (f.op === '+' || f.op === '-') && A.unit === 'usd') b = Math.round(b * 100);
  // A percent used as a multiplier means "of": 50% → 0.5.
  if (typeof B !== 'number' && B.unit === 'pct' && f.op === '*') b = b / 100;
  let v: number;
  switch (f.op) {
    case '+': v = a + b; break;
    case '-': v = a - b; break;
    case '*': v = a * b; break;
    case '/':
      if (b === 0) return { value: undefined, unit };
      if (unit === 'pct') v = (a / b) * 100;
      else if (unit === 'rate') v = (a * 100) / b; // yen ÷ dollars (cents) = yen per $
      else v = a / b;
      break;
  }
  // Money stays in whole cents and whole yen.
  if (unit === 'usd' || unit === 'yen') v = Math.round(v);
  return { value: v, unit };
}

/** A short readable name for a formula, such as "Remaining ÷ Days left". */
export function formulaLabel(f: Formula): string {
  const op = OPS.find((o) => o.op === f.op)?.label ?? f.op;
  return `${statLabel(f.a)} ${op} ${typeof f.b === 'number' ? String(f.b) : statLabel(f.b)}`;
}

/** A figure as text: `$10.00`, `¥1,600` (the trip's currency), `158.11`, `12`, `45.0%`, or `—` when blank. */
export function formatStat(v: StatValue): string {
  if (v.text !== undefined) return v.text;
  if (v.value === undefined) return '—';
  switch (v.unit) {
    case 'usd': return formatDollars(v.value);
    case 'yen': return formatYen(v.value);
    case 'rate': return formatRateUnit(v.value) || '—';
    case 'pct': return `${v.value.toFixed(1)}%`;
    case 'count': return Number.isInteger(v.value) ? String(v.value) : v.value.toFixed(2);
    default: return String(v.value);
  }
}

/* ---------- the Summary layout ---------- */

/** A Summary card: one of the three built-in cards, or one the owner made from figures and formulas. */
export type CardItem = { stat: string } | { formula: Formula; label?: string };
/**
 * How a custom card shows its data. `auto`: one item as a big number, several as a list.
 * `tiles`, `bars` and `donut` use the card's items; `daily` draws one series over the trip days instead.
 */
export type Display = 'auto' | 'tiles' | 'bars' | 'donut' | 'daily';
export const DISPLAYS: { id: Display; label: string }[] = [
  { id: 'auto', label: 'Numbers (big number or list)' },
  { id: 'tiles', label: 'Tiles' },
  { id: 'bars', label: 'Bar chart (compare figures)' },
  { id: 'donut', label: 'Pie chart (share of a total)' },
  { id: 'daily', label: 'Daily chart (over the trip)' },
];

export type SummaryCard =
  | { id: 'today' | 'budget' | 'categories'; kind: 'builtin' }
  | { id: string; kind: 'custom'; title: string; items: CardItem[]; display?: Display; series?: string };

/* ---------- daily series (one value per trip day) ---------- */

export interface SeriesDef {
  id: string;
  label: string;
  unit: 'usd' | 'yen' | 'rate';
  /** Bars for amounts per day, a line for running totals and rates. */
  mark: 'bar' | 'line';
}

const series = (): SeriesDef[] => [
  { id: 'daySpend', label: 'Spent each day ($), with the daily limit', unit: 'usd', mark: 'bar' },
  { id: 'dayYen', label: `Spent each day (${sym()})`, unit: 'yen', mark: 'bar' },
  { id: 'running', label: 'Running total vs. running limit ($)', unit: 'usd', mark: 'line' },
  { id: 'dayRate', label: `Day rate (${sym()} per $)`, unit: 'rate', mark: 'line' },
];

/** The daily series on offer: the fixed ones plus yen per day for each category. */
export function seriesCatalog(categories: readonly string[]): SeriesDef[] {
  return [...series(), ...categories.map((c): SeriesDef => ({ id: `catday:${c}`, label: `${c} each day (${sym()})`, unit: 'yen', mark: 'bar' }))];
}

export function seriesDef(id: string): SeriesDef | undefined {
  if (id.startsWith('catday:')) return { id, label: `${id.slice(7)} each day (${sym()})`, unit: 'yen', mark: 'bar' };
  return series().find((d) => d.id === id);
}

export interface SeriesPoint {
  date: string;
  /** Blank (undefined) on days with no entries, and after today for running totals. */
  value: number | undefined;
  /** The comparison line: the daily limit, or the running limit. */
  ref?: number;
}

/** One value per trip day for a series. Days with no entries are blank, never zero. */
export function dailySeries(id: string, days: DayRow[], today: string): SeriesPoint[] {
  return days.map((d): SeriesPoint => {
    switch (id) {
      case 'daySpend': return { date: d.date, value: d.hasEntries ? d.totalCents : undefined, ref: d.limitCents };
      case 'dayYen': return { date: d.date, value: d.hasEntries ? d.totalYen : undefined };
      case 'dayRate': return { date: d.date, value: d.rate };
      case 'running': return { date: d.date, value: d.date <= today ? d.runningCents : undefined, ref: d.runningLimitCents };
    }
    if (id.startsWith('catday:')) {
      const y = d.yenByCategory[id.slice(7)];
      return { date: d.date, value: d.hasEntries ? (y ?? 0) : undefined };
    }
    return { date: d.date, value: undefined };
  });
}

export const BUILTIN_CARDS: { id: 'today' | 'budget' | 'categories'; label: string }[] = [
  { id: 'today', label: 'Today (or Trip summary once it ends)' },
  { id: 'budget', label: 'Budget' },
  { id: 'categories', label: 'By category' },
];

export const DEFAULT_LAYOUT: SummaryCard[] = BUILTIN_CARDS.map((b) => ({ id: b.id, kind: 'builtin' }));

/** Read a stored layout, dropping anything malformed; falls back to the default cards. */
export function parseLayout(raw: unknown): SummaryCard[] {
  if (!Array.isArray(raw)) return DEFAULT_LAYOUT;
  const out: SummaryCard[] = [];
  const seen = new Set<string>();
  for (const c of raw) {
    if (!c || typeof c !== 'object' || typeof c.id !== 'string' || seen.has(c.id)) continue;
    if (c.kind === 'builtin' && BUILTIN_CARDS.some((b) => b.id === c.id)) {
      out.push({ id: c.id, kind: 'builtin' });
      seen.add(c.id);
    } else if (c.kind === 'custom' && typeof c.title === 'string' && Array.isArray(c.items)) {
      const items = (c.items as unknown[]).filter(isItem);
      const display = DISPLAYS.some((d) => d.id === c.display) ? (c.display as Display) : undefined;
      const series = typeof c.series === 'string' && seriesDef(c.series) ? c.series : undefined;
      out.push({ id: c.id, kind: 'custom', title: c.title.slice(0, 40), items, ...(display ? { display } : {}), ...(series ? { series } : {}) });
      seen.add(c.id);
    }
  }
  return out;
}

function isItem(x: unknown): x is CardItem {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (typeof o.stat === 'string') return true;
  const f = o.formula as Record<string, unknown> | undefined;
  return !!f && typeof f.a === 'string' && ['+', '-', '*', '/'].includes(f.op as string) && (typeof f.b === 'string' || typeof f.b === 'number');
}
