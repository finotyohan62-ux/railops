# RailOps Common PDF Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved RailOps PDF visual identity to every existing PDF action while preserving each document's current data, scope, button placement, visibility, and permissions.

**Architecture:** Extract the visual shell already validated in `inspection-report.js` into a reusable `pdf-design-system.js`. Existing PDF actions are classified by their current UI context and routed to a document-specific renderer; inspection/control reports keep their existing model and content. Unknown PDF actions keep their original handler instead of being intercepted, so rollout is fail-safe.

**Tech Stack:** Browser JavaScript, Node.js regression tests, HTML print/PDF rendering, existing jsPDF/AutoTable compatibility.

**Spec:** `docs/superpowers/specs/2026-08-30-railops-pdf-design-system.md`

## Global Constraints

- Work only on `security/v150b2b-rls-ready`; do not modify `main`.
- Do not merge PR #1 and do not enable strict RLS.
- Do not change Supabase data/schema/security, permissions, business rules, Import, Multi-chantier, or weekly purge behavior.
- Preserve existing PDF buttons, placement, role visibility, filters, data selection, and filename where possible.
- CSV/XLSX exports are out of scope.
- User-controlled text rendered into HTML must be escaped.
- Unknown/unclassified PDF actions must fall back to their current behavior.

---

### Task 1: Shared PDF visual shell

**Files:**
- Create: `js/reports/pdf-design-system.js`
- Create: `tests/v150b2b-pdf-design-system.test.js`
- Modify: `js/reports/inspection-report.js`

**Interfaces:**
- Produces: `RailOpsPdfDesignSystem.escapeHtml(value)`, `renderDocument({ title, subtitle, context, summaryCards, sections, footer })`, and reusable table/status helpers.
- Consumes: plain strings/arrays only; no RailOps state and no Supabase access.

- [ ] **Step 1: Write the failing contract test** asserting that `pdf-design-system.js` exists, exports the shared renderer, emits the RailOps brand/A4 print rules, escapes hostile HTML, and supports title/context/summary/table/footer content.
- [ ] **Step 2: Run** `node tests/v150b2b-pdf-design-system.test.js`; expect FAIL because the shared module does not exist.
- [ ] **Step 3: Implement the minimal shared renderer** by extracting only presentation primitives from the validated inspection report CSS/HTML; keep it data-agnostic.
- [ ] **Step 4: Adapt `inspection-report.js`** to call the shared renderer while preserving `buildInspectionReportModel` and the exact report sections/data semantics already covered by report tests.
- [ ] **Step 5: Run** `node tests/v150b2b-pdf-design-system.test.js` plus all `tests/v150b2b-report-*.test.js`; expect PASS.
- [ ] **Step 6: Commit** with `feat: extract common RailOps PDF design system`.

### Task 2: Safe inventory and classification of existing PDF actions

**Files:**
- Create: `js/reports/pdf-action-router.js`
- Create: `tests/v150b2b-pdf-action-router.test.js`
- Modify: `js/reports/inspection-report-bootstrap.js`

**Interfaces:**
- Produces: `classifyPdfAction(label, contextText)` returning a known document type or `null`.
- Produces: `shouldInterceptPdfAction(...)` true only for a renderer that is explicitly registered.
- Consumes: current button label and surrounding UI text; it does not change role visibility or create buttons.

- [ ] **Step 1: Write the failing router test** covering known report/control contexts and asserting that unrelated/unknown PDF contexts return `null` and are not intercepted.
- [ ] **Step 2: Run** `node tests/v150b2b-pdf-action-router.test.js`; expect FAIL because the router does not exist.
- [ ] **Step 3: Implement minimal classification** for the currently proven report/control action first, with an explicit registry structure for additional existing PDF document types discovered from runtime code.
- [ ] **Step 4: Replace the broad bootstrap decision with the router** while keeping `preventDefault()`/`stopImmediatePropagation()` only after a known renderer has been selected. Unknown PDF buttons retain their existing handler.
- [ ] **Step 5: Run** router, existing UI hook, browser bridge, loader, and report generation tests; expect PASS.
- [ ] **Step 6: Commit** with `refactor: route RailOps PDF actions safely`.

### Task 3: Connect every proven existing PDF generator to the shared identity

**Files:**
- Create/modify focused modules under: `js/reports/`
- Create one `tests/v150b2b-pdf-<document-type>.test.js` per proven existing PDF document type.
- Modify: `js/reports/pdf-action-router.js`
- Modify only the smallest existing UI/bootstrap module needed for wiring; avoid editing obfuscated business logic unless unavoidable and proven safe.

**Interfaces:**
- Each renderer consumes the same data/filter result already selected by its current document action.
- Each renderer produces HTML/print output through `RailOpsPdfDesignSystem`.

- [ ] **Step 1: Inventory actual active PDF generators** from the current branch runtime (`index.html`, `js/`, and surviving legacy UI contexts), recording only generators supported by code evidence.
- [ ] **Step 2: For each proven generator, write a failing test** that captures its current business content/identifiers and asserts the shared RailOps shell is used without changing those values.
- [ ] **Step 3: Run each new test before implementation** and confirm the expected red failure.
- [ ] **Step 4: Add the minimal document-specific adapter/renderer** and register only that proven action in `pdf-action-router.js`.
- [ ] **Step 5: Re-run the focused test plus the existing regression tests after every generator**; stop instead of guessing if the current document's data selection or role semantics cannot be proven.
- [ ] **Step 6: Commit each independently verified generator** with a focused message such as `feat: apply RailOps PDF design to <document>`.

### Task 4: Global PDF coverage guard and browser loading

**Files:**
- Create: `tests/v150b2b-pdf-coverage-contract.test.js`
- Modify: `index.html` only if a new shared module is not already loaded by the existing report loader path.
- Modify: `tests/v150b2b-report-loader.test.js` or add a focused loader test if needed.

**Interfaces:**
- Coverage guard maps every proven active PDF action to either a shared-design renderer or an explicit safe legacy fallback with rationale.

- [ ] **Step 1: Write a failing coverage test** that asserts all proven active PDF document types from Task 3 are registered and that CSV/XLSX actions are not intercepted.
- [ ] **Step 2: Run the coverage test** and confirm red before changing loading/wiring.
- [ ] **Step 3: Wire the shared modules into the existing browser load order** before document-specific bootstrap code, changing only script loading required for the new modules.
- [ ] **Step 4: Run loader/coverage/report tests** and confirm green.
- [ ] **Step 5: Commit** with `test: guard RailOps PDF design coverage`.

### Task 5: Full verification and worklog

**Files:**
- Modify: `docs/worklog-railops.md` or the repository's current canonical worklog append mechanism.

**Interfaces:**
- No new runtime interface; this task verifies branch safety and records evidence.

- [ ] **Step 1: Run the complete v150B-2B verification suite** and all other existing CI workflows relevant to the branch.
- [ ] **Step 2: Verify `main` is unchanged**, PR #1 remains DRAFT/unmerged, and the branch contains only intended PDF/design/test/docs changes for this rollout.
- [ ] **Step 3: Verify no Supabase/RLS/schema/data files changed** and no Import/Multi-chantier/weekly purge behavior changed.
- [ ] **Step 4: Append a dated worklog entry** listing document types migrated, tests/CI evidence, commit SHAs, safe fallbacks, and any unresolved document type that could not be proven.
- [ ] **Step 5: Re-run the worklog contract and affected CI checks** after the documentation commit.
- [ ] **Step 6: Commit** with `docs: log common RailOps PDF rollout`.
