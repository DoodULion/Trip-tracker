import { useToday } from './useToday';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { computeDays, computeSummary, formatDollars, tripPhase } from './calc';
import { Bars, DailyChart, Donut, Tiles, type ChartRow } from './CardCharts';
import { Big, Fig, Meter } from './Figures';
import CardSheet from './CardSheet';
import SheetBackdrop from './SheetBackdrop';
import {
  BUILTIN_CARDS,
  builtinAsCustom,
  formatStat,
  formulaLabel,
  formulaValue,
  statCatalog,
  statLabel,
  statValue,
  dailySeries,
  seriesCatalog,
  seriesDef,
  type CardItem,
  type SummaryCard,
} from './summaryCards';
import { useHoldDrag } from './useHoldDrag';
import { useSummaryLayout } from './useSummaryLayout';
import { dayLabel } from './money';
import Icon from './icons';
import { Roundel, categoryColor } from './Roundel';
import { statusBadge } from './status';
import type { Store } from './store';

type Sheet = { step: 'new' } | { step: 'menu' | 'edit' | 'confirm'; id: string } | null;

export default function Summary({ store }: { store: Store }) {
  const { data, settings } = store;
  const today = useToday();
  const s = useMemo(() => computeSummary(store.calcData, settings, today, store.categories), [store.calcData, settings, today]);

  const outsideCount = s.outside.cardCharges.length + s.outside.cashPurchases.length + s.outside.cashBought.length;
  const badge = statusBadge(s, store.trip, today);
  const finished = today > settings.tripEnd;
  const over = s.focusDay.leftCents < 0;
  const estimatedToday = store.calcData.cardCharges.filter((c) => c.estimated && c.date === s.focusDay.date);
  const showCashBanner = s.cashRateMissing && data.cashPurchases.length > 0;

  // The cards: the same set and order on every trip, chosen by the owner (Edit, top right).
  const [layout, setLayout] = useSummaryLayout();
  const [editing, setEditing] = useState(false);
  // The Edit button lives in the trip header (next to the day count), so it takes no room on the page.
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById('band-slot')), []);
  const [sheet, setSheet] = useState<Sheet>(null);
  const { order, dragId, listRef, bind } = useHoldDrag(
    layout.map((c) => c.id),
    (ids) => setLayout(ids.map((id) => layout.find((c) => c.id === id)).filter((c): c is SummaryCard => !!c)),
    '[data-id]',
  );
  const ceiling = settings.budgetCeilingCents;
  const catalog = statCatalog(store.categories, store.trip.cards);
  const series = seriesCatalog(store.categories);
  const days = useMemo(() => computeDays(store.calcData, settings), [store.calcData, settings]);
  const unitOf = (id: string) => statValue(id, s, ceiling).unit;
  const itemValue = (it: CardItem) => formatStat('stat' in it ? statValue(it.stat, s, ceiling) : formulaValue(it.formula, s, ceiling));
  const itemNote = (it: CardItem) => ('stat' in it ? statValue(it.stat, s, ceiling).note : undefined);
  const missingBuiltins = BUILTIN_CARDS.map((b) => b.id).filter((id) => !layout.some((c) => c.id === id));
  const target = sheet && sheet.step !== 'new' ? layout.find((c) => c.id === sheet.id) : undefined;
  const targetIndex = target ? layout.indexOf(target) : -1;
  const closeSheet = () => setSheet(null);

  function move(id: string, by: -1 | 1) {
    const i = layout.findIndex((c) => c.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= layout.length) return;
    const next = [...layout];
    [next[i], next[j]] = [next[j], next[i]];
    setLayout(next);
  }

  /** The ⋮ button a card shows while editing. */
  const tools = (id: string, name: string) =>
    editing ? (
      <button type="button" className="more" aria-label={`Options for ${name}`} aria-haspopup="dialog" onClick={() => setSheet({ step: 'menu', id })}>
        <Icon name="dots" />
      </button>
    ) : null;
  /** Props that make a card draggable (hold, then drag). */
  const drag = (id: string, cls: string) => ({ ...bind(id), className: `${cls} sum-card${dragId === id ? ' lifted' : ''}` });

  const dayTitle = s.focusDay.kind === 'today' ? 'Today' : s.focusDay.kind === 'upcoming' ? 'First day' : 'Last day';

  function todayCard() {
    if (finished)
      return (
      <section {...drag('today', 'card')} aria-label="Trip summary">
          <div className="card-head">
            <h2>Trip summary</h2>
          </div>
          <span className="muted small">Trip complete, {s.tripLength} days</span>
          <Big>{formatDollars(s.totalSpentCents)}</Big>
          <span className="muted small">Total spent of {formatDollars(settings.budgetCeilingCents)}</span>
          <div className="rule">
            <div>
              <Fig>{formatDollars(s.tripAverageCents)}</Fig>
              <span>Average per day</span>
            </div>
            <div>
              <Fig>{s.biggestDay ? formatDollars(s.biggestDay.cents) : '—'}</Fig>
              <span>Most spent{s.biggestDay ? `, ${dayLabel(s.biggestDay.date)}` : ''}</span>
            </div>
            <div>
              <Fig>{s.smallestDay ? formatDollars(s.smallestDay.cents) : '—'}</Fig>
              <span>Least spent{s.smallestDay ? `, ${dayLabel(s.smallestDay.date)}` : ''}</span>
            </div>
          </div>
        </section>
      );
    return (
      <section {...drag('today', `card hero${over ? ' over' : ''}`)} aria-label="Today">
        <div className="card-head">
        <h2>{dayTitle}</h2>
        {tools('today', dayTitle)}
      </div>
        {over && (
          <span className="over-tag">
            <Icon name="alert" />
            Over the limit
          </span>
        )}
        <Big>{formatDollars(Math.abs(s.focusDay.leftCents))}</Big>
        <span className="muted small">{over
            ? s.focusDay.kind === 'today'
              ? "Over today's limit"
              : `Over the limit on ${dayLabel(s.focusDay.date)}`
            : s.focusDay.kind === 'today'
              ? 'Left today'
              : s.focusDay.kind === 'upcoming'
                ? `Left on the first day, ${dayLabel(s.focusDay.date)}`
                : `Left on the last day, ${dayLabel(s.focusDay.date)}`}</span>
        <Meter part={s.focusDay.spentCents} whole={s.dailyLimitCents} />
        <span className="muted small">
          {s.focusDay.kind === 'today' ? 'Spent today' : 'Spent'} <b>{formatDollars(s.focusDay.spentCents)}</b> of {formatDollars(s.dailyLimitCents)}
        </span>
        {estimatedToday.length > 0 && (
          <span className="muted small est-note">
            Includes ≈ {formatDollars(estimatedToday.reduce((t, c) => t + (c.cents ?? 0), 0))} estimated at the market rate for {estimatedToday.length} card charge{estimatedToday.length === 1 ? '' : 's'} still missing dollars.
          </span>
        )}
      </section>
    );
  }

  function budgetCard() {
    return (
      <section {...drag('budget', 'card')} aria-label="Budget">
        <div className="card-head">
          <h2>Budget</h2>
          <span className="head-r">
            <span className={`pill ${badge.cls}`}>{badge.label}</span>
            {tools('budget', 'Budget')}
          </span>
        </div>
        <div className="card-head">
          <span className="muted small">Spent of {formatDollars(settings.budgetCeilingCents)} ceiling</span>
        </div>
        <Big>{formatDollars(s.totalSpentCents)}</Big>
        <Meter part={s.totalSpentCents} whole={settings.budgetCeilingCents} />
        <div className="part">
          <h3>{s.leftTodayCents !== undefined ? 'Rest of the trip' : 'Whole trip'}</h3>
          <div className={finished ? 'rule one' : 'rule'}>
            <div>
              <Fig className={s.remainingCents < 0 ? 'bad-text' : ''}>{formatDollars(s.remainingCents)}</Fig>
              <span className={s.remainingCents < 0 ? 'warn' : ''}>
                {s.remainingCents < 0 && <Icon name="alert" />}
                Remaining
              </span>
            </div>
            {!finished && (
              <>
                <div>
                  <Fig>{s.leftPerDayCents === undefined ? '—' : formatDollars(s.leftPerDayCents)}</Fig>
                  <span>Left per day</span>
                </div>
                <div>
                  <Fig>{`${s.daysLeft} of ${s.tripLength}`}</Fig>
                  <span>Days left</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  function categoriesCard() {
    return (
      <section {...drag('categories', 'card span-all')} aria-label="By category">
        <div className="card-head">
          <h2>By category</h2>
          {tools('categories', 'By category')}
        </div>
        <div className="cats">
          {s.byCategory.filter((c) => store.categories.includes(c.category) || c.cents > 0 || c.yen > 0).map((c) => (
            <div key={c.category} className="cat">
              <Roundel category={c.category} />
              <div>
                <b>
                  {formatDollars(c.cents)}
                  {c.pct !== undefined && <span className="pc"> {c.pct.toFixed(0)}%</span>}
                </b>
                <span className="n">{c.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function customCard(c: Extract<SummaryCard, { kind: 'custom' }>) {
    const label = (it: CardItem) => ('stat' in it ? statLabel(it.stat) : it.label || formulaLabel(it.formula));
    const display = c.display ?? 'auto';
    const one = display === 'auto' && c.items.length === 1 ? c.items[0] : undefined;
    const rows: ChartRow[] = c.items.map((it) => {
      const v = 'stat' in it ? statValue(it.stat, s, ceiling) : formulaValue(it.formula, s, ceiling);
      const cat = 'stat' in it && /^cat(yen)?:/.test(it.stat) ? it.stat.slice(it.stat.indexOf(':') + 1) : undefined;
      return { label: label(it), text: formatStat(v), value: v.value, unit: v.unit, note: v.note, ...(cat ? { color: categoryColor(cat) } : {}) };
    });
    const def = display === 'daily' && c.series ? seriesDef(c.series) : undefined;
    return (
      <section {...drag(c.id, 'card custom')} aria-label={c.title}>
        <div className="card-head">
          <h2>{c.title}</h2>
          {tools(c.id, c.title)}
        </div>
        {display !== 'daily' && c.items.length === 0 && <p className="muted small">No numbers yet. Tap the pencil, then ⋮ → Edit card.</p>}
        {def && <DailyChart def={def} points={dailySeries(def.id, days, today)} today={today} />}
        {display === 'tiles' && <Tiles rows={rows} />}
        {display === 'bars' && <Bars rows={rows} />}
        {display === 'donut' && <Donut rows={rows} format={formatStat} />}
        {one && (
          <>
            <Big>{itemValue(one)}</Big>
            <span className="muted small">
              {label(one)}
              {itemNote(one) ? `, ${itemNote(one)}` : ''}
            </span>
          </>
        )}
        {display === 'auto' && c.items.length > 1 && (
          <dl className="kv">
            {c.items.map((it, i) => (
              <Fragment key={i}>
                <dt>{label(it)}</dt>
                <dd>
                  {itemValue(it)}
                  {itemNote(it) && <small className="muted"> {itemNote(it)}</small>}
                </dd>
              </Fragment>
            ))}
          </dl>
        )}
      </section>
    );
  }

  function renderCard(c: SummaryCard): ReactNode {
    if (c.kind === 'custom') return customCard(c);
    if (c.id === 'today') return todayCard();
    if (c.id === 'budget') return budgetCard();
    return categoriesCard();
  }

  return (
    <div className="screen">
      <h1>Summary</h1>
      {slot &&
        createPortal(
          <button
            type="button"
            className={editing ? 'sum-edit on' : 'hit sum-edit-icon'}
            aria-pressed={editing}
            aria-label={editing ? 'Done editing cards' : 'Edit cards'}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Done' : <Icon name="edit" />}
          </button>,
          slot,
        )}

      {showCashBanner && <p className="banner">Add the cash you bought. Cash dollars stay blank until you do.</p>}

      <span className="phase">{tripPhase(settings, today)}</span>

      <div className={`cols${editing ? ' editing' : ''}${dragId ? ' dragging' : ''}`} ref={(el) => { listRef.current = el; }}>
        {order.map((id) => {
          const c = layout.find((x) => x.id === id);
          return c ? <Fragment key={id}>{renderCard(c)}</Fragment> : null;
        })}
        {editing && (
          <button type="button" className="add-card span-all" onClick={() => setSheet({ step: 'new' })}>
            <Icon name="add" />
            Add card
          </button>
        )}
      </div>
      {layout.length === 0 && !editing && <p className="muted small">No cards on the Summary. Tap Edit, then Add card.</p>}

      {outsideCount > 0 && (
        <p className="note">
          Outside trip dates ({settings.tripStart} to {settings.tripEnd}), not counted above:{' '}
          {[
            s.outside.cardCharges.length && `${s.outside.cardCharges.length} card charge${s.outside.cardCharges.length === 1 ? '' : 's'}`,
            s.outside.cashPurchases.length && `${s.outside.cashPurchases.length} cash purchase${s.outside.cashPurchases.length === 1 ? '' : 's'}`,
            s.outside.cashBought.length && `${s.outside.cashBought.length} cash bought`,
          ]
            .filter(Boolean)
            .join(', ')}
          . Find them on the Entries tab.
        </p>
      )}

      {sheet?.step === 'new' && (
        <CardSheet
          catalog={catalog}
          series={series}
          unitOf={unitOf}
          valueOf={itemValue}
          missingBuiltins={missingBuiltins}
          onAddBuiltin={(id) => setLayout([...layout, { id: id as 'today' | 'budget' | 'categories', kind: 'builtin' }])}
          onSave={(card) => setLayout([...layout, card])}
          onClose={closeSheet}
        />
      )}

      {target && sheet?.step === 'edit' && (
        <CardSheet
          initial={target.kind === 'custom' ? target : builtinAsCustom(target.id, store.categories, `c${Date.now().toString(36)}`)}
          fromBuiltin={target.kind === 'builtin'}
          catalog={catalog}
          series={series}
          unitOf={unitOf}
          valueOf={itemValue}
          missingBuiltins={[]}
          onAddBuiltin={() => {}}
          onSave={(card) => setLayout(layout.map((c) => (c.id === target.id ? card : c)))}
          onClose={closeSheet}
        />
      )}

      {target && sheet?.step === 'menu' && (
        <SheetBackdrop onClose={closeSheet}>
          <div className="sheet menu" role="dialog" aria-modal="true" aria-label="Card options">
            <p className="menu-title">{target.kind === 'custom' ? target.title : BUILTIN_CARDS.find((b) => b.id === target.id)?.label}</p>
            <button type="button" className="secondary" onClick={() => setSheet({ step: 'edit', id: target.id })}>Edit card</button>
            {layout.length > 1 && (
              <div className="menu-pair">
                <button type="button" className="secondary" disabled={targetIndex <= 0} onClick={() => { move(target.id, -1); closeSheet(); }}>Move up</button>
                <button type="button" className="secondary" disabled={targetIndex >= layout.length - 1} onClick={() => { move(target.id, 1); closeSheet(); }}>Move down</button>
              </div>
            )}
            <button
              type="button"
              className="danger"
              onClick={() => {
                // A built-in card can be brought back from Add card; a custom one asks first.
                if (target.kind === 'custom') return setSheet({ step: 'confirm', id: target.id });
                setLayout(layout.filter((c) => c.id !== target.id));
                closeSheet();
              }}
            >
              Remove card
            </button>
            <button type="button" className="secondary" onClick={closeSheet}>Cancel</button>
          </div>
        </SheetBackdrop>
      )}

      {target?.kind === 'custom' && sheet?.step === 'confirm' && (
        <SheetBackdrop onClose={closeSheet}>
          <div className="sheet menu" role="alertdialog" aria-modal="true" aria-label="Confirm remove card">
            <h2>Remove “{target.title}”?</h2>
            <p className="muted small">The card and its figures go away from the Summary of every trip. Your entries are not touched.</p>
            <button type="button" className="danger armed" onClick={() => { setLayout(layout.filter((c) => c.id !== target.id)); closeSheet(); }}>
              Remove card
            </button>
            <button type="button" className="secondary" onClick={closeSheet}>Cancel</button>
          </div>
        </SheetBackdrop>
      )}
    </div>
  );
}
