# Agent Habilitations Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add self-managed PDF habilitations to each RailOps agent profile, automatically extract every habilitation and its individual validity date, and activate a new document without ever losing the currently active habilitation on failure.

**Architecture:** Keep the feature isolated from scanner/register/sync business logic. A pure parser and PDF reader run in the browser, a dedicated profile module owns the UI, Supabase Storage keeps PDFs private, and dedicated server-side RPC/Edge Function boundaries enforce ownership, read permissions, signed document access, and atomic database activation. Existing RailOps role visibility is reused rather than inventing a second authorization model.

**Tech Stack:** HTML/CSS/native JavaScript, Node 22 regression scripts, Supabase Postgres/RLS/Storage/Edge Functions, `@supabase/supabase-js@2.116.0` for the new Edge Function, PDF.js `pdfjs-dist@6.3.289` loaded on demand, Tesseract.js `7.0.0` loaded on demand only for OCR fallback, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-12-agent-habilitations-profile-design.md`

## Global Constraints

- Work only on branch `feat/agent-habilitations-profile` until the dedicated PR is reviewed.
- Do not rewrite RailOps or migrate frameworks.
- Do not change scanner, register import, multi-chantier, material persistence, Chef de chantier statistics, or existing offline queue semantics.
- The agent may replace only their own habilitation document.
- No mandatory Chef/Admin validation is introduced.
- Every extracted habilitation has its own `valid_until` date; an undated or ambiguous item blocks activation.
- A failed upload, read, parse, RPC call, or network request must leave the current active document untouched.
- PDFs live in a private Supabase Storage bucket; no public URL is persisted.
- `service_role` is server-only and must never appear in browser code.
- New exposed tables have RLS enabled.
- New `SECURITY DEFINER` functions must set a fixed `search_path`, verify `auth.uid()`, revoke default `PUBLIC` execution, and grant only the required authenticated execution.
- External PDF/OCR dependencies are version-pinned and loaded only on the update flow, never during normal application startup.
- The first version does not block chantier assignment and does not add push/email notifications.
- Do not merge until a representative habilitation PDF has passed the text/OCR extraction acceptance test.
- Keep Vercel usage low: run local/CI regression first and perform one final production deployment after merge when possible.

## File Structure

- `js/core/habilitations-parser.js` — pure normalization, code/date pairing, ambiguity detection, and expiry status calculation.
- `js/core/habilitations-pdf.js` — lazy PDF.js text extraction plus lazy Tesseract OCR fallback; no persistence or UI.
- `js/core/habilitations.js` — browser orchestration, profile rendering, upload/preview/confirm flow, signed PDF access, and history display.
- `supabase/functions/railops-habilitations/index.ts` — authenticated signed-URL access and exceptional Chef/Admin archive endpoint; no PDF parsing.
- `docs/sql/2026-09-12-agent-habilitations.sql` — auditable schema, private bucket, Storage policies, read RPC, activation RPC, archive RPC, grants and RLS.
- `tests/habilitations-parser.test.js` — pure parser/status regression contract.
- `tests/habilitations-pdf.test.js` — PDF reader routing contract with injected PDF/OCR adapters.
- `tests/habilitations-security-contract.test.js` — SQL/Edge Function static security contract.
- `tests/habilitations-ui.test.js` — profile ownership, preview, failure-preservation, and loader contract.
- `.github/workflows/modules-refactor-check.yml` — add the four new Node regression scripts to the existing consolidated CI job instead of creating another workflow.
- `js/core/sync.js` — add one isolated loader entry for `habilitations.js`; no sync behavior changes.

---

### Task 1: Pure habilitation parser and status model

**Files:**
- Create: `js/core/habilitations-parser.js`
- Create: `tests/habilitations-parser.test.js`

**Interfaces:**
- Consumes: plain extracted PDF/OCR text and an optional reference date.
- Produces: `normalizeCode(value)`, `parseFrenchDate(value)`, `extractHabilitations(text)`, and `habilitationStatus(validUntil, now, warningDays)`.
- `extractHabilitations(text)` returns `{ ok:boolean, items:Array<{code,labelSource,validFrom,validUntil}>, ambiguities:string[] }`.

- [ ] **Step 1: Write the failing parser tests**

Create `tests/habilitations-parser.test.js` with explicit cases for multiple codes, individual dates, accents/slashes/spaces, duplicate codes, undated codes, conflicting dates, and status thresholds:

```js
const assert=require('assert');
const parser=require('../js/core/habilitations-parser.js');

