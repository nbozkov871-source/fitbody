-- Skinfold (caliper) measurements.
--
-- Kept apart from client_metrics on purpose: that table holds one row of
-- circumferences and weight per visit, while a caliper session holds a variable
-- set of sites. Folding them together would mean a column per site and a schema
-- change every time a methodology adds one.

create table measurement_sessions (
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

create index measurement_sessions_client_id_idx
  on measurement_sessions(client_id, measured_at desc);

create table skinfold_measurements (
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

create index skinfold_measurements_session_id_idx
  on skinfold_measurements(session_id);

alter table measurement_sessions enable row level security;
alter table skinfold_measurements enable row level security;

-- Same shape as the policies on client_metrics: a trainer reaches a session
-- only through a client they own, and a client only through their own record.
create policy "trainers manage sessions of their clients" on measurement_sessions
  for all using (
    exists (select 1 from clients c where c.id = client_id and c.trainer_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = client_id and c.trainer_id = auth.uid())
  );

create policy "clients read own sessions" on measurement_sessions
  for select using (
    exists (select 1 from clients c where c.id = client_id and c.profile_id = auth.uid())
  );

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

create trigger measurement_sessions_touch
  before update on measurement_sessions
  for each row execute function touch_measurement_session();
