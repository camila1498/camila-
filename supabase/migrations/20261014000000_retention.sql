-- Archivado de campañas y vencimiento de datos personales.
--
-- Plazos (aviso de privacidad de cada formulario), contados así:
--   * No seleccionadas (incluye sin revisar, descartadas y retiradas): desde el cierre de la campaña.
--   * Lista de espera: desde el cierre de la campaña.
--   * Participantes (aprobadas y confirmadas): desde el fin del programa, que se registra al archivar.
-- Lo vencido se ELIMINA (no seleccionadas) o se ANONIMIZA (participantes: se conservan solo respuestas de
-- opciones, útiles para estadísticas). Las cifras agregadas de la campaña permanecen.
-- Nada se elimina sin una exportación completa previa de esa campaña.

alter table public.campaigns add column program_ended_on date;
alter table public.submissions add column anonymized_at timestamptz;

create table public.retention_rules (
  form_slug text primary key references public.forms (slug) on delete cascade,
  not_selected_months integer not null default 6 check (not_selected_months between 1 and 120),
  waitlist_months integer not null default 12 check (waitlist_months between 1 and 120),
  participant_months integer not null default 24 check (participant_months between 1 and 120),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.retention_rules enable row level security;
create policy "plazos: admins leen" on public.retention_rules
  for select to authenticated using (public.is_admin());
create policy "plazos: admins crean" on public.retention_rules
  for insert to authenticated with check (public.is_admin());
create policy "plazos: admins editan" on public.retention_rules
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Los textos de los avisos de privacidad de voluntariado y aliados difieren de los de programas.
insert into public.retention_rules (form_slug, participant_months)
select slug, case slug when 'voluntariado' then 12 else 24 end
from public.forms
on conflict do nothing;

-- Constancia de lo eliminado o anonimizado (sin datos personales).
create table public.retention_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id) on delete set null,
  campaign_name text not null,
  deleted integer not null default 0,
  anonymized integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.retention_log enable row level security;
create policy "vencimientos: admins leen" on public.retention_log
  for select to authenticated using (public.is_admin());
-- Sin políticas de escritura: solo lo registra purge_expired.

create or replace function public.retention_rules_for(p_slug text)
returns table (not_selected_months integer, waitlist_months integer, participant_months integer)
language sql stable security invoker set search_path = ''
as $$
  select coalesce(r.not_selected_months, 6), coalesce(r.waitlist_months, 12), coalesce(r.participant_months, 24)
  from (select 1) x left join public.retention_rules r on r.form_slug = p_slug;
$$;

-- ------------------------------------------------------------------ Resumen de vencimientos
create or replace function public.retention_overview()
returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(row_json order by closed_at desc), '[]'::jsonb) into result
  from (
    select c.closed_at,
      jsonb_build_object(
        'id', c.id, 'name', c.name, 'formSlug', c.form_slug, 'status', c.status,
        'closedAt', c.closed_at, 'programEndedOn', c.program_ended_on,
        'rules', jsonb_build_object('notSelected', r.not_selected_months, 'waitlist', r.waitlist_months, 'participants', r.participant_months),
        'notSelected', jsonb_build_object('count', g.n_ns, 'dueAt', c.closed_at + make_interval(months => r.not_selected_months)),
        'waitlist', jsonb_build_object('count', g.n_wl, 'dueAt', c.closed_at + make_interval(months => r.waitlist_months)),
        'participants', jsonb_build_object('count', g.n_pa,
          'dueOn', c.program_ended_on + make_interval(months => r.participant_months)),
        'exportedAt', (select max(e.created_at) from public.export_log e where e.campaign_id = c.id and e.mode = 'completo' and e.created_at >= c.closed_at),
        'purged', jsonb_build_object(
          'deleted', coalesce((select sum(l.deleted) from public.retention_log l where l.campaign_id = c.id), 0),
          'anonymized', coalesce((select sum(l.anonymized) from public.retention_log l where l.campaign_id = c.id), 0))
      ) as row_json
    from public.campaigns c
    cross join lateral public.retention_rules_for(c.form_slug) r
    cross join lateral (
      select count(*) filter (where s.status in ('nueva', 'en_revision', 'descartada', 'retirada')) n_ns,
             count(*) filter (where s.status = 'lista_espera') n_wl,
             count(*) filter (where s.status in ('admitida', 'confirmada')) n_pa
      from public.submissions s where s.campaign_id = c.id and s.anonymized_at is null
    ) g
    where c.status in ('closed', 'archived')
  ) t;
  return result;
end $$;

-- ------------------------------------------------------------------ Archivar
create or replace function public.archive_campaign(p_id uuid, p_program_ended_on date)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  c public.campaigns;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  select * into c from public.campaigns where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  if c.status = 'open' then
    raise exception 'not_closed';
  end if;
  if p_program_ended_on is null or p_program_ended_on > (now() at time zone 'America/Lima')::date + 1 then
    raise exception 'invalid_date';
  end if;
  if not exists (select 1 from public.export_log where campaign_id = p_id and mode = 'completo' and created_at >= c.closed_at) then
    raise exception 'export_required';
  end if;
  update public.campaigns set status = 'archived', program_ended_on = p_program_ended_on where id = p_id;
end $$;

