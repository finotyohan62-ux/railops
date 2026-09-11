# Adaptive Register Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un moteur de lecture adaptatif capable de reconnaître plusieurs architectures de registres Excel et de les convertir vers le modèle RailOps existant sans casser les imports actuels.

**Architecture:** Un nouveau module pur `js/core/register-adaptive-reader.js` détecte et parse les variantes Excel vers un modèle canonique. `register-import-v156.js` reste propriétaire des règles métier et n’utilise le lecteur adaptatif que lorsque la confiance est suffisante ; sinon il conserve le flux historique.

**Tech Stack:** JavaScript UMD/Node, SheetJS/XLSX côté navigateur, tests Node sans dépendance externe, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-11-adaptive-register-reader-design.md`

## Global Constraints

- Aucun changement Supabase ou RPC.
- Compatibilité descendante obligatoire pour les chantiers simples et le v156.5.
- Aucune écriture serveur si une affectation de référence est ambiguë.
- Les vrais multi-chantiers explicitement présents restent autorisés.
- Les cellules fusionnées déjà corrigées restent inchangées.
- TDD : chaque nouveau comportement doit échouer avant l’implémentation puis passer après.

---

### Task 1: Contract tests for adaptive format detection

**Files:**
- Create: `tests/register-adaptive-reader.test.js`
- Modify: `.github/workflows/modules-refactor-check.yml`

**Interfaces:**
- Consumes: none.
- Produces expected API: `detectAndParseWorkbook(sheets)` and `parseSheetRows(rows, options)`.

- [ ] **Step 1: Write failing tests** covering structured multi-site, one-sheet-per-site, block-per-site, single-site and metadata-tab exclusion.
- [ ] **Step 2: Run `node tests/register-adaptive-reader.test.js` and verify RED** because the module does not exist.
- [ ] **Step 3: Add the test to `modules-refactor-check.yml`.**
- [ ] **Step 4: Commit the RED state.**

### Task 2: Implement the pure adaptive reader

**Files:**
- Create: `js/core/register-adaptive-reader.js`
- Test: `tests/register-adaptive-reader.test.js`

**Interfaces:**
- Produces:
  - `normalizeRef(value): string`
  - `headerProfile(rows): object`
  - `detectAndParseWorkbook(sheets): CanonicalRegisterModel`
  - `parseSheetRows(rows, options): CanonicalItem[]`

- [ ] **Step 1: Implement shared text/header/reference normalization.**
- [ ] **Step 2: Implement structured-table parser preserving explicit site and merged-cell continuation semantics.**
- [ ] **Step 3: Implement INVENTAIRE + site-sheet recognition without superseding explicit INVENTAIRE assignments.**
- [ ] **Step 4: Implement one-sheet-per-site parsing with metadata-tab filtering.**
- [ ] **Step 5: Implement block-per-site parsing using SITE/CHANTIER/ZONE markers.**
- [ ] **Step 6: Implement single-sheet fallback with confidence score.**
- [ ] **Step 7: Run `node tests/register-adaptive-reader.test.js` and verify GREEN.**
- [ ] **Step 8: Commit.**

### Task 3: Integrate adaptive reader with v156 without changing server semantics

**Files:**
- Modify: `js/core/register-import-v156.js`
- Create/Modify: `tests/register-import-adaptive-integration.test.js`

**Interfaces:**
- Consumes: `RailOpsAdaptiveRegisterReader.detectAndParseWorkbook` in browser and `require('./register-adaptive-reader.js')` in Node.
- Produces: existing v156 `groups` and existing RPC payloads only.

- [ ] **Step 1: Write failing integration tests** proving a one-sheet-per-site workbook and block-per-site workbook reach the existing structured dialog with the correct groups, while a single-site register keeps the historical flow.
- [ ] **Step 2: Run the integration test and verify RED.**
- [ ] **Step 3: Add a small adapter in v156 converting canonical groups into the current `structuredGroupsFromWorkbook` shape.**
- [ ] **Step 4: Keep current structured parser first so existing v156 files remain unchanged.**
- [ ] **Step 5: If adaptive confidence is below threshold, return to current legacy fallback without RPC.**
- [ ] **Step 6: Run integration and existing register tests; verify GREEN.**
- [ ] **Step 7: Commit.**

### Task 4: Browser loading and user feedback

**Files:**
- Modify: `index.html`
- Modify: `js/core/register-import-v156.js`
- Test: `tests/modules-refactor.test.js` or a dedicated script-order test if needed.

**Interfaces:**
- Browser global: `window.RailOpsAdaptiveRegisterReader` loaded before `register-import-v156.js` executes.

- [ ] **Step 1: Add a failing invariant test requiring the adaptive reader script to load before v156.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Add `<script src="./js/core/register-adaptive-reader.js"></script>` before the v156 module load point.**
- [ ] **Step 4: Display the detected format in the import dialog when adaptive parsing is used.**
- [ ] **Step 5: Verify the script-order and integration tests GREEN.**
- [ ] **Step 6: Commit.**

### Task 5: Full regression and merge gate

**Files:**
- No production changes unless a regression is found.

**Interfaces:** none.

- [ ] **Step 1: Run/observe `RailOps modules regression`.**
- [ ] **Step 2: Run/observe `RailOps lifecycle regression`.**
- [ ] **Step 3: Run/observe `Final RLS hotfix check`.**
- [ ] **Step 4: Review the PR diff for accidental changes to Supabase/RPC/offline code.**
- [ ] **Step 5: Merge only if all checks are green.**
- [ ] **Step 6: Verify Vercel automatic deployment status; do not manually redeploy.**