assert.equal(parser.normalizeCode('H3 B3'),'H3B3');
assert.equal(parser.normalizeCode('CH3 / CB3'),'CH3CB3');
assert.equal(parser.normalizeCode('APS 9'),'APS9');

const text=`
H1B1 - valable jusqu'au 15/04/2027
S11 - validité 03/11/2026
APS9 - échéance : 28/09/2026
`;
const parsed=parser.extractHabilitations(text);
assert.equal(parsed.ok,true);
assert.deepEqual(parsed.items.map(x=>[x.code,x.validUntil]),[
  ['H1B1','2027-04-15'],
  ['S11','2026-11-03'],
  ['APS9','2026-09-28']
]);

const ambiguous=parser.extractHabilitations('H3B3 S11\nValidité : 31/12/2027');
assert.equal(ambiguous.ok,false);
assert.ok(ambiguous.ambiguities.length>0);

assert.equal(parser.habilitationStatus('2026-09-11','2026-09-12',60),'expired');
assert.equal(parser.habilitationStatus('2026-10-01','2026-09-12',60),'expiring');
assert.equal(parser.habilitationStatus('2027-04-15','2026-09-12',60),'valid');
console.log('habilitations parser contract: ok');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/habilitations-parser.test.js`

Expected: FAIL because `js/core/habilitations-parser.js` does not exist.

- [ ] **Step 3: Implement the minimal pure module**

Use the same UMD/CommonJS pattern as existing RailOps focused modules. Normalize dates to ISO `YYYY-MM-DD`, only accept recognized RailOps-style codes that contain letters and digits, keep the original source label, deduplicate an identical `code + validUntil`, and return `ok:false` when a detected code cannot be paired unambiguously with a date.

Core export shape:

```js
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RailOpsHabilitationsParser=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const CODE_PATTERNS=[
    /\bH\s*\d\s*B\s*\d\b/gi,
    /\bCH\s*\d\s*[/ -]?\s*CB\s*\d\b/gi,
    /\bS\s*\d{1,2}\b/gi,
    /\bAPS\s*\d{1,2}\b/gi
  ];
  function normalizeCode(value){
    return String(value||'').toUpperCase().replace(/[\/\s-]+/g,'');
  }
  function habitationStatus(validUntil,now=new Date(),warningDays=60){
    const end=new Date(`${validUntil}T23:59:59Z`);
    const ref=now instanceof Date?now:new Date(`${now}T00:00:00Z`);
    if(end<ref)return 'expired';
    return (end-ref)<=warningDays*86400000?'expiring':'valid';
  }
  return {normalizeCode,parseFrenchDate,extractHabilitations,habilitationStatus};
});
```

Implement `parseFrenchDate` and `extractHabilitations` to satisfy only the tested deterministic associations; do not guess when multiple codes share one distant date.

- [ ] **Step 4: Run parser tests**

Run: `node tests/habilitations-parser.test.js`

Expected: `habilitations parser contract: ok`.

- [ ] **Step 5: Commit the parser slice**

```bash
git add js/core/habilitations-parser.js tests/habilitations-parser.test.js
git commit -m "feat: add habilitation parser core"
```

---

### Task 2: Secure database, private Storage bucket, and atomic activation contract

**Files:**
- Create: `docs/sql/2026-09-12-agent-habilitations.sql`
- Create: `tests/habilitations-security-contract.test.js`

**Interfaces:**
- Consumes: authenticated `auth.uid()`, existing `public.users.auth_user_id`, and the established RailOps roles `agent`, `cte`, `chef`, `chef_chantier`, `admin-owner` through `users.is_admin`.
- Produces RPCs `railops_habilitations_scope(p_user_id text default null)`, `railops_activate_habilitation_document(...)`, and `railops_archive_habilitation_document(p_document_id uuid)` plus private bucket `railops-habilitations`.
- Visibility mirrors `railops_user_directory`: self for Agent/CTE; directory-visible users for Chef/Chef de chantier/Admin. Only self can activate a replacement; only Chef/Admin can exceptionally archive another user's document.

- [ ] **Step 1: Write a failing static security contract**

Create `tests/habilitations-security-contract.test.js`:

```js
const fs=require('fs');
const assert=require('assert');
const path='docs/sql/2026-09-12-agent-habilitations.sql';
assert.ok(fs.existsSync(path),'habilitation SQL migration missing');
const sql=fs.readFileSync(path,'utf8');
for(const token of [
  'agent_habilitation_documents','agent_habilitations','enable row level security',
  'railops-habilitations','railops_habilitations_scope','railops_activate_habilitation_document',
  'railops_archive_habilitation_document','auth.uid()','revoke all on function'
]) assert.ok(sql.toLowerCase().includes(token.toLowerCase()),`missing security token: ${token}`);
assert.ok(/unique\s*\([^)]*document_id[^)]*code[^)]*valid_until/i.test(sql),'document/code/date uniqueness missing');
assert.ok(/where\s+status\s*=\s*'active'/i.test(sql),'one-active-document partial index missing');
assert.ok(!/public\s*=\s*true/i.test(sql),'bucket must not be public');
console.log('habilitations SQL security contract: ok');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/habilitations-security-contract.test.js`

Expected: FAIL because the SQL file does not exist.

- [ ] **Step 3: Write the auditable SQL migration**

Create both tables with foreign keys to `public.users(id)`, date/status checks, one-active-document partial unique index, and RLS enabled. The migration must create a private bucket idempotently:

```sql
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('railops-habilitations','railops-habilitations',false,10485760,array['application/pdf'])
on conflict (id) do update
set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];
```

Storage object names must be exactly `<auth.uid()>/<document_uuid>.pdf`. Add authenticated INSERT/SELECT/DELETE policies that require the first path segment to equal `auth.uid()::text`; do not grant cross-user direct Storage SELECT.

Implement `railops_activate_habilitation_document` as one Postgres function call. It must:
1. resolve the current `users.id` from `auth.uid()`;
2. reject a `p_storage_path` that does not start with `<auth.uid()>/`;
3. require at least one habilitation item;
4. require every item to contain non-empty `code` and ISO `valid_until`;
5. insert the new document as `processing`;
6. insert all extracted habilitations;
7. archive the previous active document for that user;
8. mark the new document `active`;
9. return the new document id and active rows.

Use the transaction semantics of a single PostgreSQL function call so any exception rolls back all database changes. Add explicit `SET search_path = public, pg_temp`, `auth.uid()` checks, `REVOKE ALL ... FROM PUBLIC`, and `GRANT EXECUTE ... TO authenticated` for every privileged function.

- [ ] **Step 4: Run the SQL contract test**

Run: `node tests/habilitations-security-contract.test.js`

Expected: `habilitations SQL security contract: ok`.

- [ ] **Step 5: Commit the database contract without applying it to production yet**

```bash
git add docs/sql/2026-09-12-agent-habilitations.sql tests/habilitations-security-contract.test.js
git commit -m "feat: define secure habilitation persistence"
```

---

### Task 3: PDF text extraction and OCR fallback adapter

**Files:**
- Create: `js/core/habilitations-pdf.js`
- Create: `tests/habilitations-pdf.test.js`

**Interfaces:**
- Consumes: a browser `File` whose MIME type is `application/pdf`, plus injected/adapted PDF.js and OCR loaders for tests.
- Produces: `readHabilitationPdf(file, deps)` returning `{ text, method:'text'|'ocr', confidence:number|null }`.
- PDF.js version: `6.3.289`; Tesseract.js version: `7.0.0`; both loaded only when this function is invoked.

- [ ] **Step 1: Write failing adapter tests**

Use injected fake readers so Node tests do not download CDN dependencies:

```js
const assert=require('assert');
const pdf=require('../js/core/habilitations-pdf.js');
(async()=>{
  const textResult=await pdf.readHabilitationPdf({type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(8)}, {
    extractText:async()=>"H1B1 valable jusqu'au 15/04/2027",
    ocrPages:async()=>{throw new Error('OCR must not run when text exists');}
  });
  assert.equal(textResult.method,'text');
  assert.ok(textResult.text.includes('H1B1'));

  const ocrResult=await pdf.readHabilitationPdf({type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(8)}, {
    extractText:async()=>'',
    ocrPages:async()=>({text:'S11 validité 03/11/2026',confidence:0.91})
  });
  assert.equal(ocrResult.method,'ocr');
  assert.equal(ocrResult.confidence,0.91);

  await assert.rejects(()=>pdf.readHabilitationPdf({type:'image/jpeg'}),/PDF/);
  console.log('habilitations PDF adapter contract: ok');
})().catch(e=>{console.error(e);process.exit(1);});
```

- [ ] **Step 2: Run and verify RED**

Run: `node tests/habilitations-pdf.test.js`

Expected: FAIL because `habilitations-pdf.js` is missing.

- [ ] **Step 3: Implement the lazy reader**

Implement a browser default adapter that dynamically loads pinned PDF.js only after file selection. Extract text from all pages in order. If trimmed native text is shorter than 20 useful characters or contains no parser-recognizable habilitation code, render pages to canvases and lazy-load Tesseract.js `7.0.0` with French OCR (`fra`). Terminate the OCR worker in `finally`.

Public shape:

```js
async function readHabilitationPdf(file,deps={}){
  if(!file||file.type!=='application/pdf')throw new Error('Un fichier PDF est requis');
  const extractText=deps.extractText||extractTextWithPdfJs;
  const ocrPages=deps.ocrPages||ocrWithTesseract;
  const native=String(await extractText(file)||'').trim();
  if(native.length>=20&&hasHabilitationCode(native))return {text:native,method:'text',confidence:null};
  const ocr=await ocrPages(file);
  if(!String(ocr?.text||'').trim())throw new Error('PDF illisible');
  return {text:ocr.text,method:'ocr',confidence:Number.isFinite(ocr.confidence)?ocr.confidence:null};
}
```

The default loaders must use version-pinned CDN URLs and must not add global startup scripts to `index.html`.

- [ ] **Step 4: Run PDF adapter and parser tests**

Run:
```bash
node tests/habilitations-pdf.test.js
node tests/habilitations-parser.test.js
```

Expected: both PASS.

- [ ] **Step 5: Commit the PDF/OCR adapter**

```bash
git add js/core/habilitations-pdf.js tests/habilitations-pdf.test.js
git commit -m "feat: add lazy habilitation PDF reader"
```

---

### Task 4: Authenticated document access Edge Function

**Files:**
- Create: `supabase/functions/railops-habilitations/index.ts`
- Extend: `tests/habilitations-security-contract.test.js`

**Interfaces:**
- Consumes: authenticated Bearer token and `{action:'signed_url'|'archive', document_id:string}`.
- Produces: for `signed_url`, `{ok:true,url:string,expires_in:300}`; for `archive`, `{ok:true}`.
- Uses `@supabase/supabase-js@2.116.0`; `verify_jwt=true` at deployment.

- [ ] **Step 1: Extend the failing security test**

Assert the function exists, pins the Supabase client, validates the Bearer token with `auth.getUser(token)`, never returns `storage_path` as a public URL, delegates authorization to the secure RPC, and never accepts a `user_id` from the client as proof of ownership.

```js
const fnPath='supabase/functions/railops-habilitations/index.ts';
assert.ok(fs.existsSync(fnPath),'habilitation Edge Function missing');
const fn=fs.readFileSync(fnPath,'utf8');
assert.ok(fn.includes("npm:@supabase/supabase-js@2.116.0"));
assert.ok(fn.includes('auth.getUser(token)'));
assert.ok(fn.includes('createSignedUrl'));
assert.ok(fn.includes('railops_archive_habilitation_document'));
assert.ok(!fn.includes('SUPABASE_ANON_KEY'));
```

- [ ] **Step 2: Run and verify RED**

Run: `node tests/habilitations-security-contract.test.js`

Expected: FAIL because the Edge Function source does not exist.

- [ ] **Step 3: Implement the function**

Follow the existing `railops-user-admin` token-validation pattern but keep this endpoint focused. `signed_url` first asks `railops_habilitations_scope` for the requested document/user visibility, then uses the server-only service client to create a 300-second signed URL. `archive` calls `railops_archive_habilitation_document`; the RPC itself remains the authority for Chef/Admin write permission.

Return generic `FORBIDDEN`, `NOT_FOUND`, and `SERVER_ERROR` codes without leaking paths or SQL details. Keep CORS headers consistent with the existing RailOps Edge Function.

- [ ] **Step 4: Run the security contract**

Run: `node tests/habilitations-security-contract.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the server access boundary**

