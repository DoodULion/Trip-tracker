import { useToday } from './useToday';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrency } from './currency';
import { computeDays, formatDollars, formatRateUnit, formatYen } from './calc';
import { RowBody } from './Entries';
import { type Row } from './EditSheet';
import { useEntryActions } from './EntryActions';
import Icon from './icons';
import { dayLabel } from './money';
import type { Store } from './store';

export default function Days({ store }: { store: Store }) {
  const { data, settings, domestic } = store;
  const today = useToday();
  const days = useMemo(() => computeDays(store.calcData, settings), [store.calcData, settings]);
  const [open, setOpen] = useState<string | null>(null);
  // Days whose total includes an estimate (a card charge still missing its dollars) are marked with ≈.
  const estimatedDays = useMemo(() => new Set(store.calcData.cardCharges.filter((c) => c.estimated).map((c) => c.date)), [store.calcData]);
  const listRef = useRef<HTMLOListElement>(null);

  // Open on today: scroll so today's day sits near the top (a little of yesterday still shows above it).
  useEffect(() => {
    const main = listRef.current?.closest('main');
    const now = listRef.current?.querySelector<HTMLElement>('.st.now');
    if (!main || !now) return;
    const offset = now.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 72;
    main.scrollTo(0, Math.max(0, offset));
    // Only on arrival: later changes (expanding a day, new entries) must not move the list.
  }, []);
  const { optionsButton, overlay } = useEntryActions(store);

  const rowsFor = (date: string): Row[] =>
    [
      ...data.cardCharges.filter((e) => e.date === date).map((e) => ({ kind: 'card' as const, e })),
      ...data.cashPurchases.filter((e) => e.date === date).map((e) => ({ kind: 'cash' as const, e })),
    ].sort((a, b) => (a.e.id < b.e.id ? -1 : 1));

  return (
    <div className="screen">
      <h1 className="page-title">Days</h1>
      <ol className="map" ref={listRef}>
        {days.map((d, i) => {
          const isOpen = open === d.date && d.hasEntries;
          const cashMissing = d.cashYen > 0 && d.cashCents === undefined;
          const over = d.overUnderCents;
          const state = d.date === today ? 'now' : d.hasEntries ? '' : 'blank';
          return (
            <li key={d.date} className={`st ${state}`} aria-current={d.date === today ? 'date' : undefined}>
              <span className="node" aria-hidden="true">{i + 1}</span>
              <button type="button" className="st-head" disabled={!d.hasEntries} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : d.date)}>
                <span>
                  <b>{dayLabel(d.date)}</b>
                  {d.date === today && <em>today</em>}
                  {!domestic && d.hasEntries && d.totalYen > 0 && (
                    <small className="st-sub">
                      {formatYen(d.totalYen)}
                      {d.rate !== undefined && ` at ${formatRateUnit(d.rate)}`}
                    </small>
                  )}
                </span>
                <span className="st-amt">
                  {d.hasEntries ? `${estimatedDays.has(d.date) ? '≈' : ''}${formatDollars(d.totalCents)}` : ''}
                  {over !== undefined &&
                    (over > 0 ? (
                      <small className="over">
                        <Icon name="alert" />
                        {formatDollars(over)} over
                      </small>
                    ) : (
                      <small>{formatDollars(-over)} under</small>
                    ))}
                </span>
              </button>

              {isOpen && (
                <div className="st-body">
                  <dl className="kv">
                    {!domestic && (
                      <>
                        <dt>Total {getCurrency().symbol.trim()}</dt>
                        <dd>{formatYen(d.totalYen)}</dd>
                        <dt>Day rate</dt>
                        <dd>{formatRateUnit(d.rate) || '—'}</dd>
                      </>
                    )}
                    <dt>Card</dt>
                    <dd>{d.cardYen || d.cardCents ? (domestic ? formatDollars(d.cardCents) : `${formatYen(d.cardYen)} (${formatDollars(d.cardCents)})`) : '—'}</dd>
                    <dt>Cash</dt>
                    <dd>{d.cashYen ? (domestic ? formatDollars(d.cashCents ?? 0) : `${formatYen(d.cashYen)}${cashMissing ? '' : ` (${formatDollars(d.cashCents ?? 0)})`}`) : '—'}</dd>
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
