-- RailOps v150B-2B — Couche de lecture sécurisée
-- Additif uniquement : aucune policy RLS existante n'est supprimée/modifiée ici.
-- Objectif : permettre au client v150B-2B de ne plus lire directement les tables sensibles.

begin;

-- Helpers déjà présents : on fixe leur search_path et on limite l'exécution publique.
create or replace function public.railops_norm_name(p_value text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select lower(regexp_replace(btrim(coalesce(p_value, '')), '[[:space:]]+', ' ', 'g'));
$$;

create or replace function public.railops_business_ref(p_id text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select upper(btrim(regexp_replace(coalesce(p_id, ''), '__MC__.*$', '', 'i')));
$$;

revoke all on function public.railops_norm_name(text) from public, anon;
revoke all on function public.railops_business_ref(text) from public, anon;
grant execute on function public.railops_norm_name(text) to authenticated;
grant execute on function public.railops_business_ref(text) to authenticated;

-- Profil complet côté serveur, sans modifier la signature historique de
-- railops_current_profile() et sans jamais retourner users.mdp.
create or replace function public.railops_session_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user record;
begin
  select u.id, u.nom, u.badge, u.role, coalesce(u.is_admin,false) as is_admin
    into v_user
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;

  if v_user.id is null then
    return jsonb_build_object('ok',false,'code','NO_RAILOPS_PROFILE');
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_user.id,
    'nom', v_user.nom,
    'badge', v_user.badge,
    'role', v_user.role,
    'is_admin_owner', v_user.is_admin,
    'effective_role', case when v_user.is_admin then 'admin' else v_user.role end
  );
end;
$$;

revoke all on function public.railops_session_context() from public, anon;
grant execute on function public.railops_session_context() to authenticated;

-- Chantiers visibles. Le propriétaire reçoit toutes les structures.
-- Chef/Agent/CTE : uniquement leur périmètre actif.
-- Chef de chantier : hiérarchie active globale, mais sans listes d'agents/chefs
-- ni contenu de tournées détaillé.
create or replace function public.railops_chantiers_scope()
returns table(
  id text,
  nom text,
  lieu text,
  chef text,
  statut text,
  "desc" text,
  "dateDebut" text,
  "dateFin" text,
  agents jsonb,
  chefs jsonb,
  tournees jsonb,
  "dateTermine" text,
  parent_id text,
  "jourReset" integer,
  "responsableSemaine" text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_admin boolean;
begin
  select u.role, coalesce(u.is_admin,false)
    into v_role, v_admin
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;

  if v_role is null then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  if v_admin then
    return query
      select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",
             coalesce(c.agents,'[]'::jsonb),coalesce(c.chefs,'[]'::jsonb),coalesce(c.tournees,'[]'::jsonb),
             c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine"
      from public.chantiers c
      order by c.parent_id nulls first,c.nom;
    return;
  end if;

  if v_role = 'chef_chantier' then
    return query
      with recursive active_tree as (
        select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine"
        from public.chantiers c
        where c.parent_id is null
          and lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
        union all
        select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine"
        from public.chantiers c
        join active_tree p on p.id=c.parent_id
        where lower(coalesce(c.statut,'actif')) not in ('archive','archivé','archivee','archivée','termine','terminé')
      )
      select a.id,a.nom,a.lieu,a.chef,a.statut,a."desc",a."dateDebut",a."dateFin",
             '[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
             a."dateTermine",a.parent_id,a."jourReset",a."responsableSemaine"
      from active_tree a
      order by a.parent_id nulls first,a.nom;
    return;
  end if;

  if v_role in ('chef','agent','cte') then
    return query
      select c.id,c.nom,c.lieu,c.chef,c.statut,c."desc",c."dateDebut",c."dateFin",
             coalesce(c.agents,'[]'::jsonb),coalesce(c.chefs,'[]'::jsonb),coalesce(c.tournees,'[]'::jsonb),
             c."dateTermine",c.parent_id,c."jourReset",c."responsableSemaine"
      from public.chantiers c
      where c.id in (select chantier_id from public.railops_material_scope_ids())
      order by c.parent_id nulls first,c.nom;
    return;
  end if;

  raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
end;
$$;

revoke all on function public.railops_chantiers_scope() from public, anon;
grant execute on function public.railops_chantiers_scope() to authenticated;

-- Matériel courant : jamais accessible au rôle chef_chantier.
create or replace function public.railops_materials_scope()
returns table(
  id text,
  nom text,
  cat text,
  "chantierId" text,
  etat text,
  scan text,
  presence text,
  echeance text,
  "verifLundi" jsonb,
  "verifSemaine" jsonb,
  "controle2m" jsonb
)
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

  if v_role is null or (not v_admin and v_role='chef_chantier') then
    if v_role='chef_chantier' then return; end if;
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  return query
    select m.id,m.nom,m.cat,m."chantierId",m.etat,m.scan,m.presence,m.echeance,m."verifLundi",m."verifSemaine",m."controle2m"
    from public.materiels m
    where v_admin
       or m."chantierId" in (select chantier_id from public.railops_material_scope_ids())
    order by m."chantierId",m.id;
end;
$$;

revoke all on function public.railops_materials_scope() from public, anon;
grant execute on function public.railops_materials_scope() to authenticated;

-- Scans : jamais accessibles au rôle chef_chantier.
create or replace function public.railops_scans_scope()
returns table(
  id text,
  "materielId" text,
  "chantierId" text,
  "agentNom" text,
  date text,
  "etatGeneral" text,
  proprete text,
  fonctionnement boolean,
  dommages boolean,
  "dommagesDesc" text,
  observations text,
  actions text,
  photo text,
  lat double precision,
  lng double precision
)
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

  if v_role is null then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;
  if not v_admin and v_role='chef_chantier' then return; end if;

  return query
    select s.id,s."materielId",s."chantierId",s."agentNom",s.date,s."etatGeneral",s.proprete,s.fonctionnement,s.dommages,s."dommagesDesc",s.observations,s.actions,s.photo,s.lat,s.lng
    from public.scans s
    where v_admin
       or s."chantierId" in (select chantier_id from public.railops_material_scope_ids())
    order by s.date desc nulls last;
end;
$$;

revoke all on function public.railops_scans_scope() from public, anon;
grant execute on function public.railops_scans_scope() to authenticated;

-- Catalogue de prix : les lignes portent des références matériel, donc elles ne
-- sont pas exposées au Chef de chantier. Propriétaire/Chef uniquement.
create or replace function public.railops_catalogue_scope()
returns table(ref text, prix numeric, description text)
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

  if v_role is null or (not v_admin and v_role <> 'chef') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  return query select p.ref,p.prix,p.description from public.prix_catalogue p order by p.ref;
end;
$$;

revoke all on function public.railops_catalogue_scope() from public, anon;
grant execute on function public.railops_catalogue_scope() to authenticated;

-- Stats globales hiérarchiques pour Chef de chantier / propriétaire, sans
-- référence individuelle ni QR ni scan.
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

  if v_role is null or (not v_admin and v_role <> 'chef_chantier') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

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
           count(m.id) filter (where m."verifLundi" is not null)::bigint,
           count(m.id) filter (where m."verifSemaine" is not null)::bigint,
           case when count(m.id)=0 then 0::numeric else round((count(m.id) filter (where m."verifLundi" is not null))::numeric*100/count(m.id),1) end,
           case when count(m.id)=0 then 0::numeric else round((count(m.id) filter (where m."verifSemaine" is not null))::numeric*100/count(m.id),1) end
    from active_tree a
    left join public.materiels m on m."chantierId"=a.id
    group by a.id,a.parent_id,a.nom,a.lieu
    order by a.parent_id nulls first,a.nom;
end;
$$;

revoke all on function public.railops_chef_chantier_tree_stats() from public, anon;
grant execute on function public.railops_chef_chantier_tree_stats() to authenticated;

-- Indique au client si les anciennes policies ouvertes sont encore présentes.
-- Cela permet de basculer progressivement le comportement sans supposer que la
-- migration RLS finale est déjà active.
create or replace function public.railops_security_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_ctx jsonb;
  v_open_count integer;
begin
  v_ctx:=public.railops_session_context();
  if coalesce((v_ctx->>'ok')::boolean,false)=false then return v_ctx; end if;

  select count(*) into v_open_count
  from pg_policies p
  where p.schemaname='public'
    and p.tablename in ('users','chantiers','materiels','scans','agents','inspections')
    and 'public'=any(p.roles)
    and coalesce(p.qual,'')='true';

  return v_ctx || jsonb_build_object(
    'strict_rls', v_open_count=0,
    'legacy_open_policy_count', v_open_count,
    'server_layer', '150B2B-read-1'
  );
end;
$$;

revoke all on function public.railops_security_status() from public, anon;
grant execute on function public.railops_security_status() to authenticated;

commit;
