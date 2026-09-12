-- RailOps - agent habilitations
-- Prototype SQL contract only. Do not apply until the standalone PDF flow is accepted.

create schema if not exists private;

create table if not exists public.agent_habilitation_documents (
  id uuid primary key,
  user_id text not null references public.users(id) on delete cascade,
  storage_path text not null unique,
  source_method text not null check (source_method in ('text','ocr')),
  source_confidence numeric(5,4),
  status text not null default 'pending' check (status in ('pending','active','archived')),
  uploaded_by uuid not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  archived_at timestamptz,
  check (source_confidence is null or (source_confidence >= 0 and source_confidence <= 1))
);

create table if not exists public.agent_habilitations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.agent_habilitation_documents(id) on delete cascade,
  code text not null check (length(code) between 2 and 32),
  label_source text,
  valid_from date,
  valid_until date not null,
  created_at timestamptz not null default now(),
  check (valid_from is null or valid_from <= valid_until),
  unique (document_id, code, valid_until)
);

create unique index if not exists agent_habilitation_documents_one_active_per_user
  on public.agent_habilitation_documents(user_id)
  where (status = 'active');

create index if not exists agent_habilitations_document_idx
  on public.agent_habilitations(document_id);

alter table public.agent_habilitation_documents enable row level security;
alter table public.agent_habilitations enable row level security;

-- No direct client table access. All reads/writes go through narrowly scoped RPCs.
revoke all on public.agent_habilitation_documents from anon, authenticated;
revoke all on public.agent_habilitations from anon, authenticated;
grant select, insert, update, delete on public.agent_habilitation_documents to service_role;
grant select, insert, update, delete on public.agent_habilitations to service_role;

-- Private PDF bucket. Object name is always <auth.uid()>/<document_uuid>.pdf.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('railops-habilitations','railops-habilitations',false,10485760,array['application/pdf'])
on conflict (id) do update
set public=false,
    file_size_limit=10485760,
    allowed_mime_types=array['application/pdf'];

drop policy if exists "railops habilitations upload own" on storage.objects;
create policy "railops habilitations upload own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'railops-habilitations'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) = 'pdf'
);

drop policy if exists "railops habilitations read own" on storage.objects;
create policy "railops habilitations read own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'railops-habilitations'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

-- Intentionally no authenticated UPDATE/DELETE storage policy. A client cannot
-- mutate or remove an already uploaded proof document directly.

