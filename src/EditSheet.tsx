import { useEffect, useRef, useState, type FormEvent } from 'react';
import { haptic } from './haptics';
import { cardRate, estimateInfo, formatDollars, formatRateUnit, type CardCharge, type Category } from './calc';
import { centsToInput, parseCents, parseYen } from './money';
import { amountHint, getCurrency, minorToInput } from './currency';
import { Roundel } from './Roundel';
import SheetBackdrop from './SheetBackdrop';
import { useUndo } from './undo';
import type { Store } from './store';

export type { Row } from './entryFilter';
import type { Row } from './entryFilter';

const TITLES = { card: 'Card charge', cash: 'Cash purchase', bought: 'Cash bought' } as const;

export default function EditSheet({ row, store, onClose }: { row: Row; store: Store; onClose: () => void }) {
  const { kind } = row;
  const e = row.e;
  const { offer } = useUndo();
  const [date, setDate] = useState(e.date);
  const [yen, setYen] = useState(minorToInput(e.yen));
  const [dollars, setDollars] = useState('cents' in e ? centsToInput(e.cents) : '');
  const [category, setCategory] = useState<Category>('category' in e ? e.category : 'Food');
  const [card, setCard] = useState('card' in e ? e.card : '');
  const [note, setNote] = useState('note' in e ? (e.note ?? '') : '');
  const [where, setWhere] = useState('where' in e ? (e.where ?? '') : '');
  const [error, setError] = useState('');
  /** Show a form error with an error haptic. */
  const fail = (m: string) => {
    haptic('error');
    setError(m);
  };
  const yenRef = useRef<HTMLInputElement>(null);
  const dollarsRef = useRef<HTMLInputElement>(null);

  // Card charge missing dollars: jump straight to the dollars box.
  const missingDollars = kind === 'card' && (e as CardCharge).cents === undefined;
  useEffect(() => {
    (missingDollars || store.domestic ? dollarsRef : yenRef).current?.focus();
  }, [missingDollars, store.domestic]);

  const cur = getCurrency();
  // A domestic trip has one amount, in dollars (a cash purchase keeps it as both its amount and its dollars).
  const dom = store.domestic && kind !== 'bought';

  // A card charge with no dollars typed is counted as an estimate: say at what rate and where it came from.
  let estimateNote = '';
  if (kind === 'card' && !dom && dollars.trim() === '') {
    const y = parseYen(yen);
    if (y) {
      const info = estimateInfo(date, store.spot, cardRate(store.data.cardCharges));
      if (!info) estimateNote = 'No rate to estimate with yet. Add the real dollars when the card posts.';
      else {
        const [, m, d] = (info.source === 'market' ? info.day : date).split('-').map(Number);
        const from = info.source === 'market' ? `market rate, ${m}/${d}` : 'your card rate';
        estimateNote = `Counted as ≈ ${formatDollars(Math.round((y * 100) / info.rate))} at ${formatRateUnit(info.rate)} (${from}) until you add the real dollars.`;
      }
    }
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setError('');
    const c = parseCents(dollars);
    const y = dom ? (kind === 'cash' ? c : undefined) : parseYen(yen);
    if (!dom && yen.trim() !== '' && y === undefined) return fail(`${cur.name} must be ${amountHint(cur)}.`);
    if (dollars.trim() !== '' && c === undefined) return fail(dom ? 'The amount must look like 12.50.' : 'Dollars must look like 10.50.');
    if (dom && (c === undefined || c <= 0)) return fail('Enter the amount, like 12.50.');
    const n = note.trim() || undefined;

    if (kind === 'card') {
      if (y === undefined && c === undefined) return fail(`Enter ${cur.name.toLowerCase()}, dollars, or both.`);
      await store.addCardCharge({ id: e.id, date, category, card, yen: y, cents: c, note: n });
    } else if (kind === 'cash') {
      if (y === undefined || y <= 0) return fail(`Enter the amount in ${cur.name.toLowerCase()}.`);
      if (c !== undefined && c <= 0) return fail('Leave USD paid blank, or enter more than $0.');
      await store.addCashPurchase({ id: e.id, date, category, yen: y, ...(c !== undefined ? { cents: c } : {}), note: n });
    } else {
      if (y === undefined || y <= 0) return fail(`Enter the ${cur.name.toLowerCase()} you received.`);
      if (c === undefined || c <= 0) return fail('Enter the dollars you paid, including fees.');
      await store.addCashBought({ id: e.id, date, yen: y, cents: c, where: where.trim() || undefined });
    }
    haptic('success');
    offer('Changes saved', () => restoreRow(store, row)); // row still holds the entry as it was before this edit
    onClose();
  }

  return (
    <SheetBackdrop onClose={onClose} role="dialog" aria-modal="true" aria-label={`Edit ${TITLES[kind]}`}>
      <form className="sheet" onSubmit={submit}>
        <h2>Edit {TITLES[kind].toLowerCase()}</h2>

        {dom ? (
          <label className="field">
            <span>Amount</span>
            <input ref={dollarsRef} value={dollars} onChange={(ev) => setDollars(ev.target.value)} inputMode="decimal" placeholder="$" autoComplete="off" />
          </label>
        ) : (
        <div className="grid2">
          <label className="field">
            <span>{kind === 'bought' ? `${cur.name} received` : cur.name}</span>
            <input ref={yenRef} value={yen} onChange={(ev) => setYen(ev.target.value)} inputMode={cur.decimals ? 'decimal' : 'numeric'} autoComplete="off" />
          </label>
          {(
            <label className="field">
              <span>{kind === 'bought' ? 'Dollars paid' : kind === 'cash' ? 'USD paid (optional)' : 'Dollars'}</span>
              <input ref={dollarsRef} value={dollars} onChange={(ev) => setDollars(ev.target.value)} inputMode="decimal" autoComplete="off" />
            </label>
          )}
        </div>
        )}

        {estimateNote && <p className="muted small est-line">{estimateNote}</p>}

        {kind !== 'bought' && (
          <div className="field">
            <span>Category</span>
            <div className="chips">
              {[...new Set([...store.categories, category])].map((c) => (
                <button key={c} type="button" className={category === c ? 'on' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>
                  <Roundel category={c} small />
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {kind === 'card' && (
          <div className="field">
            <span>Card</span>
            <div className="chips">
              {[...new Set([...store.settings.cards, ...(card && !store.settings.cards.includes(card) ? [card] : [])])].map((c) => (
                <button key={c} type="button" className={card === c ? 'on' : ''} aria-pressed={card === c} onClick={() => setCard(c)}>
                  {c}
                </button>
              ))}
              <button type="button" className={card === '' ? 'on' : ''} aria-pressed={card === ''} onClick={() => setCard('')}>
                None
              </button>
            </div>
          </div>
        )}

        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(ev) => ev.target.value && setDate(ev.target.value)} />
        </label>

        {kind === 'bought' ? (
          <label className="field">
            <span>Where (optional)</span>
            <input value={where} onChange={(ev) => setWhere(ev.target.value)} />
          </label>
        ) : (
          <label className="field">
            <span>Note (optional)</span>
            <input value={note} onChange={(ev) => setNote(ev.target.value)} />
          </label>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        <div className="sheet-actions">
          <button type="submit" className="primary">Save changes</button>
          <button type="button" className="secondary" onClick={onClose}>Discard changes</button>
        </div>
      </form>
    </SheetBackdrop>
  );
}

/** Put an entry back exactly as the given row holds it (used by Undo for edits and deletes). */
export async function restoreRow(store: Store, row: Row): Promise<void> {
  if (row.kind === 'card') await store.addCardCharge(row.e);
  else if (row.kind === 'cash') await store.addCashPurchase(row.e);
  else await store.addCashBought(row.e);
}
