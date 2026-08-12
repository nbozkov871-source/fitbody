-- FitBody CRM — initial schema
-- Run in the Supabase SQL editor, or via `supabase db push`.

create type user_role as enum ('trainer', 'client');
create type client_status as enum ('active', 'paused', 'archived');
create type plan_status as enum ('draft', 'active', 'archived');
create type goal_type as enum ('lose_fat', 'gain_muscle', 'maintain', 'recomposition');
create type activity_level as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type sex_type as enum ('male', 'female');

-- Every auth user gets a profile. Role decides which side of the app they see.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'trainer',
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references profiles(id) on delete cascade,
  -- set once the client accepts an invite and gets their own login
  profile_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  sex sex_type,
  birth_date date,
  height_cm numeric(5,1),
  goal goal_type,
  activity activity_level,
  status client_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_trainer_id_idx on clients(trainer_id);
create index clients_profile_id_idx on clients(profile_id);

create table client_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(5,1),
  body_fat_pct numeric(4,1),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  hips_cm numeric(5,1),
  arm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  notes text,
  created_at timestamptz not null default now()
);

create index client_metrics_client_id_idx on client_metrics(client_id, measured_at desc);

create table nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  trainer_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  status plan_status not null default 'draft',
  target_calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  -- client data as it was at generation time, so a plan stays reproducible
  input_snapshot jsonb,
  plan jsonb,
  created_at timestamptz not null default now()
);

create index nutrition_plans_client_id_idx on nutrition_plans(client_id, created_at desc);

alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_metrics enable row level security;
alter table nutrition_plans enable row level security;

create policy "read own profile" on profiles
  for select using (auth.uid() = id);
create policy "update own profile" on profiles
  for update using (auth.uid() = id);
create policy "insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "trainers manage their clients" on clients
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);
create policy "clients read own record" on clients
  for select using (auth.uid() = profile_id);

create policy "trainers manage metrics of their clients" on client_metrics
  for all using (
    exists (select 1 from clients c where c.id = client_id and c.trainer_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = client_id and c.trainer_id = auth.uid())
  );
create policy "clients read own metrics" on client_metrics
  for select using (
    exists (select 1 from clients c where c.id = client_id and c.profile_id = auth.uid())
  );

create policy "trainers manage their plans" on nutrition_plans
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);
create policy "clients read own active plans" on nutrition_plans
  for select using (
    status <> 'draft'
    and exists (select 1 from clients c where c.id = client_id and c.profile_id = auth.uid())
  );

-- Mirror new auth users into profiles; role comes from the signup metadata.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'trainer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
