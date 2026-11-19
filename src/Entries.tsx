import { useMemo, useState } from 'react';
import { cashYenToCents, computeDays, formatDollars, formatYen } from './calc';
import { type Row } from './EditSheet';
import { activeFilterCount, matchesRow, NO_FILTERS, type EntryFilters } from './entryFilter';
import { useEntryActions } from './EntryActions';
import FilterSheet from './FilterSheet';
import Icon from './icons';
import { dayLabel } from './money';
import { CashRoundel, Roundel } from './Roundel';
import type { Store } from './store';

const isMissing = (r: Row) => r.kind === 'card' && r.e.cents === undefined;

export default function Entries({ store }: { store: Store }) {
  const { data } = store;
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<EntryFilters>(NO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
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
    return new Map(
      computeDays(store.calcData, store.settings)
        .filter((d) => d.hasEntries)
        .map((d) => [d.date, { text: `${est.has(d.date) ? '≈' : ''}${formatDollars(d.totalCents)}`, over: (d.overUnderCents ?? 0) > 0 }]),
    );
  }, [store.calcData, store.settings]);

  const filterCount = activeFilterCount(filters);
  const narrowed = filterCount > 0 || query.trim() !== '';
  // A day's total counts the whole day, so it only shows while nothing is narrowing the list.
  const dayTotal = (date: string) => (narrowed ? undefined : totals.get(date));
  const fmt = useMemo(() => ({ local: formatYen, dollars: formatDollars }), []);
  const shown = useMemo(() => rows.filter((r) => matchesRow(r, filters, query, fmt)), [rows, filters, query, fmt]);

  // What the filter sheet offers: the trip's own lists plus anything entries already use.
  const categoryChoices = useMemo(() => [...new Set([...store.categories, ...rows.flatMap((r) => (r.kind === 'bought' ? [] : [r.e.category]))])], [store.categories, rows]);
  const cardChoices = useMemo(() => [...new Set([...store.settings.cards, ...data.cardCharges.map((c) => c.card).filter(Boolean)])], [store.settings.cards, data.cardCharges]);

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
      <h1 className="page-title">Entries</h1>

      {/* One compact block before the list: search with its filter button, then a one-line alert. (Cash you get is added from Add → Cash.) */}
      <div className="search-bar" role="search">
        <Icon name="search" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search category, note, card, amount…"
          aria-label="Search entries"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
        />
        {query && (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}>
            <Icon name="close" />
          </button>
        )}
        <button type="button" className={`search-filter${filterCount ? ' on' : ''}`} aria-label={filterCount ? `Filters, ${filterCount} on` : 'Filters'} onClick={() => setFilterOpen(true)}>
          <Icon name="filter" />
          {filterCount > 0 && <span className="badge" aria-hidden="true">{filterCount}</span>}
        </button>
      </div>
      {narrowed && (
        <p className="result-line small">
          <span>
            {shown.length} of {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </span>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilters(NO_FILTERS);
            }}
          >
            Clear
          </button>
        </p>
      )}

      {missingCount > 0 && (
        <div className="alert alert-act alert-line">
          <p>
            <b>{missingCount}</b> card charge{missingCount === 1 ? '' : 's'} need{missingCount === 1 ? 's' : ''} dollars (≈ at the market rate)
          </p>
          <button type="button" onClick={() => edit(rows.filter(isMissing).sort((a, b) => (a.e.date < b.e.date ? -1 : 1))[0])}>
            Add dollars
          </button>
        </div>
      )}

      {groups.length === 0 && <p className="muted">{rows.length === 0 ? 'Nothing logged yet. Use the Add tab.' : 'No entries match your search or filters.'}</p>}

      <div className="day-groups">
      {groups.map((g) => (
        <section key={g.date} className="day-group">
          <h2>
            {dayLabel(g.date)}
            {dayTotal(g.date) && (
              <span className={`day-total${dayTotal(g.date)!.over ? ' over' : ''}`}>
                {dayTotal(g.date)!.over && <Icon name="alert" />}
                {dayTotal(g.date)!.text}
              </span>
            )}
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

      {filterOpen && (
        <FilterSheet
          filters={filters}
          categories={categoryChoices}
          cards={cardChoices}
          hasNoCard={data.cardCharges.some((c) => !c.card)}
          onApply={setFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {overlay}
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
