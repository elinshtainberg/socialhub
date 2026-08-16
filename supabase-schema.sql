-- Enable UUID extension
create extension if not exists "pgcrypto";

-- CLIENTS
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  business_name text,
  client_type text not null default 'ongoing',
  monthly_retainer numeric,
  project_date text,
  content_summary text,
  color text not null default '#9B7BA8',
  created_at timestamptz not null default now(),
  billing_name text,
  company_id text,
  drive_url text,
  instagram_url text,
  tiktok_url text,
  facebook_url text
);

-- STUDIES
create table if not exists studies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  color text not null default '#60A5FA',
  created_at timestamptz not null default now()
);

-- TASKS
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  category text not null default 'personal',
  client_id uuid references clients(id) on delete set null,
  study_id uuid references studies(id) on delete set null,
  project_id uuid,
  due_date text,
  priority text not null default 'medium',
  status text not null default 'open',
  is_daily boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  duration_minutes integer,
  notes text,
  workout_type text
);

-- CONTENT ITEMS
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  type text not null,
  platform text not null default 'general',
  status text not null default 'idea',
  created_at timestamptz not null default now()
);

-- CALENDAR ITEMS
create table if not exists calendar_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date text not null,
  type text not null,
  title text not null,
  notes text,
  client_id uuid references clients(id) on delete set null,
  project_id uuid
);

-- PROJECTS
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  color text not null default '#9B7BA8',
  main_goal text not null default '',
  description text,
  deadline text,
  budget numeric,
  created_at timestamptz not null default now()
);

-- NOTES
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  client_id uuid not null references clients(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);

-- STUDY DEADLINES
create table if not exists study_deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  study_id uuid not null references studies(id) on delete cascade,
  title text not null,
  due_date text,
  planned_hours numeric,
  item_type text not null default 'deadline',
  notes text
);

-- INVOICES
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  client_id uuid not null references clients(id) on delete cascade,
  month text not null,
  description text not null default '',
  amount numeric,
  tax_id text,
  status text not null default 'not_issued',
  notes text
);

-- RLS: disable for now (single-user app, add later when auth is set up)
alter table clients disable row level security;
alter table studies disable row level security;
alter table tasks disable row level security;
alter table content_items disable row level security;
alter table calendar_items disable row level security;
alter table projects disable row level security;
alter table notes disable row level security;
alter table study_deadlines disable row level security;
alter table invoices disable row level security;
