-- RailOps v150B-2B — Propriétaire : rôle métier conservé + Admin séparé
-- Corrige le bug où is_admin=true remplaçait le rôle métier Chef dans les lectures quotidiennes.
begin;

create or replace function public.railops_business_material_scope_ids()
returns table(chantier_id text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with recursive
me as (
  select u.id,u.nom,u.role
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1
),
active_tree as (
  select c.id,c.parent_id,c.nom,c.lieu,c.chef,c.chefs,c.agents,c.statut
  from public.chantiers c
  where c.parent_id is null
    and lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
  union all
  select c.id,c.parent_id,c.nom,c.lieu,c.chef,c.chefs,c.agents,c.statut
  from public.chantiers c
  join active_tree p on p.id=c.parent_id
  where lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
),
seeds as (
  select a.id
  from active_tree a,me
  where me.role='chef'
    and (
      public.railops_norm_name(a.chef)=public.railops_norm_name(me.nom)
      or exists (
        select 1 from jsonb_array_elements_text(coalesce(a.chefs,'[]'::jsonb)) x(value)
        where public.railops_norm_name(x.value)=public.railops_norm_name(me.nom)
      )
    )
  union
  select a.id
  from active_tree a,me
  where me.role in ('agent','cte')
    and exists (
      select 1 from jsonb_array_elements_text(coalesce(a.agents,'[]'::jsonb)) x(value)
      where public.railops_norm_name(x.value)=public.railops_norm_name(me.nom)
    )
),
scope as (
  select s.id from seeds s
  union
  select c.id from active_tree c join scope p on c.parent_id=p.id
)
select distinct scope.id as chantier_id from scope;
$$;
revoke all on function public.railops_business_material_scope_ids() from public,anon;
grant execute on function public.railops_business_material_scope_ids() to authenticated;

create or replace function public.railops_chantiers_scope()
returns table(id text,nom text,lieu text,chef text,statut text,"desc" text,"dateDebut" text,"dateFin" text,agents jsonb,chefs jsonb,tournees jsonb,"dateTermine" text,parent_id text,"jourReset" integer,"responsableSemaine" text)
language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare v_role text;
begin
  select u.role into v_role from public.users u where u.auth_user_id=auth.uid() limit 1;
  if v_role is null then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;

  if v_role='chef_chantier' then
    return query
      with recursive active_tree as (
        select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine"
        from public.chantiers c
        where c.parent_id is null and lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
        union all
        select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine"
        from public.chantiers c join active_tree p on p.id=c.parent_id
        where lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
      )
      select a.id,a.nom,a.lieu,a.chef,a.statut,a."desc",a."dateDebut",a."dateFin",'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,a."dateTermine",a.parent_id,a."jourReset",a."responsableSemaine"
      from active_tree a order by a.parent_id nulls first,a.nom;
    return;
  end if;

  if v_role='admin' then
    return query select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",coalesce(c.agents,'[]'::jsonb),coalesce(c.chefs,'[]'::jsonb),coalesce(c.tournees,'[]'::jsonb),c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine" from public.chantiers c order by c.parent_id nulls first,c.nom;
    return;
  end if;

  if v_role in ('chef','agent','cte') then
    return query select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",coalesce(c.agents,'[]'::jsonb),coalesce(c.chefs,'[]'::jsonb),coalesce(c.tournees,'[]'::jsonb),c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine"
    from public.chantiers c where c.id in (select chantier_id from public.railops_business_material_scope_ids()) order by c.parent_id nulls first,c.nom;
    return;
  end if;
  raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
end;$$;

create or replace function public.railops_materials_scope()
returns table(id text,nom text,cat text,"chantierId" text,etat text,scan text,presence text,echeance text,"verifLundi" jsonb,"verifSemaine" jsonb,"controle2m" jsonb)
language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare v_role text;
begin
  select u.role into v_role from public.users u where u.auth_user_id=auth.uid() limit 1;
  if v_role is null then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;
  if v_role='chef_chantier' then return; end if;
  return query select m.id,m.nom,m.cat,m."chantierId",m.etat,m.scan,m.presence,m.echeance,m."verifLundi",m."verifSemaine",m."controle2m"
  from public.materiels m
  where v_role='admin' or m."chantierId" in (select chantier_id from public.railops_business_material_scope_ids())
  order by m."chantierId",m.id;
end;$$;

create or replace function public.railops_scans_scope()
returns table(id text,"materielId" text,"chantierId" text,"agentNom" text,date text,"etatGeneral" text,proprete text,fonctionnement boolean,dommages boolean,"dommagesDesc" text,observations text,actions text,photo text,lat double precision,lng double precision)
language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare v_role text;
begin
  select u.role into v_role from public.users u where u.auth_user_id=auth.uid() limit 1;
  if v_role is null then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;
  if v_role='chef_chantier' then return; end if;
  return query select s.id,s."materielId",s."chantierId",s."agentNom",s.date,s."etatGeneral",s.proprete,s.fonctionnement,s.dommages,s."dommagesDesc",s.observations,s.actions,s.photo,s.lat,s.lng
  from public.scans s
  where v_role='admin' or s."chantierId" in (select chantier_id from public.railops_business_material_scope_ids())
  order by s.date desc nulls last;
end;$$;

create or replace function public.railops_multi_map()
returns table(reference text,chantier_label text)
language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare v_role text;
begin
  select u.role into v_role from public.users u where u.auth_user_id=auth.uid() limit 1;
  if v_role is null or v_role not in ('chef','admin') then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;
  return query
  with recursive active_tree as (
    select c.id,c.parent_id,c.nom,c.nom as root_nom from public.chantiers c where c.parent_id is null and lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
    union all
    select c.id,c.parent_id,c.nom,p.root_nom from public.chantiers c join active_tree p on p.id=c.parent_id where lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
  ),myrefs as (
    select distinct public.railops_business_ref(m.id) ref from public.materiels m
    where v_role='admin' or m."chantierId" in (select chantier_id from public.railops_business_material_scope_ids())
  )
  select distinct public.railops_business_ref(m.id),case when a.parent_id is null then a.nom else a.root_nom||' › '||a.nom end
  from public.materiels m join active_tree a on a.id=m."chantierId" join myrefs r on r.ref=public.railops_business_ref(m.id)
  where v_role='admin' or m."chantierId" not in (select chantier_id from public.railops_business_material_scope_ids())
  order by 1,2;
end;$$;

-- RPC globales explicites : accessibles uniquement au propriétaire.
create or replace function public.railops_admin_chantiers_scope()
returns setof public.chantiers language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if not coalesce((select u.is_admin from public.users u where u.auth_user_id=auth.uid() limit 1),false) then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;
  return query select * from public.chantiers order by parent_id nulls first,nom;
end;$$;
create or replace function public.railops_admin_materials_scope()
returns setof public.materiels language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if not coalesce((select u.is_admin from public.users u where u.auth_user_id=auth.uid() limit 1),false) then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;
  return query select * from public.materiels order by "chantierId",id;
end;$$;
create or replace function public.railops_admin_scans_scope()
returns setof public.scans language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if not coalesce((select u.is_admin from public.users u where u.auth_user_id=auth.uid() limit 1),false) then raise exception 'RAILOPS_FORBIDDEN' using errcode='42501'; end if;
  return query select * from public.scans order by date desc nulls last;
end;$$;

revoke all on function public.railops_chantiers_scope() from public,anon;
revoke all on function public.railops_materials_scope() from public,anon;
revoke all on function public.railops_scans_scope() from public,anon;
revoke all on function public.railops_multi_map() from public,anon;
revoke all on function public.railops_admin_chantiers_scope() from public,anon;
revoke all on function public.railops_admin_materials_scope() from public,anon;
revoke all on function public.railops_admin_scans_scope() from public,anon;
grant execute on function public.railops_chantiers_scope() to authenticated;
grant execute on function public.railops_materials_scope() to authenticated;
grant execute on function public.railops_scans_scope() to authenticated;
grant execute on function public.railops_multi_map() to authenticated;
grant execute on function public.railops_admin_chantiers_scope() to authenticated;
grant execute on function public.railops_admin_materials_scope() to authenticated;
grant execute on function public.railops_admin_scans_scope() to authenticated;

commit;
