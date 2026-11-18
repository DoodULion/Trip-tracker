import { CATEGORIES, type DayRow } from './calc';
import { CATEGORY_COLOR } from './Roundel';

/** Round a max value up to a tidy axis maximum and step. */
export function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 1000, step: 500 };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  return { top: Math.ceil(max / step) * step, step };
}

function md(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

/** Stacked bars of yen by category, one bar per trip day. Plain SVG. */
export default function StackedBars({ days }: { days: DayRow[] }) {
  const W = 360;
  const H = 210;
  const L = 40;
  const R = 8;
  const T = 10;
  const B = 28;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const n = days.length;
  const slot = plotW / n;
  const barW = slot * 0.72;
  const max = Math.max(0, ...days.map((d) => d.totalYen));
  const { top, step } = niceScale(max);
  const y = (v: number) => T + plotH - (v / top) * plotH;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily spending in yen by category" style={{ color: 'var(--mute)' }}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor">
              {v >= 1000 ? `${v / 1000}k` : v}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = L + i * slot + (slot - barW) / 2;
          let acc = 0;
          return (
            <g key={d.date}>
              {CATEGORIES.map((c) => {
                const v = d.yenByCategory[c];
                if (!v) return null;
                const y0 = y(acc + v);
                const h = y(acc) - y0;
                acc += v;
                return (
                  <rect key={c} x={x} y={y0} width={barW} height={h} fill={CATEGORY_COLOR[c]}>
                    <title>{`${md(d.date)} ${c}: ¥${v.toLocaleString('en-US')}`}</title>
                  </rect>
                );
              })}
              {((i % 4 === 0 && n - 1 - i >= 5) || i === n - 1) && (
                <text x={i === n - 1 ? x + barW : x + barW / 2} y={H - 8} textAnchor={i === n - 1 ? 'end' : 'middle'} fontSize="11" fill="currentColor">
                  {md(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="legend">
        {CATEGORIES.map((c) => (
          <span key={c}>
            <i style={{ background: CATEGORY_COLOR[c] }} />
            {c}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
