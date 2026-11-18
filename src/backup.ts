/** Backup (JSON) and CSV export/import for all trips. Pure functions, no UI or storage. */
import { type CardCharge, type CashBought, type CashPurchase, type Category, type Data, type Trip } from './calc';
import { centsToInput, newId } from './money';

/** Stable file identifier. Kept as 'japan-trip' (the app's original name) so older backups still import. */
export const BACKUP_APP = 'japan-trip';
/** v1 = a single trip (settings + data). v2 = a list of trips. Both can be imported. */
export const BACKUP_VERSION = 2;

export interface BackupTrip {
  trip: Trip;
  data: Data;
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  trips: BackupTrip[];
  /** The owner's own categories (shared by every trip). Empty in older backups. */
  categories: string[];
}

export function buildBackup(items: BackupTrip[], now = new Date(), categories: string[] = []): unknown {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    categories,
    trips: items.map(({ trip, data }) => ({ ...trip, data })),
  };
}

// ---------- validation ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
type Obj = Record<string, unknown>;

function fail(msg: string): never {
  throw new Error(msg);
}
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

function str(o: Obj, k: string, where: string): string {
  const v = o[k];
  return typeof v === 'string' ? v : fail(`${where}: "${k}" must be text.`);
}
function optStr(o: Obj, k: string, where: string): string | undefined {
  const v = o[k];
  if (v === undefined || v === null || v === '') return undefined;
  return typeof v === 'string' ? v : fail(`${where}: "${k}" must be text.`);
}
function optInt(o: Obj, k: string, where: string): number | undefined {
  const v = o[k];
  if (v === undefined || v === null) return undefined;
  return isInt(v) ? v : fail(`${where}: "${k}" must be a whole number.`);
}
function reqInt(o: Obj, k: string, where: string): number {
  return optInt(o, k, where) ?? fail(`${where}: "${k}" is required.`);
}
function date(o: Obj, where: string): string {
  const d = str(o, 'date', where);
  return DATE_RE.test(d) ? d : fail(`${where}: bad date "${d}".`);
}
function category(o: Obj, where: string): Category {
  const c = typeof o.category === 'string' ? o.category.trim() : '';
  return c !== '' && c.length <= 40 ? c : fail(`${where}: missing category.`);
}
function list(v: unknown, name: string, where: string): Obj[] {
  if (!Array.isArray(v)) return fail(`${where} is missing the ${name} list.`);
  return v.map((x, i) => (isObj(x) ? x : fail(`${where}: ${name} #${i + 1} is not an entry.`)));
}

/** Validate the trip's settings fields (shared by v1 `settings` and v2 trip objects). */
function parseTripFields(v: Obj, id: string, name: string, where: string): Trip {
  const tripStart = str(v, 'tripStart', where);
  const tripEnd = str(v, 'tripEnd', where);
  if (!DATE_RE.test(tripStart) || !DATE_RE.test(tripEnd) || tripEnd < tripStart) fail(`${where}: bad trip dates.`);
  const budgetCeilingCents = reqInt(v, 'budgetCeilingCents', where);
  if (budgetCeilingCents <= 0) fail(`${where}: budget must be more than zero.`);
  const cards = v.cards;
  if (!Array.isArray(cards) || cards.some((c) => typeof c !== 'string')) fail(`${where}: cards must be a list of names.`);
  const country = optStr(v, 'country', where);
  if (country !== undefined && !/^[A-Z]{2}$/.test(country)) fail(`${where}: country must be a two-letter code.`);
  const order = typeof v.order === 'number' && Number.isFinite(v.order) ? v.order : undefined;
  const createdAt = typeof v.createdAt === 'number' && Number.isFinite(v.createdAt) ? v.createdAt : undefined;
  return {
    id, name, tripStart, tripEnd, budgetCeilingCents, cards: cards as string[],
    ...(country ? { country } : {}),
    ...(order !== undefined ? { order } : {}),
    ...(createdAt !== undefined ? { createdAt } : {}),
  };
}

