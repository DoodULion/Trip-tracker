import { useMemo, useState, type FormEvent } from 'react';
import { applyEstimates, computeDays, dailyLimitCents, formatDollars, formatYen, type Category, type Data } from './calc';
import Icon from './icons';
import NameSheet from './NameSheet';
import CashBoughtSheet from './CashBoughtSheet';
import { Roundel } from './Roundel';
import type { EntryStore } from './db';
import { clampDate, dayLabel, newId, parseCents, parseYen, todayLocal } from './money';
import { amountHint, getCurrency } from './currency';
import { useUndo } from './undo';
import type { Store } from './store';

type Mode = 'card' | 'cash';

const MODES: { id: Mode; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
];

/**
 * Add a card charge or a cash purchase. No field is focused automatically (not on opening,
 * not when switching Card / Cash, not after saving): the keyboard opens only when a field is tapped.
 * Cash bought (ATM / exchange) is logged from the Entries tab.
 */
export default function Add({ store }: { store: Store }) {
  const { settings, prefs } = store;
  const [mode, setMode] = useState<Mode>('card');
  const [date, setDate] = useState(() => clampDate(todayLocal(), settings.tripStart, settings.tripEnd));
  const [category, setCategory] = useState<Category>(() =>
    store.categories.includes(prefs.lastCategory ?? '') ? (prefs.lastCategory as Category) : (store.categories[0] ?? 'Food'),
  );
  const [naming, setNaming] = useState<'category' | 'card' | null>(null);
  const [card, setCard] = useState(() =>
    prefs.lastCard !== undefined && settings.cards.includes(prefs.lastCard) ? prefs.lastCard : settings.cards[0] ?? '',
  );
  const [yen, setYen] = useState('');
  const [dollars, setDollars] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const [addingCash, setAddingCash] = useState(false);
  const { offer } = useUndo();

  const cur = getCurrency();

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setError('');
    const y = parseYen(yen);
    const c = parseCents(dollars);
    if (yen.trim() !== '' && y === undefined) return setError(`${cur.name} must be ${amountHint(cur)}.`);
    if (dollars.trim() !== '' && c === undefined) return setError('Dollars must look like 10.50.');
    const id = newId();
    const n = note.trim() || undefined;
    let msg: string;
    let undoStore: EntryStore = 'cardCharges';

    let after: Data;
    if (mode === 'card') {
      if (y === undefined && c === undefined) return setError(`Enter ${cur.name.toLowerCase()}, dollars, or both.`);
      const entry = { id, date, category, card, yen: y, cents: c, note: n };
      after = { ...store.data, cardCharges: [...store.data.cardCharges, entry] };
      await store.addCardCharge(entry);
      await store.setPrefs({ lastCard: card, lastCategory: category });
      msg = `Saved ${y !== undefined ? formatYen(y) : ''}${y !== undefined && c !== undefined ? ` (${formatDollars(c)})` : c !== undefined ? formatDollars(c) : ''}.`;
    } else {
      if (y === undefined || y <= 0) return setError(`Enter the amount in ${cur.name.toLowerCase()}.`);
      if (c !== undefined && c <= 0) return setError('Leave USD paid blank, or enter more than $0.');
      const entry = { id, date, category, yen: y, ...(c !== undefined ? { cents: c } : {}), note: n };
      after = { ...store.data, cashPurchases: [...store.data.cashPurchases, entry] };
      await store.addCashPurchase(entry);
      undoStore = 'cashPurchases';
      await store.setPrefs({ lastCategory: category });
      msg = `Saved ${formatYen(y)}${c !== undefined ? ` (${formatDollars(c)})` : ''}.`;
    }
    msg += leftAfter(after, date);

    setYen('');
    setDollars('');
    setNote('');
    offer(msg, () => store.removeEntry(undoStore, id));
  }

  // Live answer to "can I buy this?": what is left for the entry's day if this amount is saved.
  const preview = useMemo(() => {
    const y = parseYen(yen);
    const c = parseCents(dollars);
    const typed = y !== undefined || c !== undefined;
    const tmp = { id: '__preview', date, category, note: undefined };
    const after: Data = !typed
      ? store.data
      : mode === 'card'
        ? { ...store.data, cardCharges: [...store.data.cardCharges, { ...tmp, card, yen: y, cents: c }] }
        : y !== undefined
          ? { ...store.data, cashPurchases: [...store.data.cashPurchases, { ...tmp, yen: y, ...(c !== undefined ? { cents: c } : {}) }] }
          : store.data;
    const est = applyEstimates(after, store.spot);
    const row = computeDays(est, settings).find((d) => d.date === date);
    if (!row) return undefined;
    // A card amount with no dollars typed counts at an estimated rate, so it is marked ≈.
    return { left: dailyLimitCents(settings) - row.totalCents, typed, estimated: typed && mode === 'card' && c === undefined };
  }, [yen, dollars, date, category, card, mode, store.data, store.spot, settings]);
  const isToday = date === todayLocal();

  /** " $266.61 left today." (or for the entry's day, or how far over), from the entries including the new one. */
  function leftAfter(after: Data, day: string): string {
    const row = computeDays(applyEstimates(after, store.spot), settings).find((d) => d.date === day);
    if (!row) return '';
    const left = dailyLimitCents(settings) - row.totalCents;
    const when = day === todayLocal() ? 'today' : `on ${dayLabel(day)}`;
    return left >= 0 ? ` ${formatDollars(left)} left ${when}.` : ` ${formatDollars(-left)} over the limit ${when}.`;
  }

  return (
    <>
    <form className="screen add-form" onSubmit={submit}>
      <div className="add-col">
      <div className="seg" role="tablist" aria-label="Entry type">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? 'on' : ''}
            onClick={() => {
              setMode(m.id);
              setError('');
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid2">
        <label className="field">
          <span>{cur.name}</span>
          <input value={yen} onChange={(e) => setYen(e.target.value)} inputMode={cur.decimals ? 'decimal' : 'numeric'} placeholder={cur.symbol.trim()} autoComplete="off" />
        </label>
        <label className="field">
          <span>{mode === 'card' ? 'Dollars (optional)' : 'USD paid (optional)'}</span>
          <input value={dollars} onChange={(e) => setDollars(e.target.value)} inputMode="decimal" placeholder="$" autoComplete="off" />
        </label>
      </div>

      {preview && (
        <p className={`live-left${preview.left < 0 ? ' over' : ''}`} aria-live="polite">
          <span>{preview.left < 0 && <Icon name="alert" />}{preview.typed ? 'After this, ' : ''}{preview.left < 0 ? (preview.typed ? 'over the limit' : 'Over the limit') : preview.typed ? 'left' : 'Left'} {isToday ? 'today' : `on ${dayLabel(date)}`}</span>
          <b>
            {preview.estimated ? '≈' : ''}
            {formatDollars(Math.abs(preview.left))}
          </b>
        </p>
      )}

      {/* Cash: getting cash (ATM or exchange) lives here too, beside spending it. */}
      {mode === 'cash' && (
        <button type="button" className="more-row add-cash" onClick={() => setAddingCash(true)}>
          <Icon name="add" />
          <span>Add cash</span>
          <span className="muted">from an ATM or exchange</span>
        </button>
      )}

      <div className="field">
        <span>Category</span>
        <div className="chips scroll-row">
          {store.categories.map((c) => (
            <button key={c} type="button" className={category === c ? 'on' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>
              <Roundel category={c} small />
              {c}
            </button>
          ))}
          <button type="button" className="chip-new" onClick={() => setNaming('category')}>
            <Icon name="add" />
            New category
          </button>
        </div>
      </div>
      </div>

      <div className="add-col">

      {mode === 'card' && (
        <div className="field">
          <span>Card</span>
          <div className="chips scroll-row">
            {settings.cards.map((c) => (
              <button key={c} type="button" className={card === c ? 'on' : ''} aria-pressed={card === c} onClick={() => setCard(c)}>
                {c}
              </button>
            ))}
            <button type="button" className="chip-new" onClick={() => setNaming('card')}>
              <Icon name="add" />
              New card
            </button>
          </div>
        </div>
      )}

      {/* Date and note are rarely changed: they wait behind one row, so Save stays close. */}
      {!more ? (
        <button type="button" className="more-row" aria-expanded={false} onClick={() => setMore(true)}>
          <span>{isToday ? 'Today' : dayLabel(date)}</span>
          <span className="muted">{note.trim() ? note.trim() : 'Change date, add a note'}</span>
          <Icon name="down" />
        </button>
      ) : (
        <div className="grid2 more-fields">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Note (optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary">Save</button>
      </div>
    </form>
    {naming === 'category' && (
      <NameSheet
        title="New category"
        label="Category name"
        hint={`It's added to ${store.trip.name} and to your category list. Remove it any time in App settings.`}
        existing={store.categories}
        onClose={() => setNaming(null)}
        onSave={async (name) => {
          await store.addCategory(name);
          setCategory(name);
        }}
      />
    )}
    {addingCash && <CashBoughtSheet store={store} onClose={() => setAddingCash(false)} />}
    {naming === 'card' && (
      <NameSheet
        title="New card"
        label="Card name"
        hint={`It's added to ${store.trip.name}. Rename or remove it in Edit trip.`}
        existing={settings.cards}
        onClose={() => setNaming(null)}
        onSave={async (name) => {
          await store.saveTrip({ ...store.trip, cards: [...settings.cards, name] }, []);
          setCard(name);
        }}
      />
    )}

    </>
  );
}
