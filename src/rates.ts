/**
 * Market (spot) USD→local-currency rates, used only to estimate card charges whose dollars aren't in yet.
 * Source: Frankfurter (European Central Bank reference rates; free, no account, sends nothing but the date).
 * Weekends and holidays return the previous business day's rate.
 */
const API = 'https://api.frankfurter.dev/v1';

/** Currencies the ECB publishes a reference rate for (the rest are never looked up; their charges fall back to your own card rate). */
const ECB = new Set('AUD BRL CAD CHF CNY CZK DKK EUR GBP HKD HUF IDR ILS INR ISK JPY KRW MXN MYR NOK NZD PHP PLN SEK SGD THB TRY ZAR'.split(' '));
export const hasMarketRate = (code: string) => code === 'USD' || ECB.has(code);

/** Local currency per $ on a date (YYYY-MM-DD), or undefined if offline, unsupported or the lookup fails. */
export async function fetchSpotRate(date: string, code = 'JPY'): Promise<number | undefined> {
  if (code === 'USD') return 1;
  if (!ECB.has(code)) return undefined;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return undefined;
  try {
    const res = await fetch(`${API}/${date}?base=USD&symbols=${code}`, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { rates?: Record<string, unknown> };
    const jpy = body.rates?.[code];
    return typeof jpy === 'number' && jpy > 0 ? jpy : undefined;
  } catch {
    return undefined;
  }
}
