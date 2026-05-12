-- RLS audit helper for Mawada.
-- Run after scripts/06_security_rls_hardening.sql.
-- These IDs are the local test accounts used during development.
-- Replace them if you want to test with other accounts.

begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '53d98ad3-da74-4898-bb3c-4da0fed2e6f1', true);

select 'own_profile_visible' as check_name, count(*) = 1 as passed
from public.profiles
where id = '53d98ad3-da74-4898-bb3c-4da0fed2e6f1';

select 'other_private_profiles_hidden' as check_name, count(*) = 0 as passed
from public.profiles
where id <> '53d98ad3-da74-4898-bb3c-4da0fed2e6f1';

select 'only_own_likes_visible' as check_name, count(*) = 0 as passed
from public.likes
where from_user_id <> '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
  and to_user_id <> '53d98ad3-da74-4898-bb3c-4da0fed2e6f1';

select 'only_own_conversations_visible' as check_name, count(*) = 0 as passed
from public.conversations
where user_1_id <> '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
  and user_2_id <> '53d98ad3-da74-4898-bb3c-4da0fed2e6f1';

select 'only_own_messages_visible' as check_name, count(*) = 0 as passed
from public.messages m
where not exists (
  select 1
  from public.conversations c
  where c.id = m.conversation_id
    and (
      c.user_1_id = '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
      or c.user_2_id = '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
    )
);

with attempted as (
  update public.conversations
  set mahram_status = 'approved'
  where user_1_id = '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
     or user_2_id = '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
  returning id
)
select 'client_cannot_update_mahram_status' as check_name, count(*) = 0 as passed
from attempted;

with attempted as (
  update public.mahram_match_requests
  set status = 'approved'
  where protected_user_id = '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
     or match_user_id = '53d98ad3-da74-4898-bb3c-4da0fed2e6f1'
  returning id
)
select 'client_cannot_update_mahram_requests' as check_name, count(*) = 0 as passed
from attempted;

select 'own_preferences_only' as check_name, count(*) = 0 as passed
from public.user_preferences
where user_id <> '53d98ad3-da74-4898-bb3c-4da0fed2e6f1';

select 'own_reports_only' as check_name, count(*) = 0 as passed
from public.profile_reports
where reporter_id <> '53d98ad3-da74-4898-bb3c-4da0fed2e6f1';

rollback;
