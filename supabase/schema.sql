-- 1) Ouvre le SQL Editor de ton projet Supabase et exécute ce script.
-- Chaque table privée est attachée à l'utilisateur connecté.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'apprenant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null check (length(trim(description)) > 0),
  priority text not null check (priority in ('Faible', 'Moyenne', 'Haute', 'Critique')),
  category text not null check (length(trim(category)) > 0),
  status text not null check (status in ('Ouvert', 'En cours', 'Fermé')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.incident_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  symptom text not null check (length(trim(symptom)) > 0),
  environment text,
  checks text,
  hypothesis text,
  confirmed_cause text,
  solution text,
  result text,
  lessons text,
  keywords text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  what_learned text,
  blockers text,
  priorities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists study_progress_set_updated_at on public.study_progress;
create trigger study_progress_set_updated_at
before update on public.study_progress
for each row execute procedure public.set_updated_at();

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row execute procedure public.set_updated_at();

drop trigger if exists incident_cases_set_updated_at on public.incident_cases;
create trigger incident_cases_set_updated_at
before update on public.incident_cases
for each row execute procedure public.set_updated_at();

drop trigger if exists weekly_reviews_set_updated_at on public.weekly_reviews;
create trigger weekly_reviews_set_updated_at
before update on public.weekly_reviews
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.study_progress enable row level security;
alter table public.tickets enable row level security;
alter table public.incident_cases enable row level security;
alter table public.weekly_reviews enable row level security;
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

drop policy if exists "Profiles are visible only to their owner" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can read their own study progress" on public.study_progress;
drop policy if exists "Users can insert their own study progress" on public.study_progress;
drop policy if exists "Users can update their own study progress" on public.study_progress;
drop policy if exists "Users can read their own tickets" on public.tickets;
drop policy if exists "Users can insert their own tickets" on public.tickets;
drop policy if exists "Users can update their own tickets" on public.tickets;
drop policy if exists "Users can delete their own tickets" on public.tickets;
drop policy if exists "Users can read their own incident cases" on public.incident_cases;
drop policy if exists "Users can insert their own incident cases" on public.incident_cases;
drop policy if exists "Users can update their own incident cases" on public.incident_cases;
drop policy if exists "Users can delete their own incident cases" on public.incident_cases;
drop policy if exists "Users can read their own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can insert their own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can update their own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can delete their own weekly reviews" on public.weekly_reviews;
drop policy if exists "Admins can verify their own authorization" on public.admin_users;
drop policy if exists "Admins can read their own profile" on public.profiles;
drop policy if exists "Admins can insert their own profile" on public.profiles;
drop policy if exists "Admins can update their own profile" on public.profiles;
drop policy if exists "Admins can read their own study progress" on public.study_progress;
drop policy if exists "Admins can insert their own study progress" on public.study_progress;
drop policy if exists "Admins can update their own study progress" on public.study_progress;
drop policy if exists "Admins can read their own tickets" on public.tickets;
drop policy if exists "Admins can insert their own tickets" on public.tickets;
drop policy if exists "Admins can update their own tickets" on public.tickets;
drop policy if exists "Admins can delete their own tickets" on public.tickets;
drop policy if exists "Admins can read their own incident cases" on public.incident_cases;
drop policy if exists "Admins can insert their own incident cases" on public.incident_cases;
drop policy if exists "Admins can update their own incident cases" on public.incident_cases;
drop policy if exists "Admins can delete their own incident cases" on public.incident_cases;
drop policy if exists "Admins can read their own weekly reviews" on public.weekly_reviews;
drop policy if exists "Admins can insert their own weekly reviews" on public.weekly_reviews;
drop policy if exists "Admins can update their own weekly reviews" on public.weekly_reviews;
drop policy if exists "Admins can delete their own weekly reviews" on public.weekly_reviews;

create policy "Admins can verify their own authorization"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id and public.is_site_admin());

create policy "Admins can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id and public.is_site_admin());

create policy "Admins can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id and public.is_site_admin())
with check (auth.uid() = id and public.is_site_admin());

create policy "Admins can read their own study progress"
on public.study_progress for select
to authenticated
using (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can insert their own study progress"
on public.study_progress for insert
to authenticated
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can update their own study progress"
on public.study_progress for update
to authenticated
using (auth.uid() = user_id and public.is_site_admin())
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can read their own tickets"
on public.tickets for select
to authenticated
using (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can insert their own tickets"
on public.tickets for insert
to authenticated
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can update their own tickets"
on public.tickets for update
to authenticated
using (auth.uid() = user_id and public.is_site_admin())
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can delete their own tickets"
on public.tickets for delete
to authenticated
using (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can read their own incident cases"
on public.incident_cases for select
to authenticated
using (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can insert their own incident cases"
on public.incident_cases for insert
to authenticated
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can update their own incident cases"
on public.incident_cases for update
to authenticated
using (auth.uid() = user_id and public.is_site_admin())
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can delete their own incident cases"
on public.incident_cases for delete
to authenticated
using (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can read their own weekly reviews"
on public.weekly_reviews for select
to authenticated
using (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can insert their own weekly reviews"
on public.weekly_reviews for insert
to authenticated
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can update their own weekly reviews"
on public.weekly_reviews for update
to authenticated
using (auth.uid() = user_id and public.is_site_admin())
with check (auth.uid() = user_id and public.is_site_admin());

create policy "Admins can delete their own weekly reviews"
on public.weekly_reviews for delete
to authenticated
using (auth.uid() = user_id and public.is_site_admin());

-- Données de démonstration : à utiliser en local uniquement pour montrer le fonctionnement.
-- Ne stocke pas de vrais comptes, mots de passe ou incidents d'entreprise dans ces exemples.
-- Exemple de données de test personnalisées :
-- insert into public.tickets (user_id, title, description, priority, category, status)
-- values (
--   auth.uid(),
--   'DNS interne',
--   'Les postes ne résolvent plus les noms du domaine.',
--   'Haute',
--   'Réseau',
--   'Ouvert'
-- );

-- N'ajoute JAMAIS la clé service_role dans l'application cliente.
