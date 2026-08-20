import Link from "next/link";
import { Marquee } from "@/components/landing/marquee";
import { RecordCard } from "@/components/landing/record-card";

const focusDark =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)]";
const focusLight =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--void)]";

const limeButton =
  "inline-block bg-[var(--lime)] px-7 py-3.5 font-[family-name:var(--font-display)] text-sm font-bold tracking-wide text-[var(--void)] uppercase transition-colors hover:bg-[var(--bone)]";

const WEIGHTS = [78.4, 77.9, 77.1, 76.8, 76.0, 75.4, 74.9, 74.1, 73.6, 72.8, 72.0, 71.2];

function Sparkline() {
  const max = Math.max(...WEIGHTS);
  const min = Math.min(...WEIGHTS);
  const points = WEIGHTS.map((w, i) => {
    const x = 4 + i * (232 / (WEIGHTS.length - 1));
    const y = 8 + ((max - w) / (max - min)) * 48;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg
      viewBox="0 0 240 64"
      className="h-16 w-full"
      role="img"
      aria-label="Тегло по седмици: спад от 78,4 на 71,2 килограма за дванадесет седмици"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--lime)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="236" cy="56" r="3.5" fill="var(--bone)" />
    </svg>
  );
}

function Rows({ items }: { items: [string, string][] }) {
  return (
    <dl className="text-sm">
      {items.map(([term, value]) => (
        <div
          key={term}
          className="flex items-baseline justify-between gap-4 border-t border-[var(--line-dark)] py-2.5 first:border-t-0"
        >
          <dt className="text-[var(--ash)]">{term}</dt>
          <dd className="font-mono tabular-nums text-[var(--bone)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const CAPABILITIES = [
  {
    kicker: "Клиенти",
    title: "Един профил, цялата история",
    body: "Ръст, цел, честота на тренировките и бележки от последната сесия — на едно място.",
    artifact: (
      <Rows
        items={[
          ["Ръст", "168 см"],
          ["Цел", "Отслабване"],
          ["Тренировки", "3 / седмица"],
          ["Последна сесия", "9 август"],
        ]}
      />
    ),
  },
  {
    kicker: "Прогрес",
    title: "Посоката, не последното число",
    body: "Едно измерване не значи нищо само по себе си. Хронологията показва дали работи това, което правите.",
    artifact: <Sparkline />,
  },
  {
    kicker: "Режими",
    title: "Планът излиза от данните",
    body: "Попълвате мерките и целта. Формулите пресмятат нуждите, а режимът е готов за изпращане.",
    artifact: (
      <Rows
        items={[
          ["Закуска", "480 kcal"],
          ["Обяд", "620 kcal"],
          ["Следобед", "240 kcal"],
          ["Вечеря", "500 kcal"],
        ]}
      />
    ),
  },
];

// A real sequence — a trainer does these in this order — so numbering carries
// information rather than decorating the section.
const STEPS = [
  {
    title: "Добавяте клиента",
    body: "Име, цел, начални мерки. Отнема по-малко от минута.",
  },
  {
    title: "Записвате мерките",
    body: "Всяко претегляне влиза в хронологията и остава там.",
  },
  {
    title: "Генерирате режима",
    body: "Данните влизат във формулите и планът излиза готов.",
  },
];

export default function Home() {
  return (
    <div
      className="landing flex min-h-svh flex-col bg-[var(--void)] text-[var(--bone)]"
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-[family-name:var(--font-display)] text-xl font-black tracking-tight uppercase">
          Fit<span className="text-[var(--lime)]">Body</span>
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/login"
            className={`hover:text-[var(--lime)] ${focusDark}`}
          >
            Вход
          </Link>
          <Link href="/register" className={`${limeButton} ${focusDark}`}>
            Създайте акаунт
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-20 lg:grid-cols-12 lg:gap-16 lg:pt-16">
          <div className="lg:col-span-6">
            <p className="font-mono text-xs tracking-[0.2em] text-[var(--lime)] uppercase">
              CRM за фитнес треньори
            </p>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl leading-[0.95] font-black tracking-[-0.02em] text-balance uppercase sm:text-6xl lg:text-7xl">
              Всеки клиент. Всяка мярка. Един екран.
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[var(--ash)] text-pretty">
              FitBody пази профилите, мерките и прогреса на всичките ви клиенти
              на едно място. Попълвате данните веднъж, а хранителният режим
              излиза готов.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6 text-sm">
              <Link href="/register" className={`${limeButton} ${focusDark}`}>
                Създайте акаунт
              </Link>
              <Link
                href="/login"
                className={`text-[var(--ash)] hover:text-[var(--bone)] hover:underline ${focusDark}`}
              >
                Вече имам акаунт
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <RecordCard />
          </div>
        </section>

        <Marquee />

        <section className="mx-auto w-full max-w-6xl px-6 pt-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="font-mono text-xs tracking-[0.2em] text-[var(--lime)] uppercase">
                Проблемът
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-[0.95] font-black tracking-[-0.02em] text-balance uppercase sm:text-5xl">
                Данните ви са на пет места.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <ul className="text-lg leading-relaxed text-[var(--ash)]">
                {[
                  "Таблица с мерките, която преправяте всеки месец",
                  "Бележник с целите от първата консултация",
                  "Съобщения във Viber със снимки от кантара",
                  "Хранителен режим в документ, изпратен преди месеци",
                ].map((item) => (
                  <li
                    key={item}
                    className="border-t border-[var(--line-dark)] py-4 first:border-t-0 first:pt-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-lg leading-relaxed text-[var(--bone)]">
                Клиентът пита как върви. Вие търсите отговора в четири приложения.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-20 pb-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-[var(--lime)] uppercase">
                Какво прави
              </p>
              <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-[0.95] font-black tracking-[-0.02em] text-balance uppercase sm:text-5xl">
                Записвате веднъж. Виждате всичко.
              </h2>
            </div>
          </div>

          <div className="mt-12 grid gap-px border border-[var(--line-dark)] bg-[var(--line-dark)] sm:grid-cols-3">
            {CAPABILITIES.map(({ kicker, title, body, artifact }) => (
              <article key={title} className="bg-[var(--void)] p-7">
                <div className="flex min-h-28 items-center border-b border-[var(--line-dark)] pb-6">
                  <div className="w-full">{artifact}</div>
                </div>
                <p className="mt-6 font-mono text-xs tracking-[0.2em] text-[var(--lime)] uppercase">
                  {kicker}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-black tracking-tight uppercase">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ash)]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--bone)] text-[var(--void)]">
          <div className="mx-auto w-full max-w-6xl px-6 py-24 text-center">
            <p className="font-mono text-xs tracking-[0.2em] uppercase">
              Как работи
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl leading-[0.95] font-black tracking-[-0.02em] text-balance uppercase sm:text-5xl">
              От нов клиент до готов режим
            </h2>

            <ol className="mt-14 grid gap-px border border-[var(--line-light)] bg-[var(--line-light)] text-left sm:grid-cols-3">
              {STEPS.map(({ title, body }, i) => (
                <li key={title} className="bg-[var(--bone)] p-8">
                  <p className="font-[family-name:var(--font-display)] text-5xl font-black tracking-tight">
                    <span className="text-[var(--lime)]">0</span>
                    {i + 1}
                  </p>
                  <h3 className="mt-6 font-[family-name:var(--font-display)] text-lg font-black tracking-tight uppercase">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {body}
                  </p>
                </li>
              ))}
            </ol>

            <Link
              href="/register"
              className={`mt-14 ${limeButton} ${focusLight}`}
            >
              Създайте акаунт
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-24">
          <p className="font-mono text-xs tracking-[0.2em] text-[var(--lime)] uppercase">
            Преди да питате
          </p>
          <dl className="mt-10 grid gap-px border border-[var(--line-dark)] bg-[var(--line-dark)] sm:grid-cols-2">
            {[
              {
                q: "Кой вижда данните на клиентите ми?",
                a: "Само вие. Всеки треньор вижда единствено собствените си клиенти, и това е наложено в самата база данни — не само скрито в интерфейса.",
              },
              {
                q: "Колко време отнема да започна?",
                a: "Задължително е само името. Целта, мерките и бележките добавяте когато ви е удобно.",
              },
              {
                q: "Водя всичко в Excel. Мога ли да го внеса?",
                a: "Още не. Засега клиентите се въвеждат ръчно — импорт от таблица няма.",
              },
              {
                q: "Клиентите ми влизат ли в системата?",
                a: "Засега не. FitBody е инструмент за треньора; клиентският достъп още не е готов.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-[var(--void)] p-7">
                <dt className="font-[family-name:var(--font-display)] text-lg font-black tracking-tight uppercase">
                  {q}
                </dt>
                <dd className="mt-3 leading-relaxed text-[var(--ash)]">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-24">
          <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-[0.95] font-black tracking-[-0.02em] text-balance uppercase sm:text-5xl">
            Един клиент. Една минута. Останалото се трупа само.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--ash)]">
            Добавете клиента, върху когото работите днес, и запишете първите
            мерки. Оттам нататък всяко претегляне има къде да отиде.
          </p>
          <Link href="/register" className={`mt-9 ${limeButton} ${focusDark}`}>
            Създайте акаунт
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--line-dark)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-[var(--ash)]">
          FitBody — CRM и хранителни режими за фитнес треньори
        </div>
      </footer>
    </div>
  );
}
