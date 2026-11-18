/**
 * Market (spot) USD→JPY rates, used only to estimate card charges whose dollars aren't in yet.
 * Source: Frankfurter (European Central Bank reference rates; free, no account, sends nothing but the date).
 * Weekends and holidays return the previous business day's rate.
 */
const API = 'https://api.frankfurter.dev/v1';

/** Yen per $ on a date (YYYY-MM-DD), or undefined if offline or the lookup fails. */
export async function fetchSpotRate(date: string): Promise<number | undefined> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return undefined;
  try {
    const res = await fetch(`${API}/${date}?base=USD&symbols=JPY`, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { rates?: { JPY?: unknown } };
    const jpy = body.rates?.JPY;
    return typeof jpy === 'number' && jpy > 0 ? jpy : undefined;
  } catch {
    return undefined;
  }
}
