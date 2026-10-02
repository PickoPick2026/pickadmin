-- ============================================================
-- Pick O Pick CRM upgrade — run this in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- Safe to re-run: every statement is idempotent.
-- ============================================================

-- 1) Per-user feature permissions (the checkboxes on the Admin Users form)
alter table public."adminLoginTable"
  add column if not exists permissions jsonb not null default '[]'::jsonb;

-- Give existing ADMIN accounts the standard feature set
-- (super admins already see everything; adjust the list as needed).
update public."adminLoginTable"
set permissions = '["dashboard","category","product","customer","kanban","services","quotes","nri","estimates"]'::jsonb
where role = 'ADMIN' and permissions = '[]'::jsonb;

-- 2) CRM ownership + remarks on every request/lead table.
--    assigned_to  = adminLoginTable.adminLoginID of the owner (nullable)
--    remarks      = JSON array: [{"id":"…","text":"…","author":"…","createdAt":"…"}]

alter table public."orders"
  add column if not exists assigned_to int8,
  add column if not exists remarks jsonb not null default '[]'::jsonb;

alter table public."nri_requests"
  add column if not exists assigned_to int8,
  add column if not exists remarks jsonb not null default '[]'::jsonb;

alter table public."estimate_leads"
  add column if not exists assigned_to int8,
  add column if not exists remarks jsonb not null default '[]'::jsonb;

alter table public."service_requests"
  add column if not exists assigned_to int8,
  add column if not exists remarks jsonb not null default '[]'::jsonb;

-- 3) Indexes for the common lookups
create index if not exists orders_assigned_to_idx      on public."orders" (assigned_to);
create index if not exists nri_assigned_to_idx         on public."nri_requests" (assigned_to);
create index if not exists estimates_assigned_to_idx   on public."estimate_leads" (assigned_to);
create index if not exists service_assigned_to_idx     on public."service_requests" (assigned_to);

create index if not exists orders_status_idx           on public."orders" (status);
create index if not exists nri_status_idx              on public."nri_requests" (status);
create index if not exists estimates_status_idx        on public."estimate_leads" (status);
create index if not exists service_status_idx          on public."service_requests" (status);

-- 4) Optional: if customerList has no country column yet and you want the
--    Customer List to show it, uncomment:
-- alter table public."customerList" add column if not exists country text;
