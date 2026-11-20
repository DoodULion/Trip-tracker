import { useToday } from './useToday';
import { useMemo } from 'react';
import { computeSummary, formatDollars, formatRateUnit, formatYen } from './calc';
import { Bars, type ChartRow } from './CardCharts';
import { Big, Fig } from './Figures';
import Icon from './icons';
import { dayLabel } from './money';
import type { Store } from './store';

/**
 * The trip's numbers behind the Summary, in the same figure-first language: what your dollars got you
 * (rates), the cash in your pocket, how you paid, and how the days went.
 */
export default function Stats({ store }: { store: Store }) {
  const { data, settings } = store;
  const today = useToday();
  const s = useMemo(() => computeSummary(store.calcData, settings, today), [store.calcData, settings, today]);
  // Cards with a charge still missing dollars have an estimate inside their total.
  const estimatedCards = new Set(store.calcData.cardCharges.filter((c) => c.estimated).map((c) => c.card ?? ''));
  // A domestic trip is all dollars: no exchange rates or cash bought, so only payments and days are shown.
  const dom = store.domestic;
  const cashMissing = !dom && s.cashRateMissing && data.cashPurchases.length > 0;
  const boughtYen = data.cashBought.reduce((t, b) => t + b.yen, 0);
  const boughtCents = data.cashBought.reduce((t, b) => t + b.cents, 0);
  const cardRates = Object.entries(s.cardRateByCard);
  const rate = (r: number | undefined) => formatRateUnit(r) || '—';

  const payRows: ChartRow[] = [
    ...Object.entries(s.byPayment.cards).map(([name, cents]): ChartRow => ({
      label: name,
      text: `${estimatedCards.has(name) ? '≈' : ''}${formatDollars(cents)}`,
      value: cents,
      unit: 'usd',
    })),
    ...(s.byPayment.noCard > 0
      ? [{ label: 'Card (none picked)', text: `${estimatedCards.has('') ? '≈' : ''}${formatDollars(s.byPayment.noCard)}`, value: s.byPayment.noCard, unit: 'usd' } as ChartRow]
      : []),
    { label: 'Cash', text: cashMissing ? '—' : formatDollars(s.byPayment.cash), value: cashMissing ? undefined : s.byPayment.cash, unit: 'usd' },
  ];

  return (
    <div className="screen">
      <h1 className="page-title">Stats</h1>

      {cashMissing && <p className="banner">Add the cash you bought. Cash dollars stay blank until you do.</p>}

      <div className="stats-grid">
        {!dom && (
        <section className="card" aria-label="Rates">
          <h2>Rates</h2>
          <Big>{rate(s.overallRate)}</Big>
          <span className="muted small">Overall: what each dollar got you, fees included</span>
          <div className="rule">
            <div>
              <Fig>{rate(s.cashRate)}</Fig>
              <span>Cash</span>
            </div>
            <div>
              <Fig>{rate(s.cardRate)}</Fig>
              <span>All cards</span>
            </div>
            <div>
              <Fig>{s.bestDayRate ? rate(s.bestDayRate.rate) : '—'}</Fig>
              <span>Best day{s.bestDayRate ? `, ${dayLabel(s.bestDayRate.date).slice(4)}` : ''}</span>
            </div>
          </div>
          {(cardRates.length > 1 || s.worstDayRate) && (
            <dl className="kv">
              {cardRates.length > 1 &&
                cardRates.map(([name, r]) => (
                  <Pair key={name} k={name} v={rate(r)} />
                ))}
              {s.worstDayRate && <Pair k={`Worst day, ${dayLabel(s.worstDayRate.date).slice(4)}`} v={rate(s.worstDayRate.rate)} />}
            </dl>
          )}
        </section>
        )}

        {!dom && (
        <section className="card" aria-label="Cash">
          <h2>Cash</h2>
          <Big>{formatYen(s.cashOnHandYen)}</Big>
          <span className="muted small">On hand: bought minus spent</span>
          <div className="rule">
            <div>
              <Fig>{formatYen(boughtYen)}</Fig>
              <span>Bought</span>
            </div>
            <div>
              <Fig>{formatDollars(boughtCents)}</Fig>
              <span>Paid for it</span>
            </div>
            <div>
              <Fig>{cashMissing ? '—' : formatDollars(s.byPayment.cash)}</Fig>
              <span>Spent</span>
            </div>
          </div>
        </section>
        )}

        <section className="card" aria-label="By payment">
          <h2>By payment</h2>
          <Bars rows={payRows} />
          <p className="muted small">Each bar is sized against the largest of these, not as a share of the total.</p>
          {estimatedCards.size > 0 && <p className="muted small">≈ includes an estimate at the market rate for a charge still missing dollars.</p>}
        </section>

        <section className="card" aria-label="Days">
          <h2>Days</h2>
          <div className="rule">
            <div>
              <Fig>{String(s.daysWithSpending)}</Fig>
              <span>With spending</span>
            </div>
            <div>
              <Fig className={s.daysOver > 0 ? 'bad-text' : ''}>{String(s.daysOver)}</Fig>
              <span className={s.daysOver > 0 ? 'warn' : ''}>
                {s.daysOver > 0 && <Icon name="alert" />}
                Over the limit
              </span>
            </div>
            <div>
              <Fig>{String(s.daysUnder)}</Fig>
              <span>Under the limit</span>
            </div>
          </div>
          <dl className="kv">
            <Pair k={`Biggest day${s.biggestDay ? `, ${dayLabel(s.biggestDay.date)}` : ''}`} v={s.biggestDay ? formatDollars(s.biggestDay.cents) : '—'} />
            <Pair k={`Smallest day${s.smallestDay ? `, ${dayLabel(s.smallestDay.date)}` : ''}`} v={s.smallestDay ? formatDollars(s.smallestDay.cents) : '—'} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  );
}
