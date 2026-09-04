-- Saved calculation history.
--
-- History was previously localStorage-only (zustand persist), so a signed-in
-- user lost everything on a cleared cache and saw nothing on a second device —
-- while "saved calculation history" was being sold as an account feature.
--
-- The client supplies `id` (the same crypto.randomUUID() it stores locally) so
-- local and remote rows share a primary key and syncing is an idempotent upsert.

create table if not exists public.calculations (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('lv', 'vdrop', 'sc', 'motor', 'abc', 'busbar')),
  summary     text not null default '',
  inputs      jsonb not null default '{}'::jsonb,
  result      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- The only query the app makes: this user's rows, newest first.
create index if not exists calculations_user_created_idx
  on public.calculations (user_id, created_at desc);

alter table public.calculations enable row level security;

drop policy if exists "own calculations: select" on public.calculations;
create policy "own calculations: select" on public.calculations
  for select using (auth.uid() = user_id);

drop policy if exists "own calculations: insert" on public.calculations;
create policy "own calculations: insert" on public.calculations
  for insert with check (auth.uid() = user_id);

drop policy if exists "own calculations: update" on public.calculations;
create policy "own calculations: update" on public.calculations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own calculations: delete" on public.calculations;
create policy "own calculations: delete" on public.calculations
  for delete using (auth.uid() = user_id);
