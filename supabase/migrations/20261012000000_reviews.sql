-- Revisión de postulaciones: historial de cada una y plantillas de mensajes para WhatsApp.

-- Historial append-only: cambios de estado, notas y mensajes abiertos por el equipo.
create table public.submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  kind text not null check (kind in ('status', 'note', 'whatsapp', 'email')),
  from_status text,
  to_status text,
  note text,
  detail jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index submission_events_submission_idx on public.submission_events (submission_id, created_at desc);
create index submissions_campaign_created_idx on public.submissions (campaign_id, created_at);

alter table public.submission_events enable row level security;
create policy "eventos: admins leen" on public.submission_events
  for select to authenticated using (public.is_admin());
create policy "eventos: admins registran" on public.submission_events
  for insert to authenticated with check (public.is_admin() and created_by = (select auth.uid()));
-- Sin políticas de update/delete: el historial no se edita ni se borra.

-- Plantillas internas de mensajes (el texto lo edita el equipo; las variables son una lista cerrada).
create table public.message_templates (
  key text primary key,
  label text not null,
  body text not null check (btrim(body) <> '' and length(body) <= 1500),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.message_templates (key, label, body) values
  ('approved', 'Postulación aprobada',
   E'¡Hola {{nombre}}! 👋 Te escribimos de CreateLatam.\n\n¡Tu postulación a {{campana}} fue aprobada! 🎉 En los próximos días te compartiremos los siguientes pasos.\n\nSi tienes alguna duda, respóndenos por aquí.'),
  ('waitlist', 'Lista de espera',
   E'¡Hola {{nombre}}! 👋 Te escribimos de CreateLatam.\n\nGracias por postular a {{campana}}. Tu postulación quedó en lista de espera: si se libera un cupo, te avisaremos por este medio.\n\nSi tienes alguna duda, respóndenos por aquí.'),
  ('rejected', 'Postulación no seleccionada',
   E'Hola {{nombre}}, te escribimos de CreateLatam.\n\nGracias por postular a {{campana}}. En esta ocasión no pudimos seleccionar tu postulación, pero queremos que sigas cerca de la comunidad: pronto abriremos nuevas convocatorias.\n\n¡Gracias por tu interés!');

create or replace function public.message_templates_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger message_templates_touch before update on public.message_templates
  for each row execute function public.message_templates_touch();

alter table public.message_templates enable row level security;
create policy "plantillas: admins leen" on public.message_templates
  for select to authenticated using (public.is_admin());
create policy "plantillas: admins editan" on public.message_templates
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Cambia el estado y deja el registro en el historial en una sola transacción.
create or replace function public.set_submission_status(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_old text;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_status not in ('nueva', 'en_revision', 'admitida', 'lista_espera', 'descartada', 'confirmada', 'retirada') then
    raise exception 'invalid_status';
  end if;

  select status into v_old from public.submissions where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_old = p_status then
    return;
  end if;

  update public.submissions set status = p_status where id = p_id;
  insert into public.submission_events (submission_id, kind, from_status, to_status, note, created_by)
  values (p_id, 'status', v_old, p_status, nullif(btrim(coalesce(p_note, '')), ''), (select auth.uid()));
end $$;

revoke all on function public.set_submission_status(uuid, text, text) from public, anon;
grant execute on function public.set_submission_status(uuid, text, text) to authenticated;
