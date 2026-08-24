# Snapshots GitHub / Supabase

Ce dossier contient des relevés **strictement en lecture seule** utilisés pour suivre l'état réel autour de la branche `security/v150b2b-rls-ready` sans modifier la production.

## But

Les snapshots servent à distinguer clairement :

- l'état GitHub observé au moment du contrôle (head de branche, divergence avec `main`, état de la PR et du déploiement de preview) ;
- l'état Supabase observé au même moment (santé du projet, version PostgreSQL, catégories d'alertes Security/Performance Advisor) ;
- les points qui restent volontairement sans action parce qu'ils nécessitent une validation humaine ou impliquent permissions, RLS, Auth, schéma, données ou fusion de branches.

## Convention de nommage

Les fichiers utilisent `YYYY-MM-DD-HHMM.md` en heure Europe/Paris. Le fichier portant l'horodatage le plus récent est le relevé de référence pour un diagnostic ponctuel ; les anciens fichiers restent conservés pour comparer les évolutions.

## Règles de lecture

Un snapshot est une **photographie**, pas une migration ni une recommandation automatique. Une alerte Supabase présente dans un relevé ne doit jamais être corrigée directement sur cette seule base : il faut d'abord confirmer son impact et obtenir l'accord requis si la correction touche la sécurité, les droits, le schéma ou les données.

Les garde-fous permanents restent : aucun merge/rebase automatique, aucun changement de `main`, aucune activation de RLS stricte, aucune modification destructive, et aucune altération des comportements Import, Multi-chantier ou purge hebdomadaire.
