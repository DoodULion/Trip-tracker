import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import { CATEGORIES, DEFAULT_SETTINGS, type CardCharge, type CashBought, type CashPurchase, type Data, type Trip } from './calc';
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
  // Device-level notes (cached market rates, last export date) are not trip data: keep them.
  const keep: [string, string][] = [];
  let cur = await tx.objectStore('meta').openCursor();
  while (cur) {
    const k = String(cur.key);
    if (SPOT_RE.test(k) || k === LAST_EXPORT) keep.push([k, cur.value]);
    cur = await cur.continue();
  }
  for (const s of ALL_STORES) void tx.objectStore(s).clear();
  for (const [k, v] of keep) void tx.objectStore('meta').put(v, k);
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

// ---------- device notes kept in the meta store ----------

/** Spot-rate cache keys: `spot:USD<CODE>:<date>` (yen keeps the original `spot:USDJPY:` keys). */
const SPOT_RE = /^spot:USD([A-Z]{3}):(\d{4}-\d{2}-\d{2})$/;
const LAST_EXPORT = 'lastExport';

/** Cached market rates: currency code → (YYYY-MM-DD → local currency per $). */
export async function loadSpotRates(): Promise<Record<string, Record<string, number>>> {
  const d = await db();
  const out: Record<string, Record<string, number>> = {};
  let cur = await d.transaction('meta').store.openCursor();
  while (cur) {
    const m = SPOT_RE.exec(String(cur.key));
    const v = Number(cur.value);
    if (m && v > 0) (out[m[1]] ??= {})[m[2]] = v;
    cur = await cur.continue();
  }
  return out;
}

export async function saveSpotRate(code: string, date: string, rate: number): Promise<void> {
  const d = await db();
  await d.put('meta', String(rate), `spot:USD${code}:${date}`);
}

/** When a backup was last exported on this device (ISO timestamp), if ever. */
export async function getLastExport(): Promise<string | undefined> {
  const d = await db();
  return d.get('meta', LAST_EXPORT);
}

export async function setLastExport(iso: string): Promise<void> {
  const d = await db();
  await d.put('meta', iso, LAST_EXPORT);
}

const CATEGORY_LIST_KEY = 'categoryList';
const LEGACY_EXTRAS_KEY = 'categories';

function stringList(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : undefined;
  } catch {
    return undefined;
  }
}

/** The categories offered on every trip, in order: the built-ins the owner kept plus the ones they added. */
export async function loadCategories(): Promise<string[]> {
  const d = await db();
  const list = stringList(await d.get('meta', CATEGORY_LIST_KEY));
  if (list && list.length > 0) return list;
  const extras = stringList(await d.get('meta', LEGACY_EXTRAS_KEY)) ?? [];
  return [...new Set([...CATEGORIES, ...extras])];
}

export async function saveCategories(list: string[]): Promise<void> {
  const d = await db();
  const tx = d.transaction('meta', 'readwrite');
  void tx.store.put(JSON.stringify(list), CATEGORY_LIST_KEY);
  void tx.store.delete(LEGACY_EXTRAS_KEY);
  await tx.done;
}
