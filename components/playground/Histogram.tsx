// OWNER: 05-playground-ui.md — do not edit from another role
// Inline-SVG bar chart / histogram — deliberately dependency-free (BUILD_PROMPT.md §4c: "no
// charting library dependency needed"). Two input modes:
//   - `bars`: pre-labeled values (e.g. p50/p95/p99, or throughput-per-concurrency-level for the
//     pool-saturation "knee" chart) rendered directly, one bar per entry.
//   - `values`: a raw sample array, auto-bucketed into `bucketCount` equal-width bins and rendered
//     as a frequency histogram.
// Every bar's value is also emitted as plain text in a visually-hidden list, so the data is
// available to screen readers/text browsers without parsing SVG (the "or text histogram" half of
// the spec, kept alongside the SVG rather than as an either/or).

export interface HistogramBar {
  label: string;
  value: number;
  /** Marks a bar as visually distinct — e.g. the pool-size boundary in the saturation chart. */
  highlight?: boolean;
}

export interface HistogramProps {
  bars?: HistogramBar[];
  values?: number[];
  bucketCount?: number;
  unit?: string;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

function bucketValues(values: number[], bucketCount: number): HistogramBar[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ label: `${Math.round(min)}`, value: values.length }];
  }
  const span = max - min;
  const counts = new Array<number>(bucketCount).fill(0);
  for (const v of values) {
    const idx = Math.min(bucketCount - 1, Math.floor(((v - min) / span) * bucketCount));
    counts[idx] = (counts[idx] ?? 0) + 1;
  }
  return counts.map((count, i) => {
    const lo = Math.round(min + (span * i) / bucketCount);
    const hi = Math.round(min + (span * (i + 1)) / bucketCount);
    return { label: `${lo}-${hi}`, value: count };
  });
}

function formatValue(value: number, unit: string): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 100) / 100;
  return unit ? `${rounded}${unit}` : `${rounded}`;
}

export default function Histogram({
  bars,
  values = [],
  bucketCount = 8,
  unit = "",
  width = 420,
  height = 150,
  className = "",
  ariaLabel = "Histogram",
}: HistogramProps) {
  const data = bars ?? bucketValues(values, bucketCount);

  if (data.length === 0) {
    return <p className="font-mono text-xs text-text-muted">No data yet — run to populate this chart.</p>;
  }

  const gap = 6;
  const labelAreaHeight = 22;
  const valueAreaHeight = 16;
  const plotHeight = height - labelAreaHeight - valueAreaHeight;
  const barCount = data.length;
  const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="h-auto w-full overflow-visible"
      >
        <line
          x1={0}
          y1={valueAreaHeight + plotHeight}
          x2={width}
          y2={valueAreaHeight + plotHeight}
          className="stroke-border"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barHeight = maxVal > 0 ? (d.value / maxVal) * plotHeight : 0;
          const x = i * (barWidth + gap);
          const y = valueAreaHeight + plotHeight - barHeight;
          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(0, barHeight)}
                rx={2}
                className={d.highlight ? "fill-accent-warn" : "fill-accent-primary"}
              />
              <text
                x={x + barWidth / 2}
                y={valueAreaHeight - 6}
                textAnchor="middle"
                className="fill-text-secondary font-mono"
                style={{ fontSize: 9 }}
              >
                {formatValue(d.value, unit)}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-text-muted font-mono"
                style={{ fontSize: 8 }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {data.map((d, i) => (
          <li key={`${d.label}-sr-${i}`}>
            {d.label}: {formatValue(d.value, unit)}
            {d.highlight ? " (highlighted)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
