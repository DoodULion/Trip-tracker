import { useRef, useState, type FormEvent } from 'react';
import { CATEGORIES, formatDollars, formatYen, type Category } from './calc';
import { Roundel } from './Roundel';
import { clampDate, newId, parseCents, parseYen, todayLocal } from './money';
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
    (CATEGORIES as readonly string[]).includes(prefs.lastCategory ?? '') ? (prefs.lastCategory as Category) : 'Food',
  );
  const [card, setCard] = useState(() =>
    prefs.lastCard !== undefined && settings.cards.includes(prefs.lastCard) ? prefs.lastCard : settings.cards[0] ?? '',
  );
  const [yen, setYen] = useState('');
  const [dollars, setDollars] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const savedTimer = useRef<number>(0);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setError('');
    const y = parseYen(yen);
    const c = parseCents(dollars);
    if (yen.trim() !== '' && y === undefined) return setError('Yen must be a whole number.');
    if (dollars.trim() !== '' && c === undefined) return setError('Dollars must look like 10.50.');
    const id = newId();
    const n = note.trim() || undefined;
    let msg: string;

    if (mode === 'card') {
      if (y === undefined && c === undefined) return setError('Enter yen, dollars, or both.');
      await store.addCardCharge({ id, date, category, card, yen: y, cents: c, note: n });
      await store.setPrefs({ lastCard: card, lastCategory: category });
      msg = `Saved ${y !== undefined ? formatYen(y) : ''}${y !== undefined && c !== undefined ? ' · ' : ''}${c !== undefined ? formatDollars(c) : ''}`;
    } else {
      if (y === undefined || y <= 0) return setError('Enter the yen amount.');
      await store.addCashPurchase({ id, date, category, yen: y, note: n });
      await store.setPrefs({ lastCategory: category });
      msg = `Saved ${formatYen(y)}`;
    }

    setYen('');
    setDollars('');
    setNote('');
    setSaved(msg);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(''), 2000);
  }

  return (
    <form className="screen" onSubmit={submit}>
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
          <span>Yen</span>
          <input value={yen} onChange={(e) => setYen(e.target.value)} inputMode="numeric" placeholder="¥" autoComplete="off" />
        </label>
        {mode === 'card' && (
          <label className="field">
            <span>Dollars (optional)</span>
            <input value={dollars} onChange={(e) => setDollars(e.target.value)} inputMode="decimal" placeholder="$" autoComplete="off" />
          </label>
        )}
      </div>

      <div className="field">
        <span>Category</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={category === c ? 'on' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>
              <Roundel category={c} small />
              {c}
            </button>
          ))}
        </div>
      </div>

      {mode === 'card' && (
        <div className="field">
          <span>Card</span>
          <div className="chips">
            {settings.cards.map((c) => (
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
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </label>

      <label className="field">
        <span>Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary">Save</button>
      <p className={`toast ${saved ? 'show' : ''}`} role="status">{saved}</p>
    </form>
  );
}
