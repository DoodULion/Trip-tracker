/**
 * Reads a payment copied by the owner's iPhone Shortcut (a Wallet "Transaction" automation), so Add can
 * fill in a card charge from it. Pure: no clipboard or UI here.
 *
 * The Shortcut copies text like:
 *   Trip Tracker payment
 *   Amount: ¥1,600
 *   Merchant: Lawson
 *   Card: Apple Card
 *   Date: 2026-11-27        (optional)
 *
 * Amounts are read by string handling only (no float math), in the trip's currency, or in dollars when
 * the amount is marked "$" / "US$" / "USD".
 */
import { parseLocal, type Currency } from './currency';
import { parseCents } from './money';

export interface PastedPayment {
  /** Local amount in minor units, when the payment was in the trip's currency. */
  yen?: number;
  /** Dollars in cents, when the payment was in dollars. */
  cents?: number;
  merchant?: string;
  /** The trip card it matched, if any. */
  card?: string;
  /** The card name as Wallet wrote it. */
  walletCard?: string;
  /** YYYY-MM-DD, when the Shortcut sent one. */
  date?: string;
}

export type PasteResult = { ok: true; payment: PastedPayment } | { ok: false; reason: 'none' | 'amount' | 'currency' };

/** Pull "Key: value" lines out of the pasted text (keys case-insensitive). */
function fields(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z ]+?)\s*:\s*(.*?)\s*$/.exec(line);
    if (m && m[2]) out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

/**
 * "1,600" / "1.600,50" / "12,50" / "1 234.5" → "1600" / "1600.50" / "12.50" / "1234.5".
 * A separator followed by exactly 3 digits is a thousands separator; otherwise the last one is the decimal point.
 */
export function normalizeNumber(raw: string): string | undefined {
  const s = raw.replace(/[\s  ']/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return undefined;
  const last = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  if (last === -1) return s;
  const tail = s.slice(last + 1);
  const isDecimal = tail.length !== 3 || (s[last] === '.' && s.indexOf('.') === last && s.includes(','));
  if (!isDecimal) return s.replace(/[.,]/g, '');
  const whole = s.slice(0, last).replace(/[.,]/g, '');
  return `${whole}.${tail}`;
}

const DOLLAR = /(^|[^A-Za-z])(US\$|USD|\$)|USD$/i;

/** Read an amount like "¥1,600", "JP¥1,600", "€12,50", "$24.99", "USD 24.99" for a trip in `cur`. */
export function parseAmount(raw: string, cur: Currency): { yen?: number; cents?: number } | 'amount' | 'currency' {
  const text = raw.trim();
  const sym = cur.symbol.trim();
  const isLocal = (sym && text.includes(sym)) || text.toUpperCase().includes(cur.code);
  // A "$" that isn't part of the trip's own symbol (A$, NT$ ...) means US dollars.
  const isDollar = !isLocal && DOLLAR.test(text);
  const numberPart = text.replace(/[^\d.,\s  ']/g, '').trim();
  const rest = text.replace(/[\d.,\s  '+-]/g, '');
  if (!/\d/.test(numberPart)) return 'amount';
  if (!isLocal && !isDollar && rest !== '') return 'currency';
  const n = normalizeNumber(numberPart);
  if (n === undefined) return 'amount';
  if (isDollar) {
    const cents = parseCents(n);
    return cents === undefined || cents <= 0 ? 'amount' : { cents };
  }
  // Whole-unit currencies sometimes arrive as "1600.00": drop zero decimals.
  const local = parseLocal(cur.decimals === 0 ? n.replace(/\.0*$/, '') : n, cur);
  return local === undefined || local <= 0 ? 'amount' : { yen: local };
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The trip card that Wallet's card name refers to: same name, or one name containing the other. */
export function matchCard(walletName: string, cards: string[]): string | undefined {
  const w = squash(walletName);
  if (!w) return undefined;
  return (
    cards.find((c) => squash(c) === w) ??
    cards.find((c) => squash(c).length >= 3 && (w.includes(squash(c)) || squash(c).includes(w)))
  );
}

/** Read the clipboard text the Shortcut copied. */
export function parsePayment(text: string, cur: Currency, cards: string[]): PasteResult {
  const f = fields(text);
  if (!f.amount) return { ok: false, reason: 'none' };
  const amount = parseAmount(f.amount, cur);
  if (typeof amount === 'string') return { ok: false, reason: amount };
  const walletCard = f.card || f['card or pass'] || undefined;
  const date = f.date && /^\d{4}-\d{2}-\d{2}$/.test(f.date) ? f.date : undefined;
  return {
    ok: true,
    payment: {
      ...amount,
      merchant: f.merchant || undefined,
      walletCard,
      card: walletCard ? matchCard(walletCard, cards) : undefined,
      date,
    },
  };
}
