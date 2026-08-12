# FitBody — CRM за фитнес треньори

Уеб приложение, с което фитнес треньори управляват клиентите си и генерират
персонализирани хранителни планове.

## Стек

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI)
- Supabase (PostgreSQL, Auth, Row Level Security)

## Стартиране

1. Създайте проект в [supabase.com](https://supabase.com).
2. Копирайте `.env.local.example` в `.env.local` и попълнете:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Изпълнете `supabase/migrations/0001_init.sql` в SQL editor-а на Supabase.
4. Инсталирайте и стартирайте:

   ```bash
   npm install && npm run dev
   ```

## Структура

| Път | Съдържание |
| --- | --- |
| `src/app/(auth)` | Вход и регистрация |
| `src/app/(dashboard)` | Табло, клиенти, хранителни планове |
| `src/lib/supabase` | Клиенти за браузър, сървър и session refresh |
| `src/lib/nutrition.ts` | Формули за калории и макроси |
| `supabase/migrations` | SQL схема и RLS политики |

## Модел на данните

- `profiles` — всеки auth потребител, с роля `trainer` или `client`
- `clients` — клиентите на треньора; `profile_id` се попълва, ако клиентът има
  собствен вход
- `client_metrics` — история на теглото и обиколките
- `nutrition_plans` — генерираните планове със снимка на входните данни

RLS гарантира, че треньор вижда само своите клиенти, а клиент — само своите
данни и активните си планове.

## Какво предстои

`src/lib/nutrition.ts` съдържа **временни** формули (Mifflin-St Jeor + множител
за активност) и генератор на примерен план. Те трябва да се заменят с реалните
формули на треньора и с извикване към AI модел.