```bash
git add supabase/functions/railops-habilitations/index.ts tests/habilitations-security-contract.test.js
git commit -m "feat: add secure habilitation document access"
```

---

### Task 5: Agent profile UI and safe replace flow

**Files:**
- Create: `js/core/habilitations.js`
- Create: `tests/habilitations-ui.test.js`
- Modify: `js/core/sync.js`

**Interfaces:**
- Consumes: `window.RailOpsLifecycleV155`, `window.RailOpsHabilitationsParser`, `window.RailOpsHabilitationsPdf`, global authenticated Supabase client `db`, and existing `S.agent/S.role/S.users` state.
- Produces: `window.RailOpsHabilitations` with `install(root)`, `loadForUser(userId)`, `startSelfUpdate(file)`, `confirmPreview()`, `openDocument(documentId)`, and pure `renderCard(model, permissions)`.
- Upload path is exactly `${auth.uid()}/${crypto.randomUUID()}.pdf` in private bucket `railops-habilitations`.

- [ ] **Step 1: Write failing UI/ownership tests**

Create a CommonJS-friendly module contract with injected root/db dependencies. Cover:
1. own profile renders `Mettre à jour mon habilitation`;
2. another profile never renders that button for Agent/CTE;
3. parser ambiguity renders `Lecture à vérifier` and does not call Storage upload or activation RPC;
4. upload success followed by RPC failure attempts pending-object cleanup and leaves active model unchanged;
5. successful RPC replaces the displayed active model only after server acknowledgement;
6. status labels map `valid/expiring/expired` to `Valide/Expire bientôt/Expirée`.

