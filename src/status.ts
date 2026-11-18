import type { Summary, Trip } from './calc';

/**
 * The badge for a trip: its pace while it runs, and the plain result once it has ended
 * ("Under budget" / "Over budget"), since pace means nothing after the last day.
 */
export function statusBadge(s: Summary, trip: Trip, today: string): { label: string; cls: string } {
  if (today > trip.tripEnd && s.status !== 'Not started') {
    return s.remainingCents < 0 ? { label: 'Over budget', cls: 'red' } : { label: 'Under budget', cls: '' };
  }
  return { label: s.status, cls: s.status === 'Over pace' ? 'red' : s.status === 'On pace' ? '' : 'idle' };
}

/** Trips in list order: ones the owner has arranged first (by position), then newest created first. */
export function sortTrips(trips: Trip[]): Trip[] {
  return [...trips].sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY;
    const bo = b.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const ac = a.createdAt ?? 0;
    const bc = b.createdAt ?? 0;
    if (ac !== bc) return bc - ac;
    return a.tripStart < b.tripStart ? 1 : a.tripStart > b.tripStart ? -1 : a.name.localeCompare(b.name);
  });
}
