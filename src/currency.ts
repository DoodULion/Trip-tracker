/**
 * Trip currencies. Dollars are always the base currency; a trip's country picks the local currency
 * its entries are written in (a trip with no country keeps yen, as the app always did).
 *
 * Local amounts are stored as whole minor units (yen, or euro cents): the same integers the app has always
 * stored in its `yen` fields. Pure helpers only, plus one small piece of state: the currency of the trip
 * being viewed, which the formatters read so every screen shows that trip's currency.
 */

export interface Currency {
  code: string;
  /** Written before the number: "¥", "€", "kr ". */
  symbol: string;
  /** Digits after the decimal point (0 for yen, 2 for euros, 3 for dinars). */
  decimals: 0 | 2 | 3;
  /** Plural name for labels: "Yen", "Euros". */
  name: string;
}

const c = (code: string, symbol: string, decimals: 0 | 2 | 3, name: string): [string, Currency] => [code, { code, symbol, decimals, name }];

export const CURRENCIES: Record<string, Currency> = Object.fromEntries([
  c('JPY', '¥', 0, 'Yen'),
  c('USD', '$', 2, 'US dollars'),
  c('EUR', '€', 2, 'Euros'),
  c('GBP', '£', 2, 'Pounds'),
  c('CHF', 'CHF ', 2, 'Francs'),
  c('AUD', 'A$', 2, 'Australian dollars'),
  c('CAD', 'C$', 2, 'Canadian dollars'),
  c('NZD', 'NZ$', 2, 'New Zealand dollars'),
  c('HKD', 'HK$', 2, 'Hong Kong dollars'),
  c('SGD', 'S$', 2, 'Singapore dollars'),
  c('TWD', 'NT$', 2, 'Taiwan dollars'),
  c('FJD', 'FJ$', 2, 'Fijian dollars'),
  c('MXN', 'MX$', 2, 'Pesos'),
  c('ARS', 'AR$', 2, 'Pesos'),
  c('CLP', 'CL$', 0, 'Pesos'),
  c('COP', 'CO$', 2, 'Pesos'),
  c('CUP', 'CU$', 2, 'Pesos'),
  c('PHP', '₱', 2, 'Pesos'),
  c('BRL', 'R$', 2, 'Reais'),
  c('PEN', 'S/ ', 2, 'Soles'),
  c('CRC', '₡', 2, 'Colones'),
  c('CNY', 'CN¥', 2, 'Yuan'),
  c('KRW', '₩', 0, 'Won'),
  c('INR', '₹', 2, 'Rupees'),
  c('NPR', 'Rs ', 2, 'Rupees'),
  c('LKR', 'Rs ', 2, 'Rupees'),
  c('IDR', 'Rp ', 2, 'Rupiah'),
  c('MYR', 'RM ', 2, 'Ringgit'),
  c('THB', '฿', 2, 'Baht'),
  c('VND', '₫', 0, 'Dong'),
  c('ILS', '₪', 2, 'Shekels'),
  c('JOD', 'JD ', 3, 'Dinars'),
  c('AED', 'AED ', 2, 'Dirhams'),
  c('MAD', 'MAD ', 2, 'Dirhams'),
  c('SAR', 'SAR ', 2, 'Riyals'),
  c('EGP', 'E£', 2, 'Pounds'),
  c('TRY', '₺', 2, 'Lira'),
  c('RUB', '₽', 2, 'Rubles'),
  c('UAH', '₴', 2, 'Hryvnia'),
  c('PLN', 'zł ', 2, 'Zloty'),
  c('CZK', 'Kč ', 2, 'Koruna'),
  c('HUF', 'Ft ', 2, 'Forint'),
  c('SEK', 'kr ', 2, 'Kronor'),
  c('NOK', 'kr ', 2, 'Kroner'),
  c('DKK', 'kr ', 2, 'Kroner'),
  c('ISK', 'kr ', 0, 'Krónur'),
  c('ZAR', 'R ', 2, 'Rand'),
  c('KES', 'KSh ', 2, 'Shillings'),
  c('TZS', 'TSh ', 2, 'Shillings'),
]);

export const DEFAULT_CURRENCY = CURRENCIES.JPY;

