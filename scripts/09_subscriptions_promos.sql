-- Subscriptions and promo codes for Mawada paid access.
-- Run this in the Supabase SQL editor.

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  code_normalized text generated always as (lower(trim(code))) stored,
  discount_type text not null check (discount_type in ('percent', 'amount', 'free')),
  discount_value numeric(10, 2) not null default 0,
  duration text not null default 'once' check (duration in ('once', 'forever', 'repeating')),
  duration_in_months integer,
  active boolean not null default true,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  expires_at timestamptz,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code_normalized)
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'inactive' check (
    status in ('inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired')
  ),
  source text not null default 'stripe' check (source in ('stripe', 'coupon', 'admin')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  stripe_current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (promo_code_id, user_id)
);

create index if not exists promo_codes_active_idx
  on public.promo_codes (active, code_normalized);

create index if not exists user_subscriptions_user_id_idx
  on public.user_subscriptions (user_id);

create index if not exists user_subscriptions_stripe_customer_id_idx
  on public.user_subscriptions (stripe_customer_id);

create index if not exists user_subscriptions_stripe_subscription_id_idx
  on public.user_subscriptions (stripe_subscription_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists promo_codes_touch_updated_at on public.promo_codes;
create trigger promo_codes_touch_updated_at
before update on public.promo_codes
for each row execute function public.touch_updated_at();

drop trigger if exists user_subscriptions_touch_updated_at on public.user_subscriptions;
create trigger user_subscriptions_touch_updated_at
before update on public.user_subscriptions
for each row execute function public.touch_updated_at();

alter table public.promo_codes enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.promo_code_redemptions enable row level security;

drop policy if exists "users read own subscription" on public.user_subscriptions;
create policy "users read own subscription"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users read own promo redemptions" on public.promo_code_redemptions;
create policy "users read own promo redemptions"
on public.promo_code_redemptions
for select
to authenticated
using (auth.uid() = user_id);

-- Promo code creation, redemption and subscription writes are intentionally
-- done through server routes using SUPABASE_SERVICE_ROLE_KEY.
