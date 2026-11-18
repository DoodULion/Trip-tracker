import { useMemo, useState } from 'react';
import { cashYenToCents, computeDays, formatDollars, formatYen } from './calc';
import Icon from './icons';
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
  const { optionsButton, edit, overlay } = useEntryActions(store);

  const rows = useMemo<Row[]>(
    () => [
      ...data.cardCharges.map((e) => ({ kind: 'card' as const, e })),
      ...data.cashPurchases.map((e) => ({ kind: 'cash' as const, e })),
      ...data.cashBought.map((e) => ({ kind: 'bought' as const, e })),
    ],
    [data],
  );

  const missingCount = rows.filter(isMissing).length;

  // Each day's total in its header (≈ when it includes an estimate); days outside the trip show none.
  const totals = useMemo(() => {
    const est = new Set(store.calcData.cardCharges.filter((c) => c.estimated).map((c) => c.date));
    return new Map(computeDays(store.calcData, store.settings).filter((d) => d.hasEntries).map((d) => [d.date, `${est.has(d.date) ? '≈' : ''}${formatDollars(d.totalCents)}`]));
  }, [store.calcData, store.settings]);
  const dayTotal = (date: string) => (filter === 'all' ? totals.get(date) : undefined);
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

      {/* One compact block before the list: the "Log cash bought" first, then the filters, then a one-line alert. */}
      <div className="chips scroll-row" role="group" aria-label="Filter entries">
        <button type="button" className="chip-new" onClick={() => setLogging(true)}>
          <Icon name="add" />
          Log cash bought
        </button>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={filter === f.id ? 'on' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {missingCount > 0 && (
        <div className="alert alert-act alert-line">
          <p>
            <b>{missingCount}</b> card charge{missingCount === 1 ? '' : 's'} need{missingCount === 1 ? 's' : ''} dollars (counted ≈)
          </p>
          <button type="button" onClick={() => edit(rows.filter(isMissing).sort((a, b) => (a.e.date < b.e.date ? -1 : 1))[0])}>
            Add dollars
          </button>
        </div>
      )}

      {groups.length === 0 && <p className="muted">{rows.length === 0 ? 'Nothing logged yet. Use the Add tab.' : 'No entries match this filter.'}</p>}

      <div className="day-groups">
      {groups.map((g) => (
        <section key={g.date} className="day-group">
          <h2>
            {dayLabel(g.date)}
            {dayTotal(g.date) && <span className="day-total">{dayTotal(g.date)}</span>}
          </h2>
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
      </div>

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
          <Sub note={e.note} pay={e.card || 'No card'} />
        </span>
        <span className="row-amt">
          <span>{e.yen !== undefined ? formatYen(e.yen) : '—'}</span>
          {e.cents !== undefined ? (
            <span>{formatDollars(e.cents)}</span>
          ) : (
            <Estimate cents={store.calcData.cardCharges.find((x) => x.id === e.id)?.cents} />
          )}
        </span>
      </>
    );
  }
  if (r.kind === 'cash') {
    const { e } = r;
    const cents = e.cents ?? cashYenToCents(e.yen, store.data.cashBought);
    return (
      <>
        <Roundel category={e.category} />
        <span className="row-main">
          <strong>{e.category}</strong>
          <Sub note={e.note} pay="Cash" />
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
        <Sub pay={e.where || 'ATM or exchange'} />
      </span>
      <span className="row-amt">
        <span>{formatYen(e.yen)}</span>
        <span>{formatDollars(e.cents)}</span>
      </span>
    </>
  );
}

/** The line under an entry's name: how it was paid, then the note on its own line when there is one. */
function Sub({ note, pay }: { note?: string; pay: string }) {
  return (
    <>
      <span className="row-sub">{pay}</span>
      {note && <span className="row-note-line">{note}</span>}
    </>
  );
}

/** A card charge still missing its dollars: the market-rate estimate when there is one, else "Needs $". */
function Estimate({ cents }: { cents: number | undefined }) {
  return cents === undefined ? (
    <span className="need">Needs $</span>
  ) : (
    <span className="need" title="Estimated at the day's market rate until you add the real dollars">
      ≈ {formatDollars(cents)}
    </span>
  );
}
