-- Tape measurements, hanging off the same session as the caliper readings.
--
-- A trainer measures everything in one sitting, so one session holds both. Two
-- separate histories would mean entering the date twice and would drift apart
-- the moment one gets an entry the other does not.
--
-- Safe to run more than once.

create table if not exists circumference_measurements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references measurement_sessions(id) on delete cascade,
  -- Text, like the skinfold sites: adding a place to measure stays a change to
  -- one config array in the app rather than a migration.
  site text not null,
  -- A tape reads roughly 10-250 cm across every site on a body. The bound
  -- rejects nonsense whatever writes it.
  value_cm numeric(5,1) not null check (value_cm > 0 and value_cm <= 250),
  unique (session_id, site)
);

create index if not exists circumference_measurements_session_id_idx
  on circumference_measurements(session_id);

alter table circumference_measurements enable row level security;

drop policy if exists "trainers manage circumferences of their clients" on circumference_measurements;
create policy "trainers manage circumferences of their clients" on circumference_measurements
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

drop policy if exists "clients read own circumferences" on circumference_measurements;
create policy "clients read own circumferences" on circumference_measurements
  for select using (
    exists (
      select 1 from measurement_sessions s
      join clients c on c.id = s.client_id
      where s.id = session_id and c.profile_id = auth.uid()
    )
  );

-- Move what client_metrics already holds into the new shape.
--
-- Every metrics row carrying a circumference gets a session on its own date,
-- reusing one if the caliper already created it that day. The old columns are
-- left in place and simply stop being written; dropping them belongs in a later
-- migration, once nothing has read them for a while.
do $$
declare
  metric record;
  target_session uuid;
begin
  for metric in
    select * from client_metrics
    where waist_cm is not null or chest_cm is not null or hips_cm is not null
       or arm_cm is not null or thigh_cm is not null
  loop
    select id into target_session
    from measurement_sessions
    where client_id = metric.client_id and measured_at = metric.measured_at
    limit 1;

    if target_session is null then
      insert into measurement_sessions (client_id, measured_at, notes)
      values (metric.client_id, metric.measured_at, metric.notes)
      returning id into target_session;
    end if;

    insert into circumference_measurements (session_id, site, value_cm)
    select target_session, site, value
    from (values
      ('waist', metric.waist_cm),
      ('chest', metric.chest_cm),
      ('hips', metric.hips_cm),
      ('arm_right', metric.arm_cm),
      ('thigh_right', metric.thigh_cm)
    ) as pairs(site, value)
    where value is not null and value > 0 and value <= 250
    on conflict (session_id, site) do nothing;
  end loop;
end $$;

notify pgrst, 'reload schema';
