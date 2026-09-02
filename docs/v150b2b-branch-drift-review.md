# v150B-2B — revue sûre de dérive avec `main`

Ce document décrit une revue **en lecture seule** lorsqu'un diagnostic CI indique que `main` contient des commits ou fichiers absents de `security/v150b2b-rls-ready`.

## But

Déterminer si la dérive peut affecter la compatibilité de la preview v150B-2B sans synchroniser automatiquement la branche et sans modifier le backend.

## Fraîcheur obligatoire

Chaque revue doit être recalculée à partir de l'état GitHub réel au moment du contrôle. Ne jamais recopier un ancien compteur `ahead/behind`, un ancien SHA ou une ancienne liste de fichiers depuis le worklog comme s'ils décrivaient l'état courant.

Consigner au minimum :

- l'horodatage du contrôle ;
- le SHA courant de `main` ;
- le SHA de la branche ;
- la `merge-base` ;
- les compteurs `ahead/behind` ;
- la liste des fichiers présents uniquement sur `main` ayant un impact runtime potentiel ;
- l'état Supabase réel vérifié séparément en lecture seule.

## Procédure

1. Vérifier le SHA courant de `main`, le SHA de la branche, leur `merge-base` et les compteurs `ahead/behind`.
2. Lire le résumé `Report branch drift (non-blocking)` de GitHub Actions.
3. Examiner d'abord la liste **runtime-impact** : `index.html`, JavaScript/HTML/CSS applicatif et `supabase/`.
4. Pour chaque fichier runtime présent uniquement sur `main`, lire le commit qui l'a introduit et classer son impact : cache/déploiement, structure client, authentification/synchronisation, ou backend.
5. Si la dérive touche l'authentification, la synchronisation, le backend, les permissions, les données ou la sécurité, la classer comme nécessitant une revue humaine avant toute intégration ; ne pas déduire sa compatibilité d'une CI verte.
6. Vérifier séparément l'état Supabase réel en lecture seule avant de conclure à la compatibilité.
7. Si un changement runtime, backend, permission, sécurité, données ou règle métier doit être intégré, arrêter la revue et demander une validation explicite avant merge, rebase ou cherry-pick.

## Preuve minimale à laisser dans le worklog

Une entrée utile doit permettre à une personne qui revient plus tard de distinguer le **constat daté** de l'état actuel. Elle doit indiquer les SHA observés, la divergence mesurée, les fichiers runtime concernés, la vérification Supabase en lecture seule et la décision prise (`aucune intégration`, ou `validation humaine requise`).

Les nombres et SHA restent des observations historiques : ils doivent être recalculés lors de la revue suivante.

## Ce que cette revue ne doit jamais faire

- aucun merge, rebase ou cherry-pick automatique ;
- aucune modification de `main` ;
- aucune activation de RLS stricte ;
- aucune migration, policy, permission ou correction de données ;
- aucune modification d'Import, Multi-chantier ou de la purge hebdomadaire ;
- aucune conclusion de compatibilité fondée uniquement sur une CI verte.

## Sortie attendue

Une revue sûre doit pouvoir répondre à quatre questions :

- combien de commits de `main` manquent à la branche ;
- quels fichiers ont un impact runtime potentiel ;
- quels contrôles prouvent que l'état décrit est frais et non recopié d'un ancien passage ;
- lesquels nécessitent une décision humaine avant toute intégration.

Les résultats utiles sont consignés dans `docs/worklog-railops.md`. Les écarts nécessitant une décision restent explicitement en attente ; ils ne sont pas corrigés automatiquement.
