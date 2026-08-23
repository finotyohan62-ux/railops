# RailOps iPhone / Safari Layout V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supprimer le glissement horizontal global sur iPhone et stabiliser la barre basse, le FAB, les modales et les champs de formulaire sur Safari iOS.

**Architecture:** Correctif CSS borné sur la feuille extraite `css/railops.css`, sans JavaScript métier. Un test de régression Node vérifie les invariants structurels iOS et la CI existante l'exécute avec les tests de modularisation et de lifecycle.

**Tech Stack:** HTML/CSS natif, Node.js `assert`, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-23-iphone-safari-layout-v1.md`

## Global Constraints

- Aucun changement métier, Supabase ou offline.
- Pas de framework UI ni de réécriture.
- Conserver le scroll horizontal volontaire de `.chips`.
- Compatibilité Android/desktop préservée.
- Un seul push final afin d'éviter les déploiements Vercel intermédiaires.
- Validation réelle finale sur iPhone obligatoire avant clôture.

---

### Task 1: Verrouiller les invariants iPhone par test

**Files:**
- Create: `tests/iphone-layout-regression.test.js`

**Interfaces:**
- Consumes: `css/railops.css`
- Produces: un test Node sans dépendance externe.

- [x] **Step 1: Écrire le test RED**

Le test vérifie l'absence de `#app { inset:0; width:100% }`, la contrainte horizontale des racines/écrans, les grilles `minmax(0,1fr)`, la safe-area de la navigation/FAB/modal et la règle mobile `.fi{font-size:16px}`.

- [x] **Step 2: Exécuter le test contre le CSS actuel**

Run: `node tests/iphone-layout-regression.test.js`

Expected: FAIL sur `#app must not combine inset:0 with width:100% on iOS`.

### Task 2: Corriger la géométrie mobile et les safe areas

**Files:**
- Modify: `css/railops.css`

**Interfaces:**
- Consumes: classes existantes `#app`, `.screen`, `.bnav`, `.ni`, `.nl`, `.fab`, `.msheet`, `.stat-grid`, `.rg2`, `.fi`.
- Produces: même API CSS/classes pour le HTML existant.

- [x] **Step 1: Contraindre le viewport horizontal**

Remplacer le couple `inset:0;width:100%` de `#app` par `top`, `right`, `bottom`, `left` avec `min-width:0` et `max-width:100%`. Ajouter `max-width:100%` et `overscroll-behavior-x:none` aux racines et à `.screen`.

- [x] **Step 2: Rendre flex/grid rétractables**

Ajouter `min-width:0` aux conteneurs critiques et remplacer les grilles deux colonnes par `minmax(0,1fr) minmax(0,1fr)`.

- [x] **Step 3: Stabiliser la barre basse**

Utiliser `max(8px,env(safe-area-inset-bottom,0px))` pour le padding bas, garder chaque `.ni` à `min-width:0;min-height:44px`, centrer son contenu et empêcher `.nl` de revenir à la ligne.

- [x] **Step 4: Recaler FAB et modales**

Définir le FAB avec `bottom:calc(70px + env(safe-area-inset-bottom,0px))`. Conserver `92vh` en fallback et ajouter `92dvh`, largeur bornée et padding safe-area aux `.msheet`.

- [x] **Step 5: Empêcher le zoom de focus Safari**

Ajouter `@media (max-width:600px){ .fi{font-size:16px} }`.

- [x] **Step 6: Exécuter le test GREEN**

Run: `node tests/iphone-layout-regression.test.js`

Expected: `iPhone layout regression invariants: OK`.

### Task 3: Intégrer à la CI et valider le lot

**Files:**
- Modify: `.github/workflows/modules-refactor-check.yml`

**Interfaces:**
- Consumes: test Node de Task 1.
- Produces: CI automatique sur `fix/iphone-safari-layout-v1`.

- [ ] **Step 1: Ajouter la branche au trigger push**

Ajouter `fix/iphone-safari-layout-v1` aux branches surveillées.

- [ ] **Step 2: Ajouter le test iPhone au job**

Run: `node tests/iphone-layout-regression.test.js` après le test modules.

- [ ] **Step 3: Créer un seul commit/push**

Inclure CSS, test, spec, plan et workflow dans le même commit.

- [ ] **Step 4: Vérifier GitHub Actions et Vercel**

Attendre un état vert des tests disponibles et du déploiement Vercel. Ne pas fusionner sans test réel iPhone.
