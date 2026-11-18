import { useState } from 'react';
import Add from './Add';
import Days from './Days';
import Entries from './Entries';
import Home from './Home';
import Icon, { type IconName } from './icons';
import Summary from './Summary';
import { tripStore, useApp, type App as AppState, type Store } from './store';
import TripForm from './TripForm';
import { UndoProvider } from './undo';
import { tripPhase, type Trip } from './calc';
import { findCountry, flagEmoji, tripTheme } from './countries';
import { todayLocal } from './money';

type Tab = 'summary' | 'add' | 'entries' | 'days' | 'settings';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'summary', label: 'Summary', icon: 'summary' },
  { id: 'add', label: 'Add', icon: 'add' },
  { id: 'entries', label: 'Entries', icon: 'entries' },
  { id: 'days', label: 'Days', icon: 'days' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export default function App() {
  const app = useApp();
  // The app always opens on the trips list; a trip opens only when chosen.
  const [openId, setOpenId] = useState<string | null>(null);

  if (!app.ready) return <p className="screen" style={{ padding: 16 }}>Loading…</p>;
  const trip = openId ? app.trips.find((t) => t.id === openId) : undefined;
  if (!trip) return <Home app={app} onOpen={setOpenId} />;
  return <TripView key={trip.id} app={app} trip={trip} onBack={() => setOpenId(null)} />;
}

function TripView({ app, trip, onBack }: { app: AppState; trip: Trip; onBack: () => void }) {
  const store = tripStore(app, trip);
  const [tab, setTab] = useState<Tab>('summary');

  return (
    <div className="app themed" style={tripTheme(trip.country)}>
      <UndoProvider>
      <header className="band">
        <div className="band-in">
          <button type="button" className="hit" onClick={onBack} aria-label="Back to all trips">
            <Icon name="back" />
          </button>
          {trip.country && (
            <span className="flag" role="img" aria-label={findCountry(trip.country)?.name ?? 'Flag'}>
              {flagEmoji(trip.country)}
            </span>
          )}
          <p className="band-title">{trip.name}</p>
          <span className="band-note">{tripPhase(trip, todayLocal())}</span>
        </div>
      </header>
      <main>
        {tab === 'add' ? (
          <Add store={store} />
        ) : tab === 'summary' ? (
          <Summary store={store} />
        ) : tab === 'entries' ? (
          <Entries store={store} />
        ) : tab === 'days' ? (
          <Days store={store} />
        ) : (
          <TripSettings store={store} />
        )}
      </main>
      <nav className="tabbar" aria-label="Trip sections">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </nav>
      </UndoProvider>
    </div>
  );
}

/** This trip's name, dates, budget and cards. App-wide tools (backup, CSV, delete all) are on the trips list. */
function TripSettings({ store }: { store: Store }) {
  return (
    <div className="screen">
      <h1>Settings</h1>
      <section className="card">
        <h2>This trip</h2>
        <TripForm initial={store.trip} saveLabel="Save settings" confirmSaved onSave={store.saveTrip} />
      </section>
      <p className="note">Backup, import and CSV export for all your trips are on the trips list. Tap the back arrow at the top.</p>
    </div>
  );
}
