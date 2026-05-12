-- Security hardening for Mawada RLS.
-- Run this in the Supabase SQL editor after scripts 02, 03, 04 and 05.

-- ---------------------------------------------------------------------------
-- Profiles: direct access is private. Public discovery must use profiles_public.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';

    execute 'drop policy if exists "Users can view their own profile" on public.profiles';
    execute 'create policy "Users can view their own profile"
      on public.profiles for select
      using (auth.uid() = id)';

    execute 'drop policy if exists "Users can create their own profile" on public.profiles';
    execute 'create policy "Users can create their own profile"
      on public.profiles for insert
      with check (auth.uid() = id)';

    execute 'drop policy if exists "Users can update their own profile" on public.profiles';
    execute 'create policy "Users can update their own profile"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id)';
  end if;
end $$;

-- Regular authenticated users must never promote themselves, unsuspend
-- themselves, or validate their own Mahram status by editing protected columns.
create or replace function public.prevent_profile_protected_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if (to_jsonb(new) -> 'role') is distinct from (to_jsonb(old) -> 'role')
      or (to_jsonb(new) -> 'statut') is distinct from (to_jsonb(old) -> 'statut')
      or (to_jsonb(new) -> 'mahram_statut') is distinct from (to_jsonb(old) -> 'mahram_statut')
    then
      raise exception 'Protected profile fields cannot be changed by regular users';
    end if;
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists prevent_profile_protected_changes on public.profiles';
    execute 'create trigger prevent_profile_protected_changes
      before update on public.profiles
      for each row
      execute function public.prevent_profile_protected_changes()';
  end if;
end $$;

-- Safe public profile view. It exposes only discovery-safe fields and hides
-- suspended, banned and incomplete profiles.
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

-- ---------------------------------------------------------------------------
-- Likes: users only manage their own likes and only see likes involving them.
-- ---------------------------------------------------------------------------
alter table public.likes enable row level security;

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

-- ---------------------------------------------------------------------------
-- Conversations: participants can read. Creation requires a mutual like.
-- No direct client update is allowed; Mahram decisions use the server API.
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;

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

-- Keep conversation.updated_at fresh without giving clients update rights.
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

-- ---------------------------------------------------------------------------
-- Messages: only participants can read; sending requires Mahram approval.
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

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

-- ---------------------------------------------------------------------------
-- Mahram match requests: readable by the matched users, writable only by
-- server-side service-role routes. The Mahram uses the private token API.
-- ---------------------------------------------------------------------------
alter table public.mahram_match_requests enable row level security;

drop policy if exists "Users can view their mahram match requests" on public.mahram_match_requests;
create policy "Users can view their mahram match requests"
  on public.mahram_match_requests for select
  using (auth.uid() = protected_user_id or auth.uid() = match_user_id);

drop policy if exists "Users can create their mahram match requests" on public.mahram_match_requests;
drop policy if exists "Protected user can update mahram match requests" on public.mahram_match_requests;

-- ---------------------------------------------------------------------------
-- Reports and preferences: users only access their own rows.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profile_reports') is not null then
    execute 'alter table public.profile_reports enable row level security';

    execute 'drop policy if exists "Users can create profile reports" on public.profile_reports';
    execute 'create policy "Users can create profile reports"
      on public.profile_reports for insert
      with check (auth.uid() = reporter_id)';

    execute 'drop policy if exists "Users can view their own profile reports" on public.profile_reports';
    execute 'create policy "Users can view their own profile reports"
      on public.profile_reports for select
      using (auth.uid() = reporter_id)';
  end if;

  if to_regclass('public.user_preferences') is not null then
    execute 'alter table public.user_preferences enable row level security';

    execute 'drop policy if exists "Users can view their own preferences" on public.user_preferences';
    execute 'create policy "Users can view their own preferences"
      on public.user_preferences for select
      using (auth.uid() = user_id)';

    execute 'drop policy if exists "Users can save their own preferences" on public.user_preferences';
    execute 'create policy "Users can save their own preferences"
      on public.user_preferences for insert
      with check (auth.uid() = user_id)';

    execute 'drop policy if exists "Users can update their own preferences" on public.user_preferences';
    execute 'create policy "Users can update their own preferences"
      on public.user_preferences for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Avatar storage: users can manage files only inside their own folder.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "Avatar images are publicly readable" on storage.objects';
    execute 'create policy "Avatar images are publicly readable"
      on storage.objects for select
      using (bucket_id = ''avatars'')';

    execute 'drop policy if exists "Users can upload their own avatars" on storage.objects';
    execute 'create policy "Users can upload their own avatars"
      on storage.objects for insert
      with check (
        bucket_id = ''avatars''
        and auth.uid()::text = (storage.foldername(name))[1]
      )';

    execute 'drop policy if exists "Users can update their own avatars" on storage.objects';
    execute 'create policy "Users can update their own avatars"
      on storage.objects for update
      using (
        bucket_id = ''avatars''
        and auth.uid()::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = ''avatars''
        and auth.uid()::text = (storage.foldername(name))[1]
      )';

    execute 'drop policy if exists "Users can delete their own avatars" on storage.objects';
    execute 'create policy "Users can delete their own avatars"
      on storage.objects for delete
      using (
        bucket_id = ''avatars''
        and auth.uid()::text = (storage.foldername(name))[1]
      )';
  end if;
end $$;