Representative assertion:

```js
const root={S:{agent:'Agent Test',role:'agent',users:[{id:'u1',nom:'Agent Test'}]}};
const html=mod.renderCard({userId:'u1',items:[{code:'H1B1',validUntil:'2027-04-15',status:'valid'}]}, {canReplace:true,canArchive:false});
assert.ok(html.includes('H1B1'));
assert.ok(html.includes('15/04/2027'));
assert.ok(html.includes('Mettre à jour mon habilitation'));
```

- [ ] **Step 2: Run and verify RED**

Run: `node tests/habilitations-ui.test.js`

Expected: FAIL because `js/core/habilitations.js` does not exist.

- [ ] **Step 3: Implement the isolated browser module**

Register through `RailOpsLifecycleV155.afterRender('habilitations-profile', ...)` and inject the card only into the existing account/profile surface after confirming the surface exists. Never wrap `render()` independently and never add a second MutationObserver.

Update flow:
1. accept PDF <= 10 MB;
2. call `RailOpsHabilitationsPdf.readHabilitationPdf`;
3. call `RailOpsHabilitationsParser.extractHabilitations`;
4. render preview rows with one code/date per line;
5. require explicit agent `Confirmer` click;
6. hash the file with `crypto.subtle.digest('SHA-256', bytes)`;
7. upload to private Storage path under the current `auth.uid()`;
8. call `railops_activate_habilitation_document` with parsed rows and metadata;
9. only after RPC success replace local UI model and toast success;
10. on RPC failure remove the just-uploaded pending object when possible, show an error, and keep the previous model.