-- Una campaña archivada ya no admite cambios de estado.
create or replace function public.set_submission_status(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_old text;
  v_campaign_status text;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_status not in ('nueva', 'en_revision', 'admitida', 'lista_espera', 'descartada', 'confirmada', 'retirada') then
    raise exception 'invalid_status';
  end if;

  select s.status, c.status into v_old, v_campaign_status
  from public.submissions s join public.campaigns c on c.id = s.campaign_id where s.id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_campaign_status = 'archived' then
    raise exception 'archived';
  end if;
  if v_old = p_status then
    return;
  end if;

  update public.submissions set status = p_status where id = p_id;
  insert into public.submission_events (submission_id, kind, from_status, to_status, note, created_by)
  values (p_id, 'status', v_old, p_status, nullif(btrim(coalesce(p_note, '')), ''), (select auth.uid()));
end $$;

-- Tras vaciar datos, recalcular las cifras las falsearía: la instantánea queda como estaba.
create or replace function public.refresh_campaign_stats(p_id uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if exists (select 1 from public.retention_log where campaign_id = p_id) then
    raise exception 'purged';
  end if;
  insert into public.campaign_stats (campaign_id, snapshot, generated_at)
  values (p_id, public.compute_campaign_stats(p_id), now())
  on conflict (campaign_id) do update
    set snapshot = excluded.snapshot, generated_at = excluded.generated_at, updated_at = now();
end $$;

-- ------------------------------------------------------------------ Eliminar / anonimizar lo vencido
-- SECURITY DEFINER: anonimizar toca el historial (append-only) y eso no lo permite ninguna política.
-- Por eso valida a mano que quien llama sea administrador.
create or replace function public.purge_expired(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  c public.campaigns;
  r record;
  keep text[];
  ids uuid[];
  n_deleted integer := 0;
  n_part integer := 0;
  n integer;
  def jsonb;
  today date := (now() at time zone 'America/Lima')::date;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  select * into c from public.campaigns where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if c.status = 'open' then
    raise exception 'not_closed';
  end if;
  if not exists (select 1 from public.export_log where campaign_id = p_id and mode = 'completo' and created_at >= c.closed_at) then
    raise exception 'export_required';
  end if;
  select * into r from public.retention_rules_for(c.form_slug);

  -- Las cifras de la campaña quedan fijadas antes de borrar nada.
  if not exists (select 1 from public.retention_log where campaign_id = p_id) then
    perform public.refresh_campaign_stats(p_id);
  end if;

  -- 1) No seleccionadas y lista de espera: se eliminan (con su historial y datos sensibles, en cascada).
  with d as (
    delete from public.submissions
    where campaign_id = p_id and anonymized_at is null
      and status in ('nueva', 'en_revision', 'descartada', 'retirada')
      and c.closed_at + make_interval(months => r.not_selected_months) <= now()
    returning 1)
  select count(*) into n from d;
  n_deleted := n;
  with d as (
    delete from public.submissions
    where campaign_id = p_id and anonymized_at is null and status = 'lista_espera'
      and c.closed_at + make_interval(months => r.waitlist_months) <= now()
    returning 1)
  select count(*) into n from d;
  n_deleted := n_deleted + n;

  -- 2) Participantes: se anonimizan al vencer su plazo (contado desde el fin del programa).
  if c.program_ended_on is not null and c.program_ended_on + make_interval(months => r.participant_months) <= today then
    select definition into def from public.form_versions where form_slug = c.form_slug and version = c.version;
    -- Solo se conservan respuestas de opciones, números y sí/no que no sean sensibles.
    select coalesce(array_agg(f ->> 'id'), '{}') into keep
    from jsonb_array_elements(def -> 'sections') s, jsonb_array_elements(s -> 'fields') f
    where f ->> 'type' in ('select', 'multiselect', 'boolean', 'number', 'checkbox')
      and not coalesce((f ->> 'sensitive')::boolean, false);

    select coalesce(array_agg(id), '{}') into ids from public.submissions
      where campaign_id = p_id and anonymized_at is null and status in ('admitida', 'confirmada');
    n_part := coalesce(array_length(ids, 1), 0);

    delete from public.submission_sensitive where submission_id in (select unnest(ids));
    delete from public.submission_events
      where submission_id in (select unnest(ids)) and kind in ('whatsapp', 'email', 'note');
    update public.submission_events set note = null
      where submission_id in (select unnest(ids)) and note is not null;
    update public.submissions s
    set full_name = 'Anónimo',
        email = 'anonimo-' || s.id || '@anonimo.invalid',
        notes = null,
        consent_marketing = false,
        score_review = '{}'::jsonb,
        answers = coalesce((select jsonb_object_agg(e.key, e.value) from jsonb_each(s.answers) e where e.key = any (keep)), '{}'::jsonb),
        anonymized_at = now()
    where s.id in (select unnest(ids));
  end if;

  if n_deleted + n_part > 0 then
    insert into public.retention_log (campaign_id, campaign_name, deleted, anonymized, created_by)
    values (p_id, c.name, n_deleted, n_part, (select auth.uid()));
  end if;
  return jsonb_build_object('deleted', n_deleted, 'anonymized', n_part);
end $$;

revoke all on function public.retention_rules_for(text) from public, anon;
revoke all on function public.retention_overview() from public, anon;
revoke all on function public.archive_campaign(uuid, date) from public, anon;
revoke all on function public.set_submission_status(uuid, text, text) from public, anon;
revoke all on function public.refresh_campaign_stats(uuid) from public, anon;
revoke all on function public.purge_expired(uuid) from public, anon;
grant execute on function public.retention_rules_for(text) to authenticated;
grant execute on function public.retention_overview() to authenticated;
grant execute on function public.archive_campaign(uuid, date) to authenticated;
grant execute on function public.set_submission_status(uuid, text, text) to authenticated;
grant execute on function public.refresh_campaign_stats(uuid) to authenticated;
grant execute on function public.purge_expired(uuid) to authenticated;
