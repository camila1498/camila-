-- Cierre de campaña y cifras para la web.
--
-- Al cerrar una campaña se calcula una instantánea agregada (solo conteos, sin datos personales).
-- El administrador elige qué cifras mostrar en la web; lo publicado pasa antes por reglas de
-- privacidad: sin texto libre, celdas con menos de 5 personas agrupadas o descartadas, y sin
-- desgloses si hay menos de 20 postulaciones (hay menores).

create table public.campaign_stats (
  campaign_id uuid primary key references public.campaigns (id) on delete cascade,
  snapshot jsonb not null,
  generated_at timestamptz not null default now(),
  public_data jsonb,
  public_selection jsonb,
  published boolean not null default false,
  published_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.campaign_stats enable row level security;
create policy "cifras: admins leen" on public.campaign_stats
  for select to authenticated using (public.is_admin());
create policy "cifras: admins crean" on public.campaign_stats
  for insert to authenticated with check (public.is_admin());
create policy "cifras: admins editan" on public.campaign_stats
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Quién descargó qué (las descargas pueden traer datos personales).
create table public.export_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  mode text not null check (mode in ('completo', 'anonimo')),
  row_count integer not null check (row_count >= 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index export_log_campaign_idx on public.export_log (campaign_id, created_at desc);

alter table public.export_log enable row level security;
create policy "descargas: admins leen" on public.export_log
  for select to authenticated using (public.is_admin());
create policy "descargas: admins registran" on public.export_log
  for insert to authenticated with check (public.is_admin() and created_by = (select auth.uid()));

-- ------------------------------------------------------------------ Cálculo de la instantánea
create or replace function public.compute_campaign_stats(p_id uuid)
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  c public.campaigns;
  def jsonb;
  sec jsonb;
  f jsonb;
  t text;
  fid text;
  items jsonb;
  answered integer;
  summary jsonb;
  fields jsonb := '[]'::jsonb;
  totals jsonb;
  by_status jsonb;
  by_day jsonb;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  select * into c from public.campaigns where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  select definition into def from public.form_versions where form_slug = c.form_slug and version = c.version;

  select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) into by_status
  from (select status, count(*) n from public.submissions
        where campaign_id = p_id and archived_at is null group by status) g;

  select coalesce(jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d), '[]'::jsonb) into by_day
  from (select (created_at at time zone 'America/Lima')::date d, count(*) n from public.submissions
        where campaign_id = p_id and archived_at is null group by 1) g;

  select jsonb_build_object(
           'received', count(*),
           'minors', count(*) filter (where is_minor),
           'marketing', count(*) filter (where consent_marketing))
  into totals
  from public.submissions where campaign_id = p_id and archived_at is null;

  -- Una entrada por pregunta agregable (opción, sí/no, número) de la versión de esta campaña.
  -- Nunca las sensibles ni las ocultas, y nunca texto libre.
  if def is not null then
    for sec in select s.value from jsonb_array_elements(def -> 'sections') s loop
      for f in select e.value from jsonb_array_elements(sec -> 'fields') e loop
        t := f ->> 'type';
        fid := f ->> 'id';
        continue when coalesce((f ->> 'sensitive')::boolean, false) or coalesce((f ->> 'hidden')::boolean, false);

        if t in ('select', 'boolean') then
          select coalesce(jsonb_agg(jsonb_build_object('value', v, 'label', lbl, 'count', n) order by n desc, v), '[]'::jsonb),
                 coalesce(sum(n), 0)::integer
          into items, answered
          from (
            select g.v, g.n,
                   case when t = 'boolean' then case g.v when 'true' then 'Sí' else 'No' end
                        else coalesce((select o ->> 'label' from jsonb_array_elements(f -> 'options') o where o ->> 'value' = g.v), g.v)
                   end lbl
            from (select answers ->> fid v, count(*) n from public.submissions
                  where campaign_id = p_id and archived_at is null and answers ? fid group by 1) g
          ) x;
          fields := fields || jsonb_build_array(jsonb_build_object(
            'id', fid, 'label', f ->> 'label', 'type', t, 'answered', answered, 'items', items));

        elsif t = 'multiselect' then
          select coalesce(jsonb_agg(jsonb_build_object('value', v, 'label', lbl, 'count', n) order by n desc, v), '[]'::jsonb)
          into items
          from (
            select g.v, g.n,
                   coalesce((select o ->> 'label' from jsonb_array_elements(f -> 'options') o where o ->> 'value' = g.v), g.v) lbl
            from (select el v, count(*) n
                  from public.submissions s,
                       jsonb_array_elements_text(case when jsonb_typeof(s.answers -> fid) = 'array' then s.answers -> fid else '[]'::jsonb end) el
                  where s.campaign_id = p_id and s.archived_at is null group by 1) g
          ) x;
          select count(*)::integer into answered from public.submissions
          where campaign_id = p_id and archived_at is null and jsonb_typeof(answers -> fid) = 'array';
          fields := fields || jsonb_build_array(jsonb_build_object(
            'id', fid, 'label', f ->> 'label', 'type', t, 'answered', answered, 'items', items));

        elsif t = 'number' then
          select jsonb_build_object('min', min(x), 'max', max(x), 'avg', round(avg(x), 1), 'n', count(*))
          into summary
          from (select (answers ->> fid)::numeric x from public.submissions
                where campaign_id = p_id and archived_at is null and (answers ->> fid) ~ '^-?[0-9]+$') g;
          fields := fields || jsonb_build_array(jsonb_build_object(
            'id', fid, 'label', f ->> 'label', 'type', t, 'summary', summary));
        end if;
      end loop;
    end loop;
  end if;

  return totals || jsonb_build_object(
    'schema', 1, 'generatedAt', now(), 'capacity', c.capacity,
    'byStatus', by_status, 'byDay', by_day, 'fields', fields);
