import { useToday } from './useToday';
import { useMemo } from 'react';
import { computeSummary, formatDollars } from './calc';
import { dayLabel } from './money';
import Icon from './icons';
import { Roundel } from './Roundel';
import { statusBadge } from './status';
import type { Store } from './store';

export default function Summary({ store }: { store: Store }) {
  const { data, settings } = store;
  const today = useToday();
  const s = useMemo(() => computeSummary(store.calcData, settings, today, store.categories), [store.calcData, settings, today]);

  const outsideCount = s.outside.cardCharges.length + s.outside.cashPurchases.length + s.outside.cashBought.length;
  const badge = statusBadge(s, store.trip, today);
  const finished = today > settings.tripEnd;
  const over = s.focusDay.leftCents < 0;
  const estimatedToday = store.calcData.cardCharges.filter((c) => c.estimated && c.date === s.focusDay.date);
  const showCashBanner = s.cashRateMissing && data.cashPurchases.length > 0;

  return (
    <div className="screen">
      <h1>Summary</h1>

      {showCashBanner && <p className="banner">Add the cash you bought. Cash dollars stay blank until you do.</p>}

      <div className="cols">
        {finished && (
          <section className="card" aria-label="Trip summary">
            <div className="card-head">
              <span className="muted small">Trip complete, {s.tripLength} days</span>
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
                <span>Most spent{s.biggestDay ? `, ${dayLabel(s.biggestDay.date)}` : ''}</span>
              </div>
              <div>
                <b>{s.smallestDay ? formatDollars(s.smallestDay.cents) : '—'}</b>
                <span>Least spent{s.smallestDay ? `, ${dayLabel(s.smallestDay.date)}` : ''}</span>
              </div>
            </div>
          </section>
        )}

        {!finished && (
        <section className={`card hero${over ? ' over' : ''}`} aria-label="Today">
          {over && (
            <span className="over-tag">
              <Icon name="alert" />
              Over the limit
            </span>
          )}
          <div className="big">{formatDollars(Math.abs(s.focusDay.leftCents))}</div>
          <span className="muted small">{over
              ? s.focusDay.kind === 'today'
                ? "Over today's limit"
                : `Over the limit on ${dayLabel(s.focusDay.date)}`
              : s.focusDay.kind === 'today'
                ? 'Left today'
                : s.focusDay.kind === 'upcoming'
                  ? `Left on the first day, ${dayLabel(s.focusDay.date)}`
                  : `Left on the last day, ${dayLabel(s.focusDay.date)}`}</span>
          <Meter part={s.focusDay.spentCents} whole={s.dailyLimitCents} />
          <span className="muted small">
            {s.focusDay.kind === 'today' ? 'Spent today' : 'Spent'} <b>{formatDollars(s.focusDay.spentCents)}</b> of {formatDollars(s.dailyLimitCents)}
          </span>
          {estimatedToday.length > 0 && (
            <span className="muted small est-note">
              Includes ≈ {formatDollars(estimatedToday.reduce((t, c) => t + (c.cents ?? 0), 0))} estimated at the market rate for {estimatedToday.length} card charge{estimatedToday.length === 1 ? '' : 's'} still missing dollars.
            </span>
          )}
        </section>
        )}

        <section className="card" aria-label="Budget">
          <div className="card-head">
            <span className="muted small">Spent of {formatDollars(settings.budgetCeilingCents)} ceiling</span>
            <span className={`pill ${badge.cls}`}>{badge.label}</span>
          </div>
          <div className="big">{formatDollars(s.totalSpentCents)}</div>
          <Meter part={s.totalSpentCents} whole={settings.budgetCeilingCents} />
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

        <section className="card span-all" aria-label="By category">
          <h2>By category</h2>
          <div className="cats">
            {s.byCategory.filter((c) => store.categories.includes(c.category) || c.cents > 0 || c.yen > 0).map((c) => (
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

/** A thick rounded bar: how much of a limit is used. Red once it is over. Decorative; the figures sit beside it. */
function Meter({ part, whole }: { part: number; whole: number }) {
  const p = whole > 0 ? Math.min(1, Math.max(0, part / whole)) : 0;
  return (
    <div className={`meter${part > whole ? ' over' : ''}${part <= 0 ? ' zero' : ''}`} aria-hidden="true">
      <i style={{ ['--p' as string]: p }} />
    </div>
  );
}
