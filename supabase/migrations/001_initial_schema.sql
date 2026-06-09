-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SUPER PROFILES ────────────────────────────────────────────
create table public.super_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  age integer default 40,
  salary numeric(12,2) default 80000,
  current_balance numeric(12,2) default 0,
  fund_name text default 'Unknown',
  fund_option text default 'Balanced',
  fund_fee_pct numeric(5,3) default 0.78,
  employer_sg_rate numeric(5,2) default 12.0,
  target_retirement_age integer default 65,
  account_count integer default 1,
  has_spouse boolean default false,
  spouse_balance numeric(12,2),
  spouse_income numeric(12,2),
  spouse_fund_name text,
  has_smsf boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── SUBSCRIPTIONS ─────────────────────────────────────────────
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free',
  add_ons text[] default '{}',
  status text default 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create free sub + empty super profile on signup
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, plan) values (new.id, 'free');
  insert into public.super_profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- ─── SAVED CALCULATIONS ────────────────────────────────────────
create table public.saved_calculations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  module text not null,
  inputs jsonb not null default '{}',
  results jsonb not null default '{}',
  notes text,
  created_at timestamptz default now()
);

-- ─── SMSF HOLDINGS ─────────────────────────────────────────────
create table public.smsf_holdings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ticker text not null,
  value numeric(12,2) not null default 0,
  asset_class text default 'global_equity',
  notes text,
  updated_at timestamptz default now()
);

-- ─── WAITLIST ──────────────────────────────────────────────────
create table public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  source text default 'homepage',
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.super_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saved_calculations enable row level security;
alter table public.smsf_holdings enable row level security;
alter table public.waitlist enable row level security;

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users manage own super profile" on public.super_profiles for all using (auth.uid() = user_id);
create policy "Users view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users manage own calculations" on public.saved_calculations for all using (auth.uid() = user_id);
create policy "Users manage own SMSF" on public.smsf_holdings for all using (auth.uid() = user_id);
create policy "Anyone can join waitlist" on public.waitlist for insert with check (true);
