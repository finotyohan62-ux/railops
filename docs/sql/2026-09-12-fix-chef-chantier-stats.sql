-- RailOps — 2026-09-12
-- Secure weekly aggregate statistics for Chef de chantier accounts.
-- Preserves the live RPC signature and exposes counts/percentages only, never material references.

create or replace function public.railops_chef_chantier_tree_stats()
returns table(
  chantier_id text,
  parent_id text,
  chantier_nom text,
  lieu text,
  total_materiels bigint,
  verif_1_ok bigint,
  verif_2_ok bigint,
  verif_1_pct numeric,
  verif_2_pct numeric
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_role text;
  v_admin boolean;
  current_week text;
begin
  select u.role,coalesce(u.is_admin,false)
    into v_role,v_admin
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_role is null or (not v_admin and v_role <> 'chef_chantier') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  current_week := (date_trunc('week', current_timestamp at time zone 'Europe/Paris'))::date::text;

  return query
    with recursive active_tree as (
      select c.id,c.parent_id,c.nom,c.lieu
      from public.chantiers c
      where c.parent_id is null
        and lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
      union all
      select c.id,c.parent_id,c.nom,c.lieu
      from public.chantiers c
      join active_tree p on p.id=c.parent_id
      where lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
    )
    select a.id,a.parent_id,a.nom,a.lieu,
           count(m.id)::bigint,
           count(m.id) filter (
             where coalesce(m."verifLundi"->>'weekKey','') = current_week
           )::bigint,
           count(m.id) filter (
             where coalesce(m."verifSemaine"->>'weekKey','') = current_week
           )::bigint,
           case when count(m.id)=0 then 0::numeric else round(
             (count(m.id) filter (where coalesce(m."verifLundi"->>'weekKey','') = current_week))::numeric*100/count(m.id),1
           ) end,
           case when count(m.id)=0 then 0::numeric else round(
             (count(m.id) filter (where coalesce(m."verifSemaine"->>'weekKey','') = current_week))::numeric*100/count(m.id),1
           ) end
    from active_tree a
    left join public.materiels m on m."chantierId"=a.id
    group by a.id,a.parent_id,a.nom,a.lieu
    order by a.parent_id nulls first,a.nom;
end;
$function$;
