import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const HOLD_MS = 400;

/**
 * Hold an item (about half a second) and drag it to reorder a list; a quick tap still works as a tap,
 * and a normal swipe scrolls. Used by the trips list and the Summary cards.
 *
 * Items are the elements matching `itemSelector` inside `listRef`, each with `data-id`. Pointer presses
 * that start on `ignore` (a ⋮ button, say) never start a drag. Works in one column and in a grid
 * (reading order: left to right, then down).
 */
export function useHoldDrag(ids: string[], onReorder: (ids: string[]) => void, itemSelector: string, ignore = '.more') {
  const [draft, setDraft] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const listRef = useRef<HTMLElement | null>(null);
  const press = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const suppressClick = useRef(false);
  const order = draft ?? ids;

  // While dragging, stop the page from scrolling under the finger (iOS needs a non-passive listener).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (dragId) e.preventDefault();
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, [dragId]);

  function cancelPress() {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLElement>, id: string) {
    if (e.button !== 0 || (e.target as HTMLElement).closest(ignore)) return;
    cancelPress();
    const el = e.currentTarget;
    const pointerId = e.pointerId;
    press.current = {
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        setDragId(id);
        setDraft(ids);
        try {
          el.setPointerCapture(pointerId);
        } catch {
          /* pointer already gone */
        }
        navigator.vibrate?.(12);
      }, HOLD_MS),
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (!dragId) {
      const p = press.current;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) cancelPress(); // it's a scroll, not a hold
      return;
    }
    const list = listRef.current;
    const items = [...(list?.querySelectorAll<HTMLElement>(itemSelector) ?? [])];
    const others = items.filter((el) => el.dataset.id !== dragId);
    // An item counts as "before" the finger in reading order. One column: the finger is past its middle.
    // Grid: the finger is below its row, or on its row and right of its middle.
    const grid = list ? getComputedStyle(list).display === 'grid' && getComputedStyle(list).gridTemplateColumns.split(' ').length > 1 : false;
    let index = 0;
    for (const el of others) {
      const r = el.getBoundingClientRect();
      const before = grid
        ? e.clientY > r.bottom || (e.clientY >= r.top && e.clientX > r.left + r.width / 2)
        : e.clientY > r.top + r.height / 2;
      if (before) index++;
    }
    setDraft((cur) => {
      const base = cur ?? order;
      const next = base.filter((x) => x !== dragId);
      next.splice(index, 0, dragId);
      return next.join('\u0000') === base.join('\u0000') ? cur : next;
    });
  }

  function onPointerUp() {
    cancelPress();
    if (dragId) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 50);
      if (draft && draft.join('\u0000') !== ids.join('\u0000')) onReorder(draft);
      setDragId(null);
      // Keep the dragged order on screen until the saved order arrives.
      setTimeout(() => setDraft(null), 300);
    }
  }

  /** Props for one draggable item. */
  const bind = (id: string) => ({
    'data-id': id,
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => onPointerDown(e, id),
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  });

  /** True right after a drag ends, so the tap that ends it doesn't also open the item. */
  const justDragged = () => suppressClick.current;

  return { order, dragId, listRef, bind, justDragged };
}
