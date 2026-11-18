import type { ReactElement } from 'react';

/**
 * A repeating travel pattern behind the whole page: line icons in the app's 2px stroke vocabulary.
 * Colour comes from CSS (`.backdrop` sets `color`), so it is neutral on the trips list and
 * takes the trip's country color inside a trip. Decorative and still.
 */
const ICONS: Record<string, ReactElement> = {
  plane: <path d="M12 2.5c1 0 1.6 1 1.6 2.5V9l7.4 4.2v2L13.6 13v4.2l2 1.5V21l-3.6-1-3.6 1v-2.3l2-1.5V13L3 15.2v-2L10.4 9V5c0-1.5.6-2.5 1.6-2.5z" />,
  suitcase: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 8v12M15 8v12" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7h16a1 1 0 0 1 1 1v2.5a1.5 1.5 0 0 0 0 3V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a1.5 1.5 0 0 0 0-3V8a1 1 0 0 1 1-1z" />
      <path d="M14 7v10" strokeDasharray="2 2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  mountain: <path d="M3 19l6-10 4 6 2.5-3.5L21 19zM8 12.5l1 1.5 1-1" />,
  passport: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M8.5 16h7" />
    </>
  ),
  stamp: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" strokeDasharray="1.5 2" />
    </>
  ),
  train: (
    <>
      <rect x="6" y="3" width="12" height="14" rx="3" />
      <path d="M6 11h12M9 21l2-4M15 21l-2-4M9 14h.01M15 14h.01" />
    </>
  ),
  palm: <path d="M12 21v-9M12 12c-1-3-4-4-7-3 2-1.5 5-1 7 3zM12 12c1-3 4-4 7-3-2-1.5-5-1-7 3zM12 12c-3-1-4-4-3-7 2 2 3.5 4.5 3 7zM12 12c3-1 4-4 3-7-2 2-3.5 4.5-3 7z" />,
};

// Tile layout: 4 columns x 3 rows, alternate rows shifted, each icon turned a little.
const ORDER = ['plane', 'suitcase', 'compass', 'passport', 'pin', 'camera', 'ticket', 'train', 'globe', 'mountain', 'stamp', 'palm'];
const TURN = [-14, 8, 0, 12, -6, 14, -10, 6, 0, -8, 10, -4];
const TILE = 320;

export default function Backdrop() {
  // Icons that sit on the left/right edge are drawn on both sides of the seam so the tile repeats without cutting them.
  const cells = ORDER.flatMap((name, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    let x = 40 + col * 80 + (row % 2 === 1 ? 40 : 0);
    if (x >= TILE) x -= TILE;
    const y = 45 + row * 105;
    const xs = x < 26 ? [x, x + TILE] : x > TILE - 26 ? [x, x - TILE] : [x];
    return xs.map((px) => (
      <g key={name + px} transform={`translate(${px} ${y}) rotate(${TURN[i]}) scale(1.9) translate(-12 -12)`}>
        {ICONS[name]}
      </g>
    ));
  });
  return (
    <svg className="backdrop" aria-hidden="true" focusable="false" width="100%" height="100%">
      <defs>
        <pattern id="travel-pattern" width={TILE} height={TILE * 0.98} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
            {cells}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#travel-pattern)" />
    </svg>
  );
}
