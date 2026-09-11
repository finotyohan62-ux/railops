# Sync Status UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a discreet, reliable RailOps synchronization status UI without changing the existing offline queue format, RPCs, retry semantics, or scan/material persistence behavior.

**Architecture:** Introduce a pure `js/core/sync-status.js` diagnostics module that derives display state from `navigator.onLine` and the existing `ro_offline_queue`. Its browser adapter renders one idempotent status chip and an attention banner only when actions are pending/offline. Existing `js/core/sync.js` remains the source of truth and only loads the diagnostics module; it is not rewritten to change synchronization behavior.

**Tech Stack:** Vanilla JavaScript, browser DOM APIs, localStorage, Node 22 contract tests, GitHub Actions.

**Spec:** Approved RailOps sync concept in chat on 2026-09-12: green synced, orange pending, gray offline, red reserved for a real explicit error signal; details remain discreet and must not overload the interface.

## Global Constraints

- Do not alter the `ro_offline_queue` key, record format, write path, retry path, or deletion behavior.
- Do not change `railops_upsert_scan`, `railops_upsert_material_admin`, Supabase schema, RLS, or server RPC semantics.
- Existing register import, lifecycle, role, scan, and offline-sync tests must stay green.
- Rendering must be idempotent: never create duplicate status chips or banners across repeated RailOps renders.
- A malformed local queue must never crash the application.
- A single-sheet or unrelated page must not be structurally rewritten; the module may only insert/remove its own nodes.
- No manual Vercel deployment.

---

### Task 1: Pure sync diagnostics contract

**Files:**
- Create: `tests/sync-status-ui.test.js`
- Create: `js/core/sync-status.js`

**Interfaces:**
- Consumes: serialized `ro_offline_queue`, boolean online state, optional explicit error string.
- Produces: `safeQueue(raw)`, `pendingMaterialIds(queue)`, `deriveStatus({online,queue,error})`, and browser API `RailOpsSyncStatusUI`.

- [ ] **Step 1: Write the failing contract test**

Test these exact expectations: empty/online => `synced`; queued/online => `pending` with exact count; offline => `offline`; malformed JSON => empty queue; queued `materielId` and queued material `id` are exposed as pending material IDs; explicit error => `error` only when online.

- [ ] **Step 2: Run the test to verify RED**

Run: `node tests/sync-status-ui.test.js`
Expected: FAIL because `js/core/sync-status.js` does not exist.

- [ ] **Step 3: Implement the pure module**

Use a UMD wrapper so Node tests can `require()` it and browsers receive `window.RailOpsSyncStatusUI`. `safeQueue` accepts either an array or serialized JSON and returns `[]` on invalid data. `deriveStatus` returns only presentation data and never writes localStorage.

- [ ] **Step 4: Run the test to verify GREEN**

Run: `node tests/sync-status-ui.test.js`
Expected: PASS.

### Task 2: Browser rendering without sync-engine mutation

**Files:**
- Modify: `js/core/sync-status.js`
- Test: `tests/sync-status-ui.test.js`

**Interfaces:**
- Consumes: `window.navigator.onLine`, `window.localStorage.getItem('ro_offline_queue')`, `#app` DOM.
- Produces: `refresh()`, one `#ro-sync-status`, optional `#ro-sync-attention`, and `install()`.

- [ ] **Step 1: Extend the failing test with source invariants**

Assert the browser source owns only nodes prefixed `ro-sync-`, reads `ro_offline_queue`, listens to `online`, `offline`, and `storage`, uses a `MutationObserver` or equivalent re-render hook, and contains no `db.`, `.rpc(`, `saveOfflineQueue`, `addToOfflineQueue`, or `flushOfflineQueue` calls.

- [ ] **Step 2: Run RED**

Run: `node tests/sync-status-ui.test.js`
Expected: FAIL on the missing browser integration invariants.

- [ ] **Step 3: Implement idempotent rendering**

Render a compact chip after `.topbar` when available, otherwise at the top of `#app`. Show an orange attention banner only for pending actions and a neutral offline banner only when offline with pending actions. On synced state show only the compact green chip. Reuse existing nodes by ID and remove only nodes owned by this module.

- [ ] **Step 4: Run GREEN**

Run: `node tests/sync-status-ui.test.js`
Expected: PASS.

### Task 3: Load the UI from the existing sync module

**Files:**
- Modify: `js/core/sync.js`
- Modify: `.github/workflows/modules-refactor-check.yml`
- Test: `tests/sync-status-ui.test.js`

**Interfaces:**
- Consumes: existing `loadRailOpsReportModules()` loader.
- Produces: one additional module descriptor `{src:'./js/core/sync-status.js', ready:()=>!!window.RailOpsSyncStatusUI}`.

- [ ] **Step 1: Add failing integration assertions**

Assert `sync.js` loads `./js/core/sync-status.js`, while the complete pre-existing `flushOfflineQueue` atomic RPC path remains textually present and unchanged in intent.

- [ ] **Step 2: Run RED**

Run: `node tests/sync-status-ui.test.js`
Expected: FAIL because the loader does not yet include the module.

- [ ] **Step 3: Add the loader entry and CI command**

Add the sync-status descriptor without changing the queue functions. Add `node tests/sync-status-ui.test.js` to `modules-refactor-check.yml`.

- [ ] **Step 4: Verify targeted and regression checks**

Run through CI: `sync-status-ui.test.js`, `sync-extraction.test.js`, `sync-error-handling.test.js`, `modules-refactor.test.js`, lifecycle regression, and Final RLS hotfix check. Expected: all success.

### Task 4: PR verification

**Files:** No production changes unless verification exposes a defect.

- [ ] **Step 1: Compare feature branch to `main`**

Confirm only the plan, sync-status module/test, loader entry, and workflow command changed.

- [ ] **Step 2: Open PR against `main`**

Describe that this is presentation-only diagnostics and explicitly state that no sync/RPC semantics changed.

- [ ] **Step 3: Wait for fresh PR CI evidence**

Require RailOps modules regression, lifecycle regression, and Final RLS hotfix check to be green before reporting implementation complete.
