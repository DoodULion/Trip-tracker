import { useMemo, useState } from 'react';
import { computeSummary, formatDollars, tripFraction, tripLength, tripPhase } from './calc';
import AppTools from './AppTools';
import Backdrop from './Backdrop';
import { findCountry, flagEmoji, tripTheme } from './countries';
import Icon from './icons';
import Seigaiha from './Seigaiha';
import Train from './Train';
import { dayLabel, todayLocal } from './money';
import { EMPTY_DATA, type App } from './store';
import type { Enter } from './App';
import TripForm from './TripForm';

type Overlay = { step: 'new' } | { step: 'menu' | 'edit' | 'confirm'; id: string } | null;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const md = (d: string) => dayLabel(d).slice(4);

export default function Home({ app, onOpen, enter }: { app: App; onOpen: (id: string) => void; enter: Enter }) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [view, setView] = useState<'trips' | 'settings'>('trips');
  // How the current page slides in: from the trip (or first launch) at first, then push/pop between trips and settings.
  const [motion, setMotion] = useState<Enter>(enter);
  const show = (v: 'trips' | 'settings') => {
    setMotion(v === 'settings' ? 'push' : 'pop');
    setView(v);
  };
  const today = todayLocal();
  const close = () => setOverlay(null);

  // Newest trip first.
  const trips = useMemo(() => [...app.trips].sort((a, b) => (a.tripStart < b.tripStart ? 1 : a.tripStart > b.tripStart ? -1 : a.name.localeCompare(b.name))), [app.trips]);
  const target = overlay && overlay.step !== 'new' ? app.trips.find((t) => t.id === overlay.id) : undefined;
  const targetEntries = target
    ? (() => {
        const d = app.data[target.id] ?? EMPTY_DATA;
        return d.cardCharges.length + d.cashPurchases.length + d.cashBought.length;
      })()
    : 0;

  if (view === 'settings') {
    return (
      <div className="app">
        <Backdrop />
        <header className="band">
          <div className="band-in">
            <button type="button" className="hit" onClick={() => show('trips')} aria-label="Back to trips">
              <Icon name="back" />
            </button>
            <h1 className="band-title">Settings</h1>
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

  return (
    <div className="app">
      <Backdrop />
      <header className="band">
        <Seigaiha />
        <div className="band-in root">
          <h1 className="band-title">Trips</h1>
          <button type="button" className="hit" onClick={() => show('settings')} aria-label="App settings">
            <Icon name="gear" />
          </button>
        </div>
      </header>
      <main>
        <div className={`screen page ${motion}`}>
          {trips.length === 0 && (
            <div className="empty">
              <Train className="empty-train" />
              <p className="muted">No trips yet. Create your first one to start logging spending.</p>
            </div>
          )}

          <ul className="list">
            {trips.map((t) => {
              const s = computeSummary(app.data[t.id] ?? EMPTY_DATA, t, today);
              const cls = s.status === 'Over pace' ? 'red' : s.status === 'On pace' ? '' : 'idle';
              return (
                <li key={t.id} className="trip themed" style={tripTheme(t.country)}>
                  <button type="button" className="trip-main" onClick={() => onOpen(t.id)}>
                    <span className="trip-title">
                      {t.country && (
                        <span className="flag" role="img" aria-label={findCountry(t.country)?.name ?? 'Flag'}>
                          {flagEmoji(t.country)}
                        </span>
                      )}
                      <strong>{t.name}</strong>
                      <span className={`pill ${cls}`}>{s.status}</span>
                    </span>
                    <span className="route" aria-hidden="true" style={{ ['--p' as string]: tripFraction(t, today) }}>
                      <i />
                      <u>
                        <b />
                        <Train className="train" />
                      </u>
                      <i />
                    </span>
                    <span className="route-labels">
                      <span>{md(t.tripStart)}</span>
                      <span>
                        {tripPhase(t, today)} · {plural(tripLength(t), 'day', 'days')}
                      </span>
                      <span>{md(t.tripEnd)}</span>
                    </span>
                    <span>
                      <strong>{formatDollars(s.totalSpentCents)}</strong> <span className="muted">of {formatDollars(t.budgetCeilingCents)}</span>
                    </span>
                  </button>
                  <button type="button" className="more" aria-label={`Options for ${t.name}`} aria-haspopup="dialog" onClick={() => setOverlay({ step: 'menu', id: t.id })}>
                    <Icon name="dots" />
                  </button>
                </li>
              );
            })}
          </ul>

          <button type="button" className="primary" onClick={() => setOverlay({ step: 'new' })}>New trip</button>

        </div>
      </main>

      {overlay?.step === 'new' && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="New trip">
          <div className="sheet">
            <h2>New trip</h2>
            <TripForm
              saveLabel="Create trip"
              discardLabel="Cancel"
              onDiscard={close}
              onSave={async (t, r) => {
                await app.saveTrip(t, r);
                close();
                onOpen(t.id);
              }}
            />
          </div>
        </div>
      )}

      {target && overlay?.step === 'menu' && (
        <div className="sheet-backdrop" onClick={close}>
          <div className="sheet menu" role="dialog" aria-modal="true" aria-label="Trip options" onClick={(e) => e.stopPropagation()}>
            <p className="menu-title">{target.name}</p>
            <button type="button" className="secondary" onClick={() => setOverlay({ step: 'edit', id: target.id })}>Edit trip</button>
            <button type="button" className="danger" onClick={() => setOverlay({ step: 'confirm', id: target.id })}>Delete trip</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </div>
      )}

      {target && overlay?.step === 'edit' && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Edit trip">
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
        </div>
      )}

      {target && overlay?.step === 'confirm' && (
        <div className="sheet-backdrop" onClick={close}>
          <div className="sheet menu" role="alertdialog" aria-modal="true" aria-label="Confirm delete trip" onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}
    </div>
  );
}
