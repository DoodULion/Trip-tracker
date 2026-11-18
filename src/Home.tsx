import { useMemo, useState } from 'react';
import { useHoldDrag } from './useHoldDrag';
import { categoryUsage, computeSummary, formatDollars, tripFraction, tripPhase, type Trip } from './calc';
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
              library={app.categories}
              usage={categoryUsage(Object.values(app.data))}
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
              library={app.categories}
              usage={categoryUsage(Object.entries(app.data).filter(([id]) => id !== target.id).map(([, d]) => d))}
              entryCount={targetEntries}
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
  const { order, dragId, listRef, bind, justDragged } = useHoldDrag(
    trips.map((t) => t.id),
    onReorder,
    'li.trip',
  );
  const byId = new Map(trips.map((t) => [t.id, t]));

  return (
    <ul className={`list trips${dragId ? ' dragging' : ''}`} ref={(el) => { listRef.current = el; }}>
      {order.map((id) => {
        const t = byId.get(id);
        if (!t) return null;
        const s = computeSummary(app.calcData(t.id), t, today);
        const badge = statusBadge(s, t, today);
        return (
          <li
            key={t.id}
            {...bind(t.id)}
            className={`trip themed${dragId === t.id ? ' lifted' : ''}`}
            style={tripTheme(t.country)}
          >
            <button
              type="button"
              className="trip-main"
              onClick={() => {
                if (!justDragged()) onOpen(t.id);
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
