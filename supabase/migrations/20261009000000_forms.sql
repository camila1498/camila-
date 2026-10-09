-- Formularios propios: estado por formulario, postulaciones y datos sensibles.
-- Los anonimos NO leen ni escriben tablas: envian por submit_form(), que valida que el
-- formulario este abierto y rechaza duplicados. Solo los admins ven las respuestas.

create table public.forms (
  slug text primary key,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  opens_at timestamptz,
  closes_at timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger forms_set_updated_at
  before update on public.forms
  for each row execute function public.set_updated_at();

-- Todos nacen cerrados: se abren cuando Legal apruebe el checklist.
insert into public.forms (slug, title) values
  ('voluntariado', 'Voluntariado'),
  ('aliados', 'Aliados'),
  ('emplealab', 'Mentee de EmpleaLab'),
  ('createwomen', 'Mentee de CreateWomen'),
  ('bootcamp', 'Postulación al Bootcamp 2026');

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_slug text not null references public.forms (slug),
  -- Version de las preguntas con que se respondio (para exportar con las etiquetas correctas).
  form_version integer not null default 1,
  email text not null check (email = lower(email)),
  full_name text not null,
  answers jsonb not null,
  is_minor boolean not null default false,
  consent_privacy_at timestamptz not null,
  consent_marketing boolean not null default false,
  status text not null default 'nueva'
    check (status in ('nueva', 'en_revision', 'admitida', 'lista_espera', 'descartada', 'confirmada', 'retirada')),
  tags text[] not null default '{}',
  score_auto integer,
  score_review jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (form_slug, email)
);

create index submissions_form_created_idx on public.submissions (form_slug, created_at desc);
create index submissions_form_status_idx on public.submissions (form_slug, status);

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

-- Respuestas que pueden traer datos de salud (p. ej. B13). Acceso mas estricto.
create table public.submission_sensitive (
  submission_id uuid primary key references public.submissions (id) on delete cascade,
  data jsonb not null
);

alter table public.forms enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_sensitive enable row level security;

-- El estado de cada formulario es publico (la web decide si muestra el formulario).
create policy "forms: lectura publica"
  on public.forms for select
  to anon, authenticated
  using (true);

create policy "forms: admins insertan"
  on public.forms for insert to authenticated
  with check (public.is_admin());
create policy "forms: admins editan"
  on public.forms for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "forms: admins eliminan"
  on public.forms for delete to authenticated
  using (public.is_admin());

create policy "submissions: admins leen"
  on public.submissions for select to authenticated
  using (public.is_admin());
create policy "submissions: admins editan"
  on public.submissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "submissions: admins eliminan"
  on public.submissions for delete to authenticated
  using (public.is_admin());

create policy "sensibles: admins leen"
  on public.submission_sensitive for select to authenticated
  using (public.is_admin());

create or replace function public.submit_form(
  p_slug text,
  p_answers jsonb,
  p_sensitive jsonb default '{}'::jsonb,
  p_is_minor boolean default false,
  p_marketing boolean default false,
  p_version integer default 1
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_form public.forms;
  v_email text;
  v_name text;
  v_id uuid;
begin
  select * into v_form from public.forms where slug = p_slug;
  if not found
     or v_form.status <> 'open'
     or (v_form.opens_at is not null and now() < v_form.opens_at)
     or (v_form.closes_at is not null and now() > v_form.closes_at) then
    raise exception 'form_closed';
  end if;

  if jsonb_typeof(p_answers) is distinct from 'object'
     or jsonb_typeof(p_sensitive) is distinct from 'object'
     or octet_length(p_answers::text) > 60000
     or octet_length(p_sensitive::text) > 20000 then
    raise exception 'invalid_payload';
  end if;

  v_email := lower(btrim(coalesce(p_answers ->> 'C2', '')));
  v_name := btrim(coalesce(p_answers ->> 'C1', ''));
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 200
     or v_name = '' or length(v_name) > 200 then
    raise exception 'invalid_payload';
  end if;

  if (p_answers ->> 'C7') is distinct from 'true' then
    raise exception 'consent_required';
  end if;

  begin
    insert into public.submissions
      (form_slug, form_version, email, full_name, answers, is_minor, consent_privacy_at, consent_marketing)
    values
      (p_slug, greatest(coalesce(p_version, 1), 1), v_email, v_name, p_answers,
       coalesce(p_is_minor, false), now(), coalesce(p_marketing, false))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'duplicate';
  end;

  if p_sensitive <> '{}'::jsonb then
    insert into public.submission_sensitive (submission_id, data) values (v_id, p_sensitive);
  end if;
end;
$$;

revoke all on function public.submit_form(text, jsonb, jsonb, boolean, boolean, integer) from public;
grant execute on function public.submit_form(text, jsonb, jsonb, boolean, boolean, integer) to anon, authenticated;
