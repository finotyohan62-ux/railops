# Unified Register Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every register upload through one deterministic pre-processing entry point so the DPI2455 workbook reaches v145 with 735 unique current inventory references and an enabled `Analyser avant import` button.

**Architecture:** Add a focused `js/core/register-import-v156.js` module that owns pre-processing and the single public `handleInput(input)` entry point. The existing v145 importer remains authoritative for workbook routing, preview, chantier mapping, mutations and history. Modify the active capture-phase file-picker listener to call only this module, and stop loading the previous FileReader hotfix once the unified module is active.

**Tech Stack:** Browser JavaScript, SheetJS/XLSX 0.18.5, Node.js assertion-based regression tests, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-02-unified-register-import-design.md`

## Global Constraints

- Work only on `security/v150b2b-rls-ready` until branch verification is green.
- Keep `main` untouched until the validated minimal production port.
- Do not change Supabase schema, RLS, authentication, permissions, weekly verification purge, chantier creation rules, material move rules, or import history semantics.
- Keep v145 as the sole business mutation engine.
- Treat stale declared counts and same-site exact duplicates as recoverable; keep cross-site duplicate ambiguity blocking.
- Never modify the uploaded workbook on disk.
- Supported formats remain XLSX, XLS, XLSM, XLSB, ODS, CSV and TXT; PDF remains unsupported.

---

### Task 1: Lock the single-entry-point contract with a failing regression test

**Files:**
- Modify: `tests/v150b2b-register-import-quality.test.js`
- Inspect: `index.html`
- Inspect: `js/core/sync.js`

**Interfaces:**
- Consumes: current v145 capture listener and module loader.
- Produces: regression assertions requiring `window.RailOpsRegisterImportV156.handleInput(input)` as the picker target and forbidding direct `generalizedImport(input)` on the active capture path.

- [ ] **Step 1: Write the failing test**

Add assertions that the active capture listener contains `RailOpsRegisterImportV156.handleInput(input)`, that it does not directly invoke `generalizedImport(input)`, and that `sync.js` loads `./js/core/register-import-v156.js`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/v150b2b-register-import-quality.test.js`

Expected: FAIL because the unified module and capture routing do not exist yet.

- [ ] **Step 3: Commit the red test**

Commit message: `test: require unified register import entry point`

---

### Task 2: Implement the unified pre-processor module

**Files:**
- Create: `js/core/register-import-v156.js`
- Modify: `tests/v150b2b-register-import-quality.test.js`

**Interfaces:**
- Consumes: `window.generalizedImport` or captured v145 importer, global `XLSX`, browser `File`, optional `toast`.
- Produces: `window.RailOpsRegisterImportV156` with `handleInput(input)`, `normalizeStructuredRows(rows)`, and `normalizeWorkbook(wb)`.

- [ ] **Step 1: Extend the failing test with DPI2455-shaped normalization requirements**

The test must assert that the module contains logic for:
- same-site duplicate removal;
- stale announced-count correction in-memory;
- cross-site duplicate detection that refuses normalization;
- a real `new File(...)` for rewritten Excel content;
- one call to the captured v145 importer.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/v150b2b-register-import-quality.test.js`

Expected: FAIL because `js/core/register-import-v156.js` is missing.

- [ ] **Step 3: Implement minimal `register-import-v156.js`**

Implementation rules:
- Capture the original v145 importer once at module install time.
- For CSV/TXT and unsupported normalization cases, forward the original input unchanged.
- For Excel-family formats, read `file.arrayBuffer()`, parse all sheets with SheetJS, and inspect only sheets that expose both a reference and site/location header.
- Normalize keys only for comparison.
- Suppress later exact duplicates sharing normalized `site|reference`.
- If any normalized reference appears in more than one site, do not rewrite the workbook; pass the original input so v145 retains its blocking behavior.
- Update stale top-of-sheet `N articles/matériels/références` text only in the in-memory copy to the unique structured count.
- If no recoverable defect exists, pass the original input unchanged.
- When rewritten, create a real browser `File` and call v145 exactly once with `{files:[syntheticFile],value:''}`.
- Expose normalization helpers for deterministic regression testing.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node tests/v150b2b-register-import-quality.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: add unified register import preprocessor`

---

### Task 3: Route the real picker through v156 and remove competing active hotfix loading

**Files:**
- Modify: `index.html`
- Modify: `js/core/sync.js`
- Modify: `tests/v150b2b-register-import-quality.test.js`

**Interfaces:**
- Consumes: `window.RailOpsRegisterImportV156.handleInput(input)`.
- Produces: one active capture-phase import route from the file picker to v156, then exactly one hand-off to v145.

- [ ] **Step 1: Update the test to require the real capture route**

