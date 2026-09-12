-- RailOps — 2026-09-12
-- Secure aggregate statistics for Chef de chantier accounts.
-- The role keeps zero access to material references; this RPC returns counts only.

create or replace function public.railops_chef_chantier_tree_stats()
returns table(
  chantier_id text,
  total_materiels bigint,
  verif1_faite bigint,
  verif2_faite bigint,
  absents bigint,
  hors_service bigint
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  ju public.users%rowtype;
  jt text;
  current_week text;
begin
  ju := public.railops_current_user();
  if ju.id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  jt := public.railops_norm_role(ju.role);
  if jt not in ('chef_chantier','chef_de_chantier') then
    raise exception 'CHEF_CHANTIER_ONLY';
  end if;

  current_week := (date_trunc('week', current_timestamp at time zone 'Europe/Paris'))::date::text;

  return query
  with recursive active_tree as (
    select c.id, c.parent_id
    from public.chantiers c
    where c.parent_id is null
      and lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')

    union all

    select c.id, c.parent_id
    from public.chantiers c
    join active_tree p on p.id = c.parent_id
    where lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
  )
  select
    a.id as chantier_id,
    count(m.id) as total_materiels,
    count(m.id) filter (
      where coalesce(m."verifLundi"->>'weekKey','') = current_week
    ) as verif1_faite,
    count(m.id) filter (
      where coalesce(m."verifSemaine"->>'weekKey','') = current_week
    ) as verif2_faite,
    count(m.id) filter (
      where lower(trim(coalesce(m.presence,''))) = 'absent'
    ) as absents,
    count(m.id) filter (
      where lower(trim(coalesce(m.etat,''))) = 'hors-service'
    ) as hors_service
  from active_tree a
  left join public.materiels m on m."chantierId" = a.id
  group by a.id;
end;
$function$;
