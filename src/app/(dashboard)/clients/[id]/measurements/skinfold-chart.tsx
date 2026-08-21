import { formatMm } from "@/lib/measurements";

type Point = { date: string; total: number };

// Drawn as inline SVG rather than pulling in a charting library: one line over
// time needs a path and a few labels, and the viewBox makes it responsive for
// free. If charts grow into several types, that trade is worth revisiting.
export function SkinfoldChart({ points }: { points: Point[] }) {
  if (points.length < 2) return null;

  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };

  const totals = points.map((p) => p.total);
  const rawMax = Math.max(...totals);
  const rawMin = Math.min(...totals);
  // A flat series would divide by zero and a tight one would exaggerate noise,
  // so the band always keeps some room around the values.
  const pad10 = Math.max((rawMax - rawMin) * 0.15, 5);
  const max = rawMax + pad10;
  const min = Math.max(0, rawMin - pad10);

  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const x = (i: number) =>
    pad.left + (points.length === 1 ? plotW / 2 : (i * plotW) / (points.length - 1));
  const y = (value: number) =>
    pad.top + plotH - ((value - min) / (max - min)) * plotH;

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(" ");
  const area = `${pad.left},${pad.top + plotH} ${line} ${x(points.length - 1).toFixed(1)},${pad.top + plotH}`;

  const ticks = [min, (min + max) / 2, max];
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        role="img"
        aria-label={`Σ Skinfold във времето: от ${formatMm(first.total)} mm на ${first.date} до ${formatMm(last.total)} mm на ${last.date}`}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--muted-foreground)"
              fontSize="11"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        <polygon points={area} fill="var(--primary)" opacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={p.date + i}
            cx={x(i)}
            cy={y(p.total)}
            r="3.5"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeWidth="2"
          />
        ))}

        <text
          x={pad.left}
          y={height - 10}
          fill="var(--muted-foreground)"
          fontSize="11"
        >
          {first.date}
        </text>
        <text
          x={width - pad.right}
          y={height - 10}
          textAnchor="end"
          fill="var(--muted-foreground)"
          fontSize="11"
        >
          {last.date}
        </text>
      </svg>
      <figcaption className="sr-only">
        Сума на кожните гънки в милиметри по дата.
      </figcaption>
    </figure>
  );
}
