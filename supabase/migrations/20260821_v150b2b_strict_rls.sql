-- RailOps v150B-2B — RLS STRICTES
-- NE PAS APPLIQUER avant validation complète du client v150B-2B et déploiement compatible.
-- Cette migration ferme les anciennes policies ouvertes et réduit les grants API.

begin;

-- ---------------------------------------------------------------------------
-- Helpers de policy : SECURITY DEFINER pour éviter les récursions RLS sur users.
-- ---------------------------------------------------------------------------
create or replace function public.railops_policy_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.role from public.users u where u.auth_user_id=auth.uid() limit 1;
$$;

create or replace function public.railops_policy_name()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.nom from public.users u where u.auth_user_id=auth.uid() limit 1;
$$;

create or replace function public.railops_policy_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select u.is_admin from public.users u where u.auth_user_id=auth.uid() limit 1),false);
$$;

create or replace function public.railops_policy_can_create_chantier(p_chef text,p_chefs jsonb)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.railops_policy_is_admin()
      or (
        public.railops_policy_role()='chef'
        and (
          public.railops_norm_name(p_chef)=public.railops_norm_name(public.railops_policy_name())
          or exists(
            select 1
            from jsonb_array_elements_text(coalesce(p_chefs,'[]'::jsonb)) x(value)
            where public.railops_norm_name(x.value)=public.railops_norm_name(public.railops_policy_name())
          )
        )
      );
$$;

revoke all on function public.railops_policy_role() from public, anon;
revoke all on function public.railops_policy_name() from public, anon;
revoke all on function public.railops_policy_is_admin() from public, anon;
revoke all on function public.railops_policy_can_create_chantier(text,jsonb) from public, anon;
grant execute on function public.railops_policy_role() to authenticated;
grant execute on function public.railops_policy_name() to authenticated;
grant execute on function public.railops_policy_is_admin() to authenticated;
grant execute on function public.railops_policy_can_create_chantier(text,jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Supprime explicitement les policies ouvertes actuellement auditées.
-- ---------------------------------------------------------------------------
drop policy if exists "ecriture_agents" on public.agents;
drop policy if exists "lecture profil" on public.agents;
drop policy if exists "lecture_agents" on public.agents;

drop policy if exists "ecriture_app_config" on public.app_config;
drop policy if exists "lecture_app_config" on public.app_config;

drop policy if exists "ecriture_chantiers" on public.chantiers;
drop policy if exists "lecture_chantiers" on public.chantiers;

drop policy if exists "créer inspection" on public.inspections;
drop policy if exists "ecriture_inspections" on public.inspections;
drop policy if exists "lecture inspections" on public.inspections;
drop policy if exists "lecture_inspections" on public.inspections;

drop policy if exists "lecture matériel" on public.materiel;
drop policy if exists "update matériel" on public.materiel;

drop policy if exists "ecriture_materiels" on public.materiels;
drop policy if exists "lecture_materiels" on public.materiels;

drop policy if exists "ecriture_scans" on public.scans;
drop policy if exists "lecture_scans" on public.scans;

drop policy if exists "ecriture_users" on public.users;
drop policy if exists "lecture_users" on public.users;

-- ---------------------------------------------------------------------------
-- RLS activée partout où une API publique pourrait atteindre les données.
-- ---------------------------------------------------------------------------
alter table public.agents enable row level security;
alter table public.app_config enable row level security;
alter table public.chantiers enable row level security;
alter table public.deleted_ids enable row level security;
alter table public.inspections enable row level security;
alter table public.materiel enable row level security;
alter table public.materiels enable row level security;
alter table public.prix_catalogue enable row level security;
alter table public.scans enable row level security;
alter table public.users enable row level security;

-- ---------------------------------------------------------------------------
-- Grants minimaux. Les RPC SECURITY DEFINER et Edge Functions restent utilisables.
-- ---------------------------------------------------------------------------
revoke all privileges on table public.agents from anon, authenticated;
revoke all privileges on table public.app_config from anon, authenticated;
revoke all privileges on table public.chantiers from anon, authenticated;
revoke all privileges on table public.deleted_ids from anon, authenticated;
revoke all privileges on table public.inspections from anon, authenticated;
revoke all privileges on table public.materiel from anon, authenticated;
revoke all privileges on table public.materiels from anon, authenticated;
revoke all privileges on table public.prix_catalogue from anon, authenticated;
revoke all privileges on table public.scans from anon, authenticated;
revoke all privileges on table public.users from anon, authenticated;

-- Version publique uniquement : aucun code d'invitation n'est exposé.
grant select on table public.app_config to anon, authenticated;

-- Les imports Chef et les lectures métier utilisent encore certains accès directs,
-- tous bornés par les policies ci-dessous.
grant select,insert,update,delete on table public.chantiers to authenticated;
grant select,insert,update,delete on table public.materiels to authenticated;
grant select,insert,update,delete on table public.scans to authenticated;
grant select,insert,update,delete on table public.deleted_ids to authenticated;
grant select,insert,update,delete on table public.prix_catalogue to authenticated;

-- ---------------------------------------------------------------------------
-- app_config : seule la clé version reste lisible depuis le navigateur.
-- ---------------------------------------------------------------------------
create policy railops_app_version_read
on public.app_config
for select
to anon,authenticated
using (key='version');

-- ---------------------------------------------------------------------------
-- chantiers
-- Admin : tout.
-- Chef : ses structures seulement.
-- Agent/CTE : lecture de leurs affectations seulement.
-- Chef chantier : aucune lecture directe (RPC statistiques uniquement).
-- ---------------------------------------------------------------------------
create policy railops_chantiers_select
on public.chantiers
for select
to authenticated
using (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role() in ('chef','agent','cte')
    and public.railops_can_access_chantier(id)
  )
);

