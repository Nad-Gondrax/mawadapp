-- Likes, matches and supervised conversations for Mawada.
-- Run this in the Supabase SQL editor.

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_no_self_like check (from_user_id <> to_user_id),
  constraint likes_unique_pair unique (from_user_id, to_user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_1_id uuid not null references auth.users(id) on delete cascade,
  user_2_id uuid not null references auth.users(id) on delete cascade,
  mahram_status text not null default 'pending' check (mahram_status in ('pending', 'approved', 'refused')),
  status text not null default 'active' check (status in ('active', 'blocked', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_no_self check (user_1_id <> user_2_id)
);

create unique index if not exists conversations_unique_pair
  on public.conversations (
    least(user_1_id, user_2_id),
    greatest(user_1_id, user_2_id)
  );

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  flagged boolean not null default false,
  flag_reason text,
  created_at timestamptz not null default now()
);

create index if not exists likes_from_user_idx on public.likes(from_user_id);
create index if not exists likes_to_user_idx on public.likes(to_user_id);
create index if not exists conversations_user_1_idx on public.conversations(user_1_id);
create index if not exists conversations_user_2_idx on public.conversations(user_2_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id);

alter table public.likes enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can view their likes" on public.likes;
create policy "Users can view their likes"
  on public.likes for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "Users can create their likes" on public.likes;
create policy "Users can create their likes"
  on public.likes for insert
  with check (auth.uid() = from_user_id);

drop policy if exists "Users can delete their likes" on public.likes;
create policy "Users can delete their likes"
  on public.likes for delete
  using (auth.uid() = from_user_id);

drop policy if exists "Users can view their conversations" on public.conversations;
create policy "Users can view their conversations"
  on public.conversations for select
  using (auth.uid() = user_1_id or auth.uid() = user_2_id);

drop policy if exists "Users can create their conversations" on public.conversations;
create policy "Users can create their conversations"
  on public.conversations for insert
  with check (
    (auth.uid() = user_1_id or auth.uid() = user_2_id)
    and exists (
      select 1 from public.likes l1
      where l1.from_user_id = user_1_id and l1.to_user_id = user_2_id
    )
    and exists (
      select 1 from public.likes l2
      where l2.from_user_id = user_2_id and l2.to_user_id = user_1_id
    )
  );

drop policy if exists "Users can update their conversations" on public.conversations;
drop policy if exists "Participants can update their conversations" on public.conversations;

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row
  execute function public.touch_conversation_on_message();

drop policy if exists "Users can view messages in their conversations" on public.messages;
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_1_id or auth.uid() = c.user_2_id)
    )
  );

drop policy if exists "Users can send messages in their active conversations" on public.messages;
create policy "Users can send messages in their active conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.status = 'active'
        and c.mahram_status = 'approved'
        and (auth.uid() = c.user_1_id or auth.uid() = c.user_2_id)
    )
  );

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