`Voir le PDF` invokes `railops-habilitations` with `action:'signed_url'` and opens only the returned five-minute signed URL.

Do not put PDF blobs/base64 in `S`, `localStorage`, or the existing offline queue.

- [ ] **Step 4: Add the loader without changing sync semantics**

In the existing `loadRailOpsReportModules()` list inside `js/core/sync.js`, add parser, PDF reader, then UI module in this order:

```js
{src:'./js/core/habilitations-parser.js',ready:()=>!!window.RailOpsHabilitationsParser},
{src:'./js/core/habilitations-pdf.js',ready:()=>!!window.RailOpsHabilitationsPdf},
{src:'./js/core/habilitations.js',ready:()=>!!window.RailOpsHabilitations},
```

Do not change `flushOfflineQueue`, `roPersistMaterial`, register picker capture, online/offline events, or existing module order relative to one another.

- [ ] **Step 5: Run focused UI and existing sync tests**

Run:
```bash
node tests/habilitations-ui.test.js
node tests/sync-error-handling.test.js
node tests/sync-extraction.test.js
node tests/sync-status-ui.test.js
node tests/lifecycle-refactor.test.js
```

Expected: all PASS.

- [ ] **Step 6: Commit the profile integration**

```bash
git add js/core/habilitations.js js/core/sync.js tests/habilitations-ui.test.js
git commit -m "feat: integrate habilitations into agent profile"
```

