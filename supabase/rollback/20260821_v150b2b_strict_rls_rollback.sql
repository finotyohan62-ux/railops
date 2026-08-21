-- RailOps v150B-2B — ROLLBACK RLS STRICTES
-- Restaure le modèle de policies/grants observé avant le verrouillage.
-- N'annule PAS les migrations additives (Auth/RPC/colonnes tombstone).

begin;

-- Policies v150B-2B
drop policy if exists railops_app_version_read on public.app_config;
drop policy if exists railops_chantiers_select on public.chantiers;
drop policy if exists railops_chantiers_insert on public.chantiers;
drop policy if exists railops_chantiers_update on public.chantiers;
drop policy if exists railops_chantiers_delete on public.chantiers;
drop policy if exists railops_materiels_select on public.materiels;
drop policy if exists railops_materiels_insert on public.materiels;
drop policy if exists railops_materiels_update on public.materiels;
drop policy if exists railops_materiels_delete on public.materiels;
drop policy if exists railops_scans_select on public.scans;
drop policy if exists railops_scans_insert on public.scans;
drop policy if exists railops_scans_update on public.scans;
drop policy if exists railops_scans_delete on public.scans;
drop policy if exists railops_deleted_ids_select on public.deleted_ids;
drop policy if exists railops_deleted_ids_insert on public.deleted_ids;
drop policy if exists railops_deleted_ids_update on public.deleted_ids;
drop policy if exists railops_deleted_ids_delete on public.deleted_ids;
drop policy if exists railops_prix_catalogue_all on public.prix_catalogue;

-- Helpers de policy v150B-2B
drop function if exists public.railops_policy_can_create_chantier(text,jsonb);
drop function if exists public.railops_policy_is_admin();
drop function if exists public.railops_policy_name();
drop function if exists public.railops_policy_role();

-- RLS désactivée sur les deux tables qui étaient hors RLS avant v150B-2B.
alter table public.deleted_ids disable row level security;
alter table public.prix_catalogue disable row level security;

-- Grants historiques : anon/authenticated avaient tous les privilèges table.
grant all privileges on table public.agents to anon, authenticated;
grant all privileges on table public.app_config to anon, authenticated;
grant all privileges on table public.chantiers to anon, authenticated;
grant all privileges on table public.deleted_ids to anon, authenticated;
grant all privileges on table public.inspections to anon, authenticated;
grant all privileges on table public.materiel to anon, authenticated;
grant all privileges on table public.materiels to anon, authenticated;
grant all privileges on table public.prix_catalogue to anon, authenticated;
grant all privileges on table public.scans to anon, authenticated;
grant all privileges on table public.users to anon, authenticated;

-- Policies historiques observées avant verrouillage.
create policy "ecriture_agents" on public.agents for all to public using (true);
create policy "lecture profil" on public.agents for select to authenticated using (true);
create policy "lecture_agents" on public.agents for select to public using (true);

create policy "ecriture_app_config" on public.app_config for all to public using (false);
create policy "lecture_app_config" on public.app_config for select to public using (true);

create policy "ecriture_chantiers" on public.chantiers for all to public using (true);
create policy "lecture_chantiers" on public.chantiers for select to public using (true);

create policy "créer inspection" on public.inspections for insert to authenticated with check (true);
create policy "ecriture_inspections" on public.inspections for all to public using (true);
create policy "lecture inspections" on public.inspections for select to authenticated using (true);
create policy "lecture_inspections" on public.inspections for select to public using (true);

create policy "lecture matériel" on public.materiel for select to authenticated using (true);
create policy "update matériel" on public.materiel for update to authenticated using (true);

create policy "ecriture_materiels" on public.materiels for all to public using (true);
create policy "lecture_materiels" on public.materiels for select to public using (true);

create policy "ecriture_scans" on public.scans for all to public using (true);
create policy "lecture_scans" on public.scans for select to public using (true);

create policy "ecriture_users" on public.users for all to public using (true);
create policy "lecture_users" on public.users for select to public using (true);

commit;
