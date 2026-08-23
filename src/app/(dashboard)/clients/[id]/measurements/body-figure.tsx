"use client";

/**
 * A silhouette with a band drawn at each place the tape goes.
 *
 * It is a reference, not a control: the bands light up as the matching field is
 * filled, so a trainer can see at a glance what is still missing without
 * counting empty boxes. Clicking a band focuses its field, which is a shortcut
 * rather than the only way in — the inputs stand on their own for anyone using a
 * keyboard or a screen reader.
 */

type Band = {
  site: string;
  /** Where the band sits and how wide, in the figure's own coordinates. */
  x: number;
  y: number;
  width: number;
};

const BANDS: Band[] = [
  { site: "neck", x: 78, y: 46, width: 44 },
  { site: "shoulders", x: 52, y: 66, width: 96 },
  { site: "chest", x: 60, y: 90, width: 80 },
  { site: "waist", x: 68, y: 120, width: 64 },
  { site: "hips", x: 62, y: 146, width: 76 },

  { site: "arm_right", x: 34, y: 92, width: 24 },
  { site: "arm_left", x: 142, y: 92, width: 24 },
  { site: "forearm_right", x: 26, y: 124, width: 22 },
  { site: "forearm_left", x: 152, y: 124, width: 22 },
  { site: "wrist_right", x: 22, y: 150, width: 18 },
  { site: "wrist_left", x: 160, y: 150, width: 18 },

  { site: "thigh_right", x: 66, y: 178, width: 30 },
  { site: "thigh_left", x: 104, y: 178, width: 30 },
  { site: "calf_right", x: 70, y: 224, width: 24 },
  { site: "calf_left", x: 106, y: 224, width: 24 },
  { site: "ankle_right", x: 74, y: 258, width: 18 },
  { site: "ankle_left", x: 108, y: 258, width: 18 },
];

export function BodyFigure({
  filled,
  onPick,
}: {
  /** Which site ids currently hold a value. */
  filled: Set<string>;
  onPick: (site: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 200 290"
      className="mx-auto h-72 w-auto"
      role="img"
      aria-label={`Фигура с местата за измерване. Попълнени: ${filled.size} от ${BANDS.length}.`}
    >
      {/* Silhouette, drawn plainly — it is scenery for the bands. */}
      <g fill="var(--muted)" stroke="var(--border)" strokeWidth="1">
        <circle cx="100" cy="26" r="18" />
        <rect x="92" y="42" width="16" height="10" rx="3" />
        <path d="M62 58 h76 a8 8 0 0 1 8 8 v72 a8 8 0 0 1 -8 8 h-76 a8 8 0 0 1 -8 -8 v-72 a8 8 0 0 1 8 -8 z" />
        <path d="M54 66 l-18 6 -12 84 h16 l14 -70 z" />
        <path d="M146 66 l18 6 12 84 h-16 l-14 -70 z" />
        <path d="M66 146 h28 l-4 122 h-22 z" />
        <path d="M106 146 h28 l-2 122 h-22 z" />
      </g>

      {BANDS.map((band) => {
        const isFilled = filled.has(band.site);
        return (
          <rect
            key={band.site}
            x={band.x}
            y={band.y}
            width={band.width}
            height="8"
            rx="2"
            fill={isFilled ? "var(--primary)" : "var(--foreground)"}
            opacity={isFilled ? 1 : 0.25}
            className="cursor-pointer transition-opacity"
            onClick={() => onPick(band.site)}
          >
            <title>{band.site}</title>
          </rect>
        );
      })}
    </svg>
  );
}
