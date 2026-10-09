-- Consentimiento del tutor para postulantes menores de 18 (PDF §7).
--
-- Si la participante es seleccionada, su madre, padre o tutor recibe un enlace personal a un formulario
-- corto. No basta con que la menor marque una casilla por él: el consentimiento queda a nombre de quien
-- lo da, con el texto exacto que aceptó. Sin consentimiento vigente no se puede confirmar la vacante.
-- Los consentimientos se eliminan junto con los datos de la participante (al anonimizarla o eliminarla).

create table public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  guardian_name text,
  relationship text check (relationship in ('madre', 'padre', 'tutor')),
  data_consent boolean,
  image_consent boolean,
  statement text,
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  check ((responded_at is null) = (data_consent is null))
);
alter table public.guardian_consents enable row level security;
create policy "consentimientos: admins leen" on public.guardian_consents
  for select to authenticated using (public.is_admin());
-- Sin políticas de escritura: todo pasa por las funciones de abajo.

create function public.random_token()
returns text language sql volatile set search_path = ''
as $$ select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') $$;

-- Se elimina junto con los datos de la participante cuando se anonimiza.
create or replace function public.guardian_consents_on_anonymize()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.guardian_consents where submission_id = new.id;
  return new;
end $$;
create trigger submissions_anonymize_consents
  after update of anonymized_at on public.submissions
  for each row when (old.anonymized_at is null and new.anonymized_at is not null)
  execute function public.guardian_consents_on_anonymize();

