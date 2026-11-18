import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORIES, applyEstimates, type CardCharge, type CashBought, type CashPurchase, type Data, type Settings, type Trip } from './calc';
import * as db from './db';
import { todayLocal } from './money';
import { currencyFor, scaleOf } from './currency';
import { fetchSpotRate, hasMarketRate } from './rates';
import type { EntryMap, EntryStore, Prefs, TripWithData } from './db';

export const EMPTY_DATA: Data = { cardCharges: [], cashPurchases: [], cashBought: [] };

/** Everything the app holds: all trips, their entries, and per-trip form defaults. */
export interface App {
  ready: boolean;
  trips: Trip[];
  data: Record<string, Data>;
  prefs: Record<string, Prefs>;
  /** The categories offered on every trip, in order: the built-ins the owner kept plus their own. */
  categories: string[];
  addCategory(name: string): Promise<void>;
  removeCategory(name: string): Promise<void>;
  /** Put back any deleted built-in categories (in their usual order, ahead of the owner's own). */
  restoreBuiltInCategories(): Promise<void>;
  /** Market rates fetched for days with card charges still missing dollars (currency code → YYYY-MM-DD → local currency per $). */
  spot: Record<string, Record<string, number>>;
  /** The market rates for one trip's currency, on the scale its amounts are stored in (see scaleOf), for estimates. */
  spotFor(trip: Pick<Trip, 'country'>): Record<string, number>;
  /** A trip's entries with estimated dollars filled in for card charges still missing them (for totals only). */
  calcData(tripId: string): Data;
  saveEntry<S extends EntryStore>(store: S, tripId: string, entry: EntryMap[S]): Promise<void>;
  removeEntry(tripId: string, store: EntryStore, id: string): Promise<void>;
  setPrefs(tripId: string, p: Prefs): Promise<void>;
  /** Create or update a trip. `renames` are [oldCard, newCard] pairs applied to its existing charges. */
  saveTrip(trip: Trip, renames: [string, string][]): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  replaceAll(items: TripWithData[], categories?: string[]): Promise<void>;
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
  /** Cached market rates for this trip's currency (YYYY-MM-DD → local minor units per $ ×100) used for estimates. */
  spot: Record<string, number>;
  /** Categories to offer for new entries (deleted ones are not offered; past entries keep theirs). */
  categories: string[];
  addCategory(name: string): Promise<void>;
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
  const [spot, setSpot] = useState<Record<string, Record<string, number>>>({});
  const [categories, setCategories] = useState<string[]>([...CATEGORIES]);
  const tried = useRef(new Set<string>());

  useEffect(() => {
    void db.requestPersistence();
    Promise.all([db.loadApp(), db.loadSpotRates(), db.loadCategories()]).then(([r, rates, cats]) => {
      setCategories(cats);
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
    const wanted = new Set<string>(); // "CODE|date"
    for (const t of trips) {
      const code = currencyFor(t.country).code;
      if (!hasMarketRate(code)) continue; // no published rate: such charges use your own card rate instead
      for (const c of data[t.id]?.cardCharges ?? []) {
        const date = c.date > today ? today : c.date;
        if (c.cents === undefined && c.yen && !spot[code]?.[c.date] && !tried.current.has(`${code}|${date}`)) wanted.add(`${code}|${date}`);
      }
    }
    for (const key of wanted) {
      const [code, date] = key.split('|');
      tried.current.add(key);
      void fetchSpotRate(date, code).then((rate) => {
        if (rate === undefined) {
          tried.current.delete(key); // try again next time something changes
          return;
        }
        void db.saveSpotRate(code, date, rate);
        setSpot((all) => ({ ...all, [code]: { ...all[code], [date]: rate } }));
      });
    }
  }, [ready, data, spot, trips]);

  const spotFor = useCallback(
    (trip: Pick<Trip, 'country'>) => {
      const cur = currencyFor(trip.country);
      const scale = scaleOf(cur);
      return Object.fromEntries(Object.entries(spot[cur.code] ?? {}).map(([d, r]) => [d, r * scale]));
    },
    [spot],
  );

  const calcData = useCallback(
    (tripId: string) => {
      const trip = trips.find((t) => t.id === tripId);
      return applyEstimates(data[tripId] ?? EMPTY_DATA, trip ? spotFor(trip) : {});
    },
    [data, trips, spotFor],
  );

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

  const addCategory = useCallback(async (name: string) => {
    const next = [...categories, name];
    await db.saveCategories(next);
    setCategories(next);
  }, [categories]);

  const removeCategory = useCallback(async (name: string) => {
    const next = categories.filter((c) => c !== name);
    if (next.length === 0) return; // always keep at least one
    await db.saveCategories(next);
    setCategories(next);
  }, [categories]);

  const restoreBuiltInCategories = useCallback(async () => {
    const next = [...CATEGORIES, ...categories.filter((c) => !(CATEGORIES as readonly string[]).includes(c))];
    await db.saveCategories(next);
    setCategories(next);
  }, [categories]);

  const replaceAll = useCallback(async (items: TripWithData[], cats: string[] = [...CATEGORIES]) => {
    await db.replaceAll(items);
    await db.saveCategories(cats);
    setCategories(cats);
    setTrips(items.map((i) => i.trip));
    setData(Object.fromEntries(items.map((i) => [i.trip.id, i.data])));
    setPrefsState({});
  }, []);

  const deleteAll = useCallback(() => replaceAll([]), [replaceAll]);

  return { ready, trips, data, prefs, categories, addCategory, removeCategory, restoreBuiltInCategories, spot, spotFor, calcData, saveEntry, removeEntry, setPrefs, saveTrip, deleteTrip, replaceAll, deleteAll };
}

/** A view of the app scoped to one trip, in the shape the trip screens expect. */
export function tripStore(app: App, trip: Trip): Store {
  const id = trip.id;
  return {
    trip,
    settings: trip,
    data: app.data[id] ?? EMPTY_DATA,
    calcData: app.calcData(id),
    spot: app.spotFor(trip),
    categories: app.categories,
    addCategory: app.addCategory,
    prefs: app.prefs[id] ?? {},
    addCardCharge: (e) => app.saveEntry('cardCharges', id, e),
    addCashPurchase: (e) => app.saveEntry('cashPurchases', id, e),
    addCashBought: (e) => app.saveEntry('cashBought', id, e),
    removeEntry: (store, entryId) => app.removeEntry(id, store, entryId),
    setPrefs: (p) => app.setPrefs(id, p),
    saveTrip: (t, renames) => app.saveTrip(t, renames),
  };
}