---

### Task 6: Consolidated CI coverage and protected regression gate

**Files:**
- Modify: `.github/workflows/modules-refactor-check.yml`
- Test: all new habilitation tests plus existing sensitive regressions.

**Interfaces:**
- Consumes: existing Node 22 CI job.
- Produces: one consolidated CI gate; no new workflow and therefore no extra parallel Vercel-style deployment trigger.

- [ ] **Step 1: Add the four habilitation tests to the existing workflow**

Add commands for:

```yaml
- run: node tests/habilitations-parser.test.js
- run: node tests/habilitations-pdf.test.js
- run: node tests/habilitations-security-contract.test.js
- run: node tests/habilitations-ui.test.js
```

Keep all existing workflow steps intact.

- [ ] **Step 2: Run the full sensitive local regression set before commit**

Run:
```bash
node tests/habilitations-parser.test.js
node tests/habilitations-pdf.test.js
node tests/habilitations-security-contract.test.js
node tests/habilitations-ui.test.js
node tests/secure-load.test.js
node tests/admin-mode.test.js
node tests/final-secure-user-admin.test.js
node tests/final-agent-material-save.test.js
node tests/material-reference-persistence.test.js
node tests/scan-verification-contract.test.js
node tests/sync-error-handling.test.js
node tests/sync-extraction.test.js
node tests/sync-status-ui.test.js
node tests/multichantier-source-reconciliation.test.js
node tests/register-adaptive-reader.test.js
node tests/register-import-adaptive-integration.test.js
node tests/chef-chantier-secure-stats.test.js
node tests/lifecycle-refactor.test.js
node tests/modules-refactor.test.js
```

Expected: every command exits 0.

- [ ] **Step 3: Commit the CI gate**

