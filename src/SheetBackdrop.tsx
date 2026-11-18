import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

/**
 * The dimmed layer behind a sheet. Escape or a tap on the dimmed area closes the sheet,
 * but only while nothing in it has been changed, so a half-filled form is never lost by accident.
 */
export default function SheetBackdrop({ onClose, children, ...rest }: { onClose: () => void; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const dirty = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dirty.current) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
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