Assert that the capture listener delegates to `window.RailOpsRegisterImportV156.handleInput(input)` and has a safe fallback to the existing v145 importer only if v156 failed to load. Assert that `sync.js` loads `register-import-v156.js` and no longer loads `register-import-filereader-hotfix.js` as an active module.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/v150b2b-register-import-quality.test.js`

Expected: FAIL on current `index.html` / `sync.js`.

- [ ] **Step 3: Modify `index.html` minimally**

Change only the active capture-phase register-file branch so it calls the unified handler. Preserve `preventDefault()`, `stopImmediatePropagation()`, registry-file detection and non-register behavior. Keep a fallback to v145 only when the module is unavailable.

- [ ] **Step 4: Modify `js/core/sync.js` loader minimally**

Replace the FileReader hotfix module entry with `./js/core/register-import-v156.js`, using `window.RailOpsRegisterImportV156` as readiness condition. Do not alter other module loading order or report modules.

- [ ] **Step 5: Run focused test and verify GREEN**

Run: `node tests/v150b2b-register-import-quality.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `fix: route register picker through unified importer`

---

### Task 4: Add executable normalization behavior coverage

**Files:**
- Create: `tests/v156-register-import-behavior.test.js`
- Modify: `js/core/register-import-v156.js` only if the executable test exposes a defect.

**Interfaces:**
- Consumes: exported normalization helpers from `window.RailOpsRegisterImportV156` or a Node-compatible factory exposed by the module.
- Produces: executable proof of DPI2455-like counts and cross-site blocking.

- [ ] **Step 1: Write an executable failing test with a synthetic structured dataset**

Build rows with:
- header row containing `Référence` and `Site`;
- 737 data rows total;
- 735 unique `site|reference` pairs;
- exactly two later duplicates in the same site;
- title declaring `548 articles`;
- four site buckets sized 340, 247, 117 and 31.

Assert normalization reports two duplicates, unique count 735, corrected declared count 735 and no cross-site ambiguity.

Add a second dataset where one reference appears on two sites and assert normalization refuses to rewrite it.

- [ ] **Step 2: Run the behavior test and verify RED if harness/export support is missing**

Run: `node tests/v156-register-import-behavior.test.js`

Expected: initial FAIL only for missing test harness/export support, not due to malformed fixture.

- [ ] **Step 3: Add the smallest Node-testable export/factory if necessary**

Keep browser API unchanged. Do not duplicate business logic between browser and test paths.

- [ ] **Step 4: Run both import tests and verify GREEN**

Run:
- `node tests/v150b2b-register-import-quality.test.js`
- `node tests/v156-register-import-behavior.test.js`

Expected: PASS / PASS.

- [ ] **Step 5: Commit**

Commit message: `test: cover DPI2455 register normalization behavior`

---

### Task 5: Run full branch verification and document the result

**Files:**
- Create: `docs/worklog-railops-append/2026-09-02-02xx.md`

**Interfaces:**
- Consumes: branch commits from Tasks 1-4.
- Produces: verified branch state and durable worklog entry.

- [ ] **Step 1: Run all repository workflows / targeted checks available for the branch**

Required checks:
- `v150B-2B checks`
- `RailOps lifecycle regression`
- `RailOps modules regression`
- `Final RLS hotfix check`
- Vercel preview status

Expected: all success.

- [ ] **Step 2: Inspect final branch diff against pre-change branch head**

Verify changes are limited to:
- unified register module;
- capture-route wiring;
- module-loader wiring;
- import regression tests;
- spec/plan/worklog documentation.

No Supabase/RLS/schema/security business-rule files may change.

- [ ] **Step 3: Add dated worklog entry**

Record root cause, files changed, test evidence, commit SHAs, and that production is still pending at this point.

- [ ] **Step 4: Commit worklog**

Commit message: `docs: log unified register import verification`

---

### Task 6: Minimal production port after branch is green

**Files:**
- Production `main`: only the validated runtime files required by the import fix.

**Interfaces:**
- Consumes: verified branch blobs for `index.html`, `js/core/sync.js`, `js/core/register-import-v156.js`.
- Produces: production deployment with the same single-entry import behavior.

- [ ] **Step 1: Re-inspect production `main` immediately before write**

Confirm current main SHA and ensure no unrelated concurrent changes would be overwritten.

- [ ] **Step 2: Port only validated runtime changes**

Use minimal file-level production commits; do not merge the security branch wholesale.

- [ ] **Step 3: Verify production commit diff**

Expected runtime files only: `index.html`, `js/core/sync.js`, `js/core/register-import-v156.js` (or fewer if loader wiring is already present). No Supabase or security-policy files.

- [ ] **Step 4: Verify Vercel production status**

Expected: SUCCESS.

- [ ] **Step 5: Add production deployment worklog entry on the security branch**

Record production SHA, Vercel result and remaining terrain validation: the exact DPI2455 workbook must display RETOUR 340, CONTAINER-01 247, ROISSY 117, VEMARS 31, total 735, with `Analyser avant import` enabled.