/** Country (ISO code) → its currency code. */
const BY_COUNTRY: Record<string, string> = {
  AR: 'ARS', AU: 'AUD', AT: 'EUR', BE: 'EUR', BR: 'BRL', CA: 'CAD', CL: 'CLP', CN: 'CNY', CO: 'COP', CR: 'CRC',
  HR: 'EUR', CU: 'CUP', CZ: 'CZK', DK: 'DKK', EG: 'EGP', FJ: 'FJD', FI: 'EUR', FR: 'EUR', DE: 'EUR', GR: 'EUR',
  HK: 'HKD', HU: 'HUF', IS: 'ISK', IN: 'INR', ID: 'IDR', IE: 'EUR', IL: 'ILS', IT: 'EUR', JP: 'JPY', JO: 'JOD',
  KE: 'KES', MY: 'MYR', MX: 'MXN', MA: 'MAD', NP: 'NPR', NL: 'EUR', NZ: 'NZD', NO: 'NOK', PE: 'PEN', PH: 'PHP',
  PL: 'PLN', PT: 'EUR', RU: 'RUB', SA: 'SAR', SG: 'SGD', ZA: 'ZAR', KR: 'KRW', ES: 'EUR', LK: 'LKR', SE: 'SEK',
  CH: 'CHF', TW: 'TWD', TZ: 'TZS', TH: 'THB', TR: 'TRY', UA: 'UAH', AE: 'AED', GB: 'GBP', US: 'USD', VN: 'VND',
};

/** The currency for a trip's country. No country (or one without an entry) means yen. */
export function currencyFor(country: string | undefined): Currency {
  return CURRENCIES[(country && BY_COUNTRY[country]) || 'JPY'] ?? DEFAULT_CURRENCY;
}

/** Local amounts are held ×10^decimals; rates are held on the same scale (see formatRate). */
export const scaleOf = (cur: Currency) => 10 ** cur.decimals;

/* ---------- the trip being viewed ---------- */

let current: Currency = DEFAULT_CURRENCY;

/** Set when a trip opens, so every amount on its screens is shown in that trip's currency. */
export function setCurrency(cur: Currency): void {
  current = cur;
}
export const getCurrency = (): Currency => current;

/* ---------- formatting and parsing ---------- */

const group = (n: number) => n.toLocaleString('en-US');

/** Minor units → "¥1,600", "€12.50", "-₩1,000". `cur` defaults to the trip being viewed. */
export function formatLocal(minor: number, cur: Currency = current): string {
  const r = Math.round(Math.abs(minor));
  const sign = minor < 0 && r !== 0 ? '-' : '';
  if (cur.decimals === 0) return `${sign}${cur.symbol}${group(r)}`;
  const s = scaleOf(cur);
  return `${sign}${cur.symbol}${group(Math.floor(r / s))}.${String(r % s).padStart(cur.decimals, '0')}`;
}

/**
 * Typed text → minor units, by string handling only. "1,600" → 1600 (yen); "12.5" → 1250 (euros).
 * Currencies without decimals take whole numbers only. Blank or invalid → undefined.
 */
export function parseLocal(input: string, cur: Currency = current): number | undefined {
  const s = input.replace(/[,\s]/g, '').replace(cur.symbol.trim(), '');
  const m = new RegExp(`^(\\d*)(?:\\.(\\d{0,${cur.decimals}}))?$`).exec(s);
  if (!m || (m[1] === '' && !m[2]) || (cur.decimals === 0 && s.includes('.'))) return undefined;
  const whole = m[1] === '' ? 0 : Number(m[1]);
  const frac = cur.decimals === 0 ? 0 : Number((m[2] ?? '').padEnd(cur.decimals, '0'));
  const n = whole * scaleOf(cur) + frac;
  return Number.isSafeInteger(n) ? n : undefined;
}

/** Minor units → text for an input box: 1600 → "1600" (yen), 1250 → "12.50" (euros). */
export function minorToInput(minor: number | undefined, cur: Currency = current): string {
  if (minor === undefined) return '';
  if (cur.decimals === 0) return String(minor);
  const s = scaleOf(cur);
  return `${Math.floor(minor / s)}.${String(minor % s).padStart(cur.decimals, '0')}`;
}

/** What to tell someone who typed an amount we can't read. */
export const amountHint = (cur: Currency = current) => (cur.decimals === 0 ? 'a whole number' : `a number with up to ${cur.decimals} decimals`);
