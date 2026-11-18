import { useCallback, useEffect, useRef, useState } from 'react';
import { applyEstimates, type CardCharge, type CashBought, type CashPurchase, type Data, type Settings, type Trip } from './calc';
import * as db from './db';
import { todayLocal } from './money';
import { fetchSpotRate } from './rates';
import type { EntryMap, EntryStore, Prefs, TripWithData } from './db';

export const EMPTY_DATA: Data = { cardCharges: [], cashPurchases: [], cashBought: [] };

/** Everything the app holds: all trips, their entries, and per-trip form defaults. */
export interface App {
  ready: boolean;
  trips: Trip[];
  data: Record<string, Data>;
  prefs: Record<string, Prefs>;
  /** Market rates fetched for days with card charges still missing dollars (YYYY-MM-DD → yen per $). */
  spot: Record<string, number>;
  /** A trip's entries with estimated dollars filled in for card charges still missing them (for totals only). */
  calcData(tripId: string): Data;
  saveEntry<S extends EntryStore>(store: S, tripId: string, entry: EntryMap[S]): Promise<void>;
  removeEntry(tripId: string, store: EntryStore, id: string): Promise<void>;
  setPrefs(tripId: string, p: Prefs): Promise<void>;
  /** Create or update a trip. `renames` are [oldCard, newCard] pairs applied to its existing charges. */
  saveTrip(trip: Trip, renames: [string, string][]): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  replaceAll(items: TripWithData[]): Promise<void>;
  deleteAll(): Promise<void>;
}

/** The slice of the app that the trip screens (Add, Entries, Summary, Days, Settings) see. */
export interface Store {
  trip: Trip;
  settings: Settings;
  /** The entries exactly as entered. Use this for lists and editing. */
  data: Data;
  /** The entries with estimated dollars on card charges still missing them. Use this for totals. */
  calcData: Data;
  /** Cached market rates (YYYY-MM-DD → yen per $) used for estimates. */
  spot: Record<string, number>;
  prefs: Prefs;
  addCardCharge(e: CardCharge): Promise<void>;
  addCashPurchase(e: CashPurchase): Promise<void>;
  addCashBought(e: CashBought): Promise<void>;
  removeEntry(store: EntryStore, id: string): Promise<void>;
  setPrefs(p: Prefs): Promise<void>;
  saveTrip(trip: Trip, renames: [string, string][]): Promise<void>;
}

/** Replace the entry with the same id, or append it. */
function upsert<T extends { id: string }>(list: T[], e: T): T[] {
  return list.some((x) => x.id === e.id) ? list.map((x) => (x.id === e.id ? e : x)) : [...list, e];
}

export function useApp(): App {
  const [ready, setReady] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [data, setData] = useState<Record<string, Data>>({});
  const [prefs, setPrefsState] = useState<Record<string, Prefs>>({});
  const [spot, setSpot] = useState<Record<string, number>>({});
  const tried = useRef(new Set<string>());

  useEffect(() => {
    void db.requestPersistence();
    Promise.all([db.loadApp(), db.loadSpotRates()]).then(([r, rates]) => {
      setTrips(r.trips);
      setData(r.data);
      setPrefsState(r.prefs);
      setSpot(rates);
      setReady(true);
    });
  }, []);

  // Look up the market rate for each day that has a card charge still missing dollars (once per day, when online).
  useEffect(() => {
    if (!ready) return;
    const today = todayLocal();
    const wanted = new Set<string>();
    for (const d of Object.values(data))
      for (const c of d.cardCharges) if (c.cents === undefined && c.yen && !spot[c.date] && !tried.current.has(c.date)) wanted.add(c.date > today ? today : c.date);
    for (const date of wanted) {
      tried.current.add(date);
      void fetchSpotRate(date).then((rate) => {
        if (rate === undefined) {
          tried.current.delete(date); // try again next time something changes
          return;
        }
        void db.saveSpotRate(date, rate);
        setSpot((all) => ({ ...all, [date]: rate }));
      });
    }
  }, [ready, data, spot]);

  const calcData = useCallback((tripId: string) => applyEstimates(data[tripId] ?? EMPTY_DATA, spot), [data, spot]);

  const saveEntry = useCallback(async <S extends EntryStore>(store: S, tripId: string, entry: EntryMap[S]) => {
    await db.putEntry(store, tripId, entry);
    setData((all) => {
      const cur = all[tripId] ?? EMPTY_DATA;
      return { ...all, [tripId]: { ...cur, [store]: upsert<{ id: string }>(cur[store], entry) } as Data };
    });
  }, []);

  const removeEntry = useCallback(async (tripId: string, store: EntryStore, id: string) => {
    await db.deleteEntry(store, id);
    setData((all) => {
      const cur = all[tripId] ?? EMPTY_DATA;
      return { ...all, [tripId]: { ...cur, [store]: cur[store].filter((x: { id: string }) => x.id !== id) } as Data };
    });
  }, []);

  const setPrefs = useCallback(async (tripId: string, p: Prefs) => {
    await db.savePrefs(tripId, p);
    setPrefsState((all) => ({ ...all, [tripId]: { ...all[tripId], ...p } }));
  }, []);

  const saveTrip = useCallback(async (trip: Trip, renames: [string, string][]) => {
    await db.saveTrip(trip, renames);
    setTrips((all) => upsert(all, trip));
    if (renames.length > 0) {
      const map = new Map(renames);
      setData((all) => {
        const cur = all[trip.id];
        if (!cur) return all;
        return { ...all, [trip.id]: { ...cur, cardCharges: cur.cardCharges.map((c) => (map.has(c.card) ? { ...c, card: map.get(c.card)! } : c)) } };
      });
    }
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    await db.deleteTrip(id);
    setTrips((all) => all.filter((t) => t.id !== id));
    setData((all) => Object.fromEntries(Object.entries(all).filter(([k]) => k !== id)));
    setPrefsState((all) => Object.fromEntries(Object.entries(all).filter(([k]) => k !== id)));
  }, []);

  const replaceAll = useCallback(async (items: TripWithData[]) => {
    await db.replaceAll(items);
    setTrips(items.map((i) => i.trip));
    setData(Object.fromEntries(items.map((i) => [i.trip.id, i.data])));
    setPrefsState({});
  }, []);

  const deleteAll = useCallback(() => replaceAll([]), [replaceAll]);

  return { ready, trips, data, prefs, spot, calcData, saveEntry, removeEntry, setPrefs, saveTrip, deleteTrip, replaceAll, deleteAll };
}

/** A view of the app scoped to one trip, in the shape the trip screens expect. */
export function tripStore(app: App, trip: Trip): Store {
  const id = trip.id;
  return {
    trip,
    settings: trip,
    data: app.data[id] ?? EMPTY_DATA,
    calcData: app.calcData(id),
    spot: app.spot,
    prefs: app.prefs[id] ?? {},
    addCardCharge: (e) => app.saveEntry('cardCharges', id, e),
    addCashPurchase: (e) => app.saveEntry('cashPurchases', id, e),
    addCashBought: (e) => app.saveEntry('cashBought', id, e),
    removeEntry: (store, entryId) => app.removeEntry(id, store, entryId),
    setPrefs: (p) => app.setPrefs(id, p),
    saveTrip: (t, renames) => app.saveTrip(t, renames),
  };
}
