# RailOps Progressive Modules + Mobile Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split RailOps progressively out of the monolithic `index.html` into focused native ES modules without changing behavior, then add durable offline synchronization in a separate later phase.

**Architecture:** Keep `index.html` as the document shell, extract one responsibility at a time, and retain a temporary compatibility bridge for legacy globals/inline handlers. The v155 lifecycle remains the single shared lifecycle authority. Durable offline persistence/sync is deliberately deferred until the extraction is stable.

**Tech Stack:** HTML5, CSS, native JavaScript ES modules, Supabase JS, Node 22 regression scripts, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-22-progressive-modules-mobile-offline.md`

## Global Constraints
- No React and no framework rewrite.
- No business/data-shape changes during extraction.
- Preserve mobile installed-web-app behavior and current offline behavior.
- Preserve v153 auth/session behavior and v155 single lifecycle behavior.
- Preserve localStorage keys and Supabase schema during extraction.
- Never silently lose a field report; offline conflict handling belongs to the later offline-sync phase.
- Keep `backup/pre-modules-mobile-offline-20260822` untouched.
- Every task ends with a green regression check and independently reviewable commit.

---

### Task 1: Extract CSS without JavaScript changes

**Files:**
- Create: `css/railops.css`
- Modify: `index.html`
- Create: `tests/modules-refactor.test.js`
- Modify: `.github/workflows/v155-refactor-check.yml`

**Interfaces:**
- Consumes: the existing single inline application `<style>` block and unchanged DOM class names.
- Produces: `/css/railops.css` loaded from `index.html`; no script/module behavior changes.

- [ ] **Step 1: Write the failing regression test**

Add assertions that `index.html` references `css/railops.css`, no longer contains the extracted application style block, the stylesheet exists and is non-empty, and the v155 lifecycle invariants still hold.

- [ ] **Step 2: Run test to verify RED**

Run: `node tests/modules-refactor.test.js`
Expected: FAIL because `css/railops.css` does not exist and the stylesheet link is absent.

- [ ] **Step 3: Extract the stylesheet verbatim**

Move the existing application CSS text from the inline `<style>` block to `css/railops.css` without changing selectors or declarations. Replace the block with `<link rel="stylesheet" href="./css/railops.css">` in the same document head.

- [ ] **Step 4: Run regression tests**

Run:
`node tests/modules-refactor.test.js`
`node tests/lifecycle-refactor.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `refactor: extract RailOps stylesheet`

---

### Task 2: Extract v155 lifecycle into an ES module

**Files:**
- Create: `js/core/lifecycle.js`
- Modify: `index.html`
- Modify: `tests/modules-refactor.test.js`
- Modify: `tests/lifecycle-refactor.test.js`

**Interfaces:**
- Produces `window.RailOpsLifecycleV155` with exactly the current methods: `beforeRender(name, fn)`, `afterRender(name, fn)`, `afterLoad(name, fn)`, `onMutation(name, fn)`, and `inspect()`.
- Existing legacy scripts continue registering through `window.RailOpsLifecycleV155`.

- [ ] Write a failing test requiring `js/core/lifecycle.js` and prohibiting the old inline lifecycle block.
- [ ] Run it and confirm RED for the missing module.
- [ ] Move the v155 lifecycle implementation verbatim into `js/core/lifecycle.js`; load it before legacy scripts with `<script type="module" src="./js/core/lifecycle.js"></script>` only if execution ordering is proven compatible. If module/defer ordering conflicts with legacy classic scripts, use a classic compatibility loader for this task and defer `type="module"` conversion to `app.js`.
- [ ] Run module and lifecycle regression tests and verify Vercel preview.
- [ ] Commit `refactor: extract shared lifecycle core`.

---

### Task 3: Introduce explicit application entry point and compatibility bridge

**Files:**
- Create: `js/app.js`
- Create: `js/legacy-bridge.js`
- Modify: `index.html`
- Modify: `tests/modules-refactor.test.js`

**Interfaces:**
- `app.js` becomes the eventual ES-module entry point but must not take ownership of legacy startup until equivalence is tested.
- `legacy-bridge.js` is the only approved location for intentionally exposed `window.*` compatibility symbols after modules are extracted.

- [ ] Add RED tests for one entry point and bridge existence.
- [ ] Add minimal files with no behavioral ownership change.
- [ ] Verify current startup still occurs exactly once.
- [ ] Commit `refactor: add module entry point bridge`.

---

### Task 4: Extract state and Supabase boundaries

**Files:**
- Create: `js/core/state.js`
- Create: `js/core/supabase.js`
- Modify: `js/legacy-bridge.js`
- Modify: `index.html`
- Modify: `tests/modules-refactor.test.js`

