import { useState } from 'react';
import { DEFAULT_LAYOUT, parseLayout, type SummaryCard } from './summaryCards';

const KEY = 'trip-tracker-summary-cards';

function load(): SummaryCard[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseLayout(JSON.parse(raw)) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

/**
 * The Summary cards and their order: the same for every trip, kept on this device
 * (like Appearance; not part of backups).
 */
export function useSummaryLayout(): [SummaryCard[], (next: SummaryCard[]) => void] {
  const [cards, setCards] = useState<SummaryCard[]>(load);
  const save = (next: SummaryCard[]) => {
    setCards(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: the layout lasts until the app closes */
    }
  };
  return [cards, save];
}
