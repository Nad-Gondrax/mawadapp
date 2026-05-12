-- Mahram approval requests created after a mutual match.
-- Run this in the Supabase SQL editor after 02_matches_messages.sql.

create table if not exists public.mahram_match_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  protected_user_id uuid not null references auth.users(id) on delete cascade,
  match_user_id uuid not null references auth.users(id) on delete cascade,
  access_token uuid not null default gen_random_uuid(),
  mahram_email text,
  mahram_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'refused')),
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mahram_requests_unique_access_token unique (access_token),
  constraint mahram_requests_unique_conversation unique (conversation_id),
  constraint mahram_requests_no_self_match check (protected_user_id <> match_user_id)
);

create index if not exists mahram_match_requests_protected_user_idx
  on public.mahram_match_requests(protected_user_id);

create index if not exists mahram_match_requests_match_user_idx
  on public.mahram_match_requests(match_user_id);

alter table public.mahram_match_requests enable row level security;

drop policy if exists "Users can view their mahram match requests" on public.mahram_match_requests;
create policy "Users can view their mahram match requests"
  on public.mahram_match_requests for select
  using (auth.uid() = protected_user_id or auth.uid() = match_user_id);

drop policy if exists "Users can create their mahram match requests" on public.mahram_match_requests;

drop policy if exists "Protected user can update mahram match requests" on public.mahram_match_requests;
