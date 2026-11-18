import { useState } from 'react';
import type { Trip } from './calc';
import { COUNTRIES, flagEmoji } from './countries';
import { centsToInput, newId, parseCents } from './money';

interface CardRow {
  orig?: string; // name it had when the form opened; used to rename existing charges
  name: string;
}

interface Props {
  /** Editing this trip; omit to create a new one. */
  initial?: Trip;
  /** Starting card names for a new trip. */
  defaultCards?: string[];
  saveLabel: string;
  discardLabel?: string;
  onSave: (trip: Trip, renames: [string, string][]) => Promise<void>;
  /** Shown as a second button when given (e.g. in a sheet). */
  onDiscard?: () => void;
  /** Show a "saved" note after saving (for the inline Settings tab). */
  confirmSaved?: boolean;
}

/** Name, dates, budget ceiling and cards for one trip. Used to create, edit, and in a trip's Settings tab. */
export default function TripForm({ initial, defaultCards = [], saveLabel, discardLabel = 'Discard changes', onSave, onDiscard, confirmSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [start, setStart] = useState(initial?.tripStart ?? '');
  const [end, setEnd] = useState(initial?.tripEnd ?? '');
  const [budget, setBudget] = useState(initial ? centsToInput(initial.budgetCeilingCents) : '');
  const [cards, setCards] = useState<CardRow[]>(() =>
    initial ? initial.cards.map((n) => ({ orig: n, name: n })) : defaultCards.map((n) => ({ name: n })),
  );
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  async function save() {
    setErr('');
    setSaved(false);
    const cents = parseCents(budget);
    const names = cards.map((c) => c.name.trim());
    if (name.trim() === '') return setErr('Give the trip a name.');
    if (!start || !end) return setErr('Choose a start and end date.');
    if (end < start) return setErr('The trip end date must be on or after the start date.');
    if (cents === undefined || cents <= 0) return setErr('Enter the budget ceiling in dollars, like 10000.');
    if (names.some((n) => n === '')) return setErr('Card names cannot be blank.');
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return setErr('Card names must be different from each other.');
    const renames: [string, string][] = cards.flatMap((c, i) => (c.orig !== undefined && c.orig !== names[i] ? [[c.orig, names[i]] as [string, string]] : []));
    await onSave({ id: initial?.id ?? newId(), name: name.trim(), tripStart: start, tripEnd: end, budgetCeilingCents: cents, cards: names, ...(country ? { country } : {}) }, renames);
    setCards(names.map((n) => ({ orig: n, name: n })));
    if (confirmSaved) setSaved(true);
  }

  return (
    <form
      className="tripform"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label className="field">
        <span>Trip name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Japan 2026" autoComplete="off" />
      </label>
      <label className="field">
        <span>Country (sets the flag and main color)</span>
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">No country (orange)</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {flagEmoji(c.code)} {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid2">
        <label className="field">
          <span>Start</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          <span>End</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Budget ceiling ($)</span>
        <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder="10000" autoComplete="off" />
      </label>

      <div className="field">
        <span>Cards</span>
        {cards.map((c, i) => (
          <div key={i} className="card-edit">
            <input aria-label={`Card ${i + 1} name`} value={c.name} onChange={(e) => setCards(cards.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <button type="button" className="secondary" aria-label={`Remove ${c.name || 'card'}`} onClick={() => setCards(cards.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="secondary" onClick={() => setCards([...cards, { name: '' }])}>
          Add a card
        </button>
        <p className="muted small">Renaming a card updates its past charges. Removing one keeps its past charges under the old name.</p>
      </div>

      {err && <p className="error" role="alert">{err}</p>}
      <div className={onDiscard ? 'sheet-actions' : undefined}>
        <button type="submit" className="primary">{saveLabel}</button>
        {onDiscard && (
          <button type="button" className="secondary" onClick={onDiscard}>{discardLabel}</button>
        )}
      </div>
      {saved && <p className="toast show" role="status">Settings saved.</p>}
    </form>
  );
}
