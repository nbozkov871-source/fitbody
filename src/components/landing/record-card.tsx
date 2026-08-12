"use client";

import { useEffect, useRef, useState } from "react";

type Row = {
  label: string;
  from: number;
  to: number;
  unit: string;
  decimals: number;
};

const ROWS: Row[] = [
  { label: "Тегло", from: 78.4, to: 71.2, unit: "кг", decimals: 1 },
  { label: "Талия", from: 92, to: 81, unit: "см", decimals: 0 },
  { label: "Мазнини", from: 31.5, to: 24.8, unit: "%", decimals: 1 },
];

const DURATION = 1100;

// Bulgarian writes decimals with a comma; toFixed would print a period.
function format(value: number, decimals: number) {
  return value.toLocaleString("bg-BG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// The one orchestrated moment on the page: the record fills itself in, the way a
// trainer's card fills in over twelve weeks. Everything else on the page holds still.
// Starts settled, so the server render, a reduced-motion visitor, and anyone
// whose JavaScript never arrives all see the week-12 numbers — the point of the
// card. The count-up is an enhancement layered on top, not the source of truth.
function useProgress() {
  const [progress, setProgress] = useState(1);
  const frame = useRef<number>(undefined);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / DURATION, 1);
      // Ease out cubic, so the numbers settle rather than stop dead.
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return progress;
}

function MeasurementRow({ row, progress }: { row: Row; progress: number }) {
  const current = row.from + (row.to - row.from) * progress;
  // Rounded before display so binary float noise never reaches the label.
  const drop = format(Math.abs(row.to - row.from), row.decimals);
  const settled = progress > 0.85;

  return (
    <div
      className="flex items-baseline justify-between gap-4 border-t border-[var(--line-dark)] py-3.5 first:border-t-0"
      // Screen readers get the finished fact, not the ticking number.
      aria-label={`${row.label}: от ${format(row.from, row.decimals)} на ${format(
        row.to,
        row.decimals,
      )} ${row.unit}, спад с ${drop} ${row.unit}`}
    >
      <span aria-hidden className="text-sm text-[var(--ash)]">
        {row.label}
      </span>
      <span aria-hidden className="flex items-baseline gap-3">
        <span className="font-mono text-xl tabular-nums text-[var(--bone)] sm:text-2xl">
          {format(current, row.decimals)}
        </span>
        <span className="w-6 text-sm text-[var(--ash)]">{row.unit}</span>
        <span
          className="w-20 text-right font-mono text-sm tabular-nums text-[var(--lime)] transition-opacity duration-500"
          style={{ opacity: settled ? 1 : 0 }}
        >
          {/* The arrow states the direction, so the lime is never the only signal
              and the minus sign is not repeating what the arrow already says. */}
          ↓ {drop}
        </span>
      </span>
    </div>
  );
}

export function RecordCard() {
  const progress = useProgress();

  return (
    <figure className="border border-[var(--line-dark)] bg-[var(--panel)] p-6 sm:p-8">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="font-[family-name:var(--font-display)] text-lg font-black tracking-tight text-[var(--bone)] uppercase">
          М. Петрова
        </span>
        <span className="font-mono text-xs tabular-nums text-[var(--ash)]">
          седмица 1 → 12
        </span>
      </figcaption>

      <div className="mt-5">
        {ROWS.map((row) => (
          <MeasurementRow key={row.label} row={row} progress={progress} />
        ))}
      </div>

      <div className="mt-5 border-t border-[var(--line-dark)] pt-5">
        <p className="text-xs tracking-widest text-[var(--ash)] uppercase">
          Текущ режим
        </p>
        <p className="mt-1.5 font-mono text-sm tabular-nums text-[var(--bone)]">
          1 840 kcal
          <span className="text-[var(--ash)]"> · 138 Б / 180 В / 55 М</span>
        </p>
      </div>
    </figure>
  );
}
