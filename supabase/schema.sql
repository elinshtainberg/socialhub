-- ============================================
-- SocialHub - Schema
-- Run this in the Supabase SQL editor
-- ============================================

create extension if not exists "uuid-ossp";

-- ---------- CLIENTS ----------
create table if not exists clients (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  business_name   text,
  client_type     text not null default 'ongoing', -- 'ongoing' | 'one_time'
  monthly_retainer numeric,
  project_date    text,
  content_summary text,
  color           text not null default 'purple',
  created_at      timestamptz not null default now(),
  -- Billing
  billing_name    text,
  company_id      text,
  -- Social links
  drive_url       text,
  instagram_url   text,
  tiktok_url      text,
  facebook_url    text,
  -- CRM
  next_action     text
);

-- ---------- CLIENT COLLABS ----------
create table if not exists client_collabs (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  handle      text not null default '',
  platforms   text[] not null default '{instagram}',
  type        text not null default 'קולאבי',
  status      text not null default 'יזום',
  last_post   date,
  amount      text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- TASKS ----------
create table if not exists tasks (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  category         text not null default 'personal', -- 'client' | 'personal' | 'study' | 'workout'
  client_id        uuid references clients(id) on delete set null,
  study_id         uuid,
  project_id       uuid,
  due_date         text,
  priority         text not null default 'medium', -- 'low' | 'medium' | 'urgent'
  status           text not null default 'open',   -- 'open' | 'in_progress' | 'done'
  is_daily         boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  duration_minutes numeric,
  notes            text,
  workout_type     text
);

-- ---------- CONTENT ITEMS ----------
create table if not exists content_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  title       text not null,
  type        text not null default 'post',      -- 'post' | 'reel' | 'story'
  platform    text not null default 'general',   -- 'instagram' | 'tiktok' | 'facebook' | 'general'
  status      text not null default 'idea',      -- 'idea' | 'in_progress' | 'done' | 'future'
  created_at  timestamptz not null default now()
);

-- ---------- CALENDAR ITEMS ----------
create table if not exists calendar_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        text not null,   -- "YYYY-MM-DD"
  type        text not null,   -- 'post' | 'reel' | 'story' | 'tiktok' | 'other' | 'holiday' | 'event' | 'meeting' | 'shoot'
  title       text not null,
  notes       text,
  client_id   uuid references clients(id) on delete set null,
  project_id  uuid,
  start_time  text             -- "HH:MM"
);

-- ---------- NOTES ----------
create table if not exists notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  content     text not null default '',
  updated_at  timestamptz not null default now()
);

-- ---------- INVOICES ----------
create table if not exists invoices (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  month       text not null,   -- "YYYY-MM"
  description text not null default '',
  amount      numeric,
  tax_id      text,
  status      text not null default 'not_issued', -- 'not_issued' | 'sent' | 'paid'
  notes       text
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table clients         enable row level security;
alter table client_collabs  enable row level security;
alter table tasks           enable row level security;
alter table content_items   enable row level security;
alter table calendar_items  enable row level security;
alter table notes           enable row level security;
alter table invoices        enable row level security;

-- Each user sees only their own rows
create policy "own clients"        on clients        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks"          on tasks          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own content_items"  on content_items  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own calendar_items" on calendar_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes"          on notes          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own invoices"       on invoices       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Collabs: accessible if the parent client belongs to the user
create policy "own client_collabs" on client_collabs for all
  using  (exists (select 1 from clients where clients.id = client_collabs.client_id and clients.user_id = auth.uid()))
  with check (exists (select 1 from clients where clients.id = client_collabs.client_id and clients.user_id = auth.uid()));

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_tasks_user_due      on tasks(user_id, due_date);
create index if not exists idx_tasks_client        on tasks(client_id);
create index if not exists idx_content_client      on content_items(client_id);
create index if not exists idx_calendar_user_date  on calendar_items(user_id, date);
create index if not exists idx_calendar_client     on calendar_items(client_id);
create index if not exists idx_invoices_month      on invoices(user_id, month);
create index if not exists idx_collabs_client      on client_collabs(client_id);
