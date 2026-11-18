import { useEffect, useState } from 'react';
import { todayLocal } from './money';

/**
 * Today's local date (YYYY-MM-DD) that stays current: it re-reads the date when the app
 * comes back to the foreground (a Home Screen app can stay open for days) and at midnight.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayLocal);

  useEffect(() => {
    const refresh = () => setToday(todayLocal());
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    scheduleMidnight();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
}