create or replace function private.railops_activate_habilitation_document_impl(
  p_document_id uuid,
  p_storage_path text,
  p_source_method text,
  p_source_confidence numeric,
  p_items jsonb
)
returns table(document_id uuid, user_id text, activated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth uuid := (select auth.uid());
  v_user_id text;
  v_now timestamptz := clock_timestamp();
  v_item jsonb;
  v_code text;
  v_label text;
  v_from_text text;
  v_until_text text;
  v_valid_from date;
  v_valid_until date;
begin
  if v_auth is null then
    raise exception 'RAILOPS_AUTH_REQUIRED' using errcode='42501';
  end if;

  select u.id
    into v_user_id
  from public.users u
  where u.auth_user_id = v_auth
  limit 1;

  if v_user_id is null then
    raise exception 'RAILOPS_PROFILE_REQUIRED' using errcode='42501';
  end if;

  if p_document_id is null then
    raise exception 'RAILOPS_HABILITATION_DOCUMENT_ID_REQUIRED' using errcode='22023';
  end if;

  if p_storage_path <> (select auth.uid())::text || '/' || p_document_id::text || '.pdf' then
    raise exception 'RAILOPS_HABILITATION_STORAGE_PATH_INVALID' using errcode='22023';
  end if;

  if p_source_method not in ('text','ocr') then
    raise exception 'RAILOPS_HABILITATION_SOURCE_METHOD_INVALID' using errcode='22023';
  end if;

  if p_source_confidence is not null and (p_source_confidence < 0 or p_source_confidence > 1) then
    raise exception 'RAILOPS_HABILITATION_CONFIDENCE_INVALID' using errcode='22023';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'RAILOPS_HABILITATION_ITEMS_REQUIRED' using errcode='22023';
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'railops-habilitations'
      and o.name = p_storage_path
      and o.owner_id = v_auth::text
  ) then
    raise exception 'RAILOPS_HABILITATION_PDF_NOT_FOUND' using errcode='22023';
  end if;

  insert into public.agent_habilitation_documents(
    id,user_id,storage_path,source_method,source_confidence,status,uploaded_by,created_at
  ) values (
    p_document_id,v_user_id,p_storage_path,p_source_method,p_source_confidence,'pending',v_auth,v_now
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_code := upper(regexp_replace(coalesce(v_item->>'code',''),'[^A-Za-z0-9]','','g'));
    v_label := nullif(trim(coalesce(v_item->>'labelSource','')), '');
    v_from_text := nullif(trim(coalesce(v_item->>'validFrom','')), '');
    v_until_text := nullif(trim(coalesce(v_item->>'validUntil','')), '');

    if v_code = '' or length(v_code) < 2 or length(v_code) > 32 then
      raise exception 'RAILOPS_HABILITATION_CODE_INVALID' using errcode='22023';
    end if;

    if v_until_text is null or v_until_text !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'RAILOPS_HABILITATION_VALID_UNTIL_INVALID' using errcode='22023';
    end if;

    begin
      v_valid_until := v_until_text::date;
    exception when others then
      raise exception 'RAILOPS_HABILITATION_VALID_UNTIL_INVALID' using errcode='22023';
    end;

    if to_char(v_valid_until,'YYYY-MM-DD') <> v_until_text then
      raise exception 'RAILOPS_HABILITATION_VALID_UNTIL_INVALID' using errcode='22023';
    end if;

    v_valid_from := null;
    if v_from_text is not null then
      if v_from_text !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'RAILOPS_HABILITATION_VALID_FROM_INVALID' using errcode='22023';
      end if;
      begin
        v_valid_from := v_from_text::date;
      exception when others then
        raise exception 'RAILOPS_HABILITATION_VALID_FROM_INVALID' using errcode='22023';
      end;
      if to_char(v_valid_from,'YYYY-MM-DD') <> v_from_text then
        raise exception 'RAILOPS_HABILITATION_VALID_FROM_INVALID' using errcode='22023';
      end if;
      if v_valid_from > v_valid_until then
        raise exception 'RAILOPS_HABILITATION_RANGE_INVALID' using errcode='22023';
      end if;
    end if;

    insert into public.agent_habilitations(document_id,code,label_source,valid_from,valid_until)
    values (p_document_id,v_code,v_label,v_valid_from,v_valid_until);
  end loop;

  update public.agent_habilitation_documents d
     set status='archived', archived_at=v_now
   where d.user_id=v_user_id
     and d.status='active'
     and d.id<>p_document_id;

  update public.agent_habilitation_documents d
     set status='active', activated_at=v_now, archived_at=null
   where d.id=p_document_id
     and d.user_id=v_user_id
     and d.status='pending';

  return query
  select p_document_id,v_user_id,v_now;
end;
$$;

create or replace function private.railops_habilitations_scope_impl(p_user_id text default null)
returns table(
  document_id uuid,
  user_id text,
  activated_at timestamptz,
  source_method text,
  source_confidence numeric,
  items jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_auth uuid := (select auth.uid());
  v_me_id text;
  v_role text;
  v_admin boolean;
  v_can_read_others boolean;
begin
  if v_auth is null then
    raise exception 'RAILOPS_AUTH_REQUIRED' using errcode='42501';
  end if;

  select u.id,u.role,coalesce(u.is_admin,false)
    into v_me_id,v_role,v_admin
  from public.users u
  where u.auth_user_id=v_auth
  limit 1;

  if v_me_id is null then
    raise exception 'RAILOPS_PROFILE_REQUIRED' using errcode='42501';
  end if;

  -- Chef de chantier cross-agent scope is deliberately not widened here until
  -- RailOps has a server-verifiable team/perimeter relation for that role.
  v_can_read_others := v_admin or v_role='chef';

  if p_user_id is not null and p_user_id<>v_me_id and not v_can_read_others then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  return query
  select
    d.id,
    d.user_id,
    d.activated_at,
    d.source_method,
    d.source_confidence,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'code',h.code,
          'labelSource',h.label_source,
          'validFrom',case when h.valid_from is null then null else to_char(h.valid_from,'YYYY-MM-DD') end,
          'validUntil',to_char(h.valid_until,'YYYY-MM-DD')
        ) order by h.code,h.valid_until
      ) filter (where h.id is not null),
      '[]'::jsonb
    ) as items
  from public.agent_habilitation_documents d
  left join public.agent_habilitations h on h.document_id=d.id
  where d.status='active'
    and (
      (v_can_read_others and (p_user_id is null or d.user_id=p_user_id))
      or
      (not v_can_read_others and d.user_id=v_me_id and (p_user_id is null or p_user_id=v_me_id))
    )
  group by d.id,d.user_id,d.activated_at,d.source_method,d.source_confidence
  order by d.user_id;
