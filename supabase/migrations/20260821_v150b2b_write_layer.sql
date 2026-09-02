-- RailOps v150B-2B — Couche d'écriture contrôlée
-- Additive uniquement : ne ferme/modifie AUCUNE ancienne policy RLS.
-- Les RPC sont destinées au client v150B-2B avant le verrouillage final.

begin;

-- ---------------------------------------------------------------------------
-- 1) Helper : contexte utilisateur courant
-- ---------------------------------------------------------------------------
create or replace function public.railops_can_access_chantier(p_chantier_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and (
        coalesce(u.is_admin,false)
        or (
          u.role in ('chef','agent','cte')
          and p_chantier_id in (select chantier_id from public.railops_material_scope_ids())
        )
      )
  );
$$;

revoke all on function public.railops_can_access_chantier(text) from public, anon;
grant execute on function public.railops_can_access_chantier(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Mise à jour contrôlée d'un matériel existant
-- Agent/CTE : uniquement état opérationnel / vérifications.
-- Chef/Admin : mêmes champs + métadonnées métier, mais déplacement limité au scope.
-- ---------------------------------------------------------------------------
create or replace function public.railops_save_material_state(
  p_id text,
  p_patch jsonb
)
returns public.materiels
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me record;
  v_old public.materiels%rowtype;
  v_new public.materiels%rowtype;
  v_target_chantier text;
  v_allowed_keys text[];
  v_key text;
begin
  select u.id,u.nom,u.role,coalesce(u.is_admin,false) as is_admin
    into v_me
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_me.id is null then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;
  if v_me.role='chef_chantier' and not v_me.is_admin then
    raise exception 'RAILOPS_NO_MATERIAL_ACCESS' using errcode='42501';
  end if;

  select * into v_old from public.materiels where id=p_id for update;
  if v_old.id is null then
    raise exception 'RAILOPS_MATERIAL_NOT_FOUND';
  end if;
  if not v_me.is_admin and not public.railops_can_access_chantier(v_old."chantierId") then
    raise exception 'RAILOPS_OUT_OF_SCOPE' using errcode='42501';
  end if;

  if v_me.is_admin or v_me.role='chef' then
    v_allowed_keys := array['nom','cat','chantierId','etat','scan','presence','echeance','verifLundi','verifSemaine','controle2m'];
  else
    v_allowed_keys := array['etat','scan','presence','verifLundi','verifSemaine','controle2m'];
  end if;

  for v_key in select jsonb_object_keys(coalesce(p_patch,'{}'::jsonb)) loop
    if not (v_key = any(v_allowed_keys)) then
      raise exception 'RAILOPS_FIELD_FORBIDDEN:%',v_key using errcode='42501';
    end if;
  end loop;

  v_target_chantier := coalesce(nullif(p_patch->>'chantierId',''),v_old."chantierId");
  if v_target_chantier is distinct from v_old."chantierId" then
    if not (v_me.is_admin or v_me.role='chef') then
      raise exception 'RAILOPS_MOVE_FORBIDDEN' using errcode='42501';
    end if;
    if not v_me.is_admin and not public.railops_can_access_chantier(v_target_chantier) then
      raise exception 'RAILOPS_TARGET_OUT_OF_SCOPE' using errcode='42501';
    end if;
  end if;

  update public.materiels m
     set nom = case when p_patch ? 'nom' then p_patch->>'nom' else m.nom end,
         cat = case when p_patch ? 'cat' then p_patch->>'cat' else m.cat end,
         "chantierId" = case when p_patch ? 'chantierId' then p_patch->>'chantierId' else m."chantierId" end,
         etat = case when p_patch ? 'etat' then p_patch->>'etat' else m.etat end,
         scan = case when p_patch ? 'scan' then p_patch->>'scan' else m.scan end,
         presence = case when p_patch ? 'presence' then p_patch->>'presence' else m.presence end,
         echeance = case when p_patch ? 'echeance' then p_patch->>'echeance' else m.echeance end,
         "verifLundi" = case when p_patch ? 'verifLundi' then p_patch->'verifLundi' else m."verifLundi" end,
         "verifSemaine" = case when p_patch ? 'verifSemaine' then p_patch->'verifSemaine' else m."verifSemaine" end,
         "controle2m" = case when p_patch ? 'controle2m' then p_patch->'controle2m' else m."controle2m" end
   where m.id=p_id
   returning * into v_new;

  return v_new;
end;
$$;

revoke all on function public.railops_save_material_state(text,jsonb) from public, anon;
grant execute on function public.railops_save_material_state(text,jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Upsert d'un scan terrain.
-- Le chantier et le matériel doivent appartenir au scope Auth réel.
-- Pour un non-Admin, agentNom est forcé depuis le profil Auth RailOps.
-- ---------------------------------------------------------------------------
create or replace function public.railops_upsert_scan(p_scan jsonb)
returns public.scans
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me record;
  v_mat public.materiels%rowtype;
  v_row public.scans%rowtype;
  v_id text;
  v_mid text;
  v_cid text;
begin
  select u.id,u.nom,u.role,coalesce(u.is_admin,false) as is_admin
    into v_me
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_me.id is null or (v_me.role='chef_chantier' and not v_me.is_admin) then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  v_id := nullif(p_scan->>'id','');
  v_mid := nullif(p_scan->>'materielId','');
  v_cid := nullif(p_scan->>'chantierId','');
  if v_id is null or v_mid is null or v_cid is null then
    raise exception 'RAILOPS_SCAN_INVALID';
  end if;

  select * into v_mat from public.materiels where id=v_mid;
  if v_mat.id is null or v_mat."chantierId" is distinct from v_cid then
    raise exception 'RAILOPS_SCAN_MATERIAL_MISMATCH';
  end if;
  if not v_me.is_admin and not public.railops_can_access_chantier(v_cid) then
    raise exception 'RAILOPS_OUT_OF_SCOPE' using errcode='42501';
  end if;

  insert into public.scans(
    id,"materielId","chantierId","agentNom",date,"etatGeneral",proprete,
    fonctionnement,dommages,"dommagesDesc",observations,actions,photo,lat,lng
  ) values (
    v_id,v_mid,v_cid,
    case when v_me.is_admin then coalesce(p_scan->>'agentNom',v_me.nom) else v_me.nom end,
    p_scan->>'date',p_scan->>'etatGeneral',p_scan->>'proprete',
    case when p_scan ? 'fonctionnement' then (p_scan->>'fonctionnement')::boolean else null end,
    case when p_scan ? 'dommages' then (p_scan->>'dommages')::boolean else null end,
    p_scan->>'dommagesDesc',p_scan->>'observations',p_scan->>'actions',p_scan->>'photo',
    case when nullif(p_scan->>'lat','') is null then null else (p_scan->>'lat')::double precision end,
    case when nullif(p_scan->>'lng','') is null then null else (p_scan->>'lng')::double precision end
  )
  on conflict(id) do update set
    "materielId"=excluded."materielId",
    "chantierId"=excluded."chantierId",
    "agentNom"=excluded."agentNom",
    date=excluded.date,
    "etatGeneral"=excluded."etatGeneral",
    proprete=excluded.proprete,
    fonctionnement=excluded.fonctionnement,
    dommages=excluded.dommages,
    "dommagesDesc"=excluded."dommagesDesc",
    observations=excluded.observations,
    actions=excluded.actions,
    photo=excluded.photo,
    lat=excluded.lat,
    lng=excluded.lng
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.railops_upsert_scan(jsonb) from public, anon;
grant execute on function public.railops_upsert_scan(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Tournées : champ borné, sans droit de modifier le reste du chantier.
-- Agent/CTE peuvent enregistrer une tournée seulement sur leurs affectations.
-- ---------------------------------------------------------------------------
create or replace function public.railops_save_tournees(
  p_chantier_id text,
  p_tournees jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me record;
begin
  select u.id,u.role,coalesce(u.is_admin,false) as is_admin
    into v_me
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_me.id is null or (v_me.role='chef_chantier' and not v_me.is_admin) then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;
  if not v_me.is_admin and not public.railops_can_access_chantier(p_chantier_id) then
    raise exception 'RAILOPS_OUT_OF_SCOPE' using errcode='42501';
  end if;
  if jsonb_typeof(coalesce(p_tournees,'[]'::jsonb)) <> 'array' then
    raise exception 'RAILOPS_TOURNEES_INVALID';
  end if;

  update public.chantiers
     set tournees=coalesce(p_tournees,'[]'::jsonb)
   where id=p_chantier_id;

  if not found then raise exception 'RAILOPS_CHANTIER_NOT_FOUND'; end if;
  return jsonb_build_object('ok',true,'chantier_id',p_chantier_id);
end;
$$;

revoke all on function public.railops_save_tournees(text,jsonb) from public, anon;
grant execute on function public.railops_save_tournees(text,jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Import / gestion matérielle Chef + Admin
-- Aucun Agent/CTE/Chef de chantier ne peut créer un matériel.
-- ---------------------------------------------------------------------------
create or replace function public.railops_upsert_material_admin(p_item jsonb)
returns public.materiels
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me record;
  v_row public.materiels%rowtype;
  v_id text;
  v_cid text;
begin
  select u.id,u.role,coalesce(u.is_admin,false) as is_admin
    into v_me
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_me.id is null or (not v_me.is_admin and v_me.role<>'chef') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  v_id:=nullif(p_item->>'id','');
  v_cid:=nullif(p_item->>'chantierId','');
  if v_id is null or v_cid is null then raise exception 'RAILOPS_MATERIAL_INVALID'; end if;
  if not v_me.is_admin and not public.railops_can_access_chantier(v_cid) then
    raise exception 'RAILOPS_OUT_OF_SCOPE' using errcode='42501';
  end if;

  insert into public.materiels(
    id,nom,cat,"chantierId",etat,scan,presence,echeance,"verifLundi","verifSemaine","controle2m"
  ) values (
    v_id,p_item->>'nom',p_item->>'cat',v_cid,p_item->>'etat',p_item->>'scan',p_item->>'presence',p_item->>'echeance',
    case when p_item ? 'verifLundi' then p_item->'verifLundi' else null end,
    case when p_item ? 'verifSemaine' then p_item->'verifSemaine' else null end,
    case when p_item ? 'controle2m' then p_item->'controle2m' else null end
  )
  on conflict(id) do update set
    nom=excluded.nom,cat=excluded.cat,"chantierId"=excluded."chantierId",etat=excluded.etat,
    scan=excluded.scan,presence=excluded.presence,echeance=excluded.echeance,
    "verifLundi"=excluded."verifLundi","verifSemaine"=excluded."verifSemaine","controle2m"=excluded."controle2m"
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.railops_upsert_material_admin(jsonb) from public, anon;
grant execute on function public.railops_upsert_material_admin(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Suppression matériel Chef/Admin + tombstone idempotent.
-- Ne purge aucun historique hebdomadaire ici.
-- ---------------------------------------------------------------------------
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

  insert into public.deleted_ids(id,deleted_at)
  values(p_id,now())
  on conflict(id) do update set deleted_at=excluded.deleted_at;

  delete from public.scans where "materielId"=p_id;
  delete from public.materiels where id=p_id;

  return jsonb_build_object('ok',true,'id',p_id,'tombstoned',true);
end;
$$;

revoke all on function public.railops_delete_material(text) from public, anon;
grant execute on function public.railops_delete_material(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7) Tombstones : Chef/Admin seulement (anti-résurrection import).
-- ---------------------------------------------------------------------------
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
  return query select d.id,d.deleted_at from public.deleted_ids d order by d.deleted_at desc;
end;
$$;

revoke all on function public.railops_deleted_ids_scope() from public, anon;
grant execute on function public.railops_deleted_ids_scope() to authenticated;

commit;