-- ------------------------------------------------------------------ Lado del equipo
-- Crea (o renueva) el enlace. SECURITY DEFINER para no dar permisos de escritura sobre la tabla.
create or replace function public.request_guardian_consent(p_submission uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_minor boolean;
  v_campaign_status text;
  r public.guardian_consents;
  v_token text;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  select s.is_minor, c.status into v_minor, v_campaign_status
  from public.submissions s join public.campaigns c on c.id = s.campaign_id where s.id = p_submission;
  if not found then
    raise exception 'not_found';
  end if;
  if not v_minor then
    raise exception 'not_minor';
  end if;
  if v_campaign_status = 'archived' then
    raise exception 'archived';
  end if;

  select * into r from public.guardian_consents where submission_id = p_submission;
  if found then
    if r.responded_at is not null then
      raise exception 'already_responded';
    end if;
    v_token := case when r.expires_at < now() then public.random_token() else r.token end;
    update public.guardian_consents set token = v_token, expires_at = now() + interval '60 days' where id = r.id;
    return v_token;
  end if;

  v_token := public.random_token();
  insert into public.guardian_consents (submission_id, token, expires_at, created_by)
  values (p_submission, v_token, now() + interval '60 days', (select auth.uid()));
  insert into public.submission_events (submission_id, kind, note, created_by)
  values (p_submission, 'note', 'Se generó el enlace de consentimiento del tutor', (select auth.uid()));
  return v_token;
end $$;

-- Para repetir el proceso (p. ej. el tutor se equivocó): borra la respuesta y deja constancia en el historial.
create or replace function public.reset_guardian_consent(p_submission uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  delete from public.guardian_consents where submission_id = p_submission;
  if not found then
    raise exception 'not_found';
  end if;
  insert into public.submission_events (submission_id, kind, note, created_by)
  values (p_submission, 'note', 'Se reinició el consentimiento del tutor (hay que generar un enlace nuevo)', (select auth.uid()));
end $$;

-- El tutor retira su autorización: deja de contar para confirmar la vacante y el uso de imagen se da por revocado.
create or replace function public.revoke_guardian_consent(p_submission uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  update public.guardian_consents
  set revoked_at = now(), revoked_by = (select auth.uid())
  where submission_id = p_submission and responded_at is not null and revoked_at is null;
  if not found then
    raise exception 'not_found';
  end if;
  insert into public.submission_events (submission_id, kind, note, created_by)
  values (p_submission, 'note', 'El tutor revocó su consentimiento', (select auth.uid()));
end $$;

-- ------------------------------------------------------------------ Lado del tutor (público, con el enlace)
-- Devuelve lo que necesita la página del tutor, o null si el enlace no existe.
create or replace function public.get_guardian_consent(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  r public.guardian_consents;
  s public.submissions;
  c public.campaigns;
  def jsonb;
  v_state text;
  v_age text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  select * into r from public.guardian_consents where token = p_token;
  if not found then
    return null;
  end if;
  select * into s from public.submissions where id = r.submission_id;
  select * into c from public.campaigns where id = s.campaign_id;
  select definition into def from public.form_versions where form_slug = c.form_slug and version = c.version;

  v_state := case
    when not public.legal_ready() then 'unavailable'
    when r.responded_at is not null and r.revoked_at is not null then 'revoked'
    when r.responded_at is not null and r.data_consent then 'authorized'
    when r.responded_at is not null then 'declined'
    when r.expires_at < now() then 'expired'
    else 'pending' end;

  select s.answers ->> (f ->> 'id') into v_age
  from jsonb_array_elements(coalesce(def -> 'sections', '[]'::jsonb)) sec,
       jsonb_array_elements(sec -> 'fields') f
  where f ->> 'type' = 'number' and f ->> 'label' ilike '%edad%' and s.answers ? (f ->> 'id')
  limit 1;

  return jsonb_build_object(
    'state', v_state,
    'participantName', s.full_name,
    'age', v_age,
    'program', coalesce(def ->> 'title', c.name),
    'campaignName', c.name,
    'retention', def ->> 'retention',
    'imageConsent', r.image_consent,
    'legal', public.legal_info());
end $$;

create or replace function public.submit_guardian_consent(
  p_token text, p_name text, p_relationship text, p_data_ok boolean, p_image_ok boolean, p_statement text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r public.guardian_consents;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_token';
  end if;
  if not public.legal_ready() then
    raise exception 'unavailable';
  end if;
  select * into r from public.guardian_consents where token = p_token for update;
  if not found then
    raise exception 'invalid_token';
  end if;
  if r.responded_at is not null then
    raise exception 'already_responded';
  end if;
  if r.expires_at < now() then
    raise exception 'expired';
  end if;
  if p_data_ok is null or p_image_ok is null
     or length(btrim(coalesce(p_name, ''))) not between 2 and 120
     or p_relationship not in ('madre', 'padre', 'tutor')
     or length(btrim(coalesce(p_statement, ''))) not between 20 and 3000 then
    raise exception 'invalid_data';
  end if;

  update public.guardian_consents
  set responded_at = now(), guardian_name = btrim(p_name), relationship = p_relationship,
      data_consent = p_data_ok, image_consent = case when p_data_ok then p_image_ok else false end,
      statement = btrim(p_statement)
  where id = r.id;

  insert into public.submission_events (submission_id, kind, note)
  values (r.submission_id, 'note',
    case when p_data_ok
      then 'El tutor autorizó la participación (uso de imagen: ' || case when p_image_ok then 'sí' else 'no' end || ')'
      else 'El tutor no autorizó la participación' end);
end $$;

-- ------------------------------------------------------------------ Sin consentimiento no se confirma la vacante
create or replace function public.set_submission_status(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_old text;
  v_minor boolean;
  v_campaign_status text;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_status not in ('nueva', 'en_revision', 'admitida', 'lista_espera', 'descartada', 'confirmada', 'retirada') then
    raise exception 'invalid_status';
  end if;

  select s.status, s.is_minor, c.status into v_old, v_minor, v_campaign_status
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
  if p_status = 'confirmada' and v_minor
     and not exists (select 1 from public.guardian_consents g
                     where g.submission_id = p_id and g.data_consent and g.revoked_at is null) then
    raise exception 'consent_required';
  end if;

  update public.submissions set status = p_status where id = p_id;
  insert into public.submission_events (submission_id, kind, from_status, to_status, note, created_by)
  values (p_id, 'status', v_old, p_status, nullif(btrim(coalesce(p_note, '')), ''), (select auth.uid()));
end $$;

-- Mensaje de WhatsApp (editable) con el enlace para el tutor.
insert into public.message_templates (key, label, body) values
  ('guardian_consent', 'Consentimiento del tutor',
   E'Hola, te escribimos de CreateLatam. 👋\n\n{{nombre}} fue seleccionada en {{campana}} 🎉 y, como es menor de edad, necesitamos tu autorización como madre, padre o tutor para confirmar su vacante.\n\nEs un formulario corto, lo completas tú desde este enlace:\n{{enlace_consentimiento}}\n\nSi tienes alguna duda, respóndenos por aquí.')
on conflict (key) do nothing;

revoke all on function public.random_token() from public, anon, authenticated;
revoke all on function public.request_guardian_consent(uuid) from public, anon;
revoke all on function public.reset_guardian_consent(uuid) from public, anon;
revoke all on function public.revoke_guardian_consent(uuid) from public, anon;
revoke all on function public.set_submission_status(uuid, text, text) from public, anon;
revoke all on function public.get_guardian_consent(text) from public;
revoke all on function public.submit_guardian_consent(text, text, text, boolean, boolean, text) from public;
grant execute on function public.request_guardian_consent(uuid) to authenticated;
grant execute on function public.reset_guardian_consent(uuid) to authenticated;
grant execute on function public.revoke_guardian_consent(uuid) to authenticated;
grant execute on function public.set_submission_status(uuid, text, text) to authenticated;
grant execute on function public.get_guardian_consent(text) to anon, authenticated;
grant execute on function public.submit_guardian_consent(text, text, text, boolean, boolean, text) to anon, authenticated;
