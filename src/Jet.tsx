/** The app icon's jet in side view, nose right. The tail and stripe take the current main color. Decorative. */
export default function Jet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 260 122" width="34" height="16" aria-hidden="true" focusable="false">
      <g stroke="var(--ink)" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round">
        <path d="M154 42 L126 14 L114 14 L126 42 Z" fill="var(--field)" vectorEffect="non-scaling-stroke" />
        <path d="M76 42 L42 4 L22 4 L32 42 Z" fill="var(--or)" vectorEffect="non-scaling-stroke" />
        <path d="M62 40 L200 40 C230 40 249 48 254 58 C249 68 230 75 200 75 L72 75 C48 75 28 66 12 50 L10 42 C24 40 42 40 62 40 Z" fill="var(--sign)" vectorEffect="non-scaling-stroke" />
        <path d="M40 62 C90 66 160 66 246 62" fill="none" stroke="var(--or)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <path d="M224 47 C234 48 242 51 247 56 L226 56 Z" fill="var(--ink)" vectorEffect="non-scaling-stroke" />
        <path d="M52 58 L20 74 L36 76 L70 60 Z" fill="var(--field)" vectorEffect="non-scaling-stroke" />
        <path d="M164 60 L110 108 C104 112 96 112 96 106 L116 61 Z" fill="var(--field)" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
