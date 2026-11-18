import { useRef, useState } from 'react';
import Add from './Add';
import Days from './Days';
import Entries from './Entries';
import Home from './Home';
import Icon, { type IconName } from './icons';
import Payments from './Payments';
import Summary from './Summary';
import { tripStore, useApp, type App as AppState } from './store';
import Backdrop from './Backdrop';
import { UndoProvider } from './undo';
import { tripPhase, type Trip } from './calc';
import { findCountry, flagEmoji, tripTheme } from './countries';
import { useToday } from './useToday';
import { todayLocal } from './money';
import { navigate } from './navMotion';

type Tab = 'summary' | 'add' | 'entries' | 'days' | 'payments';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'summary', label: 'Summary', icon: 'summary' },
  { id: 'add', label: 'Add', icon: 'add' },
  { id: 'entries', label: 'Entries', icon: 'entries' },
  { id: 'days', label: 'Days', icon: 'days' },
  { id: 'payments', label: 'Payments', icon: 'payments' },
];

/** How a page enters: pushed in from the right, popped back from the left, or no motion (first launch). */
export type Enter = 'push' | 'pop' | '';

export default function App() {
  const app = useApp();
  // The app always opens on the trips list; a trip opens only when chosen.
  const [openId, setOpenId] = useState<string | null>(null);
  const [enter, setEnter] = useState<Enter>('');
  const launched = useRef(false);

  // On launch only: if today falls inside a trip's dates, open that trip (its Summary); otherwise stay on the list.
  // Going back to the list later must not reopen it, so this runs once.
  if (app.ready && !launched.current) {
    launched.current = true;
    const now = todayLocal();
    const current = app.trips.find((t) => t.tripStart <= now && now <= t.tripEnd);
    if (current) setOpenId(current.id);
  }

  if (!app.ready) return <p className="screen" style={{ padding: 16 }}>Loading…</p>;
  const trip = openId ? app.trips.find((t) => t.id === openId) : undefined;
  if (!trip)
    return (
      <Home
        app={app}
        enter={enter}
        onOpen={(id) => {
          // Whole-screen slide when the browser supports it; otherwise only the page content slides in.
          const slid = navigate('push', () => {
            setEnter('');
            setOpenId(id);
          });
          if (!slid) setEnter('push');
        }}
      />
    );
  return (
    <TripView
      key={trip.id}
      app={app}
      trip={trip}
      enter={enter}
      onBack={() => {
        const slid = navigate('pop', () => {
          setEnter('');
          setOpenId(null);
        });
        if (!slid) setEnter('pop');
      }}
    />
  );
}

function TripView({ app, trip, enter, onBack }: { app: AppState; trip: Trip; enter: Enter; onBack: () => void }) {
  const store = tripStore(app, trip);
  const today = useToday();
  const [tab, setTab] = useState<Tab>('summary');
  // The first page slides in with the trip; later tab changes slide toward the tab that was tapped.
  const motion = useRef<string>(enter);

  function go(next: Tab) {
    if (next === tab) return;
    const from = TABS.findIndex((t) => t.id === tab);
    const to = TABS.findIndex((t) => t.id === next);
    motion.current = to > from ? 'fwd' : 'back';
    setTab(next);
    document.querySelector('main')?.scrollTo(0, 0);
  }

  return (
    <div className="app themed" style={tripTheme(trip.country)}>
      <UndoProvider>
      <Backdrop />
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
          <span className="band-note">{tripPhase(trip, today)}</span>
        </div>
      </header>
      <main>
        <div key={tab} className={`page ${motion.current}`}>
          {tab === 'add' ? (
            <Add store={store} />
          ) : tab === 'summary' ? (
            <Summary store={store} />
          ) : tab === 'entries' ? (
            <Entries store={store} />
          ) : tab === 'days' ? (
            <Days store={store} />
          ) : (
            <Payments store={store} />
          )}
        </div>
      </main>
      <nav className="tabbar" aria-label="Trip sections">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => go(t.id)}>
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </nav>
      </UndoProvider>
    </div>
  );
}
