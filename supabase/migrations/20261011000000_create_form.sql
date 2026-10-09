-- Crear y eliminar formularios nuevos desde la plataforma.
--
-- Un formulario nuevo nace sin versiones ni campañas: solo la fila en `forms` y su borrador.
-- La primera vez que se publica se congela como versión 1.

-- Crea el formulario y su borrador de una sola vez (nunca queda uno sin el otro).
create or replace function public.create_form(p_slug text, p_title text, p_definition jsonb)
returns text
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) > 40 then
    raise exception 'invalid_slug';
  end if;
  if p_title is null or btrim(p_title) = '' or length(p_title) > 200 then
    raise exception 'invalid_title';
  end if;
  if jsonb_typeof(p_definition) is distinct from 'object' or (p_definition ->> 'slug') is distinct from p_slug then
    raise exception 'invalid_definition';
  end if;

  begin
    insert into public.forms (slug, title) values (p_slug, btrim(p_title));
  exception when unique_violation then
    raise exception 'slug_taken';
  end;

  insert into public.form_drafts (form_slug, definition, based_on_version, updated_by)
  values (p_slug, p_definition, 0, (select auth.uid()));

  return p_slug;
end $$;

-- Solo se puede eliminar un formulario que nunca se publicó (sin versiones ni campañas).
create or replace function public.delete_form(p_slug text)
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if exists (select 1 from public.form_versions where form_slug = p_slug)
     or exists (select 1 from public.campaigns where form_slug = p_slug) then
    raise exception 'already_published';
  end if;

  delete from public.form_drafts where form_slug = p_slug;
  delete from public.forms where slug = p_slug;
  if not found then
    raise exception 'not_found';
  end if;
end $$;

revoke all on function public.create_form(text, text, jsonb) from public, anon;
revoke all on function public.delete_form(text) from public, anon;
grant execute on function public.create_form(text, text, jsonb) to authenticated;
grant execute on function public.delete_form(text) to authenticated;
