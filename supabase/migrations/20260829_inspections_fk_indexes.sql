-- RailOps — performance-only indexes approved on 2026-08-29.
-- No data, constraint, permission, RLS policy, or business rule is changed.

create index if not exists inspections_agent_id_idx
  on public.inspections (agent_id);

create index if not exists inspections_materiel_id_idx
  on public.inspections (materiel_id);
