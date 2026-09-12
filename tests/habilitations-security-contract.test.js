const fs=require('fs');
const assert=require('assert');
const path='docs/sql/2026-09-12-agent-habilitations.sql';
assert.ok(fs.existsSync(path),'habilitation SQL contract must exist');
const sql=fs.readFileSync(path,'utf8');
const low=sql.toLowerCase();
for(const token of [
  'agent_habilitation_documents',
  'agent_habilitations',
  'enable row level security',
  'railops-habilitations',
  'private.railops_activate_habilitation_document_impl',
  'public.railops_activate_habilitation_document',
  'public.railops_habilitations_scope',
  'public.railops_archive_habilitation_document',
  'auth.uid()',
  "status = 'active'",
  'revoke all on function',
  'grant execute on function'
]) assert.ok(low.includes(token.toLowerCase()),`missing security contract token: ${token}`);
assert.ok(low.includes("set search_path = ''"),'privileged helpers must use an empty search_path');
assert.ok(/security\s+definer/i.test(sql),'private privileged helpers must be security definer');
assert.ok(/security\s+invoker/i.test(sql),'public RPC wrappers must remain security invoker');
assert.ok(/unique\s*\([^)]*document_id[^)]*code[^)]*valid_until/i.test(sql),'document/code/date uniqueness must be enforced');
assert.ok(/where\s*\(status\s*=\s*'active'\)/i.test(sql),'one-active-document partial index must exist');
assert.ok(low.includes("storage.foldername(name))[1] = (select auth.uid())::text"),'storage upload must be restricted to the caller folder');
assert.ok(!/public\s*=\s*true/i.test(sql),'storage bucket must never be public');
assert.ok(low.includes("p_storage_path <> (select auth.uid())::text || '/' || p_document_id::text || '.pdf'"),'activation must bind the DB document id to the caller-owned storage path');
assert.ok(low.includes('from storage.objects'),'activation must verify that the uploaded object exists before DB activation');
assert.ok(low.includes('revoke all on public.agent_habilitation_documents from anon, authenticated'),'direct table access must be revoked');
assert.ok(low.includes('revoke all on public.agent_habilitations from anon, authenticated'),'direct item access must be revoked');
console.log('habilitations SQL security contract: ok');
