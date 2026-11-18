import { useMemo } from 'react';
import { CATEGORIES, computeDays, computeSummary, formatDollars, formatRate, formatYen } from './calc';
import { dayLabel, todayLocal } from './money';
import { Roundel } from './Roundel';
import StackedBars from './StackedBars';
import type { Store } from './store';

const num = (n: number) => (n ? n.toLocaleString('en-US') : '');

export default function Summary({ store }: { store: Store }) {
  const { data, settings } = store;
  const today = todayLocal();
  const s = useMemo(() => computeSummary(data, settings, today), [data, settings, today]);
  const days = useMemo(() => computeDays(data, settings), [data, settings]);
  const logged = days.filter((d) => d.hasEntries);

  const outsideCount = s.outside.cardCharges.length + s.outside.cashPurchases.length + s.outside.cashBought.length;
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, days.reduce((t, d) => t + d.yenByCategory[c], 0)]));
  const totalYen = days.reduce((t, d) => t + d.totalYen, 0);
  const pillClass = s.status === 'Over pace' ? 'red' : s.status === 'On pace' ? '' : 'idle';
  const showCashBanner = s.cashRateMissing && data.cashPurchases.length > 0;

  return (
    <div className="screen">
      <h1>Summary</h1>

      {showCashBanner && <p className="banner">Add the cash you bought. Cash dollars stay blank until you do.</p>}

      <div className="cols">
        <section className="card" aria-label="Today">
          <div className="card-head">
            <span className="muted small">
              {s.focusDay.kind === 'today'
                ? 'Today'
                : s.focusDay.kind === 'upcoming'
                  ? `First day, ${dayLabel(s.focusDay.date)}`
                  : `Last day, ${dayLabel(s.focusDay.date)}`}
              {' · daily limit '}
              {formatDollars(s.dailyLimitCents)}
            </span>
          </div>
          <div className="pair">
            <div>
              <div className="mid">{formatDollars(s.focusDay.spentCents)}</div>
              <span>{s.focusDay.kind === 'today' ? 'Spent today' : 'Spent'}</span>
            </div>
            <div>
              <div className={`mid ${s.focusDay.leftCents < 0 ? 'bad-text' : ''}`}>{formatDollars(s.focusDay.leftCents)}</div>
              <span>{s.focusDay.kind === 'today' ? 'Left today' : 'Left'}</span>
            </div>
          </div>
        </section>

        <section className="card" aria-label="Budget">
          <div className="card-head">
            <span className="muted small">Spent of {formatDollars(settings.budgetCeilingCents)} ceiling</span>
            <span className={`pill ${pillClass}`}>{s.status}</span>
          </div>
          <div className="big">{formatDollars(s.totalSpentCents)}</div>
          <div className="part">
            <h3>{s.leftTodayCents !== undefined ? 'Rest of the trip' : 'Whole trip'}</h3>
            <div className="rule">
              <div>
                <b className={s.remainingCents < 0 ? 'bad-text' : ''}>{formatDollars(s.remainingCents)}</b>
                <span>Remaining</span>
              </div>
              <div>
                <b>{s.leftPerDayCents === undefined ? '—' : formatDollars(s.leftPerDayCents)}</b>
                <span>Left per day</span>
              </div>
              <div>
                <b>
                  {s.daysLeft} of {s.tripLength}
                </b>
                <span>Days left</span>
              </div>
            </div>
          </div>
        </section>

        <section className="card" aria-label="By category">
          <h2>By category</h2>
          <div className="cats">
            {s.byCategory.map((c) => (
              <div key={c.category} className="cat">
                <Roundel category={c.category} />
                <div>
                  <b>
                    {formatDollars(c.cents)}
                    {c.pct !== undefined && <span className="pc"> {c.pct.toFixed(0)}%</span>}
                  </b>
                  <span className="n">{c.category}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {outsideCount > 0 && (
        <p className="note">
          Outside trip dates ({settings.tripStart} to {settings.tripEnd}), not counted above:{' '}
          {[
            s.outside.cardCharges.length && `${s.outside.cardCharges.length} card charge${s.outside.cardCharges.length === 1 ? '' : 's'}`,
            s.outside.cashPurchases.length && `${s.outside.cashPurchases.length} cash purchase${s.outside.cashPurchases.length === 1 ? '' : 's'}`,
            s.outside.cashBought.length && `${s.outside.cashBought.length} cash bought`,
          ]
            .filter(Boolean)
            .join(', ')}
          . Find them on the Entries tab.
        </p>
      )}

      <section className="card">
        <h2>Daily yen by category</h2>
        <StackedBars days={days} />
      </section>

      <section className="card">
        <h2>Daily spending (¥) by category</h2>
        {logged.length === 0 ? (
          <p className="muted">Nothing logged yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  {CATEGORIES.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {logged.map((d) => (
                  <tr key={d.date}>
                    <th scope="row">{dayLabel(d.date)}</th>
                    {CATEGORIES.map((c) => (
                      <td key={c}>{num(d.yenByCategory[c])}</td>
                    ))}
                    <td>{num(d.totalYen)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Trip total</th>
                  {CATEGORIES.map((c) => (
                    <td key={c}>{num(totals[c])}</td>
                  ))}
                  <td>{num(totalYen)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <div className="cols">
        <section className="card" aria-label="Cash and rates">
          <h2>Cash and rates</h2>
          <dl className="kv">
            <dt>Cash on hand</dt>
            <dd>{formatYen(s.cashOnHandYen)}</dd>
            <dt>Overall rate</dt>
            <dd>{formatRate(s.overallRate) || '—'}</dd>
            <dt>Cash rate</dt>
            <dd>{formatRate(s.cashRate) || '—'}</dd>
            <dt>Card rate</dt>
            <dd>{formatRate(s.cardRate) || '—'}</dd>
            {Object.entries(s.cardRateByCard).map(([name, r]) => (
              <Pair key={name} k={`  ${name}`} v={formatRate(r) || '—'} />
            ))}
            <dt>Best day rate</dt>
            <dd>{s.bestDayRate ? `${formatRate(s.bestDayRate.rate)} (${dayLabel(s.bestDayRate.date)})` : '—'}</dd>
            <dt>Worst day rate</dt>
            <dd>{s.worstDayRate ? `${formatRate(s.worstDayRate.rate)} (${dayLabel(s.worstDayRate.date)})` : '—'}</dd>
          </dl>
        </section>

        <section className="card" aria-label="By payment and days">
          <h2>By payment</h2>
          <dl className="kv">
            {Object.entries(s.byPayment.cards).map(([name, cents]) => (
              <Pair key={name} k={name} v={formatDollars(cents)} />
            ))}
            {s.byPayment.noCard > 0 && <Pair k="Card (none picked)" v={formatDollars(s.byPayment.noCard)} />}
            <Pair k="Cash" v={s.cashRateMissing && data.cashPurchases.length > 0 ? '—' : formatDollars(s.byPayment.cash)} />
          </dl>
          <h2 className="gap">Days</h2>
          <dl className="kv">
            <dt>With spending</dt>
            <dd>{s.daysWithSpending}</dd>
            <dt>Over the limit</dt>
            <dd>{s.daysOver}</dd>
            <dt>Under the limit</dt>
            <dd>{s.daysUnder}</dd>
            <dt>Biggest day</dt>
            <dd>{s.biggestDay ? `${formatDollars(s.biggestDay.cents)} (${dayLabel(s.biggestDay.date)})` : '—'}</dd>
            <dt>Smallest day</dt>
            <dd>{s.smallestDay ? `${formatDollars(s.smallestDay.cents)} (${dayLabel(s.smallestDay.date)})` : '—'}</dd>
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
