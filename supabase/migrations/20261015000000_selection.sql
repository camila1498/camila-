-- Selección por puntaje (Bootcamp): calificaciones manuales, segunda revisión, etiquetas y aplicación en lote.
--
-- Las reglas (qué puntos da cada respuesta, descartes, cortes) viven en la aplicación
-- (src/lib/selection/bootcamp.ts); la base guarda lo que decide una persona y valida quién y cuándo:
--   score_review = { "first": {b8, b9, offTopic, by, at}, "second": {…} }
-- La segunda revisión debe hacerla otra persona distinta de la primera.

alter table public.submission_events drop constraint submission_events_kind_check;
alter table public.submission_events
  add constraint submission_events_kind_check check (kind in ('status', 'note', 'whatsapp', 'email', 'grade'));

create or replace function public.grade_submission(
  p_id uuid, p_slot text, p_b8 integer, p_b9 integer, p_off_topic boolean
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_review jsonb;
  v_campaign_status text;
  v_me text := (select auth.uid())::text;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_slot not in ('first', 'second') then
    raise exception 'invalid_slot';
  end if;
  if p_b8 is null or p_b8 not between 0 and 3 or p_b9 is null or p_b9 not between 0 and 2 then
    raise exception 'invalid_grade';
  end if;

  select s.score_review, c.status into v_review, v_campaign_status
  from public.submissions s join public.campaigns c on c.id = s.campaign_id where s.id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_campaign_status = 'archived' then
    raise exception 'archived';
  end if;

  if p_slot = 'second' then
    if v_review -> 'first' is null then
      raise exception 'first_missing';
    end if;
    if v_review -> 'first' ->> 'by' = v_me then
      raise exception 'same_reviewer';
    end if;
  elsif v_review -> 'second' ->> 'by' = v_me then
    -- Quien hizo la segunda revisión no puede pasar a ser la primera de la misma postulación.
    raise exception 'same_reviewer';
  end if;

  update public.submissions
  set score_review = jsonb_set(
    coalesce(score_review, '{}'::jsonb), array[p_slot],
    jsonb_build_object('b8', p_b8, 'b9', p_b9, 'offTopic', coalesce(p_off_topic, false), 'by', v_me, 'at', now()))
  where id = p_id;

  insert into public.submission_events (submission_id, kind, detail, created_by)
  values (p_id, 'grade',
    jsonb_build_object('slot', p_slot, 'b8', p_b8, 'b9', p_b9, 'offTopic', coalesce(p_off_topic, false)), (select auth.uid()));
end $$;

-- Etiquetas manuales permitidas (las automáticas, como "Requiere equipo", se calculan al mostrar).
create or replace function public.set_submission_tag(p_id uuid, p_tag text, p_on boolean)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_tag not in ('equipo-conseguido') then
    raise exception 'invalid_tag';
  end if;
  update public.submissions
  set tags = case when p_on then (select array(select distinct unnest(tags || array[p_tag]))) else array_remove(tags, p_tag) end
  where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  insert into public.submission_events (submission_id, kind, note, created_by)
  values (p_id, 'note', case when p_on then 'Equipo conseguido' else 'Equipo conseguido: quitado' end, (select auth.uid()));
end $$;

-- Aplica la selección calculada: solo toca postulaciones que siguen sin resolver (nueva / pendiente),
-- así nunca pisa una decisión que ya tomó una persona.
create or replace function public.apply_selection(p_campaign uuid, p_admit uuid[], p_wait uuid[], p_discard uuid[])
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_status text;
  r record;
  v_counts jsonb := jsonb_build_object('admitida', 0, 'lista_espera', 0, 'descartada', 0, 'skipped', 0);
  v_key text;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  select status into v_status from public.campaigns where id = p_campaign;
  if not found then
    raise exception 'not_found';
  end if;
  if v_status <> 'closed' then
    raise exception 'not_closed';
  end if;

  for r in
    select u.id, u.target from (
      select unnest(coalesce(p_admit, '{}')) id, 'admitida' target
      union all select unnest(coalesce(p_wait, '{}')), 'lista_espera'
      union all select unnest(coalesce(p_discard, '{}')), 'descartada') u
  loop
    if exists (select 1 from public.submissions where id = r.id and campaign_id = p_campaign and status in ('nueva', 'en_revision')) then
      perform public.set_submission_status(r.id, r.target, 'Selección por puntaje');
      v_key := r.target;
    else
      v_key := 'skipped';
    end if;
    v_counts := jsonb_set(v_counts, array[v_key], to_jsonb((v_counts ->> v_key)::integer + 1));
  end loop;
  return v_counts;
end $$;

revoke all on function public.grade_submission(uuid, text, integer, integer, boolean) from public, anon;
revoke all on function public.set_submission_tag(uuid, text, boolean) from public, anon;
revoke all on function public.apply_selection(uuid, uuid[], uuid[], uuid[]) from public, anon;
grant execute on function public.grade_submission(uuid, text, integer, integer, boolean) to authenticated;
grant execute on function public.set_submission_tag(uuid, text, boolean) to authenticated;
grant execute on function public.apply_selection(uuid, uuid[], uuid[], uuid[]) to authenticated;
