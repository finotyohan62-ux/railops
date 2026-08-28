# RailOps — journal de travail

> Historique intégral du journal jusqu’au passage du 2026-08-28 04:17 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-28-0417.md`. Cette archive pointe vers le blob Git exact du journal précédent ; le journal courant continue ci-dessous.

## 2026-08-28 — snapshot GitHub/Supabase frais 05:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `6d302fb82c3905d7143526d60c9d5a0cd793cc26`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence initiale `2 commits behind / 509 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`, `chantiers=22`, `materiels=1689`, `scans=124`, `users=34`; RLS activé mais non forcé sur les tables cœur contrôlées. Security Advisor et Performance Advisor relus sans aucune remédiation.
- Amélioration réversible : ajout du snapshot `docs/supabase-state/2026-08-28-0512.md`. Les commits `70fbd5b71b7e10bd7df946df3cab3541d3416d00` et `91548f37960663c23531378504a7b136635a79c3` ont révélé deux exigences textuelles du contrat snapshot ; le correctif documentaire final `562e6988633ef7ff91379b06fd6992a592931429` les aligne sans toucher au runtime.
- Vérification fraîche : `v150B-2B checks` run `33138432764` est `success` sur `562e6988633ef7ff91379b06fd6992a592931429`.
- Maintenance du journal : l’ancien contenu de `docs/worklog-railops.md` est préservé bit pour bit dans `docs/worklog-railops-archive-through-2026-08-28-0417.md` avant poursuite du journal courant.
- Garde-fous respectés : aucun code runtime, workflow métier, règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit ni test utilisateur requis ; les remédiations sécurité/performance et toute intégration de la dérive de `main` restent volontairement hors scope sans validation explicite.

## 2026-08-28 — durcissement des tests diagnostics 06:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée à `14ebe67959dd7b7d975a499dc4684ff3e4093ad9`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` relu en lecture seule, statut `ACTIVE_HEALTHY`; RLS des tables cœur contrôlées toujours activé et non forcé.
- Amélioration réversible et sans runtime : `tests/v150b2b-diagnostics.test.js` vérifie désormais explicitement que la génération du snapshot diagnostics ne mute pas l’état applicatif et que seuls les marqueurs `_pending === true` sont comptés comme scans en attente.
- Commit : `7c2bd8ea7fcf9c80683770389e250d7014b26c9c` (`test: harden diagnostics purity checks`).
- Vérification fraîche : `v150B-2B checks` run `33141427795` est `success` sur ce commit ; le garde ciblé diagnostics passe avec la suite v150B-2B.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; la dérive de `main` et toute remédiation sécurité/performance restent hors scope sans validation explicite.