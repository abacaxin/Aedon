-- AEDON — B1: multiple projects per user.
-- Run this in the Supabase SQL editor (or `supabase db push`) once per project.

-- Projects were capped at one per owner_id (see 0001_init.sql). The dashboard needs
-- to list many, so drop that constraint; `id` (already the primary key) keeps rows
-- unique, and the existing RLS policies already scope every operation by owner_id.
drop index if exists public.projects_owner_unique;

-- Speeds up "list my projects, newest first".
create index if not exists projects_owner_updated_idx
  on public.projects (owner_id, updated_at desc);
