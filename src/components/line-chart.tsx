export type SeriesPoint = { date: string; value: number };

export type Series = {
  label: string;
  unit: string;
  colour: string;
  points: SeriesPoint[];
};

/**
 * One or two measures plotted over time, as inline SVG. A line and some labels
 * did not justify a charting dependency in a project that has none, and the
 * viewBox makes it responsive without a resize listener.
 *
 * Both series share a y axis only when they are given the same unit; otherwise
 * each is scaled to its own range, since kilograms and centimetres do not
 * belong on one scale.
 */
export function LineChart({
  series,
  height = 220,
}: {
  series: Series[];
  height?: number;
}) {
  const usable = series.filter((s) => s.points.length >= 2);
  if (usable.length === 0) return null;

  const width = 720;
  const pad = { top: 16, right: 16, bottom: 34, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Series can come from different tables and so from different dates. Laying
  // them out by position in the array would silently draw the second one at the
  // first one's dates, so the axis is built from every date present and each
  // point is placed at its own.
  const axis = [...new Set(usable.flatMap((s) => s.points.map((p) => p.date)))].sort();
  const x = (date: string) => {
    const index = axis.indexOf(date);
    return pad.left + (axis.length === 1 ? plotW / 2 : (index * plotW) / (axis.length - 1));
  };

  // A flat series would divide by zero and a tight one would turn ordinary
  // noise into a mountain range, so every band keeps room around its values.
  const scaleFor = (s: Series) => {
    const values = s.points.map((p) => p.value);
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    const room = Math.max((rawMax - rawMin) * 0.15, Math.abs(rawMax) * 0.02, 1);
    const max = rawMax + room;
    const min = Math.max(0, rawMin - room);
    return (value: number) =>
      pad.top + plotH - ((value - min) / (max - min || 1)) * plotH;
  };

  const primary = usable[0];
  const yPrimary = scaleFor(primary);

  const primaryValues = primary.points.map((p) => p.value);
  const ticks = [
    Math.min(...primaryValues),
    (Math.min(...primaryValues) + Math.max(...primaryValues)) / 2,
    Math.max(...primaryValues),
  ];

  const firstDate = axis[0];
  const lastDate = axis[axis.length - 1];

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={usable
          .map(
            (s) =>
              `${s.label}: от ${s.points[0].value} на ${s.points[s.points.length - 1].value} ${s.unit}`,
          )
          .join("; ")}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={yPrimary(tick)}
              y2={yPrimary(tick)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={yPrimary(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--muted-foreground)"
              fontSize="11"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {usable.map((s, index) => {
          const y = index === 0 ? yPrimary : scaleFor(s);
          const line = s.points
            .map((p) => `${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`)
            .join(" ");

          return (
            <g key={s.label}>
              {index === 0 && (
                <polygon
                  points={`${x(s.points[0].date).toFixed(1)},${pad.top + plotH} ${line} ${x(s.points[s.points.length - 1].date).toFixed(1)},${pad.top + plotH}`}
                  fill={s.colour}
                  opacity="0.12"
                />
              )}
              <polyline
                points={line}
                fill="none"
                stroke={s.colour}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={index === 0 ? undefined : "5 4"}
              />
              {s.points.map((p, i) => (
                <circle
                  key={p.date + i}
                  cx={x(p.date)}
                  cy={y(p.value)}
                  r="3"
                  fill="var(--background)"
                  stroke={s.colour}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}

        <text x={pad.left} y={height - 10} fill="var(--muted-foreground)" fontSize="11">
          {firstDate}
        </text>
        <text
          x={width - pad.right}
          y={height - 10}
          textAnchor="end"
          fill="var(--muted-foreground)"
          fontSize="11"
        >
          {lastDate}
        </text>
      </svg>

      {usable.length > 1 && (
        <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {usable.map((s, i) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-4"
                style={{
                  backgroundColor: s.colour,
                  opacity: i === 0 ? 1 : 0.7,
                }}
              />
              {s.label} ({s.unit})
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
