import { haptic } from './haptics';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const HOLD_MS = 400;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** An inline transition for the move, keeping the card's own scale, shadow and fade transitions (CSS). */
const T = (move: string) => `transform ${move}, scale 240ms ${EASE}, box-shadow 240ms ease-out, opacity 200ms ease-out`;

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Hold an item (about half a second) and drag it to reorder a list; a quick tap still works as a tap,
 * and a normal swipe scrolls. Used by the trips list and the Summary cards.
 *
 * Motion: while you hold, the item presses in slightly; once it lifts it follows your finger, the other
 * items slide out of its way, and on release it settles into its slot.
 *
 * Items are the elements matching `itemSelector` inside `listRef`, each with `data-id`. Pointer presses
 * that start on `ignore` (a ⋮ button, say) never start a drag. Works in one column and in a grid
 * (reading order: left to right, then down).
 */
export function useHoldDrag(ids: string[], onReorder: (ids: string[]) => void, itemSelector: string, ignore = '.more') {
  const [draft, setDraft] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const listRef = useRef<HTMLElement | null>(null);
  const press = useRef<{ timer: ReturnType<typeof setTimeout>; el: HTMLElement } | null>(null);
  const ptr = useRef({ x: 0, y: 0 });
  const startPoint = useRef({ x: 0, y: 0 });
  const grab = useRef({ dx: 0, dy: 0 });
  const prevRects = useRef(new Map<string, DOMRect>());
  const suppressClick = useRef(false);
  const order = draft ?? ids;
  const orderKey = order.join('\u0000');

  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? [])];
  const itemFor = (id: string) => items().find((el) => el.dataset.id === id);

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

  /** Put the lifted item under the finger, wherever its slot currently is. */
  function follow(el: HTMLElement) {
    el.style.transition = T('0s');
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    const tx = ptr.current.x - grab.current.dx - (r.left + r.width / 2);
    const ty = ptr.current.y - grab.current.dy - (r.top + r.height / 2);
    el.style.transform = `translate(${tx}px, ${ty}px)`;
  }

  // When the order changes, the other items glide from where they were to where they are now (FLIP).
  useLayoutEffect(() => {
    const els = items();
    const next = new Map<string, DOMRect>();
    for (const el of els) next.set(el.dataset.id ?? '', el.getBoundingClientRect());
    if (dragId && !reduced()) {
      for (const el of els) {
        const id = el.dataset.id ?? '';
        if (id === dragId) continue;
        const was = prevRects.current.get(id);
        const now = next.get(id);
        if (!was || !now) continue;
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.style.transition = T('0s');
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        void el.offsetWidth; // start from the old spot
        el.style.transition = T(`240ms ${EASE}`);
        el.style.transform = '';
        setTimeout(() => {
          if (el.dataset.id !== dragId) el.style.transition = '';
        }, 280);
      }
    }
    // The lifted item keeps tracking the finger across its new slot.
    if (dragId) {
      const d = itemFor(dragId);
      if (d) follow(d);
    }
    // Remember where everything sits for the next change (the lifted item is measured without its offset).
    const d = dragId ? itemFor(dragId) : undefined;
    if (d) {
      const t = d.style.transform;
      d.style.transform = '';
      next.set(dragId as string, d.getBoundingClientRect());
      d.style.transform = t;
    }
    prevRects.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey, dragId]);

  function cancelPress() {
    if (press.current) {
      clearTimeout(press.current.timer);
      delete press.current.el.dataset.pressing;
    }
    press.current = null;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLElement>, id: string) {
    if (e.button !== 0 || (e.target as HTMLElement).closest(ignore)) return;
    cancelPress();
    const el = e.currentTarget;
    const pointerId = e.pointerId;
    ptr.current = { x: e.clientX, y: e.clientY };
    el.dataset.pressing = ''; // the item presses in a little while you hold
    press.current = {
      el,
      timer: setTimeout(() => {
        delete el.dataset.pressing;
        const r = el.getBoundingClientRect();
        grab.current = { dx: ptr.current.x - (r.left + r.width / 2), dy: ptr.current.y - (r.top + r.height / 2) };
        setDragId(id);
        setDraft(ids);
        try {
          el.setPointerCapture(pointerId);
        } catch {
          /* pointer already gone */
        }
        haptic('tap'); // lifted
      }, HOLD_MS),
    };
    startPoint.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    ptr.current = { x: e.clientX, y: e.clientY };
    if (!dragId) {
      const p = startPoint.current;
      if (press.current && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) cancelPress(); // it's a scroll, not a hold
      return;
    }
    const el = itemFor(dragId);
    if (el) follow(el);
    const others = items().filter((x) => x.dataset.id !== dragId);
    // An item counts as "before" the finger in reading order. One column: the finger is past its middle.
    // Grid: the finger is below its row, or on its row and right of its middle.
    const list = listRef.current;
    const grid = list ? getComputedStyle(list).display === 'grid' && getComputedStyle(list).gridTemplateColumns.split(' ').length > 1 : false;
    let index = 0;
    for (const o of others) {
      const r = o.getBoundingClientRect();
      const before = grid
        ? e.clientY > r.bottom || (e.clientY >= r.top && e.clientX > r.left + r.width / 2)
        : e.clientY > r.top + r.height / 2;
      if (before) index++;
    }
    const base = draft ?? order;
    const next = base.filter((x) => x !== dragId);
    next.splice(index, 0, dragId);
    if (next.join('\u0000') === base.join('\u0000')) return;
    haptic('tick'); // moved to a new slot
    setDraft(next);
  }

  function onPointerUp() {
    cancelPress();
    if (dragId) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 50);
      // Settle into the slot.
      const el = itemFor(dragId);
      if (el) {
        el.style.transition = reduced() ? T('0s') : T(`260ms ${EASE}`);
        el.style.transform = '';
        setTimeout(() => {
          el.style.transition = '';
        }, 300);
      }
      haptic('tap'); // dropped
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
