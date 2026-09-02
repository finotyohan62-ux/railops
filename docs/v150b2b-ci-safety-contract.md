# v150B-2B — contrat de sécurité CI

Ce document décrit le comportement actuel du workflow `.github/workflows/v150b2b-checks.yml` sur la branche `security/v150b2b-rls-ready`. Il s'agit d'un repère de maintenance, pas d'une autorisation à modifier les règles métier, les permissions applicatives, Supabase ou la production.

## Périmètre

Le workflow est volontairement limité aux vérifications de branche :

- `push` sur `security/v150b2b-rls-ready` ;
- `pull_request` ciblant `main` ;
- aucune exécution planifiée, externe ou privilégiée (`schedule`, `workflow_dispatch`, `repository_dispatch`, `workflow_run`, `pull_request_target`) ;
- permissions GitHub limitées à `contents: read` ;
- aucun secret ni environnement de déploiement consommé ;
- checkout sans persistance des credentials et avec historique complet (`fetch-depth: 0`).

## Diagnostic de dérive

Sur un `push`, l'étape `Report branch drift (non-blocking)` compare la branche à `origin/main` en lecture seule. Elle expose notamment :

- les nombres de commits `behind` et `ahead` ;
- la merge-base et sa date ;
- le nombre de fichiers modifiés uniquement sur `main` ;
- une classification indicative `app / tests / backend / docs / other` ;
- la liste limitée des fichiers à impact runtime ;
- une recommandation de revue de compatibilité lorsque des fichiers runtime ont changé sur `main`.

Cette étape est informative et `continue-on-error: true` : elle ne merge, rebase, cherry-pick, push ni déploie rien.

## Vérification principale

La suite est exécutée directement avec Node.js 22 via :

```text
node tests/run-v150b2b-checks.js
```

Le workflow n'installe pas de dépendances et possède un timeout de cinq minutes. La concurrence annule les exécutions devenues obsolètes pour la même branche ou pull request.

## Règle de maintenance

Avant toute modification de ce workflow, conserver les invariants testés dans `tests/v150b2b-ci-branch-safety.test.js`. Une évolution qui nécessite un déploiement, une permission supplémentaire, un secret, une mutation Git/Supabase ou un changement de règles métier doit être traitée comme une décision distincte et validée explicitement avant application.
