-- Exclusive match flow for Taym.
-- Run this in the Supabase SQL editor after scripts 02 and 06.

alter table public.conversations
  add column if not exists ended_at timestamptz,
  add column if not exists ended_by uuid references auth.users(id) on delete set null,
  add column if not exists user_1_go_further_at timestamptz,
  add column if not exists user_2_go_further_at timestamptz,
  add column if not exists mahram_contacts_revealed_at timestamptz;

create index if not exists conversations_active_user_1_idx
  on public.conversations (user_1_id)
  where status = 'active' and mahram_status in ('pending', 'approved');

create index if not exists conversations_active_user_2_idx
  on public.conversations (user_2_id)
  where status = 'active' and mahram_status in ('pending', 'approved');

create or replace function public.prevent_multiple_active_conversations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and new.mahram_status in ('pending', 'approved') then
    if exists (
      select 1
      from public.conversations c
      where c.id <> coalesce(new.id, gen_random_uuid())
        and c.status = 'active'
        and c.mahram_status in ('pending', 'approved')
        and (
          c.user_1_id in (new.user_1_id, new.user_2_id)
          or c.user_2_id in (new.user_1_id, new.user_2_id)
        )
    ) then
      raise exception 'active_match_lock';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_prevent_multiple_active on public.conversations;
create trigger conversations_prevent_multiple_active
  before insert or update on public.conversations
  for each row
  execute function public.prevent_multiple_active_conversations();

create or replace function public.prevent_like_during_active_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.conversations c
    where c.status = 'active'
      and c.mahram_status in ('pending', 'approved')
      and (
        c.user_1_id in (new.from_user_id, new.to_user_id)
        or c.user_2_id in (new.from_user_id, new.to_user_id)
      )
  ) then
    raise exception 'active_match_lock';
  end if;

  return new;
end;
$$;

drop trigger if exists likes_prevent_active_match on public.likes;
create trigger likes_prevent_active_match
  before insert on public.likes
  for each row
  execute function public.prevent_like_during_active_match();
