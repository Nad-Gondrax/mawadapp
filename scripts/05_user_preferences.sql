-- Search preferences saved per user.
-- Run this in the Supabase SQL editor.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age_min integer not null default 18 check (age_min >= 18 and age_min <= 99),
  age_max integer not null default 60 check (age_max >= 18 and age_max <= 99 and age_max >= age_min),
  departement text not null default 'Tous',
  niveau_etude text not null default 'tous',
  niveau_pratique text not null default 'tous',
  pays_origine text not null default 'Tous',
  avec_enfants text not null default 'tous' check (avec_enfants in ('tous', 'oui', 'non')),
  projet_mariage text not null default 'tous',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users can view their own preferences" on public.user_preferences;
create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save their own preferences" on public.user_preferences;
create policy "Users can save their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own preferences" on public.user_preferences;
create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
