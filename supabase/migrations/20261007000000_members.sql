-- Miembros de la plataforma con rol. Reemplaza a `admins`.
-- Solo entra quien este pre-registrado por correo; al iniciar sesion con Google se
-- vincula su usuario (claim_membership). Los permisos de datos siguen en RLS.

create table public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  full_name text,
  role text not null default 'student' check (role in ('admin', 'team', 'student')),
  user_id uuid unique references auth.users (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger members_set_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- Conserva a los admins que ya existian.
insert into public.members (email, role, user_id)
select lower(u.email), 'admin', a.user_id
from public.admins a
join auth.users u on u.id = a.user_id
where u.email is not null
on conflict (email) do nothing;

-- is_admin() conserva su nombre: las politicas de `becas` y set_beca_rank no cambian.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where user_id = (select auth.uid()) and role = 'admin' and active
  );
$$;

create or replace function public.member_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.members
  where user_id = (select auth.uid()) and active
  limit 1;
$$;

-- Vincula al usuario que acaba de entrar con Google a su registro de miembro.
-- Exige una identidad de Google con el mismo correo (no basta un registro por correo/clave).
create or replace function public.claim_membership()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if (select auth.uid()) is null then
    return null;
  end if;

  update public.members m
  set user_id = (select auth.uid())
  where m.user_id is null
    and m.active
    and exists (
      select 1 from auth.identities i
      where i.user_id = (select auth.uid())
        and i.provider = 'google'
        and lower(i.identity_data ->> 'email') = m.email
    )
  returning m.role into v_role;

  if v_role is null then
    select role into v_role from public.members
    where user_id = (select auth.uid()) and active;
  end if;

  return v_role;
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.member_role() from public, anon;
revoke all on function public.claim_membership() from public, anon;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.member_role() to authenticated;
grant execute on function public.claim_membership() to authenticated;

alter table public.members enable row level security;

create policy "members: ver el propio registro o todos si admin"
  on public.members for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "members: admins agregan"
  on public.members for insert
  to authenticated
  with check (public.is_admin());

create policy "members: admins editan"
  on public.members for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "members: admins eliminan"
  on public.members for delete
  to authenticated
  using (public.is_admin());

drop table public.admins;
