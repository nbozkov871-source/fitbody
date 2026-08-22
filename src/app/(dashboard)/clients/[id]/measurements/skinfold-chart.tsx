import { LineChart } from "@/components/line-chart";

type Point = { date: string; total: number };

/** The sum of the caliper readings over time. Drawing lives in LineChart. */
export function SkinfoldChart({ points }: { points: Point[] }) {
  return (
    <LineChart
      series={[
        {
          label: "Σ Skinfold",
          unit: "mm",
          colour: "var(--primary)",
          points: points.map((p) => ({ date: p.date, value: p.total })),
        },
      ]}
    />
  );
}
