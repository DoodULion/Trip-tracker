import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const SHOW_MS = 7000;

interface Offer {
  id: number;
  label: string;
  undo: () => Promise<void>;
}

interface UndoApi {
  /** Show a message with an Undo button for a few seconds. Only the latest offer is kept. */
  offer: (label: string, undo: () => Promise<void>) => void;
}

const UndoContext = createContext<UndoApi>({ offer: () => {} });

/** Lets any screen inside a trip offer "Undo" after saving, editing or deleting an entry. */
export function useUndo(): UndoApi {
  return useContext(UndoContext);
}

export function UndoProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Offer | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>(0);
  const counter = useRef(0);

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    setCurrent(null);
  }, []);

  const offer = useCallback((label: string, undo: () => Promise<void>) => {
    window.clearTimeout(timer.current);
    counter.current += 1;
    setCurrent({ id: counter.current, label, undo });
    timer.current = window.setTimeout(() => setCurrent(null), SHOW_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function undoNow() {
    if (!current || busy) return;
    setBusy(true);
    try {
      await current.undo();
    } finally {
      setBusy(false);
      clear();
    }
  }

  return (
    <UndoContext.Provider value={{ offer }}>
      {children}
      {current && (
        <div className="undo" role="status" key={current.id}>
          <span className="undo-label">{current.label}</span>
          <button type="button" className="undo-btn" onClick={() => void undoNow()} disabled={busy}>
            Undo
          </button>
        </div>
      )}
    </UndoContext.Provider>
  );
}
