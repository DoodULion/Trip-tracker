/** Figure building blocks shared by Summary and Stats. */

/** A thick rounded bar: how much of a limit is used. Red once it is over. Decorative; the figures sit beside it. */
export function Meter({ part, whole }: { part: number; whole: number }) {
  const p = whole > 0 ? Math.min(1, Math.max(0, part / whole)) : 0;
  return (
    <div className={`meter${part > whole ? ' over' : ''}${part <= 0 ? ' zero' : ''}`} aria-hidden="true">
      <i style={{ ['--p' as string]: p }} />
    </div>
  );
}

/*
 * Figures size themselves to their length: each one is shrunk only as far as needed for all of its
 * characters to fit its column (CSS reads --chars), so "$10,000.00" and "$400.00" never run together.
 */
const chars = (text: string) => ({ ['--chars' as string]: Math.max(text.length, 4) });

export function Fig({ children, className = '' }: { children: string; className?: string }) {
  return (
    <b className={`fig ${className}`} style={chars(children)}>
      {children}
    </b>
  );
}

export function Big({ children }: { children: string }) {
  return (
    <div className="big fit" style={chars(children)}>
      {children}
    </div>
  );
}
