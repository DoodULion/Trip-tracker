import { useState, type FormEvent } from 'react';
import Icon from './icons';
import SheetBackdrop from './SheetBackdrop';
import {
  BUILTIN_CARDS,
  DISPLAYS,
  OPS,
  formulaLabel,
  formulaUnit,
  statLabel,
  type CardItem,
  type Display,
  type SeriesDef,
  type Formula,
  type Op,
  type StatDef,
  type StatValue,
  type SummaryCard,
} from './summaryCards';

type Custom = Extract<SummaryCard, { kind: 'custom' }>;
const MAX_ITEMS = 8;

const itemLabel = (it: CardItem) => ('stat' in it ? statLabel(it.stat) : it.label || formulaLabel(it.formula));

/**
 * Make or change a custom Summary card: a name plus figures picked from a list and simple formulas
 * (one figure +, −, × or ÷ another figure or a number). Each pick shows its current value for this trip.
 * A new card can also bring back a built-in card that was removed.
 */
export default function CardSheet({ initial, fromBuiltin, catalog, series, unitOf, valueOf, missingBuiltins, onAddBuiltin, onSave, onClose }: {
  initial?: Custom;
  /** The card being edited is a built-in one: saving turns it into the card shown here. */
  fromBuiltin?: boolean;
  catalog: StatDef[];
  series: SeriesDef[];
  unitOf: (id: string) => StatValue['unit'];
  /** The current value of an item, formatted, for this trip. */
  valueOf: (item: CardItem) => string;
  missingBuiltins: string[];
  onAddBuiltin: (id: string) => void;
  onSave: (card: Custom) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [items, setItems] = useState<CardItem[]>(initial?.items ?? []);
  const [display, setDisplay] = useState<Display>(initial?.display ?? 'auto');
  const [seriesId, setSeriesId] = useState(initial?.series ?? '');
  const daily = display === 'daily';
  const [error, setError] = useState('');
  const [building, setBuilding] = useState(false);
  const [a, setA] = useState('');
  const [op, setOp] = useState<Op>('/');
  const [b, setB] = useState(''); // a stat id, or '#' for a plain number
  const [num, setNum] = useState('');
  const [fname, setFname] = useState('');

  const groups = [...new Set(catalog.map((d) => d.group))];
  const full = items.length >= MAX_ITEMS;

  const aUnit = a ? unitOf(a) : undefined;
  const bOptions = aUnit ? catalog.filter((d) => formulaUnit(aUnit, op, unitOf(d.id)) !== undefined) : [];
  const numberOk = aUnit ? formulaUnit(aUnit, op, 'number') !== undefined : false;
  const numValue = num.trim() === '' ? NaN : Number(num.replace(/,/g, ''));
  const formula: Formula | undefined =
    a && b && (b !== '#' || Number.isFinite(numValue)) ? { a, op, b: b === '#' ? numValue : b } : undefined;
  const formulaValid = formula && (b === '#' ? numberOk : bOptions.some((d) => d.id === b));

  function addFormula() {
    if (!formula || !formulaValid || full) return;
    setItems([...items, { formula, ...(fname.trim() ? { label: fname.trim().slice(0, 40) } : {}) }]);
    setA('');
    setB('');
    setNum('');
    setFname('');
    setBuilding(false);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (t === '') return setError('Give the card a name.');
    if (daily && !seriesId) return setError('Pick what the daily chart shows.');
    if (!daily && items.length === 0) return setError('Add at least one number or calculation.');
    onSave({
      id: initial?.id ?? `c${Date.now().toString(36)}`,
      kind: 'custom',
      title: t.slice(0, 40),
      items: daily ? [] : items,
      ...(display !== 'auto' ? { display } : {}),
      ...(daily ? { series: seriesId } : {}),
    });
    onClose();
  }

  return (
    <SheetBackdrop onClose={onClose} role="dialog" aria-modal="true" aria-label={initial ? 'Edit card' : 'New card'}>
      <form className="sheet card-sheet" onSubmit={submit}>
        <h2>{initial ? 'Edit card' : 'New card'}</h2>
        {fromBuiltin && <p className="muted small">This is a built-in card. Saving turns it into your own card with the numbers below; you can bring the original back from Add card.</p>}
        <p className="muted small">A card shows numbers from this trip: pick ready-made ones (like Remaining or Food), or combine two, such as Remaining ÷ Days left. Then choose how it looks.</p>

        {!initial && missingBuiltins.length > 0 && (
          <div className="field">
            <span>Bring back a built-in card</span>
            <div className="chips">
              {missingBuiltins.map((id) => (
                <button key={id} type="button" className="chip-new" onClick={() => { onAddBuiltin(id); onClose(); }}>
                  <Icon name="add" />
                  {BUILTIN_CARDS.find((c) => c.id === id)?.label ?? id}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span>Card name</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} autoComplete="off" placeholder="For example: Food watch" enterKeyHint="done" />
        </label>

        <label className="field">
          <span>Show as</span>
          <select value={display} onChange={(e) => setDisplay(e.target.value as Display)}>
            {DISPLAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
        {display === 'bars' && <p className="muted small">Each bar is sized against the largest figure of the same kind (dollars with dollars, local currency with local currency).</p>}
        {display === 'donut' && <p className="muted small">A pie shows parts of a whole: pick numbers of the same kind, such as each category or each card.</p>}

        {daily && (
          <label className="field">
            <span>Chart</span>
            <select value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
              <option value="">Choose what to chart…</option>
              {series.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </label>
        )}

        {!daily && (<>
        <div className="field">
          <span>Numbers on this card ({items.length} of {MAX_ITEMS})</span>
          {items.length === 0 ? (
            <p className="muted small">Nothing yet. Pick a number below, or make a calculation from two numbers.</p>
          ) : (
            <ul className="pick-list">
              {items.map((it, i) => (
                <li key={i}>
                  <span className="pick-name">{itemLabel(it)}</span>
                  <b>{valueOf(it)}</b>
                  <button type="button" className="more" aria-label={`Remove ${itemLabel(it)}`} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                    <Icon name="close" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="field">
          <span>Add a number</span>
          <select
            value=""
            disabled={full}
            onChange={(e) => {
              if (e.target.value) setItems([...items, { stat: e.target.value }]);
            }}
          >
            <option value="">{full ? 'This card is full' : 'Choose a number…'}</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {catalog.filter((d) => d.group === g).map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {!building ? (
          <button type="button" className="secondary" disabled={full} onClick={() => setBuilding(true)}>Add a calculation (+ − × ÷)</button>
        ) : (
          <fieldset className="formula">
            <legend>Calculation</legend>
            <label className="field">
              <span>Start with</span>
              <select value={a} onChange={(e) => { setA(e.target.value); setB(''); }}>
                <option value="">Choose a number…</option>
                {groups.map((g) => (
                  <optgroup key={g} label={g}>
                    {catalog.filter((d) => d.group === g && unitOf(d.id) !== 'text').map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="seg" role="radiogroup" aria-label="Operation">
              {OPS.map((o) => (
                <button key={o.op} type="button" role="radio" aria-checked={op === o.op} className={op === o.op ? 'on' : ''} onClick={() => { setOp(o.op); setB(''); }}>
                  {o.label}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Then</span>
              <select value={b} disabled={!a} onChange={(e) => setB(e.target.value)}>
                <option value="">{a ? 'Choose…' : 'Pick the first number'}</option>
                {numberOk && <option value="#">A number</option>}
                {groups.map((g) => {
                  const opts = bOptions.filter((d) => d.group === g);
                  return opts.length ? (
                    <optgroup key={g} label={g}>
                      {opts.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </label>
            {b === '#' && (
              <label className="field">
                <span>{aUnit === 'usd' && (op === '+' || op === '-') ? 'Dollars' : 'Number'}</span>
                <input inputMode="decimal" value={num} onChange={(e) => setNum(e.target.value)} placeholder="0" />
              </label>
            )}
            <label className="field">
              <span>Name (optional)</span>
              <input value={fname} onChange={(e) => setFname(e.target.value)} maxLength={40} placeholder={formula ? formulaLabel(formula) : 'Shown beside the result'} />
            </label>
            {formula && formulaValid && (
              <p className="formula-preview">
                {formulaLabel(formula)} = <b>{valueOf({ formula })}</b>
              </p>
            )}
            <div className="menu-pair">
              <button type="button" className="secondary" onClick={() => setBuilding(false)}>Cancel</button>
              <button type="button" className="secondary" disabled={!formulaValid} onClick={addFormula}>Add</button>
            </div>
          </fieldset>
        )}

        </>)}

        {error && <p className="error" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="submit" className="primary">{initial ? 'Save changes' : 'Add card'}</button>
          <button type="button" className="secondary" onClick={onClose}>{initial ? 'Discard changes' : 'Cancel'}</button>
        </div>
      </form>
    </SheetBackdrop>
  );
}
