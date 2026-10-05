-- Becas administrables desde el panel de administracion.

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Cada usuario solo puede ver si el mismo es admin; el alta de admins se hace
-- desde el SQL Editor / service role, nunca desde la app.
create policy "admins: ver propio registro"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.becas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  tag_variant text not null default 'default'
    check (tag_variant in ('default', 'stem', 'liderazgo', 'europa')),
  estado text not null,
  title text not null,
  institution text not null,
  description text not null,
  deadline text not null,
  tags text[] not null default '{}',
  -- Posicion en "Rankeadas" (1 = mejor). Null = solo aparece en Database.
  rank integer unique check (rank is null or rank > 0),
  published boolean not null default true,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index becas_rank_idx on public.becas (rank) where rank is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger becas_set_updated_at
  before update on public.becas
  for each row execute function public.set_updated_at();

alter table public.becas enable row level security;

create policy "becas: lectura publica de publicadas"
  on public.becas for select
  to anon, authenticated
  using (published or public.is_admin());

create policy "becas: admins insertan"
  on public.becas for insert
  to authenticated
  with check (public.is_admin());

create policy "becas: admins editan"
  on public.becas for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "becas: admins eliminan"
  on public.becas for delete
  to authenticated
  using (public.is_admin());