```bash
git add .github/workflows/modules-refactor-check.yml
git commit -m "ci: protect agent habilitations regressions"
```

---

### Task 7: Apply Supabase backend changes and verify security before any Vercel production deploy

**Files:**
- Source of truth already committed: `docs/sql/2026-09-12-agent-habilitations.sql`
- Source of truth already committed: `supabase/functions/railops-habilitations/index.ts`

**Interfaces:**
- Applies the reviewed SQL to project `tbmzmmamaiftbbbuelgd` through the Supabase migration action.
- Deploys `railops-habilitations` with `verify_jwt=true`.

- [ ] **Step 1: Re-read current Supabase changelog/docs relevant to Storage RLS, signed URLs, and Edge Functions**

Confirm no breaking change affects the reviewed SQL/function. If a current Supabase API differs, update the branch code and rerun Task 2/4 tests before touching production.

- [ ] **Step 2: Apply the reviewed SQL as one named migration**

Migration name: `agent_habilitations_profile_20260912`.

Do not execute piecemeal production DDL. Apply the exact committed SQL in one migration operation so schema history and repository source remain aligned.

- [ ] **Step 3: Deploy the dedicated Edge Function once**

Deploy `supabase/functions/railops-habilitations/index.ts` as function `railops-habilitations` with JWT verification enabled.

- [ ] **Step 4: Run live permission smoke queries**

Verify:
- both tables exist with RLS enabled;
- bucket `railops-habilitations` is private;
- one-active-document index exists;
- only `authenticated` has execute on the three RailOps habilitation RPCs;
- `anon` cannot execute them;
- no broad Storage policy allows cross-user direct reads.

- [ ] **Step 5: Run Supabase security and performance advisors**

Resolve any new warning attributable to this migration before proceeding. Existing unrelated warnings are recorded separately and are not silently changed as part of this feature.

- [ ] **Step 6: Re-run browser-facing regression tests after backend deployment**

Run the Task 6 sensitive regression set again. Expected: all PASS.

---

### Task 8: Representative PDF acceptance, PR, and single rollout

**Files:**
- No new production file unless the representative document exposes a deterministic parser-format gap; any parser adjustment must add a matching regression case first.

**Interfaces:**
- Uses one representative non-sensitive/anonymized habilitation PDF or a real document supplied for acceptance testing.
- Produces an evidence-backed PR ready for merge.

- [ ] **Step 1: Test a representative text-layer PDF**

From an Agent account, open own profile, select the PDF, and verify the preview lists every expected habilitation with the correct individual date. Do not confirm activation if any code/date pairing is wrong.

- [ ] **Step 2: Test OCR fallback only when the representative PDF lacks usable text**

Verify the OCR progress state appears, extracted values are shown for confirmation, and an ambiguous result refuses activation rather than guessing.

- [ ] **Step 3: Confirm successful activation behavior**

After explicit confirmation, verify:
- new document is active;
- previous active document is archived;
- each extracted habilitation has its own date;
- `Voir le PDF` returns a short-lived signed URL;
- refreshing/relogging preserves the result.

- [ ] **Step 4: Confirm failure preservation behavior**

Use a deliberately invalid/ambiguous synthetic PDF flow and verify the existing active document remains active and visible. No production data is deleted for this check.

- [ ] **Step 5: Run final verification before claiming completion**

Run the entire Task 6 regression set, inspect Git diff for unrelated changes, check CI, and check Supabase advisors. Use `superpowers:verification-before-completion` before any success claim.

- [ ] **Step 6: Request code review and open the dedicated PR**

Use `superpowers:requesting-code-review`, then create one PR from `feat/agent-habilitations-profile` to `main` describing parser, Storage/RLS, activation safety, profile UX, tests, and live backend verification.

- [ ] **Step 7: Merge only after green review/CI, then allow one final Vercel production deployment**

Do not create additional no-op or retry deployments unless a verified deployment failure requires it.