create policy railops_chantiers_insert
on public.chantiers
for insert
to authenticated
with check (
  public.railops_policy_is_admin()
  or public.railops_policy_can_create_chantier(chef,chefs)
);

create policy railops_chantiers_update
on public.chantiers
for update
to authenticated
using (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier(id))
)
with check (
  public.railops_policy_is_admin()
  or public.railops_policy_can_create_chantier(chef,chefs)
);

create policy railops_chantiers_delete
on public.chantiers
for delete
to authenticated
using (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier(id))
);

-- ---------------------------------------------------------------------------
-- materiels
-- Lecture : Admin, Chef, Agent, CTE dans leur scope.
-- Ecriture directe : Admin/Chef seulement. Agent/CTE passent par RPC bornées.
-- Chef chantier : aucune référence directe.
-- ---------------------------------------------------------------------------
create policy railops_materiels_select
on public.materiels
for select
to authenticated
using (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role() in ('chef','agent','cte')
    and public.railops_can_access_chantier("chantierId")
  )
);

create policy railops_materiels_insert
on public.materiels
for insert
to authenticated
with check (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
);

create policy railops_materiels_update
on public.materiels
for update
to authenticated
using (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
)
with check (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
);

create policy railops_materiels_delete
on public.materiels
for delete
to authenticated
using (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
);

-- ---------------------------------------------------------------------------
-- scans
-- Lecture dans le scope pour Chef/Agent/CTE.
-- Ecriture directe réservée Admin/Chef ; Agent/CTE utilisent railops_upsert_scan().
-- ---------------------------------------------------------------------------
create policy railops_scans_select
on public.scans
for select
to authenticated
using (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role() in ('chef','agent','cte')
    and public.railops_can_access_chantier("chantierId")
  )
);

create policy railops_scans_insert
on public.scans
for insert
to authenticated
with check (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
);

create policy railops_scans_update
on public.scans
for update
to authenticated
using (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
)
with check (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
);

create policy railops_scans_delete
on public.scans
for delete
to authenticated
using (
  public.railops_policy_is_admin()
  or (public.railops_policy_role()='chef' and public.railops_can_access_chantier("chantierId"))
);

-- ---------------------------------------------------------------------------
-- deleted_ids
-- Les anciens tombstones sans chantier restent visibles aux Chefs pour compatibilité.
-- Les nouveaux tombstones sont cloisonnés par chantier.
-- ---------------------------------------------------------------------------
create policy railops_deleted_ids_select
on public.deleted_ids
for select
to authenticated
using (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role()='chef'
    and (chantier_id is null or public.railops_can_access_chantier(chantier_id))
  )
);

create policy railops_deleted_ids_insert
on public.deleted_ids
for insert
to authenticated
with check (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role()='chef'
    and chantier_id is not null
    and public.railops_can_access_chantier(chantier_id)
  )
);

create policy railops_deleted_ids_update
on public.deleted_ids
for update
to authenticated
using (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role()='chef'
    and (chantier_id is null or public.railops_can_access_chantier(chantier_id))
  )
)
with check (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role()='chef'
    and (chantier_id is null or public.railops_can_access_chantier(chantier_id))
  )
);

create policy railops_deleted_ids_delete
on public.deleted_ids
for delete
to authenticated
using (
  public.railops_policy_is_admin()
  or (
    public.railops_policy_role()='chef'
    and (chantier_id is null or public.railops_can_access_chantier(chantier_id))
  )
);

-- ---------------------------------------------------------------------------
-- Catalogue prix : Chef/Admin uniquement.
-- ---------------------------------------------------------------------------
create policy railops_prix_catalogue_all
on public.prix_catalogue
for all
to authenticated
using (
  public.railops_policy_is_admin() or public.railops_policy_role()='chef'
)
with check (
  public.railops_policy_is_admin() or public.railops_policy_role()='chef'
);

-- users, agents, inspections et materiel legacy : aucun accès direct navigateur.
-- Les besoins RailOps passent par RPC/Edge Functions.

commit;
