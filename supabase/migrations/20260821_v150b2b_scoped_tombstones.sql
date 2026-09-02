-- RailOps v150B-2B — Tombstones cloisonnés par chantier
begin;

alter table public.deleted_ids add column if not exists chantier_id text;
alter table public.deleted_ids add column if not exists deleted_by_user_id text;

create or replace function public.railops_delete_material(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me record;
  v_mat public.materiels%rowtype;
begin
  select u.id,u.role,coalesce(u.is_admin,false) as is_admin
    into v_me
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_me.id is null or (not v_me.is_admin and v_me.role<>'chef') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  select * into v_mat from public.materiels where id=p_id for update;
  if v_mat.id is null then
    return jsonb_build_object('ok',true,'already_absent',true,'id',p_id);
  end if;
  if not v_me.is_admin and not public.railops_can_access_chantier(v_mat."chantierId") then
    raise exception 'RAILOPS_OUT_OF_SCOPE' using errcode='42501';
  end if;

  insert into public.deleted_ids(id,deleted_at,chantier_id,deleted_by_user_id)
  values(p_id,now(),v_mat."chantierId",v_me.id)
  on conflict(id) do update set
    deleted_at=excluded.deleted_at,
    chantier_id=excluded.chantier_id,
    deleted_by_user_id=excluded.deleted_by_user_id;

  delete from public.scans where "materielId"=p_id;
  delete from public.materiels where id=p_id;

  return jsonb_build_object('ok',true,'id',p_id,'chantier_id',v_mat."chantierId",'tombstoned',true);
end;
$$;

create or replace function public.railops_deleted_ids_scope()
returns table(id text, deleted_at timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_admin boolean;
begin
  select u.role,coalesce(u.is_admin,false)
    into v_role,v_admin
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_role is null or (not v_admin and v_role<>'chef') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  return query
    select d.id,d.deleted_at
    from public.deleted_ids d
    where v_admin
       or d.chantier_id is null
       or d.chantier_id in (select chantier_id from public.railops_material_scope_ids())
    order by d.deleted_at desc;
end;
$$;

revoke all on function public.railops_delete_material(text) from public, anon;
revoke all on function public.railops_deleted_ids_scope() from public, anon;
grant execute on function public.railops_delete_material(text) to authenticated;
grant execute on function public.railops_deleted_ids_scope() to authenticated;

commit;
