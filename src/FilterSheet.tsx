import { useState, type FormEvent } from 'react';
import { type EntryFilters, type Kind, NO_FILTERS } from './entryFilter';
import { amountHint, getCurrency, minorToInput } from './currency';
import { parseYen } from './money';
import SheetBackdrop from './SheetBackdrop';

const KINDS: { id: Kind; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'bought', label: 'Cash bought' },
];

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** The filters for the Entries list: payment type, category, card, price, dates and a few more. */
export default function FilterSheet({ filters, categories, cards, hasNoCard, onApply, onClose }: {
  filters: EntryFilters;
  categories: string[];
  cards: string[];
  /** Whether any charge has no card picked (then "No card" is offered as a choice). */
  hasNoCard: boolean;
  onApply: (f: EntryFilters) => void;
  onClose: () => void;
}) {
  const cur = getCurrency();
  const [f, setF] = useState<EntryFilters>(filters);
  const [min, setMin] = useState(minorToInput(filters.minMinor));
  const [max, setMax] = useState(minorToInput(filters.maxMinor));
  const [error, setError] = useState('');

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const lo = min.trim() === '' ? undefined : parseYen(min);
    const hi = max.trim() === '' ? undefined : parseYen(max);
    if ((min.trim() !== '' && lo === undefined) || (max.trim() !== '' && hi === undefined)) return setError(`Prices must be ${amountHint(cur)}.`);
    if (lo !== undefined && hi !== undefined && lo > hi) return setError('The lowest price is above the highest.');
    let { from, to } = f;
    if (from && to && from > to) [from, to] = [to, from];
    onApply({ ...f, minMinor: lo, maxMinor: hi, from: from || undefined, to: to || undefined });
    onClose();
  }

  return (
    <SheetBackdrop onClose={onClose} role="dialog" aria-modal="true" aria-label="Filter entries">
      <form className="sheet" onSubmit={submit}>
        <h2>Filter entries</h2>

        <div className="field">
          <span>Payment type</span>
          <div className="chips">
            {KINDS.map((k) => (
              <button key={k.id} type="button" className={f.kinds.includes(k.id) ? 'on' : ''} aria-pressed={f.kinds.includes(k.id)} onClick={() => setF({ ...f, kinds: toggle(f.kinds, k.id) })}>
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {cards.length + (hasNoCard ? 1 : 0) > 1 && (
          <div className="field">
            <span>Card</span>
            <div className="chips">
              {cards.map((c) => (
                <button key={c} type="button" className={f.cards.includes(c) ? 'on' : ''} aria-pressed={f.cards.includes(c)} onClick={() => setF({ ...f, cards: toggle(f.cards, c) })}>
                  {c}
                </button>
              ))}
              {hasNoCard && (
                <button type="button" className={f.cards.includes('') ? 'on' : ''} aria-pressed={f.cards.includes('')} onClick={() => setF({ ...f, cards: toggle(f.cards, '') })}>
                  No card
                </button>
              )}
            </div>
          </div>
        )}

        <div className="field">
          <span>Category</span>
          <div className="chips">
            {categories.map((c) => (
              <button key={c} type="button" className={f.categories.includes(c) ? 'on' : ''} aria-pressed={f.categories.includes(c)} onClick={() => setF({ ...f, categories: toggle(f.categories, c) })}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid2">
          <label className="field">
            <span>Lowest price ({cur.symbol.trim()})</span>
            <input value={min} onChange={(e) => setMin(e.target.value)} inputMode={cur.decimals ? 'decimal' : 'numeric'} autoComplete="off" />
          </label>
          <label className="field">
            <span>Highest price ({cur.symbol.trim()})</span>
            <input value={max} onChange={(e) => setMax(e.target.value)} inputMode={cur.decimals ? 'decimal' : 'numeric'} autoComplete="off" />
          </label>
        </div>

        <div className="grid2">
          <label className="field">
            <span>From day</span>
            <input type="date" value={f.from ?? ''} onChange={(e) => setF({ ...f, from: e.target.value || undefined })} />
          </label>
          <label className="field">
            <span>To day</span>
            <input type="date" value={f.to ?? ''} onChange={(e) => setF({ ...f, to: e.target.value || undefined })} />
          </label>
        </div>

        <div className="field">
          <span>More</span>
          <div className="chips">
            <button type="button" className={f.missingOnly ? 'on' : ''} aria-pressed={f.missingOnly} onClick={() => setF({ ...f, missingOnly: !f.missingOnly })}>
              Missing dollars
            </button>
            <button type="button" className={f.hasNote ? 'on' : ''} aria-pressed={f.hasNote} onClick={() => setF({ ...f, hasNote: !f.hasNote })}>
              Has a note
            </button>
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="sheet-actions">
          <button type="submit" className="primary">Show results</button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              onApply(NO_FILTERS);
              onClose();
            }}
          >
            Clear filters
          </button>
        </div>
      </form>
    </SheetBackdrop>
  );
}
