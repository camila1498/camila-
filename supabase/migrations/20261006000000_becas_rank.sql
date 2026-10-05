-- Asigna o quita el ranking de una beca. Como `rank` es unico, si la posicion ya la
-- tiene otra beca, las dos intercambian (la desplazada toma el rank anterior de esta,
-- o queda sin rank). Todo ocurre en una sola transaccion y bajo RLS.

create or replace function public.set_beca_rank(p_id uuid, p_rank integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old integer;
  v_other uuid;
begin
  if not public.is_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_rank is not null and p_rank <= 0 then
    raise exception 'el ranking debe ser mayor que 0' using errcode = '22023';
  end if;

  select rank into v_old from public.becas where id = p_id;
  if not found then
    raise exception 'beca no encontrada' using errcode = 'P0002';
  end if;
  if p_rank is not distinct from v_old then
    return;
  end if;

  if p_rank is not null then
    select id into v_other from public.becas where rank = p_rank and id <> p_id;
    if v_other is not null then
      update public.becas set rank = null where id = v_other;
    end if;
  end if;

  update public.becas set rank = p_rank where id = p_id;

  if v_other is not null then
    update public.becas set rank = v_old where id = v_other;
  end if;
end;
$$;

revoke all on function public.set_beca_rank(uuid, integer) from public, anon;
grant execute on function public.set_beca_rank(uuid, integer) to authenticated;