function parseData(raw: unknown, where: string): Data {
  if (!isObj(raw)) return fail(`${where} has no data.`);
  const seen = new Set<string>();
  const id = (o: Obj, w: string) => {
    const v = str(o, 'id', `${where}, ${w}`);
    const key = w.split(' #')[0] + '|' + v;
    if (v === '' || seen.has(key)) fail(`${where}, ${w}: missing or duplicate id.`);
    seen.add(key);
    return v;
  };
  const W = (s: string, i: number) => `${s} #${i + 1}`;

  const cardCharges: CardCharge[] = list(raw.cardCharges, 'card charges', where).map((o, i) => {
    const w = W('Card charge', i);
    const yen = optInt(o, 'yen', w);
    const cents = optInt(o, 'cents', w);
    if (yen === undefined && cents === undefined) fail(`${where}, ${w}: needs yen or dollars.`);
    return { id: id(o, w), date: date(o, `${where}, ${w}`), category: category(o, `${where}, ${w}`), card: typeof o.card === 'string' ? o.card : '', yen, cents, note: optStr(o, 'note', w) };
  });
  const cashPurchases: CashPurchase[] = list(raw.cashPurchases, 'cash purchases', where).map((o, i) => {
    const w = W('Cash purchase', i);
    const cents = optInt(o, 'cents', w);
    return { id: id(o, w), date: date(o, `${where}, ${w}`), category: category(o, `${where}, ${w}`), yen: reqInt(o, 'yen', w), ...(cents !== undefined ? { cents } : {}), note: optStr(o, 'note', w) };
  });
  const cashBought: CashBought[] = list(raw.cashBought, 'cash bought', where).map((o, i) => {
    const w = W('Cash bought', i);
    return { id: id(o, w), date: date(o, `${where}, ${w}`), yen: reqInt(o, 'yen', w), cents: reqInt(o, 'cents', w), where: optStr(o, 'where', w) };
  });
  return { cardCharges, cashPurchases, cashBought };
}

/** Parse and fully validate backup text. Throws an Error with a plain-language message. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('That file is not valid JSON.');
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP) return fail('That file is not a Trip Tracker backup.');
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) return fail('That backup is from a newer version of the app.');
  const exportedAt = typeof raw.exportedAt === 'string' ? raw.exportedAt : '';

  let trips: BackupTrip[];
  if (raw.version === 1) {
    // Old single-trip backup: becomes one trip.
    if (!isObj(raw.settings)) return fail('Backup has no settings.');
    trips = [{ trip: parseTripFields(raw.settings, newId(), 'Japan Trip', 'Settings'), data: parseData(raw.data, 'Backup') }];
  } else {
    if (!Array.isArray(raw.trips)) return fail('Backup has no trips.');
    const ids = new Set<string>();
    trips = raw.trips.map((t, i) => {
      if (!isObj(t)) return fail(`Trip #${i + 1} is not a trip.`);
      const name = str(t, 'name', `Trip #${i + 1}`).trim();
      const where = `Trip "${name || i + 1}"`;
      if (name === '') fail(`Trip #${i + 1} has no name.`);
      const id = str(t, 'id', where);
      if (id === '' || ids.has(id)) fail(`${where}: missing or duplicate id.`);
      ids.add(id);
      return { trip: parseTripFields(t, id, name, where), data: parseData(t.data, where) };
    });
  }
  const categories = Array.isArray(raw.categories)
    ? [...new Set(raw.categories.filter((c): c is string => typeof c === 'string').map((c) => c.trim()).filter((c) => c !== '' && c.length <= 40))]
    : [];
  return { app: BACKUP_APP, version: raw.version, exportedAt, trips, categories };
}

// ---------- CSV ----------

function cell(v: string | number | undefined): string {
  if (v === undefined) return '';
  let s = String(v);
  // Stop spreadsheet apps from running text that starts with = + - @ as a formula.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_HEADER = ['Trip', 'Type', 'Date', 'Category', 'Card', 'Yen', 'Dollars', 'Note'];

/** Every entry of every trip as CSV text (with a leading BOM so Excel reads UTF-8). Trips in the order given, entries oldest first. */
export function toCsv(items: BackupTrip[]): string {
  type R = { date: string; id: string; cols: (string | number | undefined)[] };
  const lines: string[] = [CSV_HEADER.map(cell).join(',')];
  for (const { trip, data } of items) {
    const rows: R[] = [
      ...data.cardCharges.map((e) => ({
        date: e.date,
        id: e.id,
        cols: ['Card', e.date, e.category, e.card, e.yen, e.cents === undefined ? undefined : centsToInput(e.cents), e.note],
      })),
      ...data.cashPurchases.map((e) => ({ date: e.date, id: e.id, cols: ['Cash', e.date, e.category, '', e.yen, e.cents === undefined ? undefined : centsToInput(e.cents), e.note] })),
      ...data.cashBought.map((e) => ({ date: e.date, id: e.id, cols: ['Cash bought', e.date, '', '', e.yen, centsToInput(e.cents), e.where] })),
    ];
    rows.sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1));
    for (const r of rows) lines.push([trip.name, ...r.cols].map(cell).join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}
