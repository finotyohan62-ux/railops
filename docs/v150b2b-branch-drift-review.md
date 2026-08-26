# v150B-2B — revue sûre de dérive avec `main`

Ce document décrit une revue **en lecture seule** lorsqu'un diagnostic CI indique que `main` contient des commits ou fichiers absents de `security/v150b2b-rls-ready`.

## But

Déterminer si la dérive peut affecter la compatibilité de la preview v150B-2B sans synchroniser automatiquement la branche et sans modifier le backend.

## Procédure

1. Vérifier le SHA courant de `main`, le SHA de la branche et leur `merge-base`.
2. Lire le résumé `Report branch drift (non-blocking)` de GitHub Actions.
3. Examiner d'abord la liste **runtime-impact** : `index.html`, JavaScript/HTML/CSS applicatif et `supabase/`.
4. Pour chaque fichier runtime présent uniquement sur `main`, lire le commit qui l'a introduit et classer son impact : cache/déploiement, structure client, authentification/synchronisation, ou backend.
5. Vérifier séparément l'état Supabase réel en lecture seule avant de conclure à la compatibilité.
6. Si un changement runtime, backend, permission, sécurité, données ou règle métier doit être intégré, arrêter la revue et demander une validation explicite avant merge, rebase ou cherry-pick.

## Ce que cette revue ne doit jamais faire

- aucun merge, rebase ou cherry-pick automatique ;
- aucune modification de `main` ;
- aucune activation de RLS stricte ;
- aucune migration, policy, permission ou correction de données ;
- aucune modification d'Import, Multi-chantier ou de la purge hebdomadaire ;
- aucune conclusion de compatibilité fondée uniquement sur une CI verte.

## Sortie attendue

Une revue sûre doit pouvoir répondre à trois questions :

- combien de commits et fichiers de `main` manquent à la branche ;
- quels fichiers ont un impact runtime potentiel ;
- lesquels nécessitent une décision humaine avant toute intégration.

Les résultats utiles sont consignés dans `docs/worklog-railops.md`. Les écarts nécessitant une décision restent explicitement en attente ; ils ne sont pas corrigés automatiquement.
