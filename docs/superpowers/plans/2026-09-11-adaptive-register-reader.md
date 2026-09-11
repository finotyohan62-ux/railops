# Adaptive Register Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un moteur de lecture adaptatif capable de reconnaître plusieurs architectures de registres Excel et de les convertir vers le modèle RailOps existant sans casser les imports actuels.

**Architecture:** Un nouveau module pur `js/core/register-adaptive-reader.js` détecte et parse les variantes Excel vers un modèle canonique. `register-import-v156.js` reste propriétaire des règles métier, exécute son parser actuel en premier et ne charge le lecteur adaptatif qu’en deuxième intention lorsque la confiance est suffisante. Les registres simples conservent le flux historique.

**Tech Stack:** JavaScript UMD/Node, SheetJS/XLSX côté navigateur, tests Node sans dépendance externe, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-11-adaptive-register-reader-design.md`

## Global Constraints

- Aucun changement Supabase ou RPC.
- Compatibilité descendante obligatoire pour les chantiers simples et le v156 existant.
- Aucune écriture serveur si une affectation de référence est ambiguë.
- Les vrais multi-chantiers explicitement présents restent autorisés.
- Les cellules fusionnées déjà corrigées restent inchangées.
- TDD : chaque nouveau comportement doit échouer avant l’implémentation puis passer après.

---

### Task 1: Contract tests for adaptive format detection

**Files:**
- Create: `tests/register-adaptive-reader.test.js`
- Modify: `.github/workflows/modules-refactor-check.yml`

- [x] **Step 1: Write failing tests** covering structured multi-site, one-sheet-per-site, block-per-site, single-site and metadata-tab exclusion.
- [x] **Step 2: Verify RED** because the module does not exist.
- [x] **Step 3: Add the test to `modules-refactor-check.yml`.**
- [x] **Step 4: Commit the RED state.**

### Task 2: Implement the pure adaptive reader

**Files:**
- Create: `js/core/register-adaptive-reader.js`
- Test: `tests/register-adaptive-reader.test.js`

- [x] **Step 1: Implement shared text/header/reference normalization.**
- [x] **Step 2: Implement structured-table parser preserving explicit site and merged-cell continuation semantics.**
- [x] **Step 3: Implement INVENTAIRE + site-sheet recognition without superseding explicit INVENTAIRE assignments.**
- [x] **Step 4: Implement one-sheet-per-site parsing with metadata-tab filtering.**
- [x] **Step 5: Implement block-per-site parsing using explicit markers and conservative repeated plain-title inference.**
- [x] **Step 6: Implement single-sheet fallback with confidence score.**
- [x] **Step 7: Verify GREEN in GitHub Actions.**
- [x] **Step 8: Commit.**

### Task 3: Integrate adaptive reader with v156 without changing server semantics

**Files:**
- Modify: `js/core/register-import-v156.js`
- Create: `tests/register-import-adaptive-integration.test.js`

- [x] **Step 1: Write failing integration tests** proving one-sheet-per-site and block-per-site work while a single-site register keeps the historical flow.
- [x] **Step 2: Verify RED.**
- [x] **Step 3: Add adapter from canonical groups into the existing v156 group shape.**
- [x] **Step 4: Keep current structured parser first so existing v156 files remain unchanged.**
- [x] **Step 5: If adaptive confidence is below threshold, return to current legacy fallback without RPC.**
- [x] **Step 6: Verify integration and existing register tests GREEN.**
- [x] **Step 7: Commit.**

### Task 4: Browser loading and user feedback

**Files:**
- Modify: `js/core/register-import-v156.js`
- No modification required to `index.html`.

- [x] **Step 1: Keep adaptive loading out of the critical startup path.**
- [x] **Step 2: Lazy-load `./js/core/register-adaptive-reader.js` only when the existing parser found no structured destinations.**
- [x] **Step 3: In Node tests, use `require('./register-adaptive-reader.js')`.**
- [x] **Step 4: Display the detected adaptive format in the default import dialog.**
- [x] **Step 5: Verify integration and lifecycle regressions GREEN.**
- [x] **Step 6: Commit.**

### Task 5: Full regression and merge gate

**Files:**
- No production changes unless a regression is found.

- [x] **Step 1: Observe `RailOps modules regression` green on the implementation.**
- [x] **Step 2: Observe `RailOps lifecycle regression` green on the implementation.**
- [x] **Step 3: Observe `Final RLS hotfix check` green on the implementation.**
- [ ] **Step 4: Review the final PR diff for accidental Supabase/RPC/offline changes.**
- [ ] **Step 5: Merge only if all final-head checks are green.**
- [ ] **Step 6: Verify Vercel automatic deployment status; do not manually redeploy.**
