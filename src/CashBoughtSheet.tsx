import { useState, type FormEvent } from 'react';
import { clampDate, newId, parseCents, parseYen, todayLocal } from './money';
import { formatDollars, formatYen } from './calc';
import { useUndo } from './undo';
import type { Store } from './store';

/** Log yen received from an ATM or exchange, and the dollars paid including fees. Nothing is focused automatically. */
export default function CashBoughtSheet({ store, onClose }: { store: Store; onClose: () => void }) {
  const { settings } = store;
  const { offer } = useUndo();
  const [yen, setYen] = useState('');
  const [dollars, setDollars] = useState('');
  const [date, setDate] = useState(() => clampDate(todayLocal(), settings.tripStart, settings.tripEnd));
  const [where, setWhere] = useState('');
  const [error, setError] = useState('');

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setError('');
    const y = parseYen(yen);
    const c = parseCents(dollars);
    if (y === undefined || y <= 0) return setError('Enter the yen you received, as a whole number.');
    if (c === undefined || c <= 0) return setError('Enter the dollars you paid, including fees, like 200.00.');
    const id = newId();
    await store.addCashBought({ id, date, yen: y, cents: c, where: where.trim() || undefined });
    offer(`Saved cash bought ${formatYen(y)} for ${formatDollars(c)}`, () => store.removeEntry('cashBought', id));
    onClose();
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Log cash bought">
      <form className="sheet" onSubmit={submit}>
        <h2>Log cash bought</h2>
        <p className="muted small">An ATM withdrawal or currency exchange. This sets your real cash rate.</p>
        <div className="grid2">
          <label className="field">
            <span>Yen received</span>
            <input value={yen} onChange={(e) => setYen(e.target.value)} inputMode="numeric" placeholder="¥" autoComplete="off" />
          </label>
          <label className="field">
            <span>Dollars paid (with fees)</span>
            <input value={dollars} onChange={(e) => setDollars(e.target.value)} inputMode="decimal" placeholder="$" autoComplete="off" />
          </label>
        </div>
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Where (optional)</span>
          <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="7-Eleven ATM" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="submit" className="primary">Save</button>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