**Interfaces:**
- State extraction initially preserves the exact existing state object shape and persistence keys.
- Supabase extraction preserves the existing initialized client/session flow and table names.
- No feature module is rewritten in this task beyond imports/compatibility bindings required to reference the extracted code.

- [ ] Add characterization tests for localStorage key names/state shape and Supabase initialization markers.
- [ ] Confirm RED for missing extracted modules.
- [ ] Move code with compatibility exports; no data model changes.
- [ ] Run auth/startup/lifecycle tests and preview smoke checks.
- [ ] Commit `refactor: extract state and supabase core`.

---

### Task 5: Extract auth and roles

**Files:**
- Create: `js/auth.js`
- Create: `js/roles.js`
- Modify: `js/legacy-bridge.js`
- Modify: `index.html`
- Add focused auth/role regression tests.

**Interfaces:**
- Preserve v153 session restoration, sign-in/sign-out behavior, profile resolution and role strings.
- UI permission helpers may move, but server authorization remains Supabase/RLS.

- [ ] Characterize existing auth and role behavior in tests.
- [ ] Confirm RED for missing modules.
- [ ] Extract without rule changes.
- [ ] Verify all role variants and startup/session restoration.
- [ ] Commit `refactor: extract auth and roles modules`.

---

### Task 6: Extract chantiers

**Files:**
- Create: `js/chantiers.js`
- Modify bridge/index/tests as required.

**Interfaces:** preserve chantier IDs, hierarchy, assignment, active/archive semantics and current storage/Supabase behavior.

- [ ] Add characterization tests for chantier rules before moving code.
- [ ] Confirm RED for missing module.
- [ ] Extract chantier logic only.
- [ ] Run regression suite and preview smoke checks.
- [ ] Commit `refactor: extract chantiers module`.

---

### Task 7: Extract registre and inventaire

**Files:**
- Create: `js/registre.js`
- Create: `js/inventaire.js`
- Modify bridge/index/tests as required.

**Interfaces:** preserve reference normalization, duplicate rules, multi-chantier semantics, Excel/DPI import, QR/scanning, inventory status and inventory responsible label normalization.

- [ ] Add characterization tests for anti-duplicate, multi-chantier, imports and inventory responsibility before moving code.
- [ ] Confirm RED for missing modules.
- [ ] Extract registre functions and verify.
- [ ] Extract inventaire functions and verify.
- [ ] Run full regression suite and preview smoke checks.
- [ ] Commit `refactor: extract registre and inventaire modules`.

---

### Task 8: Extract common UI and retire avoidable globals

**Files:**
- Create: `js/ui.js`
- Modify: `js/app.js`, `js/legacy-bridge.js`, `index.html`, tests.

**Interfaces:** UI owns shared rendering/navigation/modals/toasts only; business decisions remain in feature modules.

- [ ] Characterize startup/render count and required inline-handler globals.
- [ ] Confirm RED for missing UI module.
- [ ] Extract shared UI code in small slices.
- [ ] Remove bridge exports only after their call sites no longer require globals.
- [ ] Run full regression suite and preview smoke checks.
- [ ] Commit `refactor: extract shared ui module`.

---

### Task 9: Stabilization gate before offline redesign

**Files:** tests/workflow only unless defects are found.

- [ ] Verify `index.html` is a shell rather than the application implementation.
- [ ] Verify all module files parse/load and no circular dependency is introduced.
- [ ] Verify v155 shared lifecycle still has one render wrapper, one load wrapper and one lifecycle mutation observer.
- [ ] Verify authentication, roles, chantiers, registre/import, inventaire and installed-mobile preview behavior.
- [ ] Merge only after CI and Vercel are green.

---

### Task 10: Durable offline queue — separate follow-up refactor

**Files:**
- Create/complete: `js/core/storage.js`, `js/core/sync.js`, `service-worker.js`, PWA metadata as required.
- Add offline queue/idempotency/conflict tests.

**Interfaces:**
- Local pending operation record includes a stable client operation ID, payload, creation timestamp, retry metadata and sync status.
- Queue deletion occurs only after server acknowledgement.
- Reconnect/restart retries are idempotent.
- Conflicts preserve both sides and surface a resolution state; no silent overwrite.

- [ ] Write RED tests proving offline operations survive reload and cannot be discarded before acknowledgement.
- [ ] Implement IndexedDB-backed pending queue.
- [ ] Implement idempotent sync boundary and reconnect/restart retry.
- [ ] Add service-worker/app-shell caching only after exact asset list is generated from the stable module graph.
- [ ] Verify airplane-mode create → close app → reopen offline → reconnect → single server persistence scenario.
- [ ] Commit/PR separately from the pure extraction work.
