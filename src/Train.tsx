/** A bullet train in side elevation, drawn in the app's 2px line vocabulary. Decorative. */
export default function Train({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 22" width="64" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16V9a3 3 0 0 1 3-3h30c9 0 16 5 24 9v1H3Z" style={{ fill: 'var(--sign)' }} />
      <path d="M8 10h22M36 10h8M3 14h56" />
      <path d="M44 10c4 .5 8 2 11 4" />
      <circle cx="14" cy="18.5" r="2" style={{ fill: 'var(--sign)' }} />
      <circle cx="30" cy="18.5" r="2" style={{ fill: 'var(--sign)' }} />
      <circle cx="46" cy="18.5" r="2" style={{ fill: 'var(--sign)' }} />
    </svg>
  );
}
