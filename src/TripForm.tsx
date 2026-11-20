import { useState } from 'react';
import { isDomestic, suggestCategories, type Trip } from './calc';
import { Roundel } from './Roundel';
import { COUNTRIES, US_STATES, flagEmoji } from './countries';
import { currencyFor } from './currency';
import { centsToAmountInput, formatAmountInput, newId, parseCents } from './money';

interface CardRow {
  orig?: string; // name it had when the form opened; used to rename existing charges
  name: string;
}

interface Props {
  /** Editing this trip; omit to create a new one. */
  initial?: Trip;
  saveLabel: string;
  discardLabel?: string;
  onSave: (trip: Trip, renames: [string, string][]) => Promise<void>;
  /** Shown as a second button when given (e.g. in a sheet). */
  onDiscard?: () => void;
  /** Show a "saved" note after saving . */
  confirmSaved?: boolean;
  /** How many entries the trip already has (to warn when a new country changes the currency they are read in). */
  entryCount?: number;
  /** The owner's whole category list. */
  library: string[];
  /** How often each category was used on the owner's other trips (learned suggestions). */
  usage: Record<string, number>;
}

/** Name, dates, budget ceiling and cards for one trip. Used to create and edit trips from the trips list. */
export default function TripForm({ initial, saveLabel, discardLabel = 'Discard changes', onSave, onDiscard, confirmSaved, entryCount = 0, library, usage }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  // Domestic (within the US) trips are kept in dollars only. The type is fixed once a trip has entries,
  // since its entries are stored differently.
  const [domestic, setDomestic] = useState(initial ? isDomestic(initial) : false);
  const typeLocked = !!initial && entryCount > 0;
  const [state, setState] = useState(initial?.state ?? '');
  const [start, setStart] = useState(initial?.tripStart ?? '');
  const [end, setEnd] = useState(initial?.tripEnd ?? '');
  const [budget, setBudget] = useState(initial ? centsToAmountInput(initial.budgetCeilingCents) : '');
  const [cards, setCards] = useState<CardRow[]>(() =>
    initial ? initial.cards.map((n) => ({ orig: n, name: n })) : [],
  );
  // Categories: ordered by how often they were used on past trips. A new trip starts with the ones you
  // usually use (or the whole list when there is no history); an older trip with no choice yet has them all.
  const { ordered, usual } = suggestCategories(library, usage);
  const [cats, setCats] = useState<string[]>(() =>
    initial ? (initial.categories?.filter((c) => library.includes(c)) ?? [...library]) : usual.length > 0 ? usual : [...library],
  );
  const toggleCat = (c: string) => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c]);
  const sameAs = (list: string[]) => list.length === cats.length && list.every((c) => cats.includes(c));
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
    if (cats.length === 0) return setErr('Pick at least one category for this trip.');
    const renames: [string, string][] = cards.flatMap((c, i) => (c.orig !== undefined && c.orig !== names[i] ? [[c.orig, names[i]] as [string, string]] : []));
    await onSave(
      {
        id: initial?.id ?? newId(),
        name: name.trim(),
        tripStart: start,
        tripEnd: end,
        budgetCeilingCents: cents,
        cards: names,
        categories: ordered.filter((c) => cats.includes(c)),
        ...(domestic ? { country: 'US', scope: 'domestic' as const, ...(state ? { state } : {}) } : country ? { country } : {}),
        // Keep the trip's place on the list when it is edited.
        ...(initial?.order !== undefined ? { order: initial.order } : {}),
        ...(initial?.createdAt !== undefined ? { createdAt: initial.createdAt } : {}),
      },
      renames,
    );
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
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>
      <div className="field">
        <span>Trip type</span>
        <div className="seg" role="radiogroup" aria-label="Trip type">
          {([['international', 'International'], ['domestic', 'Domestic (US)']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={(id === 'domestic') === domestic}
              className={(id === 'domestic') === domestic ? 'on' : ''}
              disabled={typeLocked && (id === 'domestic') !== domestic}
              onClick={() => {
                setDomestic(id === 'domestic');
                if (id === 'international' && domestic && country === 'US') setCountry(''); // pick a country afresh
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {(domestic || typeLocked) && (
          <p className="muted small">
            {domestic && 'Everything is in dollars: no local currency, exchange rates or cash bought.'}
            {domestic && typeLocked && ' '}
            {typeLocked && 'The type can’t change once a trip has entries.'}
          </p>
        )}
      </div>
      {domestic && (
        <label className="field">
          <span>State (sets the main color)</span>
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">No state (US colors)</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!domestic && (
        <>
        <label className="field">
          <span>Country (sets the flag, main color and currency)</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">No country (neutral, yen)</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {flagEmoji(c.code)} {c.name}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">
          Amounts are entered in {currencyFor(country || undefined).name.toLowerCase()} ({currencyFor(country || undefined).code}); dollars stay the base currency.
          {initial && entryCount > 0 && currencyFor(country || undefined).code !== currencyFor(initial.country).code && (
            <> The {entryCount} entries already in this trip will read as {currencyFor(country || undefined).name.toLowerCase()}, not {currencyFor(initial.country).name.toLowerCase()}.</>
          )}
        </p>
        </>
      )}
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
        <input value={budget} onChange={(e) => setBudget(withCommas(e.target))} inputMode="decimal" autoComplete="off" />
      </label>

      <div className="field">
        <span>Credit Card</span>
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
        {initial && <p className="muted small">Renaming a card updates its past charges. Removing one keeps its past charges under the old name.</p>}
      </div>

      <div className="field">
        <span>Categories for this trip</span>
        <div className="chips">
          {ordered.map((c) => (
            <button key={c} type="button" className={cats.includes(c) ? 'on' : ''} aria-pressed={cats.includes(c)} onClick={() => toggleCat(c)}>
              <Roundel category={c} small />
              {c}
              {(usage[c] ?? 0) > 0 && <small className="use-count">{usage[c]}</small>}
            </button>
          ))}
        </div>
        {usual.length > 0 && !sameAs(usual) && (
          <button type="button" className="secondary" onClick={() => setCats(usual)}>
            Use my usual categories ({usual.length})
          </button>
        )}
        <p className="muted small">
          {usual.length > 0
            ? 'Ordered by how often you used them on past trips (the number is how many entries). Add a new category in App settings, or from Add.'
            : 'Tap to choose which categories Add offers on this trip. Add a new category in App settings, or from Add.'}
        </p>
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

/**
 * Format the field's text with thousands commas and keep the cursor after the same digit,
 * so typing or deleting in the middle of the number doesn't jump the cursor to the end.
 */
function withCommas(el: HTMLInputElement): string {
  const caret = el.selectionStart ?? el.value.length;
  const kept = el.value.slice(0, caret).replace(/[^\d.]/g, '').length;
  const next = formatAmountInput(el.value);
  requestAnimationFrame(() => {
    if (document.activeElement !== el) return;
    let i = 0;
    for (let n = 0; i < next.length && n < kept; i++) if (/[\d.]/.test(next[i])) n++;
    el.setSelectionRange(i, i);
  });
  return next;
}
