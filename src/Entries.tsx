import { useMemo, useState } from 'react';
import { cashYenToCents, formatDollars, formatYen } from './calc';
import CashBoughtSheet from './CashBoughtSheet';
import { type Row } from './EditSheet';
import { useEntryActions } from './EntryActions';
import { dayLabel } from './money';
import { CashRoundel, Roundel } from './Roundel';
import type { Store } from './store';

type Filter = 'all' | 'card' | 'cash' | 'bought';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'bought', label: 'Cash bought' },
];

const isMissing = (r: Row) => r.kind === 'card' && r.e.cents === undefined;

export default function Entries({ store }: { store: Store }) {
  const { data } = store;
  const [filter, setFilter] = useState<Filter>('all');
  const [logging, setLogging] = useState(false);
  const { optionsButton, overlay } = useEntryActions(store);

  const rows = useMemo<Row[]>(
    () => [
      ...data.cardCharges.map((e) => ({ kind: 'card' as const, e })),
      ...data.cashPurchases.map((e) => ({ kind: 'cash' as const, e })),
      ...data.cashBought.map((e) => ({ kind: 'bought' as const, e })),
    ],
    [data],
  );

  const missingCount = rows.filter(isMissing).length;
  const shown = rows.filter((r) => (filter === 'all' ? true : r.kind === filter));

  // Newest day first; within a day, in the order entered (ids start with a timestamp).
  const groups = useMemo(() => {
    const byDate = new Map<string, Row[]>();
    for (const r of shown) byDate.set(r.e.date, [...(byDate.get(r.e.date) ?? []), r]);
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, list]) => ({ date, list: list.sort((a, b) => (a.e.id < b.e.id ? -1 : 1)) }));
  }, [shown]);

  return (
    <div className="screen">
      <h1>Entries</h1>

      <button type="button" className="secondary" onClick={() => setLogging(true)}>Log cash bought</button>

      {missingCount > 0 && (
        <p className="alert">
          {missingCount} card charge{missingCount === 1 ? '' : 's'} still need{missingCount === 1 ? 's' : ''} dollars (outlined in red). Use ⋮ then Edit to add them.
        </p>
      )}

      <div className="chips" role="group" aria-label="Filter entries">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={filter === f.id ? 'on' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="muted">{rows.length === 0 ? 'Nothing logged yet. Use the Add tab.' : 'No entries match this filter.'}</p>}

      {groups.map((g) => (
        <section key={g.date} className="day-group">
          <h2>{dayLabel(g.date)}</h2>
          <ul className="list">
            {g.list.map((r) => (
              <li key={r.kind + r.e.id}>
                <div className={`row ${isMissing(r) ? 'missing' : ''}`}>
                  <RowBody r={r} store={store} />
                  {optionsButton(r)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {overlay}
      {logging && <CashBoughtSheet store={store} onClose={() => setLogging(false)} />}
    </div>
  );
}

export function RowBody({ r, store }: { r: Row; store: Store }) {
  if (r.kind === 'card') {
    const { e } = r;
    return (
      <>
        <Roundel category={e.category} />
        <span className="row-main">
          <strong>{e.category}</strong>
          <span className="muted">{e.card || 'No card'}{e.note ? ` · ${e.note}` : ''}</span>
        </span>
        <span className="row-amt">
          <span>{e.yen !== undefined ? formatYen(e.yen) : '—'}</span>
          {e.cents !== undefined ? <span>{formatDollars(e.cents)}</span> : <span className="need">Needs $</span>}
        </span>
      </>
    );
  }
  if (r.kind === 'cash') {
    const { e } = r;
    const cents = cashYenToCents(e.yen, store.data.cashBought);
    return (
      <>
        <Roundel category={e.category} />
        <span className="row-main">
          <strong>{e.category}</strong>
          <span className="muted">Cash{e.note ? ` · ${e.note}` : ''}</span>
        </span>
        <span className="row-amt">
          <span>{formatYen(e.yen)}</span>
          <span className="muted">{cents !== undefined ? formatDollars(cents) : ''}</span>
        </span>
      </>
    );
  }
  const { e } = r;
  return (
    <>
      <CashRoundel />
      <span className="row-main">
        <strong>Cash bought</strong>
        <span className="muted">{e.where || 'ATM / exchange'}</span>
      </span>
      <span className="row-amt">
        <span>{formatYen(e.yen)}</span>
        <span>{formatDollars(e.cents)}</span>
      </span>
    </>
  );
}
