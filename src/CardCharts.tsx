import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { formatDollars, formatRate, formatYen } from './calc';
import { dayLabel } from './money';
import type { SeriesDef, SeriesPoint, StatValue } from './summaryCards';

/** One item of a custom card, ready to draw. */
export interface ChartRow {
  label: string;
  text: string;
  value: number | undefined;
  unit: StatValue['unit'];
  note?: string;
}

/** Chart colors for slices, in a fixed order (checked for color-blind separation in light and dark). */
const SLICES = 6;

const chars = (text: string) => ({ ['--chars' as string]: Math.max(text.length, 4) });

/** Figures side by side, each over its label. */
export function Tiles({ rows }: { rows: ChartRow[] }) {
  return (
    <div className="tiles">
      {rows.map((r, i) => (
        <div key={i}>
          <b className="fig" style={chars(r.text)}>{r.text}</b>
          <span>
            {r.label}
            {r.note ? `, ${r.note}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Horizontal bars, one per figure, each scaled against the largest figure of the same kind
 * (dollars against dollars, yen against yen). Text figures show without a bar.
 */
export function Bars({ rows }: { rows: ChartRow[] }) {
  const max = new Map<string, number>();
  for (const r of rows) if (r.value !== undefined && r.unit !== 'text') max.set(r.unit, Math.max(max.get(r.unit) ?? 0, Math.abs(r.value)));
  return (
    <ul className="hbars">
      {rows.map((r, i) => {
        const m = max.get(r.unit) ?? 0;
        const p = r.value !== undefined && m > 0 ? Math.abs(r.value) / m : 0;
        return (
          <li key={i}>
            <span className="hb-label">{r.label}</span>
            <b>{r.text}</b>
            {r.unit !== 'text' && (
              <span className={`hb-track${r.value !== undefined && r.value < 0 ? ' neg' : ''}`} aria-hidden="true">
                <i style={{ width: `${p * 100}%` }} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A ring split by share of the total. Uses the figures of the first figure's kind that are above zero;
 * more than six fold into "Other". A legend with each value and percent sits beside it.
 */
export function Donut({ rows, format }: { rows: ChartRow[]; format: (v: StatValue) => string }) {
  const first = rows.find((r) => r.value !== undefined && r.unit !== 'text' && r.unit !== 'pct');
  const unit = first?.unit;
  const usable = rows.filter((r) => r.unit === unit && r.value !== undefined && r.value > 0);
  const left = rows.length - usable.length;
  // The total in the middle names the unit, so "Food ($)" reads as "Food" here.
  let parts = usable.map((r) => ({ label: r.label.replace(/ \([^)]*\)$/, ''), value: r.value as number }));
  if (parts.length > SLICES) {
    const rest = parts.slice(SLICES - 1).reduce((t, x) => t + x.value, 0);
    parts = [...parts.slice(0, SLICES - 1), { label: 'Other', value: rest }];
  }
  const total = parts.reduce((t, x) => t + x.value, 0);
  if (!unit || total <= 0) return <p className="muted small">Nothing to share out yet: the pie needs figures above zero.</p>;

  const R = 40;
  const C = 2 * Math.PI * R;
  const gap = parts.length > 1 ? 2.2 : 0; // a small surface gap between slices
  let offset = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 100 100" role="img" aria-label={parts.map((x) => `${x.label} ${((x.value / total) * 100).toFixed(0)}%`).join(', ')}>
        {parts.map((x, i) => {
          const len = (x.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={x.label === 'Other' ? 'var(--mute)' : `var(--chart-${i + 1})`}
              strokeWidth="14"
              strokeDasharray={`${Math.max(len - gap, 0.5)} ${C}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="50" y="48" textAnchor="middle" className="donut-total">{format({ value: total, unit })}</text>
        <text x="50" y="60" textAnchor="middle" className="donut-cap">total</text>
      </svg>
      <ul className="legend">
        {parts.map((x, i) => (
          <li key={i}>
            <i style={{ background: x.label === 'Other' ? 'var(--mute)' : `var(--chart-${i + 1})` }} aria-hidden="true" />
            <span>{x.label}</span>
            <b>{format({ value: x.value, unit })}</b>
            <small>{((x.value / total) * 100).toFixed(0)}%</small>
          </li>
        ))}
      </ul>
      {left > 0 && <p className="muted small span-row">{left} figure{left === 1 ? '' : 's'} left out: a pie only shares out figures of the same kind that are above zero.</p>}
    </div>
  );
}

/** The next round number at or above v: 1, 2, 2.5 or 5 times a power of ten. */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const fmt = (unit: SeriesDef['unit'], v: number) => (unit === 'usd' ? formatDollars(v) : unit === 'yen' ? formatYen(v) : formatRate(v));
const md = (d: string) => dayLabel(d).slice(4);

/**
 * One series over the trip days: bars for amounts per day (over-limit days in red, the daily limit dashed),
 * a line for running totals and rates. Tap or hover a day to read its value.
 */
export function DailyChart({ def, points, today }: { def: SeriesDef; points: SeriesPoint[]; today: string }) {
  const n = points.length;
  const defined = points.filter((p) => p.value !== undefined);
  const initial = (() => {
    const t = points.findIndex((p) => p.date === today);
    if (t >= 0) return t;
    for (let i = n - 1; i >= 0; i--) if (points[i].value !== undefined) return i;
    return 0;
  })();
  const [sel, setSel] = useState(initial);
  if (n === 0) return null;

  const vals = points.flatMap((p) => [p.value ?? 0, p.ref ?? 0]);
  const lo = def.unit === 'rate' && defined.length ? Math.min(...defined.map((p) => p.value as number)) * 0.97 : 0;
  const hiRaw = Math.max(...vals, 0);
  // The top of the chart is a round number (in dollars, yen or rate), so its label reads cleanly.
  const scale = def.unit === 'usd' ? 100 : 1;
  const hi = hiRaw > lo ? niceCeil(hiRaw / scale) * scale : lo + 1;
  const W = 300;
  const H = 120;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const slot = W / n;
  const x = (i: number) => slot * i + slot / 2;

  const pick = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width) * n);
    setSel(Math.min(n - 1, Math.max(0, i)));
  };

  // Lines break at blank days.
  const path = (get: (p: SeriesPoint) => number | undefined) => {
    let d = '';
    let pen = false;
    points.forEach((p, i) => {
      const v = get(p);
      if (v === undefined) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      pen = true;
    });
    return d;
  };
  const hasRef = points.some((p) => p.ref !== undefined);
  const s = points[sel];
  const refLabel = def.id === 'running' ? 'running limit' : 'limit';

  return (
    <div className="daily">
      <p className="daily-read" aria-live="polite">
        <span>{dayLabel(s.date)}</span>
        <b>{s.value === undefined ? '—' : fmt(def.unit, s.value)}</b>
        {s.ref !== undefined && <span className="muted"> {refLabel} {fmt(def.unit, s.ref)}</span>}
      </p>
      <div className="daily-plot">
        <span className="daily-max">{fmt(def.unit, hi)}</span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${def.label}. ${defined.length} of ${n} days have a value.`}
          onPointerDown={pick}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse') pick(e);
          }}
        >
          <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="grid" />
          <rect x={slot * sel} y="0" width={slot} height={H} className="sel" />
          {def.mark === 'bar' &&
            points.map((p, i) =>
              p.value === undefined || p.value <= 0 ? null : (
                <rect
                  key={p.date}
                  x={slot * i + Math.min(1, slot * 0.15)}
                  width={Math.max(slot - Math.min(2, slot * 0.3), 1)}
                  y={y(p.value)}
                  height={H - y(p.value)}
                  className={p.ref !== undefined && p.value > p.ref ? 'bar over' : 'bar'}
                />
              ),
            )}
          {def.mark === 'line' && <path d={path((p) => p.value)} className="line" />}
          {hasRef && <path d={path((p) => p.ref)} className="ref" />}
          <line x1="0" x2={W} y1={H} y2={H} className="base" />
        </svg>
        <span className="daily-axis">
          <span>{md(points[0].date)}</span>
          <span>{md(points[Math.floor((n - 1) / 2)].date)}</span>
          <span>{md(points[n - 1].date)}</span>
        </span>
      </div>
      {hasRef && (
        <p className="daily-key">
          <span><i className="k-main" aria-hidden="true" />{def.id === 'running' ? 'Running total' : 'Spent'}</span>
          <span><i className="k-ref" aria-hidden="true" />{def.id === 'running' ? 'Running limit' : 'Daily limit'}</span>
          {def.id === 'daySpend' && <span><i className="k-over" aria-hidden="true" />Over the limit</span>}
        </p>
      )}
      <table className="sr-only">
        <caption>{def.label}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <th scope="row">{dayLabel(p.date)}</th>
              <td>{p.value === undefined ? 'blank' : fmt(def.unit, p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
