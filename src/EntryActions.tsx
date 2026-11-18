import { useMemo, useState, type ReactNode } from 'react';
import { formatDollars, formatYen } from './calc';
import EditSheet, { restoreRow, type Row } from './EditSheet';
import { useUndo } from './undo';
import Icon from './icons';
import { dayLabel } from './money';
import SheetBackdrop from './SheetBackdrop';
import type { Store } from './store';

const STORES = { card: 'cardCharges', cash: 'cashPurchases', bought: 'cashBought' } as const;

type Step = 'menu' | 'confirm' | 'edit';

/** One-line description of an entry, for the menu and delete confirmation. */
function describe(r: Row): string {
  const parts: string[] = [];
  if (r.kind === 'bought') parts.push('Cash bought');
  else parts.push(r.kind === 'card' ? r.e.category : `${r.e.category} (cash)`);
  if (r.e.yen !== undefined) parts.push(formatYen(r.e.yen));
  if ('cents' in r.e && r.e.cents !== undefined) parts.push(formatDollars(r.e.cents));
  if ('note' in r.e && r.e.note) parts.push(r.e.note);
  if (r.kind === 'card' && r.e.card) parts.push(r.e.card);
  parts.push(dayLabel(r.e.date));
  return parts.join(', ');
}

/**
 * Each entry row has a ⋯ button on its right that opens Edit / Delete.
 * Tapping the row itself does nothing. Render `optionsButton(row)` inside a row
 * and `overlay` once on the screen.
 */
export function useEntryActions(store: Store): {
  optionsButton: (r: Row) => ReactNode;
  /** Open the edit sheet for an entry straight away (e.g. from the missing-dollars alert). */
  edit: (r: Row) => void;
  overlay: ReactNode;
} {
  const [state, setState] = useState<{ step: Step; kind: Row['kind']; id: string } | null>(null);
  const { offer } = useUndo();

  const rows = useMemo<Row[]>(
    () => [
      ...store.data.cardCharges.map((e) => ({ kind: 'card' as const, e })),
      ...store.data.cashPurchases.map((e) => ({ kind: 'cash' as const, e })),
      ...store.data.cashBought.map((e) => ({ kind: 'bought' as const, e })),
    ],
    [store.data],
  );
  const row = state ? rows.find((r) => r.kind === state.kind && r.e.id === state.id) : undefined;

  const open = (r: Row, step: Step) => setState({ step, kind: r.kind, id: r.e.id });
  const close = () => setState(null);

  const optionsButton = (r: Row) => (
    <button type="button" className="more" aria-label={`Options for ${describe(r)}`} aria-haspopup="dialog" onClick={() => open(r, 'menu')}>
      <Icon name="dots" />
    </button>
  );

  async function remove() {
    if (!row) return;
    const gone = row;
    await store.removeEntry(STORES[row.kind], row.e.id);
    offer(`Deleted ${describe(gone)}`, () => restoreRow(store, gone));
    close();
  }

  let overlay: ReactNode = null;
  if (state && row) {
    if (state.step === 'edit') {
      overlay = <EditSheet key={row.kind + row.e.id} row={row} store={store} onClose={close} />;
    } else if (state.step === 'menu') {
      overlay = (
        <SheetBackdrop onClose={close}>
          <div className="sheet menu" role="dialog" aria-modal="true" aria-label="Entry options">
            <p className="menu-title">{describe(row)}</p>
            <button type="button" className="secondary" onClick={() => open(row, 'edit')}>Edit</button>
            <button type="button" className="danger" onClick={() => open(row, 'confirm')}>Delete</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </SheetBackdrop>
      );
    } else {
      overlay = (
        <SheetBackdrop onClose={close}>
          <div className="sheet menu" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
            <h2>Delete this entry?</h2>
            <p className="menu-title">{describe(row)}</p>
            <p className="muted small">You can undo it for a few seconds afterwards.</p>
            <button type="button" className="danger armed" onClick={() => void remove()}>Delete</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </SheetBackdrop>
      );
    }
  }

  return { optionsButton, edit: (r) => open(r, 'edit'), overlay };
}
