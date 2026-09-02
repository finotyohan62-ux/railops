-- RailOps v150B-2B — Ecritures catalogue sécurisées
begin;

create or replace function public.railops_catalogue_upsert(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_admin boolean;
  v_row jsonb;
  v_count integer:=0;
begin
  select u.role,coalesce(u.is_admin,false)
    into v_role,v_admin
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;
  if v_role is null or (not v_admin and v_role<>'chef') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;
  if jsonb_typeof(coalesce(p_rows,'[]'::jsonb)) <> 'array' then
    raise exception 'RAILOPS_CATALOGUE_INVALID';
  end if;
  for v_row in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb)) loop
    if nullif(btrim(v_row->>'ref'),'') is null or nullif(v_row->>'prix','') is null then
      raise exception 'RAILOPS_CATALOGUE_ROW_INVALID';
    end if;
    insert into public.prix_catalogue(ref,prix,description)
    values(btrim(v_row->>'ref'),(v_row->>'prix')::numeric,coalesce(v_row->>'description',''))
    on conflict(ref) do update set prix=excluded.prix,description=excluded.description;
    v_count:=v_count+1;
  end loop;
  return jsonb_build_object('ok',true,'count',v_count);
end;
$$;

revoke all on function public.railops_catalogue_upsert(jsonb) from public, anon;
grant execute on function public.railops_catalogue_upsert(jsonb) to authenticated;

create or replace function public.railops_catalogue_delete(p_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_admin boolean;
  v_count integer;
begin
  select u.role,coalesce(u.is_admin,false)
    into v_role,v_admin
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;
  if v_role is null or (not v_admin and v_role<>'chef') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;
  delete from public.prix_catalogue where ref=p_ref;
  get diagnostics v_count=row_count;
  return jsonb_build_object('ok',true,'deleted',v_count);
end;
$$;

revoke all on function public.railops_catalogue_delete(text) from public, anon;
grant execute on function public.railops_catalogue_delete(text) to authenticated;
commit;
