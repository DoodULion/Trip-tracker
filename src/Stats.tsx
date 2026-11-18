import { useToday } from './useToday';
import { useMemo } from 'react';
import { computeSummary, formatDollars, formatRate, formatYen } from './calc';
import { dayLabel } from './money';
import type { Store } from './store';

/** Cash on hand, real exchange rates, spending by payment method, and day stats. */
export default function Stats({ store }: { store: Store }) {
  const { data, settings } = store;
  const today = useToday();
  const s = useMemo(() => computeSummary(store.calcData, settings, today), [store.calcData, settings, today]);
  // Cards with a charge still missing dollars have an estimate inside their total.
  const estimatedCards = new Set(store.calcData.cardCharges.filter((c) => c.estimated).map((c) => c.card ?? ''));
  const cashMissing = s.cashRateMissing && data.cashPurchases.length > 0;

  return (
    <div className="screen">
      <h1>Stats</h1>

      {cashMissing && <p className="banner">Add the cash you bought. Cash dollars stay blank until you do.</p>}

      <div className="pay-grid">
        <section className="card pay" aria-label="By payment">
          <h2>By payment</h2>
          <dl className="kv">
            {Object.entries(s.byPayment.cards).map(([name, cents]) => (
              <Pair key={name} k={name} v={`${estimatedCards.has(name) ? '≈' : ''}${formatDollars(cents)}`} />
            ))}
            {s.byPayment.noCard > 0 && <Pair k="Card (none picked)" v={`${estimatedCards.has('') ? '≈' : ''}${formatDollars(s.byPayment.noCard)}`} />}
            <Pair k="Cash" v={cashMissing ? '—' : formatDollars(s.byPayment.cash)} />
          </dl>
          {estimatedCards.size > 0 && <p className="muted small">≈ includes an estimate at the market rate for a charge still missing dollars.</p>}
        </section>

        <section className="card rates" aria-label="Cash and rates">
          <h2>Cash and rates</h2>
          <dl className="kv">
            <Pair k="Cash on hand" v={formatYen(s.cashOnHandYen)} />
            <Pair k="Overall rate" v={formatRate(s.overallRate) || '—'} />
            <Pair k="Cash rate" v={formatRate(s.cashRate) || '—'} />
            <Pair k="Card rate" v={formatRate(s.cardRate) || '—'} />
            {Object.entries(s.cardRateByCard).map(([name, r]) => (
              <Pair key={name} k={`  ${name}`} v={formatRate(r) || '—'} />
            ))}
            <Pair k="Best day rate" v={s.bestDayRate ? `${formatRate(s.bestDayRate.rate)} (${dayLabel(s.bestDayRate.date)})` : '—'} />
            <Pair k="Worst day rate" v={s.worstDayRate ? `${formatRate(s.worstDayRate.rate)} (${dayLabel(s.worstDayRate.date)})` : '—'} />
          </dl>
        </section>

        <section className="card days" aria-label="Days">
          <h2>Days</h2>
          <dl className="kv">
            <Pair k="With spending" v={String(s.daysWithSpending)} />
            <Pair k="Over the limit" v={String(s.daysOver)} />
            <Pair k="Under the limit" v={String(s.daysUnder)} />
            <Pair k="Biggest day" v={s.biggestDay ? `${formatDollars(s.biggestDay.cents)} (${dayLabel(s.biggestDay.date)})` : '—'} />
            <Pair k="Smallest day" v={s.smallestDay ? `${formatDollars(s.smallestDay.cents)} (${dayLabel(s.smallestDay.date)})` : '—'} />
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
