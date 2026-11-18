import { useMemo, useState } from 'react';
import { computeDays, formatDollars, formatRate, formatYen } from './calc';
import { RowBody } from './Entries';
import { type Row } from './EditSheet';
import { useEntryActions } from './EntryActions';
import { dayLabel, todayLocal } from './money';
import type { Store } from './store';

export default function Days({ store }: { store: Store }) {
  const { data, settings } = store;
  const today = todayLocal();
  const days = useMemo(() => computeDays(data, settings), [data, settings]);
  const [open, setOpen] = useState<string | null>(null);
  const { optionsButton, overlay } = useEntryActions(store);

  const rowsFor = (date: string): Row[] =>
    [
      ...data.cardCharges.filter((e) => e.date === date).map((e) => ({ kind: 'card' as const, e })),
      ...data.cashPurchases.filter((e) => e.date === date).map((e) => ({ kind: 'cash' as const, e })),
    ].sort((a, b) => (a.e.id < b.e.id ? -1 : 1));

  return (
    <div className="screen">
      <h1>Days</h1>
      <ol className="map">
        {days.map((d, i) => {
          const isOpen = open === d.date && d.hasEntries;
          const cashMissing = d.cashYen > 0 && d.cashCents === undefined;
          const over = d.overUnderCents;
          const state = d.date === today ? 'now' : d.hasEntries ? '' : 'empty';
          return (
            <li key={d.date} className={`st ${state}`} aria-current={d.date === today ? 'date' : undefined}>
              <span className="node" aria-hidden="true">{i + 1}</span>
              <button type="button" className="st-head" disabled={!d.hasEntries} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : d.date)}>
                <span>
                  <b>{dayLabel(d.date)}</b>
                  {d.date === today && <em>today</em>}
                </span>
                <span className="st-amt">
                  {d.hasEntries ? formatDollars(d.totalCents) : ''}
                  {over !== undefined && <small className={over > 0 ? 'over' : ''}>{over > 0 ? `${formatDollars(over)} over` : `${formatDollars(-over)} under`}</small>}
                </span>
              </button>

              {isOpen && (
                <div className="st-body">
                  <dl className="kv">
                    <dt>Total ¥</dt>
                    <dd>{formatYen(d.totalYen)}</dd>
                    <dt>Day rate</dt>
                    <dd>{formatRate(d.rate) || '—'}</dd>
                    <dt>Card</dt>
                    <dd>{d.cardYen || d.cardCents ? `${formatYen(d.cardYen)} (${formatDollars(d.cardCents)})` : '—'}</dd>
                    <dt>Cash</dt>
                    <dd>{d.cashYen ? `${formatYen(d.cashYen)}${cashMissing ? '' : ` (${formatDollars(d.cashCents ?? 0)})`}` : '—'}</dd>
                    <dt>Running total</dt>
                    <dd>{formatDollars(d.runningCents)}</dd>
                    <dt>Running limit</dt>
                    <dd>{formatDollars(d.runningLimitCents)}</dd>
                  </dl>
                  {cashMissing && <p className="note">Add the cash you bought to see cash dollars.</p>}
                  <ul className="list">
                    {rowsFor(d.date).map((r) => (
                      <li key={r.kind + r.e.id}>
                        <div className={`row ${r.kind === 'card' && r.e.cents === undefined ? 'missing' : ''}`}>
                          <RowBody r={r} store={store} />
                          {optionsButton(r)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {overlay}
    </div>
  );
}