end;
$$;

create or replace function private.railops_archive_habilitation_document_impl(p_document_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth uuid := (select auth.uid());
  v_role text;
  v_admin boolean;
  v_changed integer;
begin
  if v_auth is null then
    raise exception 'RAILOPS_AUTH_REQUIRED' using errcode='42501';
  end if;

  select u.role,coalesce(u.is_admin,false)
    into v_role,v_admin
  from public.users u
  where u.auth_user_id=v_auth
  limit 1;

  if v_role is null or not (v_admin or v_role='chef') then
    raise exception 'RAILOPS_FORBIDDEN' using errcode='42501';
  end if;

  update public.agent_habilitation_documents d
     set status='archived', archived_at=clock_timestamp()
   where d.id=p_document_id
     and d.status in ('pending','active');

  get diagnostics v_changed = row_count;
  return v_changed>0;
end;
$$;

-- Public Data API wrappers stay SECURITY INVOKER. The privileged implementation
-- lives in the non-exposed private schema and performs its own auth.uid() checks.
create or replace function public.railops_activate_habilitation_document(
  p_document_id uuid,
  p_storage_path text,
  p_source_method text,
  p_source_confidence numeric,
  p_items jsonb
)
returns table(document_id uuid, user_id text, activated_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.railops_activate_habilitation_document_impl(
    p_document_id,p_storage_path,p_source_method,p_source_confidence,p_items
  );
$$;

create or replace function public.railops_habilitations_scope(p_user_id text default null)
returns table(
  document_id uuid,
  user_id text,
  activated_at timestamptz,
  source_method text,
  source_confidence numeric,
  items jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.railops_habilitations_scope_impl(p_user_id);
$$;

create or replace function public.railops_archive_habilitation_document(p_document_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.railops_archive_habilitation_document_impl(p_document_id);
$$;

grant usage on schema private to authenticated;

revoke all on function private.railops_activate_habilitation_document_impl(uuid,text,text,numeric,jsonb) from public, anon;
revoke all on function private.railops_habilitations_scope_impl(text) from public, anon;
revoke all on function private.railops_archive_habilitation_document_impl(uuid) from public, anon;
grant execute on function private.railops_activate_habilitation_document_impl(uuid,text,text,numeric,jsonb) to authenticated;
grant execute on function private.railops_habilitations_scope_impl(text) to authenticated;
grant execute on function private.railops_archive_habilitation_document_impl(uuid) to authenticated;

revoke all on function public.railops_activate_habilitation_document(uuid,text,text,numeric,jsonb) from public, anon;
revoke all on function public.railops_habilitations_scope(text) from public, anon;
revoke all on function public.railops_archive_habilitation_document(uuid) from public, anon;
grant execute on function public.railops_activate_habilitation_document(uuid,text,text,numeric,jsonb) to authenticated;
grant execute on function public.railops_habilitations_scope(text) to authenticated;
grant execute on function public.railops_archive_habilitation_document(uuid) to authenticated;
