import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

/**
 * The dimmed layer behind a sheet. Escape or a tap on the dimmed area closes the sheet,
 * but only while nothing in it has been changed, so a half-filled form is never lost by accident.
 */
export default function SheetBackdrop({ onClose, children, ...rest }: { onClose: () => void; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const dirty = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const ref = useRef<HTMLDivElement>(null);

  // With the keyboard open the sheet stays inside the part of the screen you can see: the backdrop is sized to the
  // visual viewport (what is left above the keyboard), so the whole card fits, and the focused field is kept in view.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = ref.current;
    if (!vv || !el) return;
    const fit = () => {
      el.style.setProperty('--vv-h', `${vv.height}px`);
      el.style.setProperty('--vv-top', `${vv.offsetTop}px`);
      const f = document.activeElement;
      if (f instanceof HTMLElement && el.contains(f) && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) f.scrollIntoView({ block: 'nearest' });
    };
    fit();
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    return () => {
      vv.removeEventListener('resize', fit);
      vv.removeEventListener('scroll', fit);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dirty.current) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={ref}
      className="sheet-backdrop"
      {...rest}
      onInputCapture={() => {
        dirty.current = true;
      }}
      onClickCapture={(e) => {
        // Picking a chip or a Card/Cash segment changes the form too.
        if ((e.target as HTMLElement).closest('.chips button, .seg button')) dirty.current = true;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !dirty.current) closeRef.current();
      }}
    >
      {children}
    </div>
  );
}
