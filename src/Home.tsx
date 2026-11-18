import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { computeSummary, formatDollars, tripFraction, tripPhase, type Trip } from './calc';
import AppTools from './AppTools';
import Backdrop from './Backdrop';
import { findCountry, flagEmoji, tripTheme } from './countries';
import Icon from './icons';
import Jet from './Jet';
import { dayLabel, todayLocal } from './money';
import { EMPTY_DATA, type App } from './store';
import type { Enter } from './App';
import { navigate } from './navMotion';
import SheetBackdrop from './SheetBackdrop';
import { sortTrips, statusBadge } from './status';
import TripForm from './TripForm';
import { useToday } from './useToday';

type Overlay = { step: 'new' } | { step: 'menu' | 'edit' | 'confirm'; id: string } | null;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const md = (d: string) => dayLabel(d).slice(4);
const HOLD_MS = 400;
type Bucket = 'now' | 'past';
/** Remembered while the app is open, so coming back from a trip lands on the tab it was opened from. */
let lastBucket: Bucket | undefined;

export default function Home({ app, onOpen, enter }: { app: App; onOpen: (id: string) => void; enter: Enter }) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [view, setView] = useState<'trips' | 'settings'>('trips');
  // How the current page slides in: from the trip (or first launch) at first, then push/pop between trips and settings.
  const [motion, setMotion] = useState<Enter>(enter);
  const show = (v: 'trips' | 'settings') => {
    const dir = v === 'settings' ? 'push' : 'pop';
    const slid = navigate(dir, () => {
      setMotion('');
      setView(v);
    });
    if (!slid) setMotion(dir);
  };
  const today = useToday();
  const close = () => setOverlay(null);

  const sorted = useMemo(() => sortTrips(app.trips), [app.trips]);
  const isPast = (t: Trip) => t.tripEnd < today;
  const pastCount = sorted.filter(isPast).length;
  // Current and future trips by default; the Past tab when every trip is over.
  const [bucket, setBucketState] = useState<Bucket>(() => lastBucket ?? (sorted.length > 0 && sorted.every((t) => t.tripEnd < todayLocal()) ? 'past' : 'now'));
  const setBucket = (b: Bucket) => {
    lastBucket = b;
    setBucketState(b);
  };
  const shown = sorted.filter((t) => isPast(t) === (bucket === 'past'));
  const target = overlay && overlay.step !== 'new' ? app.trips.find((t) => t.id === overlay.id) : undefined;
  const targetEntries = target
    ? (() => {
        const d = app.data[target.id] ?? EMPTY_DATA;
        return d.cardCharges.length + d.cashPurchases.length + d.cashBought.length;
      })()
    : 0;

  /** The order of the visible tab's trips, followed by the other tab's trips in their current order. */
  const fullOrder = (visible: string[]) => [...visible, ...sorted.filter((t) => !visible.includes(t.id)).map((t) => t.id)];

  /** Save a new order: every trip gets its position. */
  async function saveOrder(ids: string[]) {
    for (const [i, id] of ids.entries()) {
      const t = app.trips.find((x) => x.id === id);
      if (t && t.order !== i) await app.saveTrip({ ...t, order: i }, []);
    }
  }

  function move(id: string, by: -1 | 1) {
    const ids = shown.map((t) => t.id);
    const i = ids.indexOf(id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void saveOrder(fullOrder(ids));
  }

  if (view === 'settings') {
    return (
      <div className="app">
        <Backdrop />
        <header className="band">
          <div className="band-in">
            <button type="button" className="hit" onClick={() => show('trips')} aria-label="Back to trips">
              <Icon name="back" />
            </button>
            <h1 className="band-title">App settings</h1>
          </div>
        </header>
        <main>
          <div className={`screen page ${motion}`}>
            <AppTools app={app} />
          </div>
        </main>
      </div>
    );
  }

  const targetIndex = target ? shown.findIndex((t) => t.id === target.id) : -1;

  return (
    <div className="app">
      <Backdrop />
      <header className="band">
        <div className="band-in root">
          <h1 className="band-title">Trips</h1>
          <button type="button" className="hit" onClick={() => show('settings')} aria-label="App settings">
            <Icon name="gear" />
          </button>
        </div>
      </header>
      <main>
        <div className={`screen page ${motion}`}>
          {sorted.length > 0 && (
            <div className="seg" role="tablist" aria-label="Trips">
              <button type="button" role="tab" aria-selected={bucket === 'now'} className={bucket === 'now' ? 'on' : ''} onClick={() => setBucket('now')}>
                Current &amp; upcoming
              </button>
              <button type="button" role="tab" aria-selected={bucket === 'past'} className={bucket === 'past' ? 'on' : ''} onClick={() => setBucket('past')}>
                Past{pastCount > 0 ? ` (${pastCount})` : ''}
              </button>
            </div>
          )}

          {sorted.length === 0 && (
            <div className="empty">
              <Jet className="jet" />
              <p className="muted">No trips yet. Create your first one to start logging spending.</p>
            </div>
          )}
          {sorted.length > 0 && shown.length === 0 && (
            <div className="empty">
              <p className="muted">{bucket === 'past' ? 'No past trips yet. A trip moves here the day after it ends.' : 'No current or upcoming trips. Create one below.'}</p>
            </div>
          )}

          <TripList key={bucket} trips={shown} app={app} today={today} onOpen={onOpen} onMenu={(id) => setOverlay({ step: 'menu', id })} onReorder={(ids) => void saveOrder(fullOrder(ids))} />

          <button type="button" className="primary" onClick={() => setOverlay({ step: 'new' })}>New trip</button>
        </div>
      </main>

      {overlay?.step === 'new' && (
        <SheetBackdrop onClose={close} role="dialog" aria-modal="true" aria-label="New trip">
          <div className="sheet">
            <h2>New trip</h2>
            <TripForm
              saveLabel="Create trip"
              discardLabel="Cancel"
              onDiscard={close}
              onSave={async (t, r) => {
                // Newest first: put the new trip above every arranged trip.
                const top = Math.min(0, ...app.trips.map((x) => x.order ?? 0)) - 1;
                const created = { ...t, createdAt: Date.now(), ...(app.trips.some((x) => x.order !== undefined) ? { order: top } : {}) };
                await app.saveTrip(created, r);
                setBucket(created.tripEnd < today ? 'past' : 'now');
                close();
                onOpen(created.id);
              }}
            />
          </div>
        </SheetBackdrop>
      )}

      {target && overlay?.step === 'menu' && (
        <SheetBackdrop onClose={close}>
          <div className="sheet menu" role="dialog" aria-modal="true" aria-label="Trip options">
            <p className="menu-title">{target.name}</p>
            <button type="button" className="secondary" onClick={() => setOverlay({ step: 'edit', id: target.id })}>Edit trip</button>
            {shown.length > 1 && (
              <div className="menu-pair">
                <button type="button" className="secondary" disabled={targetIndex <= 0} onClick={() => { move(target.id, -1); close(); }}>Move up</button>
                <button type="button" className="secondary" disabled={targetIndex >= shown.length - 1} onClick={() => { move(target.id, 1); close(); }}>Move down</button>
              </div>
            )}
            <button type="button" className="danger" onClick={() => setOverlay({ step: 'confirm', id: target.id })}>Delete trip</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </SheetBackdrop>
      )}

      {target && overlay?.step === 'edit' && (
        <SheetBackdrop onClose={close} role="dialog" aria-modal="true" aria-label="Edit trip">
          <div className="sheet">
            <h2>Edit trip</h2>
            <TripForm
              key={target.id}
              initial={target}
              saveLabel="Save changes"
              discardLabel="Discard changes"
              onDiscard={close}
              onSave={async (t, r) => {
                await app.saveTrip(t, r);
                close();
              }}
            />
          </div>
        </SheetBackdrop>
      )}

      {target && overlay?.step === 'confirm' && (
        <SheetBackdrop onClose={close}>
          <div className="sheet menu" role="alertdialog" aria-modal="true" aria-label="Confirm delete trip">
            <h2>Delete “{target.name}”?</h2>
            <p className="muted small">
              This permanently deletes the trip and its {plural(targetEntries, 'entry', 'entries')}. It can't be undone. Export a backup first if you might want it back.
            </p>
            <button
              type="button"
              className="danger armed"
              onClick={async () => {
                await app.deleteTrip(target.id);
                close();
              }}
            >
              Delete trip
            </button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </SheetBackdrop>
      )}
    </div>
  );
}

