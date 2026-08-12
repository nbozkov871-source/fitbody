const WORDS = ["КЛИЕНТИ", "МЕРКИ", "РЕЖИМИ", "ПРОГРЕС", "ИСТОРИЯ"];

function Run({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-8 pr-8"
      aria-hidden={hidden || undefined}
    >
      {WORDS.map((word) => (
        <li key={word} className="flex items-center gap-8 whitespace-nowrap">
          <span className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight sm:text-3xl">
            {word}
          </span>
          <span className="text-lg text-[var(--lime)]" aria-hidden>
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden border-y border-[var(--line-dark)] bg-[var(--void)] py-5 text-[var(--bone)]">
      {/* Two identical runs slide by 50%, so the loop has no seam. The second is
          hidden from screen readers, which only need the list once. */}
      <div className="landing-marquee-track flex w-max">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