end $$;

create or replace function public.refresh_campaign_stats(p_id uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  insert into public.campaign_stats (campaign_id, snapshot, generated_at)
  values (p_id, public.compute_campaign_stats(p_id), now())
  on conflict (campaign_id) do update
    set snapshot = excluded.snapshot, generated_at = excluded.generated_at, updated_at = now();
end $$;

-- Cerrar la campaña ahora también deja lista la instantánea de cifras.
create or replace function public.close_campaign(p_id uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  update public.campaigns set status = 'closed', closed_at = now() where id = p_id and status = 'open';
  if not found then
    raise exception 'not_open';
  end if;
  perform public.refresh_campaign_stats(p_id);
end $$;

-- ------------------------------------------------------------------ Publicación
-- Arma lo que se mostrará en la web a partir de la instantánea, con las reglas de privacidad.
-- Guardar la selección deja las cifras SIN publicar: hay que revisarlas y publicarlas aparte.
create or replace function public.set_public_stats(p_id uuid, p_metrics text[], p_field_ids text[])
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  c public.campaigns;
  snap jsonb;
  received integer;
  metrics jsonb := '{}'::jsonb;
  out_fields jsonb := '[]'::jsonb;
  m text;
  fid text;
  f jsonb;
  kept jsonb;
  other integer;
  countries integer;
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

  p_metrics := coalesce(p_metrics, '{}');
  p_field_ids := coalesce(p_field_ids, '{}');
  foreach m in array p_metrics loop
    if m not in ('received', 'capacity', 'per_spot', 'accepted', 'countries') then
      raise exception 'invalid_metric';
    end if;
  end loop;

  select snapshot into snap from public.campaign_stats where campaign_id = p_id;
  if snap is null then
    perform public.refresh_campaign_stats(p_id);
    select snapshot into snap from public.campaign_stats where campaign_id = p_id;
  end if;
  received := (snap ->> 'received')::integer;

  if 'received' = any (p_metrics) then
    metrics := metrics || jsonb_build_object('received', received);
  end if;
  if 'capacity' = any (p_metrics) or 'per_spot' = any (p_metrics) then
    if c.capacity is null then
      raise exception 'no_capacity';
    end if;
    if 'capacity' = any (p_metrics) then
      metrics := metrics || jsonb_build_object('capacity', c.capacity);
    end if;
    if 'per_spot' = any (p_metrics) then
      metrics := metrics || jsonb_build_object('perSpot', round(received::numeric / c.capacity, 1));
    end if;
  end if;
  if 'accepted' = any (p_metrics) then
    metrics := metrics || jsonb_build_object('accepted',
      coalesce((snap #>> '{byStatus,admitida}')::integer, 0) + coalesce((snap #>> '{byStatus,confirmada}')::integer, 0));
  end if;
  if 'countries' = any (p_metrics) then
    select jsonb_array_length(e -> 'items') into countries
    from jsonb_array_elements(snap -> 'fields') e where e ->> 'id' = 'C4' limit 1;
    if countries is null then
      raise exception 'no_countries';
    end if;
    metrics := metrics || jsonb_build_object('countries', countries);
  end if;

  if array_length(p_field_ids, 1) is not null then
    if received < 20 then
      raise exception 'too_few';
    end if;
    foreach fid in array p_field_ids loop
      select e into f from jsonb_array_elements(snap -> 'fields') e
      where e ->> 'id' = fid and e ->> 'type' in ('select', 'multiselect', 'boolean') limit 1;
      if f is null then
        raise exception 'invalid_field';
      end if;

      -- Celdas con 5 o más personas se muestran; las menores se juntan en "Otros" si suman 5 o más,
      -- y si no se descartan.
      select coalesce(jsonb_agg(jsonb_build_object('label', i ->> 'label', 'count', (i ->> 'count')::integer)
                                order by (i ->> 'count')::integer desc), '[]'::jsonb)
      into kept from jsonb_array_elements(f -> 'items') i where (i ->> 'count')::integer >= 5;
      select coalesce(sum((i ->> 'count')::integer), 0)::integer into other
      from jsonb_array_elements(f -> 'items') i where (i ->> 'count')::integer < 5;
      if other >= 5 then
        kept := kept || jsonb_build_array(jsonb_build_object('label', 'Otros', 'count', other));
      end if;

      out_fields := out_fields || jsonb_build_array(jsonb_build_object(
        'id', fid, 'label', f ->> 'label', 'answered', (f ->> 'answered')::integer, 'items', kept));
    end loop;
  end if;

  update public.campaign_stats
  set public_data = jsonb_build_object('metrics', metrics, 'fields', out_fields),
      public_selection = jsonb_build_object('metrics', to_jsonb(p_metrics), 'fields', to_jsonb(p_field_ids)),
      published = false, published_at = null, published_by = null, updated_at = now()
  where campaign_id = p_id;
end $$;

create or replace function public.publish_public_stats(p_id uuid, p_publish boolean)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  update public.campaign_stats
  set published = p_publish,
      published_at = case when p_publish then now() end,
      published_by = case when p_publish then (select auth.uid()) end,
      updated_at = now()
  where campaign_id = p_id and public_data is not null;
  if not found then
    raise exception 'nothing_to_publish';
  end if;
end $$;

-- Lo único que ve el público: cifras ya filtradas de campañas publicadas (sin ids ni datos personales).
create or replace function public.get_public_stats(p_form_slug text default null)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'name', c.name, 'formSlug', c.form_slug, 'publishedAt', s.published_at, 'data', s.public_data)
         order by s.published_at desc), '[]'::jsonb)
  from public.campaign_stats s
  join public.campaigns c on c.id = s.campaign_id
  where s.published and s.public_data is not null
    and (p_form_slug is null or c.form_slug = p_form_slug);
$$;

revoke all on function public.compute_campaign_stats(uuid) from public, anon;
revoke all on function public.refresh_campaign_stats(uuid) from public, anon;
revoke all on function public.close_campaign(uuid) from public, anon;
revoke all on function public.set_public_stats(uuid, text[], text[]) from public, anon;
revoke all on function public.publish_public_stats(uuid, boolean) from public, anon;
revoke all on function public.get_public_stats(text) from public;
grant execute on function public.compute_campaign_stats(uuid) to authenticated;
grant execute on function public.refresh_campaign_stats(uuid) to authenticated;
grant execute on function public.close_campaign(uuid) to authenticated;
grant execute on function public.set_public_stats(uuid, text[], text[]) to authenticated;
grant execute on function public.publish_public_stats(uuid, boolean) to authenticated;
grant execute on function public.get_public_stats(text) to anon, authenticated;
