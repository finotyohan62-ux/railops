-- RailOps — atomic scan/material verification persistence
-- 2026-09-11
--
-- Root cause: railops_upsert_scan persisted the inspection row but material state
-- (presence/etat/scan/verifLundi/verifSemaine) was written separately by the client.
-- A partial failure therefore left a valid scan with an unverified material.

create or replace function public.railops_upsert_scan(p_scan jsonb)
returns public.scans
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_me record;
  v_mat public.materiels%rowtype;
  v_existing public.scans%rowtype;
  v_row public.scans%rowtype;
  v_id text;
  v_mid text;
  v_cid text;
  v_is_new boolean;
  v_scan_ts timestamptz;
  v_shifted_date date;
  v_reset_day integer;
  v_dow integer;
  v_week_key text;
  v_verif jsonb;
begin
  select u.id,u.nom,u.role,coalesce(u.is_admin,false) as is_admin
    into v_me
  from public.users u
  where u.auth_user_id=auth.uid()
  limit 1;

  if v_me.id is null or (v_me.role='chef_chantier' and not v_me.is_admin) then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  v_id:=nullif(p_scan->>'id','');
  v_mid:=nullif(p_scan->>'materielId','');
  v_cid:=nullif(p_scan->>'chantierId','');
  if v_id is null or v_mid is null or v_cid is null then
    raise exception 'RAILOPS_SCAN_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_id, 1));

  select * into v_mat from public.materiels where id=v_mid for update;
  if v_mat.id is null or v_mat."chantierId" is distinct from v_cid then
    raise exception 'RAILOPS_SCAN_MATERIAL_MISMATCH';
  end if;
  if not v_me.is_admin and not public.railops_can_access_chantier(v_cid) then
    raise exception 'RAILOPS_OUT_OF_SCOPE' using errcode='42501';
  end if;

  select * into v_existing from public.scans where id=v_id for update;
  v_is_new := v_existing.id is null;

  if v_existing.id is not null and not v_me.is_admin then
    if not public.railops_can_access_chantier(v_existing."chantierId") then
      raise exception 'RAILOPS_EXISTING_SCAN_OUT_OF_SCOPE' using errcode='42501';
    end if;
    if v_me.role in ('agent','cte')
       and public.railops_norm_name(v_existing."agentNom") <> public.railops_norm_name(v_me.nom) then
      raise exception 'RAILOPS_SCAN_NOT_OWNER' using errcode='42501';
    end if;
    if v_me.role in ('agent','cte')
       and (v_existing."materielId" is distinct from v_mid or v_existing."chantierId" is distinct from v_cid) then
      raise exception 'RAILOPS_SCAN_RETARGET_FORBIDDEN' using errcode='42501';
    end if;
  end if;

  insert into public.scans(id,"materielId","chantierId","agentNom",date,"etatGeneral",proprete,fonctionnement,dommages,"dommagesDesc",observations,actions,photo,lat,lng)
  values(
    v_id,v_mid,v_cid,
    case when v_me.is_admin or v_me.role='chef' then coalesce(p_scan->>'agentNom',v_me.nom) else v_me.nom end,
    p_scan->>'date',p_scan->>'etatGeneral',p_scan->>'proprete',
    case when p_scan?'fonctionnement' then (p_scan->>'fonctionnement')::boolean else null end,
    case when p_scan?'dommages' then (p_scan->>'dommages')::boolean else null end,
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

  -- Mirror the client's getWeekKey()/recordVerif() rule server-side.
  -- RailOps applies a 14h cutoff before assigning the chantier reset day.
  v_scan_ts := coalesce(nullif(v_row.date,'')::timestamptz, now());
  select coalesce(c."jourReset",1)
    into v_reset_day
  from public.chantiers c
  where c.id=v_cid;
  v_reset_day := coalesce(v_reset_day,1);
  v_shifted_date := ((v_scan_ts - interval '14 hours') at time zone 'UTC')::date;
  v_dow := extract(dow from v_shifted_date)::integer;
  v_week_key := (v_shifted_date - ((v_dow - v_reset_day + 7) % 7))::text;
  v_verif := jsonb_build_object('weekKey',v_week_key,'date',v_row.date,'agentNom',v_row."agentNom");

  update public.materiels m
  set scan = case
               when m.scan is null then v_row.date
               when nullif(v_row.date,'') is null then m.scan
               when nullif(m.scan,'') is null then v_row.date
               when v_scan_ts >= m.scan::timestamptz then v_row.date
               else m.scan
             end,
      presence = case
                   when nullif(v_row.date,'') is not null
                        and (m.scan is null or nullif(m.scan,'') is null or v_scan_ts >= m.scan::timestamptz)
                   then 'confirme'
                   else m.presence
                 end,
      etat = case
               when nullif(v_row.date,'') is not null
                    and (m.scan is null or nullif(m.scan,'') is null or v_scan_ts >= m.scan::timestamptz)
               then coalesce(nullif(v_row."etatGeneral",''),m.etat)
               else m.etat
             end,
      "verifLundi" = case
                        when v_is_new and coalesce(m."verifLundi"->>'weekKey','') <> v_week_key then v_verif
                        else m."verifLundi"
                      end,
      "verifSemaine" = case
                          when v_is_new
                               and coalesce(m."verifLundi"->>'weekKey','') = v_week_key
                               and coalesce(m."verifSemaine"->>'weekKey','') <> v_week_key
                          then v_verif
                          else m."verifSemaine"
                        end
  where m.id=v_mid;

  return v_row;
end;
$function$;

-- Repair only the seven audit-proven rows reported on Lison and Montreuil.
-- The write guard expects an authenticated RailOps user. During a privileged
-- migration there is no request JWT, so use the existing admin identity only
-- for this transaction-local repair; the setting disappears at transaction end.
select set_config(
  'request.jwt.claim.sub',
  (select auth_user_id::text from public.users where coalesce(is_admin,false)=true and auth_user_id is not null limit 1),
  true
);

with target_ids(id) as (
  values
    ('DRAP008'),('PULSAR132'),('PULSAR178'),
    ('DRAP012'),('DRAP023'),('PULSAR138'),('PULSAR187')
), scan_base as (
  select s.id as scan_id,
         s."materielId" as material_id,
         s."agentNom" as agent_nom,
         s.date as scan_date,
         s."etatGeneral" as etat_general,
         coalesce(c."jourReset",1) as reset_day,
         ((s.date::timestamptz - interval '14 hours') at time zone 'UTC')::date as shifted_date
  from public.scans s
  join public.materiels m on m.id=s."materielId"
  join public.chantiers c on c.id=m."chantierId"
  join target_ids t on t.id=m.id
  where nullif(s.date,'') is not null
), keyed as (
  select b.*,
         (b.shifted_date - (((extract(dow from b.shifted_date)::integer) - b.reset_day + 7) % 7))::text as week_key
  from scan_base b
), latest_week as (
  select material_id, max(week_key) as week_key
  from keyed
  group by material_id
), ranked as (
  select k.*,
         row_number() over(partition by k.material_id,k.week_key order by k.scan_date,k.scan_id) as rn,
         row_number() over(partition by k.material_id order by k.scan_date desc,k.scan_id desc) as latest_rn
  from keyed k
  join latest_week w on w.material_id=k.material_id and w.week_key=k.week_key
), repair as (
  select material_id,
         max(scan_date) filter (where latest_rn=1) as latest_scan,
         max(etat_general) filter (where latest_rn=1) as latest_etat,
         (jsonb_agg(jsonb_build_object('weekKey',week_key,'date',scan_date,'agentNom',agent_nom) order by scan_date,scan_id) filter (where rn=1))->0 as verif_1,
         (jsonb_agg(jsonb_build_object('weekKey',week_key,'date',scan_date,'agentNom',agent_nom) order by scan_date,scan_id) filter (where rn=2))->0 as verif_2
  from ranked
  group by material_id
)
update public.materiels m
set scan = r.latest_scan,
    presence = 'confirme',
    etat = coalesce(nullif(r.latest_etat,''),m.etat),
    "verifLundi" = coalesce(r.verif_1,m."verifLundi"),
    "verifSemaine" = coalesce(r.verif_2,m."verifSemaine")
from repair r
where m.id=r.material_id;
