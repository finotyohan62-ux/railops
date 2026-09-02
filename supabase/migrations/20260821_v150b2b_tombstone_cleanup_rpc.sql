-- RailOps v150B-2B — Nettoyage tombstones via RPC sécurisée
begin;
create or replace function public.railops_purge_old_deleted_ids(p_before timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_admin boolean;
  v_count integer:=0;
begin
  select u.role,coalesce(u.is_admin,false)
    into v_role,v_admin
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;
  if v_role is null then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;
  if not v_admin and v_role<>'chef' then
    return jsonb_build_object('ok',true,'deleted',0,'skipped',true);
  end if;
  delete from public.deleted_ids d
  where d.deleted_at < p_before
    and (v_admin or d.chantier_id is null or d.chantier_id in (select chantier_id from public.railops_material_scope_ids()));
  get diagnostics v_count=row_count;
  return jsonb_build_object('ok',true,'deleted',v_count);
end;
$$;
revoke all on function public.railops_purge_old_deleted_ids(timestamptz) from public, anon;
grant execute on function public.railops_purge_old_deleted_ids(timestamptz) to authenticated;
commit;
