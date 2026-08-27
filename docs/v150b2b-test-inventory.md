# v150B-2B — inventaire de vérification

Ce document décrit la suite de vérification de la branche `security/v150b2b-rls-ready`. Il est documentaire uniquement : il ne modifie ni le runtime RailOps, ni les données, ni les permissions.

## Lancement local

```bash
node tests/run-v150b2b-checks.js
```

Le runner découvre automatiquement les fichiers `tests/v150b2b-*.test.js`, les exécute dans l’ordre alphabétique, puis contrôle la syntaxe des modules extraits de `v150b2b-test.html`.

## Gardes critiques explicitement attendues

Le runner échoue immédiatement si l’un de ces tests n’est plus découvert :

- `v150b2b-agent-material-save-regression.test.js` — non-régression de sauvegarde matériel Agent.
- `v150b2b-ci-branch-safety.test.js` — périmètre et innocuité de la CI de branche.
- `v150b2b-ci-isolation-contract.test.js` — isolation du runner diagnostique.
- `v150b2b-ci-job-permissions.test.js` — absence de permissions CI redéfinies au niveau job.
- `v150b2b-ci-nonmutation.test.js` — absence de mutation dans les contrôles CI.
- `v150b2b-static-invariants.test.js` — invariants statiques de la prévisualisation v150B-2B.

## Diagnostic produit par le runner

À chaque exécution, le runner affiche :

- le contexte Node/ref/SHA/événement ;
- le nombre de tests et de cibles syntaxiques découverts ;
- la durée de chaque contrôle et les trois plus lents ;
- le nombre de contrôles réussis ;
- les causes d’échec regroupées lorsqu’il y en a ;
- un résumé GitHub Actions quand `GITHUB_STEP_SUMMARY` est disponible.

## Limites volontaires

Cette suite est un garde-fou de diagnostic. Elle ne doit pas servir à déployer, modifier Supabase, fusionner/rebaser la branche, activer une RLS stricte ou changer les règles métier. Les imports, le Multi-chantier et la purge de vérification hebdomadaire restent hors du périmètre des améliorations automatisées sans validation explicite.
