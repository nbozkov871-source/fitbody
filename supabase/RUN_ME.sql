-- ============================================================
-- FitBody — пусни целия този файл наведнъж в SQL editor.
-- Безопасно е да се изпълни повече от веднъж.
-- Съдържа миграции 0002 (калипер) и 0003 (профил при Google вход).
-- ============================================================

-- Skinfold (caliper) measurements.
--
-- Written to be safe to run more than once: the SQL editor rolls the whole
-- script back if a single statement fails, so a half-applied earlier attempt
-- would otherwise block every retry.
--
-- Kept apart from client_metrics on purpose: that table holds one row of
-- circumferences and weight per visit, while a caliper session holds a variable
-- set of sites. Folding them together would mean a column per site and a schema
-- change every time a methodology adds one.

create table if not exists measurement_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  -- Who held the caliper. Nullable and set null on delete so a session keeps
  -- its history even if that profile later goes away.
  measured_by uuid references profiles(id) on delete set null,
  measured_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists measurement_sessions_client_id_idx
  on measurement_sessions(client_id, measured_at desc);

create table if not exists skinfold_measurements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references measurement_sessions(id) on delete cascade,
  -- Free text rather than an enum, so adding a site is a config change in the
  -- app and not a migration. The app owns the list of valid ids.
  site text not null,
  -- A caliper reads roughly 1-80 mm; the bound rejects nonsense and NaN before
  -- it can reach the column, whatever calls the database.
  value_mm numeric(4,1) not null check (value_mm > 0 and value_mm <= 100),
  -- One reading per site per session, so a repeated save cannot double a row.
  unique (session_id, site)
);

create index if not exists skinfold_measurements_session_id_idx
  on skinfold_measurements(session_id);

alter table measurement_sessions enable row level security;
alter table skinfold_measurements enable row level security;

-- Same shape as the policies on client_metrics: a trainer reaches a session
-- only through a client they own, and a client only through their own record.
drop policy if exists "trainers manage sessions of their clients" on measurement_sessions;
create policy "trainers manage sessions of their clients" on measurement_sessions
  for all using (
    exists (select 1 from clients c where c.id = client_id and c.trainer_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = client_id and c.trainer_id = auth.uid())
  );

drop policy if exists "clients read own sessions" on measurement_sessions;
create policy "clients read own sessions" on measurement_sessions
  for select using (
    exists (select 1 from clients c where c.id = client_id and c.profile_id = auth.uid())
  );

drop policy if exists "trainers manage skinfolds of their clients" on skinfold_measurements;
create policy "trainers manage skinfolds of their clients" on skinfold_measurements
  for all using (
    exists (
      select 1 from measurement_sessions s
      join clients c on c.id = s.client_id
      where s.id = session_id and c.trainer_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from measurement_sessions s
      join clients c on c.id = s.client_id
      where s.id = session_id and c.trainer_id = auth.uid()
    )
  );

drop policy if exists "clients read own skinfolds" on skinfold_measurements;
create policy "clients read own skinfolds" on skinfold_measurements
  for select using (
    exists (
      select 1 from measurement_sessions s
      join clients c on c.id = s.client_id
      where s.id = session_id and c.profile_id = auth.uid()
    )
  );

create or replace function touch_measurement_session()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists measurement_sessions_touch on measurement_sessions;
create trigger measurement_sessions_touch
  before update on measurement_sessions
  for each row execute function touch_measurement_session();

-- ============================================================

-- Hardens profile creation now that accounts can also arrive through Google.
--
-- The password form always sends full_name, so the original trigger could read
-- one field and stop. An OAuth provider decides for itself what it puts in the
-- metadata, and a Google account without a name set would have produced a
-- profile with a null name that no screen has anything to show for.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      -- Last resort: the part of the address before the @, so the interface
      -- always has something to greet the person with.
      split_part(new.email, '@', 1)
    ),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'trainer')
  )
  -- Linking a Google identity to an address that already signed up with a
  -- password fires this trigger again; the existing profile is the good one.
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Опреснява кеша на PostgREST, за да се появят новите таблици веднага.
notify pgrst, 'reload schema';
