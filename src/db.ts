import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import { DEFAULT_SETTINGS, type CardCharge, type CashBought, type CashPurchase, type Data, type Trip } from './calc';
import { newId } from './money';

/** Entries are stored with the id of the trip they belong to. */
type WithTrip<T> = T & { tripId: string };

interface Schema extends DBSchema {
  trips: { key: string; value: Trip };
  cardCharges: { key: string; value: WithTrip<CardCharge>; indexes: { tripId: string } };
  cashPurchases: { key: string; value: WithTrip<CashPurchase>; indexes: { tripId: string } };
  cashBought: { key: string; value: WithTrip<CashBought>; indexes: { tripId: string } };
  meta: { key: string; value: string };
}

export type EntryStore = 'cardCharges' | 'cashPurchases' | 'cashBought';
export const ENTRY_STORES: EntryStore[] = ['cardCharges', 'cashPurchases', 'cashBought'];
const ALL_STORES = ['trips', 'cardCharges', 'cashPurchases', 'cashBought', 'meta'] as const;
export interface EntryMap {
  cardCharges: CardCharge;
  cashPurchases: CashPurchase;
  cashBought: CashBought;
}

export interface Prefs {
  lastCard?: string;
  lastCategory?: string;
}

export interface TripWithData {
  trip: Trip;
  data: Data;
}

/** Stable storage name. Kept as 'japan-trip' (the app's original name) so existing data is found. */
const DB_NAME = 'japan-trip';
const DB_VERSION = 2;

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDb = IDBPDatabase<any>;
type AnyTx = IDBPTransaction<any, any, 'versionchange'>;

/**
 * v1 had one trip: a `settings` record plus entries with no trip id.
 * v2 turns that into a first trip ("Japan Trip") and tags every entry with its id.
 */
async function migrateV1(d: AnyDb, tx: AnyTx): Promise<void> {
  const trips = d.createObjectStore('trips', { keyPath: 'id' });
  const settings = await tx.objectStore('settings').get('main');
  let entryCount = 0;
  for (const s of ENTRY_STORES) {
    const os = tx.objectStore(s);
    os.createIndex('tripId', 'tripId');
    entryCount += await os.count();
  }
  const meta = tx.objectStore('meta');
  if (settings || entryCount > 0) {
    const id = newId();
    await trips.put({ id, name: 'Japan Trip', ...(settings ?? DEFAULT_SETTINGS) });
    for (const s of ENTRY_STORES) {
      let cur = await tx.objectStore(s).openCursor();
      while (cur) {
        await cur.update({ ...cur.value, tripId: id });
        cur = await cur.continue();
      }
    }
    for (const key of ['lastCard', 'lastCategory']) {
      const v = await meta.get(key);
      if (v !== undefined) await meta.put(v, `${key}:${id}`);
      await meta.delete(key);
    }
  } else {
    await meta.clear();
  }
  d.deleteObjectStore('settings');
}

let dbPromise: Promise<IDBPDatabase<Schema>> | undefined;

function db() {
  dbPromise ??= openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion, _newVersion, tx) {
      const raw = d as unknown as AnyDb;
      if (oldVersion < 1) {
        raw.createObjectStore('trips', { keyPath: 'id' });
        for (const s of ENTRY_STORES) raw.createObjectStore(s, { keyPath: 'id' }).createIndex('tripId', 'tripId');
        raw.createObjectStore('meta');
      } else if (oldVersion < 2) {
        migrateV1(raw, tx as unknown as AnyTx).catch(() => tx.abort());
      }
    },
  });
  return dbPromise;
}

/** Ask the browser to keep our data. Safe to call every launch. */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* not supported; ignore */
  }
}

function strip<T extends { tripId: string }>(e: T): Omit<T, 'tripId'> {
  const { tripId: _unused, ...rest } = e;
  void _unused;
  return rest;
}

export interface AppSnapshot {
  trips: Trip[];
  data: Record<string, Data>;
  prefs: Record<string, Prefs>;
}

