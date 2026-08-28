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

## 2026-08-28 — robustesse diagnostics sur états malformés 07:16 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `cb114b498d2f08d0a55e6acfc46358eefaffd811`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle SQL lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout d’un cas de régression dans `tests/v150b2b-diagnostics.test.js` pour vérifier que des collections malformées ou seulement « array-like » sont ignorées proprement, ne gonflent aucun compteur, ne créent aucun faux scan en attente et n’émettent aucun faux avertissement ; la version numérique est toujours sérialisée en texte et un indicateur `online` non booléen reste `null`.
- Commit fonctionnel : `5a48d9552481f44ee5f8cad1f3d101c41ebcf30a` (`test: cover malformed diagnostics state`).
- Vérification fraîche : `v150B-2B checks` run `33144243263` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, permission, règle métier, Import, logique Multi-chantier, purge hebdomadaire ni RLS stricte modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; toute intégration de la dérive de `main`, remédiation sécurité/performance ou changement de permissions reste volontairement hors scope sans validation explicite.

## 2026-08-28 — diagnostic réseau indéterminé 08:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `fe9b3329e07172554e78d6cfc22a182af2f15faf`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence `2 commits behind / 518 ahead` avant ce passage. Contrôle Supabase strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout d’un cas de régression dans `tests/v150b2b-diagnostics.test.js` pour garantir qu’un état Chef de chantier avec connectivité inconnue (`online=null`) n’émet pas à tort `CHEF_CHANTIER_STATS_MISSING`.
- Commit fonctionnel : `0752b355656dbdf02ddf94778c8c9cd3d9129bed` (`test: cover unknown connectivity diagnostics`).
- Vérification fraîche : `v150B-2B checks` run `33147476680` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, permission, règle métier, Import, logique Multi-chantier, purge hebdomadaire ni RLS stricte modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; la dérive de `main`, les remédiations sécurité/performance et tout changement de permissions restent volontairement hors scope sans validation explicite.

## 2026-08-28 — maintien des alertes diagnostics hors ligne 09:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `b26caa299eca6d3ec2d5b6557323683be38ee142`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout de `tests/v150b2b-diagnostics-offline-warning.test.js`, auto-découvert par le runner v150B-2B, pour garantir que le mode hors ligne ne masque que l’alerte dépendante de la disponibilité serveur (`CHEF_CHANTIER_STATS_MISSING`) et conserve les alertes de fuite de scope et d’invariants de session.
- Commit fonctionnel : `85dd3c26995a243492eb41f72264a2b11e30e5a2` (`test: preserve offline diagnostic warnings`).
- Vérification fraîche : `v150B-2B checks` run `33150724207` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; toute intégration de la dérive de `main`, remédiation sécurité/performance ou changement de permissions reste volontairement hors scope sans validation explicite.

## 2026-08-28 — index de couverture diagnostics 10:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `3f3bd85874c225080c212de2d64e5c49928e037b`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et documentaire uniquement : `docs/v150b2b-test-inventory.md` référence désormais explicitement les six gardes diagnostics auto-découverts (forme/pureté, confidentialité, warnings, comportement hors ligne, wiring preview et guide logs) et rappelle que le runner reste la source d’autorité d’exécution.
- Commit fonctionnel : `17e14155588f9026cedfb17161843a848d677c41` (`docs: index diagnostics test coverage`).
- Vérification fraîche : `v150B-2B checks` run `33154738797` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent hors scope sans validation explicite.

## 2026-08-28 — stabilité de l’ordre des alertes diagnostics 11:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `2707fbae55f85bdb277a8a538161b456c0c0a9d7`, puis `dda00a06994f56ea45076b2ec095970581a0913f` après le garde ajouté ; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout de `tests/v150b2b-diagnostics-warning-order.test.js`, auto-découvert par le runner, pour verrouiller un ordre déterministe des alertes lorsque plusieurs invariants diagnostics échouent simultanément et garantir l’absence de doublons. Cela stabilise les logs/support sans modifier la logique applicative.
- Commit fonctionnel : `dda00a06994f56ea45076b2ec095970581a0913f` (`test: lock diagnostics warning order`).
- Vérification fraîche : `v150B-2B checks` run `33158516812` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent hors scope sans validation explicite.
