import { useMemo } from 'react';
import { computeSummary, formatDollars } from './calc';
import { dayLabel, todayLocal } from './money';
import { Roundel } from './Roundel';
import type { Store } from './store';

export default function Summary({ store }: { store: Store }) {
  const { data, settings } = store;
  const today = todayLocal();
  const s = useMemo(() => computeSummary(data, settings, today), [data, settings, today]);

  const outsideCount = s.outside.cardCharges.length + s.outside.cashPurchases.length + s.outside.cashBought.length;
  const pillClass = s.status === 'Over pace' ? 'red' : s.status === 'On pace' ? '' : 'idle';
  const finished = today > settings.tripEnd;
  const showCashBanner = s.cashRateMissing && data.cashPurchases.length > 0;

  return (
    <div className="screen">
      <h1>Summary</h1>

      {showCashBanner && <p className="banner">Add the cash you bought. Cash dollars stay blank until you do.</p>}

      <div className="cols">
        {finished && (
          <section className="card" aria-label="Trip summary">
            <div className="card-head">
              <span className="muted small">Trip complete · {s.tripLength} days</span>
            </div>
            <div className="big">{formatDollars(s.totalSpentCents)}</div>
            <span className="muted small">Total spent of {formatDollars(settings.budgetCeilingCents)}</span>
            <div className="rule">
              <div>
                <b>{formatDollars(s.tripAverageCents)}</b>
                <span>Average per day</span>
              </div>
              <div>
                <b>{s.biggestDay ? formatDollars(s.biggestDay.cents) : '—'}</b>
                <span>Most spent{s.biggestDay ? ` · ${dayLabel(s.biggestDay.date)}` : ''}</span>
              </div>
              <div>
                <b>{s.smallestDay ? formatDollars(s.smallestDay.cents) : '—'}</b>
                <span>Least spent{s.smallestDay ? ` · ${dayLabel(s.smallestDay.date)}` : ''}</span>
              </div>
            </div>
          </section>
        )}

        {!finished && (
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
        )}

        <section className="card" aria-label="Budget">
          <div className="card-head">
            <span className="muted small">Spent of {formatDollars(settings.budgetCeilingCents)} ceiling</span>
            <span className={`pill ${pillClass}`}>{s.status}</span>
          </div>
          <div className="big">{formatDollars(s.totalSpentCents)}</div>
          <div className="part">
            <h3>{s.leftTodayCents !== undefined ? 'Rest of the trip' : 'Whole trip'}</h3>
            <div className={finished ? 'rule one' : 'rule'}>
              <div>
                <b className={s.remainingCents < 0 ? 'bad-text' : ''}>{formatDollars(s.remainingCents)}</b>
                <span>Remaining</span>
              </div>
              {!finished && (
                <>
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
                </>
              )}
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
    </div>
  );
}
