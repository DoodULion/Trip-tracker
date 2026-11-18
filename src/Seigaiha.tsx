/**
 * Seigaiha (wave scales), drawn as real overlapping arcs: each fan is four concentric half-circles,
 * rows stack top to bottom so each row covers the lower half of the one above, and alternate rows
 * are offset by half a fan. Painted over the orange band at low ink strength and faded toward the title.
 */
import type { ReactElement } from 'react';

const R = [20, 15, 10, 5];
const ROWS = 6;

export default function Seigaiha() {
  const fans: ReactElement[] = [];
  for (let row = 0; row < ROWS; row++) {
    const cy = 8 + row * 10;
    const off = row % 2 === 0 ? 0 : 20;
    for (let k = -1; k < 12; k++) {
      const cx = off + k * 40;
      R.forEach((r, i) => {
        fans.push(<path key={`${row}-${k}-${i}`} d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`} style={{ fill: 'var(--or)' }} />);
      });
    }
  }
  return (
    <svg className="seigaiha" viewBox="0 0 400 68" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
      <g fill="none" stroke="var(--on-or)" strokeWidth="0.9" strokeOpacity="0.3">
        {fans}
      </g>
    </svg>
  );
}
