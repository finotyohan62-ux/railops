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

## Confidentialité des relevés

Les snapshots restent **metadata-only**. Ils peuvent contenir des identifiants techniques non secrets utiles au diagnostic (SHA Git, nom de branche, identifiant public du projet, noms de tables/functions et états de policies), mais ne doivent jamais contenir de jeton de session, JWT, bearer token, clé `service_role`, clé Supabase secrète, mot de passe ou autre secret d'authentification.

Le test `tests/v150b2b-snapshot-privacy.test.js` vérifie automatiquement les fichiers horodatés du dossier contre plusieurs formes courantes de secrets avant qu'un changement ne soit considéré comme vert. Ce garde-fou est volontairement local aux snapshots et ne lit ni n'écrit aucune donnée Supabase.

## Règles de lecture

Un snapshot est une **photographie**, pas une migration ni une recommandation automatique. Une alerte Supabase présente dans un relevé ne doit jamais être corrigée directement sur cette seule base : il faut d'abord confirmer son impact et obtenir l'accord requis si la correction touche la sécurité, les droits, le schéma ou les données.

Les garde-fous permanents restent : aucun merge/rebase automatique, aucun changement de `main`, aucune activation de RLS stricte, aucune modification destructive, et aucune altération des comportements Import, Multi-chantier ou purge hebdomadaire.
