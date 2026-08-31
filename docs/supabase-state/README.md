# Snapshots GitHub / Supabase

Ce dossier contient des relevés **strictement en lecture seule** utilisés pour suivre l'état réel autour de la branche `security/v150b2b-rls-ready` sans modifier la production.

## But

Les snapshots servent à distinguer clairement :

- l'état GitHub observé au moment du contrôle (head de branche, divergence avec `main`, état de la PR et du déploiement de preview) ;
- l'état Supabase observé au même moment (santé du projet, version PostgreSQL, catégories d'alertes Security/Performance Advisor) ;
- les points qui restent volontairement sans action parce qu'ils nécessitent une validation humaine ou impliquent permissions, RLS, Auth, schéma, données ou fusion de branches.

## Convention de nommage

Les fichiers utilisent `YYYY-MM-DD-HHMM.md` en heure Europe/Paris. Le fichier portant l'horodatage le plus récent est le relevé de référence pour un diagnostic ponctuel ; les anciens fichiers restent conservés pour comparer les évolutions.

## Convention de comptage

Les snapshots doivent nommer explicitement la métrique mesurée afin d'éviter toute confusion entre **volume de données** et **configuration de sécurité** :

- `row_count` = nombre de lignes réellement présentes dans la table au moment du relevé ;
- `policy_count` = nombre de policies RLS définies pour cette table ;
- `rls_enabled` = état d'activation de la RLS, séparé des deux compteurs précédents.

Un tableau ou une liste de nombres ne doit donc jamais être présenté sous le seul terme « comptage » lorsqu'il s'agit de policies. Si les volumes de données ne sont pas nécessaires au diagnostic, le snapshot peut les omettre plutôt que de les déduire d'un autre indicateur.

## Fraîcheur et comparaison des Advisors

Les sorties Security/Performance Advisor sont des observations horodatées. Pour éviter de présenter une alerte ancienne comme une nouveauté :

- conserver l'`observed_at` fourni par Supabase lorsqu'il est disponible, ou au minimum l'heure locale du relevé ;
- comparer d'abord les familles d'alertes et leurs `cache_key` avec le snapshot précédent avant d'annoncer un changement ;
- considérer un niveau `INFO` comme un signal de diagnostic, pas comme une anomalie à corriger automatiquement ;
- considérer un niveau `WARN` comme un point à qualifier, pas comme une autorisation de modifier Auth, permissions, RLS, fonctions ou schéma ;
- ne notifier Yohan que si une famille nouvelle, une hausse significative, une régression observable ou une décision humaine apparaît. Une famille identique déjà documentée ne constitue pas à elle seule un nouvel incident.

Cette règle évite le bruit dans les contrôles récurrents tout en conservant l'historique nécessaire pour détecter une vraie dérive.

## Gabarit minimal avant commit

Pour éviter qu'un nouveau relevé soit incomplet, recopier cette ossature puis remplacer uniquement les valeurs réellement observées. Les huit tables cœur doivent toutes apparaître dans la section RLS/policies, même lorsque le nombre de policies vaut `0`.

```md
# RailOps — état GitHub / Supabase

Relevé strictement en lecture seule.

## GitHub
- Branche : `security/v150b2b-rls-ready`
- `main` : `<sha>`
- Divergence : **<behind> behind / <ahead> ahead**

## Supabase
- Projet : `railops` (`<project-ref>`)
- Santé/version : `<état réellement observé>`

### RLS / policies — lecture seule
- `agents` : <policy_count> ; rls_enabled=<true|false>
- `chantiers` : <policy_count> ; rls_enabled=<true|false>
- `deleted_ids` : <policy_count> ; rls_enabled=<true|false>
- `inspections` : <policy_count> ; rls_enabled=<true|false>
- `materiels` : <policy_count> ; rls_enabled=<true|false>
- `prix_catalogue` : <policy_count> ; rls_enabled=<true|false>
- `scans` : <policy_count> ; rls_enabled=<true|false>
- `users` : <policy_count> ; rls_enabled=<true|false>

### Security Advisor
- <résumé factuel des familles observées, avec observed_at si disponible>

Ces alertes restent des signaux de diagnostic uniquement.
Aucune permission, fonction, policy, Auth ou RLS n'est modifiée automatiquement.

### Performance Advisor
- <résumé factuel des familles observées, avec observed_at si disponible>

Aucun index ni changement de schéma n'est appliqué.

## Diagnostic
- <constat uniquement, sans déduire une remédiation risquée>

## Garde-fous
- aucun merge, rebase ou changement de `main` ;
- aucune activation de RLS stricte ;
- aucune écriture Supabase, donnée, schéma, permission ou règle métier ;
- aucun changement Import, Multi-chantier ou purge hebdomadaire.
```

Avant commit, exécuter la suite `v150B-2B checks` ou au minimum le contrat `tests/v150b2b-snapshot-contract.test.js` afin de vérifier que le relevé le plus récent reste conforme.

## Confidentialité des relevés

Les snapshots restent **metadata-only**. Ils peuvent contenir des identifiants techniques non secrets utiles au diagnostic (SHA Git, nom de branche, identifiant public du projet, noms de tables/functions et états de policies), mais ne doivent jamais contenir de jeton de session, JWT, bearer token, clé `service_role`, clé Supabase secrète, mot de passe ou autre secret d'authentification.

Le test `tests/v150b2b-snapshot-privacy.test.js` vérifie automatiquement les fichiers horodatés du dossier contre plusieurs formes courantes de secrets avant qu'un changement ne soit considéré comme vert. Ce garde-fou est volontairement local aux snapshots et ne lit ni n'écrit aucune donnée Supabase.

## Règles de lecture

Un snapshot est une **photographie**, pas une migration ni une recommandation automatique. Une alerte Supabase présente dans un relevé ne doit jamais être corrigée directement sur cette seule base : il faut d'abord confirmer son impact et obtenir l'accord requis si la correction touche la sécurité, les droits, le schéma ou les données.

Les garde-fous permanents restent : aucun merge/rebase automatique, aucun changement de `main`, aucune activation de RLS stricte, aucune modification destructive, et aucune altération des comportements Import, Multi-chantier ou purge hebdomadaire.
