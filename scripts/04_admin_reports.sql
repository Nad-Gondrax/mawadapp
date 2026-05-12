-- Admin minimum: reports table and safer public profile discovery.
-- Run this in the Supabase SQL editor.

create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint profile_reports_no_self_report check (reporter_id <> reported_user_id)
);

create index if not exists profile_reports_reporter_idx
  on public.profile_reports(reporter_id);

create index if not exists profile_reports_reported_user_idx
  on public.profile_reports(reported_user_id);

create index if not exists profile_reports_status_idx
  on public.profile_reports(status);

alter table public.profile_reports enable row level security;

drop policy if exists "Users can create profile reports" on public.profile_reports;
create policy "Users can create profile reports"
  on public.profile_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can view their own profile reports" on public.profile_reports;
create policy "Users can view their own profile reports"
  on public.profile_reports for select
  using (auth.uid() = reporter_id);

-- If your public discovery view already exists with a different column list,
-- drop it first so Supabase can recreate the safe version cleanly.
drop view if exists public.profiles_public;

create view public.profiles_public as
select
  id,
  prenom,
  age,
  genre,
  ville,
  pays_origine,
  photo,
  photo_blurred,
  taille,
  silhouette,
  barbe,
  hijab,
  style_vestimentaire,
  traits,
  profession,
  niveau_etudes,
  situation_pro,
  niveau_pratique,
  pratique_priere,
  situation_maritale,
  projet_mariage,
  souhaite_enfants,
  presentation,
  style_amour,
  style_vie,
  gestion_conflits,
  origine_pere_pays1,
  origine_pere_pays2,
  origine_mere_pays1,
  origine_mere_pays2,
  created_at
from public.profiles
where coalesce(statut, 'actif') in ('actif', 'verifie')
  and onboarding_complete = true;