export async function loadApp(): Promise<AppSnapshot> {
  const d = await db();
  const trips = await d.getAll('trips');
  const data: Record<string, Data> = {};
  const prefs: Record<string, Prefs> = {};
  for (const t of trips) {
    const [cardCharges, cashPurchases, cashBought, lastCard, lastCategory] = await Promise.all([
      d.getAllFromIndex('cardCharges', 'tripId', t.id),
      d.getAllFromIndex('cashPurchases', 'tripId', t.id),
      d.getAllFromIndex('cashBought', 'tripId', t.id),
      d.get('meta', `lastCard:${t.id}`),
      d.get('meta', `lastCategory:${t.id}`),
    ]);
    data[t.id] = {
      cardCharges: cardCharges.map(strip) as CardCharge[],
      cashPurchases: cashPurchases.map(strip) as CashPurchase[],
      cashBought: cashBought.map(strip) as CashBought[],
    };
    prefs[t.id] = { lastCard, lastCategory };
  }
  return { trips, data, prefs };
}

export async function putEntry<S extends EntryStore>(store: S, tripId: string, entry: EntryMap[S]): Promise<void> {
  const d = await db();
  await d.put(store, { ...entry, tripId } as never);
}

export async function deleteEntry(store: EntryStore, id: string): Promise<void> {
  const d = await db();
  await d.delete(store, id);
}

/** Create or update a trip. `renames` are [oldCard, newCard] pairs applied to that trip's card charges. */
export async function saveTrip(trip: Trip, renames: [string, string][]): Promise<void> {
  const d = await db();
  const tx = d.transaction(['trips', 'cardCharges'], 'readwrite');
  void tx.objectStore('trips').put(trip);
  if (renames.length > 0) {
    const map = new Map(renames);
    let cur = await tx.objectStore('cardCharges').index('tripId').openCursor(trip.id);
    while (cur) {
      const to = map.get(cur.value.card);
      if (to !== undefined) await cur.update({ ...cur.value, card: to });
      cur = await cur.continue();
    }
  }
  await tx.done;
}

/** Delete a trip and everything in it. */
export async function deleteTrip(id: string): Promise<void> {
  const d = await db();
  const tx = d.transaction([...ALL_STORES], 'readwrite') as unknown as IDBPTransaction<any, any, 'readwrite'>;
  void tx.objectStore('trips').delete(id);
  for (const s of ENTRY_STORES) {
    const keys = await tx.objectStore(s).index('tripId').getAllKeys(id);
    for (const k of keys) void tx.objectStore(s).delete(k);
  }
  void tx.objectStore('meta').delete(`lastCard:${id}`);
  void tx.objectStore('meta').delete(`lastCategory:${id}`);
  await tx.done;
}

export async function savePrefs(tripId: string, prefs: Prefs): Promise<void> {
  const d = await db();
  const tx = d.transaction('meta', 'readwrite');
  if (prefs.lastCard !== undefined) void tx.store.put(prefs.lastCard, `lastCard:${tripId}`);
  if (prefs.lastCategory !== undefined) void tx.store.put(prefs.lastCategory, `lastCategory:${tripId}`);
  await tx.done;
}

/** Replace everything in one transaction (used by Import backup). */
export async function replaceAll(items: TripWithData[]): Promise<void> {
  const d = await db();
  const tx = d.transaction([...ALL_STORES], 'readwrite') as unknown as IDBPTransaction<any, any, 'readwrite'>;
  for (const s of ALL_STORES) void tx.objectStore(s).clear();
  for (const { trip, data } of items) {
    void tx.objectStore('trips').put(trip);
    for (const e of data.cardCharges) void tx.objectStore('cardCharges').put({ ...e, tripId: trip.id });
    for (const e of data.cashPurchases) void tx.objectStore('cashPurchases').put({ ...e, tripId: trip.id });
    for (const e of data.cashBought) void tx.objectStore('cashBought').put({ ...e, tripId: trip.id });
  }
  await tx.done;
}

export async function clearAll(): Promise<void> {
  await replaceAll([]);
}
