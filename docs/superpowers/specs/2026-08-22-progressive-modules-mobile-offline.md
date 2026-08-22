# RailOps Progressive Modules + Mobile Offline Spec

## Goal
Refactor RailOps progressively from one large `index.html` into focused native ES modules without changing the current user-facing behavior, while preserving mobile installability, local work during network loss, and later reliable synchronization to Supabase.

## Non-negotiable constraints
- Do not rewrite RailOps or migrate to React.
- Keep HTML/CSS/JavaScript and native browser modules.
- `main` must remain deployable at every merge point.
- Preserve the existing Supabase data model, localStorage keys, roles, authentication flows, chantier hierarchy, inventory rules, imports, QR/scanning behavior, multi-chantier behavior, anti-duplicate rules, and v155 shared lifecycle behavior during extraction.
- Preserve Android/iOS installed-web-app behavior.
- Preserve current offline behavior during the module extraction phase.
- Do not introduce the new durable offline queue in the same commits as pure module extraction.
- Future durable offline writes must survive app close/reopen and synchronize after connectivity returns.
- A field report must never be silently lost. Conflicting offline changes must be retained and surfaced instead of silently overwriting one another.
- Keep the backup branch `backup/pre-modules-mobile-offline-20260822` untouched as the pre-refactor restore point.

## Architecture
Use native ES modules served directly by Vercel. Keep `index.html` as the document shell and progressively extract responsibilities. During migration, retain a small compatibility bridge for global functions that are still referenced by inline event handlers or legacy code.

Target structure:

```text
index.html
css/
  railops.css
js/
  app.js
  core/
    lifecycle.js
    state.js
    supabase.js
    storage.js
    sync.js
  auth.js
  roles.js
  chantiers.js
  registre.js
  inventaire.js
  ui.js
  legacy-bridge.js
tests/
```

## Migration sequence
1. Extract CSS only. No JavaScript behavior changes.
2. Extract the existing v155 lifecycle manager while preserving its exact shared-hook semantics.
3. Extract state and Supabase access with compatibility exports; no data-shape changes.
4. Extract auth and roles; preserve v153 session behavior and permission semantics.
5. Extract chantiers logic.
6. Extract registre and inventaire logic, including anti-duplicate, multi-chantier, import, QR and inventory-label behavior.
7. Extract common UI/rendering and reduce legacy global surface.
8. Make `js/app.js` the explicit application entry point.
9. Only after the modular extraction is stable, add durable offline infrastructure (`storage.js`, `sync.js`, service worker / app-shell caching as required), with separate tests and review.

## Dependency direction
- `app.js` orchestrates startup.
- Feature modules may consume core state/storage/Supabase interfaces.
- Core storage/Supabase modules must not depend on UI rendering.
- Authorization policy lives in `roles.js`; server-side security remains Supabase/RLS responsibility.
- `lifecycle.js` owns the shared render/load/mutation lifecycle. Feature modules register handlers; they must not create independent render/load wrappers.

## Validation gates
Every migration slice must have an independently reviewable commit and preserve a working deployment. At minimum run the lifecycle regression test, module/load checks, and Vercel deployment checks. Add focused tests before moving sensitive business logic.

## Offline phase acceptance criteria
When durable offline sync is implemented later:
- A report created offline is stored locally before the UI reports success.
- Pending reports survive full app close/reopen.
- Reconnect triggers retry without duplicate server records.
- Items are removed from the local pending queue only after server acknowledgement.
- Retry is idempotent.
- Conflicting updates are retained and surfaced for resolution; no silent data loss.