/**
 * The trip cards. Hold one (about half a second) and drag it up or down to reorder;
 * a quick tap opens the trip, and a normal swipe scrolls the list.
 */
function TripList({ trips, app, today, onOpen, onMenu, onReorder }: {
  trips: Trip[];
  app: App;
  today: string;
  onOpen: (id: string) => void;
  onMenu: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const press = useRef<{ id: string; x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const suppressClick = useRef(false);
  const order = draft ?? trips.map((t) => t.id);
  const byId = new Map(trips.map((t) => [t.id, t]));

  // While dragging, stop the page from scrolling under the finger (iOS needs a non-passive listener).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (dragId) e.preventDefault();
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, [dragId]);

  function cancelPress() {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLLIElement>, id: string) {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.more')) return;
    cancelPress();
    const li = e.currentTarget;
    const pointerId = e.pointerId;
    press.current = {
      id,
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        setDragId(id);
        setDraft(trips.map((t) => t.id));
        try {
          li.setPointerCapture(pointerId);
        } catch {
          /* pointer already gone */
        }
        navigator.vibrate?.(12);
      }, HOLD_MS),
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLLIElement>) {
    if (!dragId) {
      const p = press.current;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) cancelPress(); // it's a scroll, not a hold
      return;
    }
    const items = [...(listRef.current?.querySelectorAll<HTMLLIElement>('li.trip') ?? [])];
    const others = items.filter((li) => li.dataset.id !== dragId);
    let index = 0;
    // A card counts as "before" the finger in reading order. One column (phone): the finger is past its middle.
    // Two-up grid (wide): the finger is below its row, or on its row and right of its middle.
    const grid = listRef.current ? getComputedStyle(listRef.current).display === 'grid' : false;
    for (const li of others) {
      const r = li.getBoundingClientRect();
      const before = grid
        ? e.clientY > r.bottom || (e.clientY >= r.top && e.clientX > r.left + r.width / 2)
        : e.clientY > r.top + r.height / 2;
      if (before) index++;
    }
    setDraft((cur) => {
      const ids = (cur ?? order).filter((x) => x !== dragId);
      ids.splice(index, 0, dragId);
      return ids.join() === (cur ?? order).join() ? cur : ids;
    });
  }

  function onPointerUp() {
    cancelPress();
    if (dragId) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 50);
      if (draft && draft.join() !== trips.map((t) => t.id).join()) onReorder(draft);
      setDragId(null);
      // Keep the dragged order on screen until the saved order arrives.
      setTimeout(() => setDraft(null), 300);
    }
  }

  return (
    <ul className={`list trips${dragId ? ' dragging' : ''}`} ref={listRef}>
      {order.map((id) => {
        const t = byId.get(id);
        if (!t) return null;
        const s = computeSummary(app.calcData(t.id), t, today);
        const badge = statusBadge(s, t, today);
        return (
          <li
            key={t.id}
            data-id={t.id}
            className={`trip themed${dragId === t.id ? ' lifted' : ''}`}
            style={tripTheme(t.country)}
            onPointerDown={(e) => onPointerDown(e, t.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className="trip-main"
              onClick={() => {
                if (!suppressClick.current) onOpen(t.id);
              }}
            >
              <span className="trip-title">
                {t.country && (
                  <span className="flag" role="img" aria-label={findCountry(t.country)?.name ?? 'Flag'}>
                    {flagEmoji(t.country)}
                  </span>
                )}
                <strong>{t.name}</strong>
              </span>
              <span className="route" aria-hidden="true" style={{ ['--p' as string]: tripFraction(t, today) }}>
                <u>
                  <b />
                  <Jet className="jet" />
                </u>
              </span>
              <span className="route-labels">
                <span>{md(t.tripStart)}</span>
                <span>{tripPhase(t, today)}</span>
                <span>{md(t.tripEnd)}</span>
              </span>
              <span className="trip-money">
                <span>
                  <strong>{formatDollars(s.totalSpentCents)}</strong> <span className="muted">of {formatDollars(t.budgetCeilingCents)}</span>
                </span>
                <span className={`pill ${badge.cls}`}>{badge.label}</span>
              </span>
            </button>
            <button type="button" className="more" aria-label={`Options for ${t.name}`} aria-haspopup="dialog" onClick={() => onMenu(t.id)}>
              <Icon name="dots" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
