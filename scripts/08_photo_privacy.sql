-- Photo privacy: users can blur their photo and approve/refuse unblur requests.
-- Run this in the Supabase SQL editor.

alter table public.profiles
  add column if not exists photo_blurred boolean not null default false;

create table if not exists public.photo_unblur_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  requested_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'refused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint photo_unblur_no_self_request check (requester_id <> requested_user_id),
  constraint photo_unblur_unique_pair unique (requester_id, requested_user_id)
);

create index if not exists photo_unblur_requester_idx
  on public.photo_unblur_requests(requester_id);

create index if not exists photo_unblur_requested_user_idx
  on public.photo_unblur_requests(requested_user_id);

alter table public.photo_unblur_requests enable row level security;

drop policy if exists "Users can view their photo unblur requests" on public.photo_unblur_requests;
create policy "Users can view their photo unblur requests"
  on public.photo_unblur_requests for select
  using (auth.uid() = requester_id or auth.uid() = requested_user_id);

drop policy if exists "Users can create their photo unblur requests" on public.photo_unblur_requests;
create policy "Users can create their photo unblur requests"
  on public.photo_unblur_requests for insert
  with check (auth.uid() = requester_id);

drop policy if exists "Profile owners can decide photo unblur requests" on public.photo_unblur_requests;
create policy "Profile owners can decide photo unblur requests"
  on public.photo_unblur_requests for update
  using (auth.uid() = requested_user_id)
  with check (auth.uid() = requested_user_id);

create or replace function public.touch_photo_unblur_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();

  if new.status <> old.status then
    new.decided_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists photo_unblur_requests_touch on public.photo_unblur_requests;
create trigger photo_unblur_requests_touch
  before update on public.photo_unblur_requests
  for each row
  execute function public.touch_photo_unblur_request();

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

grant select on public.profiles_public to authenticated;
