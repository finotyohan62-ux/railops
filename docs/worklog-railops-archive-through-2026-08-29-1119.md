# RailOps — journal de travail

> Historique intégral du journal jusqu’au passage du 2026-08-28 22:15 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-28-2215.md`. Le journal courant continue ci-dessous.

## 2026-08-28 — diagnostics explicites du manifeste CI critique 23:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `4846a5cdfdf1c5cede76f051308722ad4f9c48e6`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence `2 commits behind / 550 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`. Aucune écriture Supabase effectuée.
- Amélioration réversible et sans runtime : `tests/v150b2b-runner-coverage.test.js` exige désormais des diagnostics directs si le manifeste de gardes CI critiques est vide ou contient des doublons ; `tests/run-v150b2b-checks.js` arrête immédiatement la vérification avec un message explicite dans ces deux cas.
- Cycle rouge/vert vérifié : commit test `7cfc9dc939373c5ea9d23d14cc15274f75cf4a31` a fait échouer `v150B-2B checks` run `33211667565`; commit fonctionnel `debaa6fd622080219ac81f691e0896e78839cd0b` (`ci: diagnose invalid critical test manifest`) a remis l’étape `Run v150B-2B verification suite` au vert dans le run `33211720507`.
- Garde-fous respectés : aucun code applicatif runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; les deux commits `main` absents de la branche touchent `js/core/sync.js` et ses tests, donc leur intégration reste volontairement hors scope sans validation explicite.

## 2026-08-29 — baseline Supabase Advisor 00:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `a7b00c9c931527786e2447eb698dc64b0acb4562`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Contrôle Supabase strictement en lecture seule : projet `railops` (`tbmzmmamaiftbbbuelgd`) `ACTIVE_HEALTHY`; Advisor sécurité relu. Les alertes présentes concernent notamment des tables avec RLS sans policy, des fonctions `SECURITY DEFINER` exécutables par `authenticated` et la protection contre les mots de passe compromis désactivée. Aucune écriture Supabase effectuée.
- Amélioration réversible et sans runtime : ajout de `docs/supabase-advisor-baseline.md` pour figer le diagnostic courant et expliciter que ces alertes ne doivent pas être corrigées automatiquement, car elles impliquent potentiellement permissions, RLS, authentification ou migrations.
- Premier contrôle CI : `v150B-2B checks` run `33216170698` a échoué uniquement sur `tests/v150b2b-worklog-contract.test.js`. Cause racine confirmée : le test exigeait que le dernier fragment historique soit encore présent dans `docs/worklog-railops.md`, alors que cette entrée avait été correctement déplacée dans `docs/worklog-railops-archive-through-2026-08-28-2215.md` lors de la rotation du journal.
- Correctif test uniquement : `tests/v150b2b-worklog-contract.test.js` vérifie désormais la présence du dernier fragment dans l’historique durable constitué du journal courant et de ses archives, sans modifier le runtime ni les règles métier. Commit `399ec741a4ff3ba46d68731dc03ad2818ec3bdf2` (`test: accept archived worklog append history`).
- Vérification : `v150B-2B checks` run `33216258220` terminé en `success` sur `399ec741a4ff3ba46d68731dc03ad2818ec3bdf2`; le document Advisor est lisible depuis la branche et reprend uniquement l’état observé via Supabase Advisor.
- Commit documentaire initial : `68d56fcd74be1595edd7146458eb9da81fa34684` (`docs: capture Supabase advisor baseline`).
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, policy, grant, RLS stricte, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : les alertes Advisor impliquant permissions/RLS/authentification restent volontairement non traitées jusqu’à validation explicite ; aucun test utilisateur requis pour cette passe documentaire.

## 2026-08-29 — baseline Advisor performance 01:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `08e216331e30e29a9f5b85c60d2d3223b51df0ba`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Contrôle Supabase strictement en lecture seule : Advisor performance relu sur le projet `railops` (`tbmzmmamaiftbbbuelgd`). Deux avis `unindexed_foreign_keys` de niveau `INFO` sont présents sur `public.inspections` : `inspections_agent_id_fkey` et `inspections_materiel_id_fkey` ne disposent pas d’un index couvrant. Aucun changement de base de données effectué.
- Amélioration réversible et sans runtime : `docs/supabase-advisor-baseline.md` inclut désormais cette baseline performance, distingue explicitement l’avis de performance d’une panne fonctionnelle et interdit toute création automatique d’index/contrainte dans les passages sans validation.
- Commit : `9b09c4587718f8f88706042e412a1827043b07ed` (`docs: capture Supabase performance advisor baseline`).
- Vérification : `v150B-2B checks` run `33219767864` terminé en `success` sur `9b09c4587718f8f88706042e412a1827043b07ed`; un second relevé Advisor confirme les deux mêmes avis sans dérive entre les contrôles.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, index, contrainte, policy, grant, RLS stricte, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : créer des index couvrants pour ces deux clés étrangères serait une migration de schéma et reste volontairement bloqué jusqu’à validation explicite de Yohan ; aucun test utilisateur requis pour la documentation actuelle.

## 2026-08-29 — indexation des clés étrangères `inspections` 01:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `9b82bcfdf4d8ad529f12cf31479eb633666ea6eb`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`; divergence `559 ahead / 2 behind`. Supabase `railops` était `ACTIVE_HEALTHY`, les deux clés étrangères existaient bien et `public.inspections` n’avait alors que son index primaire.
- Changement explicitement approuvé par Yohan : ajout de la migration idempotente `supabase/migrations/20260829_inspections_fk_indexes.sql`, commit `040b9aeec2b54794af337928dc8d659139c97b0b` (`perf: add inspections foreign-key indexes`), puis application Supabase de `inspections_fk_indexes`. Deux index btree ont été créés : `inspections_agent_id_idx(agent_id)` et `inspections_materiel_id_idx(materiel_id)`.
- Vérification base : `pg_indexes` confirme les deux index ; l’Advisor performance ne signale plus `unindexed_foreign_keys`. Les deux nouveaux index apparaissent immédiatement comme `unused_index`, état attendu juste après création et qui ne déclenche aucune suppression automatique. L’Advisor sécurité reste sur la baseline connue ; aucune policy, permission, RLS ou fonction n’a été modifiée.
- Vérification CI du commit migration : les 5 runs observés sont terminés sans échec, dont `v150B-2B checks` runs `33219983672` et `33219987072`, `RailOps lifecycle regression` `33219987224`, `RailOps modules regression` `33219987031` et `Final RLS hotfix check` `33219987034`; statut Vercel preview `success`.
- Documentation mise à jour dans `docs/supabase-advisor-baseline.md`, commit `c92b3f97a317b370217186e8bf05d5d59272dd9c` (`docs: record approved inspections index migration`).
- Garde-fous respectés : aucun code runtime, donnée métier, contrainte, policy, grant, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge et aucun changement de `main`.
- Point en attente : surveiller simplement l’usage réel des deux index lors de prochains relevés Advisor ; aucune décision ou test utilisateur requis maintenant.

## 2026-08-29 — réalignement contrôlé avec `main` 01:32 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` était `562 ahead / 2 behind` par rapport à `main`; les deux commits manquants étaient `e89c57c995fe0661cffcdbfcf88b9f30a408a093` (rafraîchissement de déploiement Agent, une ligne dans `js/core/sync.js`) et `37b216936a6692d54f82cbc004b30c936d13785a` (`Fix ghost scan integrity`, avec régression dédiée).
- Cycle rouge/vert : ajout du cas de test manquant dans `tests/sync-error-handling.test.js`, commit `52a2f91eb1d5bfd8022238df0a7705a51304a2ed`; reproduction locale isolée confirmée en échec avec l’ancien `sync.js` (le scan orphelin était vidé de la file), puis validation en vert après reprise du correctif de `main`.
- Correctif aligné : `js/core/sync.js` est désormais identique à `main` pour cette zone, commit `d88cba7e1915e4553b1c7b3f70c4fc22e3a5a948` (`fix: align ghost scan integrity with main`). Le scan reste en attente et aucun upload `scans` n’est tenté si le matériel associé est absent localement.
- Réalignement d’historique : merge contrôlé `main -> security/v150b2b-rls-ready` matérialisé par `62a0c6a9f749c92a6f72ea5fd8c02f9a8486d563` (`merge: realign security branch with main`), sans modification de `main`. La comparaison après merge indique `behind_by=0` et merge-base `37b216936a6692d54f82cbc004b30c936d13785a`.
- Vérification CI sur `62a0c6a9f749c92a6f72ea5fd8c02f9a8486d563` : `Final RLS hotfix check`, `RailOps modules regression`, `RailOps lifecycle regression` et `v150B-2B checks` sont tous terminés en `success`; Vercel preview est également `success`.
- Nettoyage : un marqueur de staging temporaire a été créé puis supprimé immédiatement (`87cc723073349ebe41f6d85f2f40217009570c71` / `1552f55e8d1e57be8934ed1c3d6ee1666282c357`), sans fichier résiduel ni effet runtime.
- Garde-fous respectés : aucune donnée Supabase, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiée ; PR #1 conservée en DRAFT et non fusionnée.
- Point en attente : aucun choix produit requis pour ce réalignement ; la prochaine étape peut revenir aux améliorations fonctionnelles ou de robustesse à faible risque.

## 2026-08-29 — contrat de persistance des inspections 02:18 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `23f984fe6482eef518acec42c041a520ebfaaf0b`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. La lecture du runtime confirme que le flux historique d’inspection utilise `S.scans`, la clé locale `ro3_s`, un upsert idempotent par `id`, puis un rechargement des champs métier et une fusion par identifiant.
- Amélioration réversible et sans runtime : ajout de `tests/v150b2b-inspection-persistence-contract.test.js`, qui caractérise ce contrat existant (initialisation de l’état, sauvegarde locale, chemin d’upsert, liste des champs relus et dédoublonnage par `id`) sans modifier `js/legacy-core.js` ni Supabase.
- Commit test : `0eb06308a010c3b76a973b34bfa7db19339bdb66` (`test: guard inspection persistence contract`).
- Vérification : `v150B-2B checks` run `33223138377` terminé en `success` sur le commit test.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : aucune décision ni test utilisateur requis ; ce garde-fou permet de poursuivre ultérieurement l’audit du rendu Chef sans toucher au comportement actuel.

## 2026-08-29 — inventaire du garde de persistance inspections 03:20 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head initial `3e93913ef5f24359360f21d2217f061f8ea40d76`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`; Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`.
- Amélioration réversible et sans runtime : `docs/v150b2b-test-inventory.md` référence désormais `v150b2b-inspection-persistence-contract.test.js` et son rôle ; `tests/v150b2b-test-inventory-contract.test.js` exige que ce garde reste présent dans l’inventaire humain.
- Vérification : le contrôle attendu était absent de l’inventaire avant changement ; commit `924dedda3af9219ce3365451d8f2dc52326cd4f6` (`docs: index inspection persistence guard`) ; `v150B-2B checks` run `33226115047` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, policy, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, aucune RLS stricte, aucun déploiement production et aucun changement de `main`.
- Point en attente : aucun choix produit ni test utilisateur requis ; la prochaine passe peut poursuivre l’audit du rendu Chef ou une autre amélioration documentaire/diagnostique à faible risque.

## 2026-08-29 — audit du champ fournisseur des inspections 05:25 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `9d1ceaf31cbbb9e164b3cae6454fc22dfc72fe80`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Le runtime persiste `fournisseur` dans les objets d’inspection mais la sélection de rechargement `scans` ne relit pas ce champ.
- Diagnostic automatisé : commit rouge `d7f1d6a678e8cfd85ba4b3d42be5ecba5364b367` a exigé `fournisseur` dans le contrat de rechargement ; `v150B-2B checks` a confirmé le défaut avec 52 contrôles sur 53 au vert et uniquement cette attente en échec. La branche a été remise au vert par `cfdd2270eb535c4ba2d027978ce64d121c002c50` sans modifier le runtime.
- Amélioration réversible et sans runtime : ajout de `docs/inspection-persistence-audit.md`, commit `d29269a7c668c48a2f1530bd7f7202ebd658e6dd`, qui documente le flux réel, l’écart de champ, la reproduction et la correction minimale recommandée.
- Choix de sécurité : aucun monkey-patch du client Supabase n’a été introduit. La correction directe d’un seul champ dans `js/legacy-core.js` est différée jusqu’à disposer d’une édition fiable de ce fichier minifié, afin d’éviter une réécriture disproportionnée d’environ 500 Ko pour un changement local.
- Garde-fous respectés : aucun changement Supabase, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire ; aucun merge ni changement de `main`.
- Point en attente : correction locale de la sélection `scans` (`+ fournisseur`) dès qu’un mode d’édition sûr de `js/legacy-core.js` est disponible ; aucun choix produit ni test utilisateur requis.

## 2026-08-29 — correction du diagnostic `fournisseur` 06:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` vérifiée avant édition ; `main` laissé intact. Projet Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`.
- Diagnostic serveur : `information_schema.columns` confirme que `public.scans` contient exactement `id,materielId,chantierId,agentNom,date,etatGeneral,proprete,fonctionnement,dommages,dommagesDesc,observations,actions,photo,lat,lng`. `fournisseur` n'existe pas dans cette table ; un contrôle complémentaire confirme qu'il n'existe pas non plus dans `public.materiels`.
- Correction documentaire uniquement : `docs/inspection-persistence-audit.md` ne recommande plus d'ajouter `fournisseur` à la requête `scans`. Le document précise désormais que cette modification provoquerait une sélection d'une colonne inexistante et que toute réintroduction éventuelle de cette donnée relève d'un choix de modèle de données.
- Commit de correction : `48e6f54f751d347cb6a80e682e4fef67146a480f` (`docs: corriger l'audit persistance inspections`).
- Garde-fous respectés : aucune écriture Supabase, donnée, schéma, migration, RLS, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis pour cette correction ; poursuivre les gardes de non-régression du flux d'inspection sans ajouter de champ serveur.

## 2026-08-29 — persistance inspections promue en garde CI critique 07:13 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `424a4a811eba14ef74cf83a78151549946fe57f0`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`; comparaison `behind_by=0`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé uniquement en lecture : tables opérationnelles avec RLS activée et non forcée, aucune écriture effectuée.
- Amélioration réversible et sans runtime : `tests/run-v150b2b-checks.js` classe désormais `v150b2b-inspection-persistence-contract.test.js` parmi les gardes critiques ; `tests/v150b2b-runner-coverage.test.js` verrouille explicitement cette présence pour éviter une rétrogradation silencieuse du contrôle d’intégrité des inspections.
- Commit test/CI : `e1b2108040179571c38a71186f605c6e20e70dee` (`test: promote inspection persistence guard to critical CI`). Les quatre workflows observés sur ce commit sont terminés en `success`, dont `v150B-2B checks` run `33235973095`, `RailOps modules regression`, `RailOps lifecycle regression` et `Final RLS hotfix check`.
- Documentation synchronisée : `docs/v150b2b-test-inventory.md` classe maintenant le garde de persistance inspections dans la section des gardes critiques. Commit `de43522cbb6feab098f567182dd5fc9a61d5d42c` (`docs: mark inspection persistence as critical CI guard`).
- Garde-fous respectés : aucun code applicatif runtime, donnée, schéma, migration, RLS stricte, policy, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis ; poursuivre l’audit des inspections par des gardes statiques/rendus uniquement quand le comportement actuel peut être caractérisé sans ambiguïté.

## 2026-08-29 — garde de lecture sécurisée des inspections Chef 08:25 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `defe1d1e3cfb2f4e7cf65e53caeb87e6c4036b03`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Le chargement sécurisé de `js/core/lifecycle.js` lit les inspections via `railops_scans_scope`, les place dans `S.scans` puis met en cache `ro3_s`.
- Amélioration réversible et sans runtime : ajout de `tests/v150b2b-inspection-secure-read-contract.test.js`, qui simule un profil Chef et vérifie que la lecture utilise le scope Chef, n’utilise pas le scope admin, préserve tous les champs d’inspection disponibles et conserve le même payload dans le cache sécurisé.
- Commit test : `dd853f18b4e34cfd75a892d904b4fc76a37df362` (`test: guard Chef inspection secure read path`).
- Vérification : `v150B-2B checks` run `33238349887` terminé en `success` sur `dd853f18b4e34cfd75a892d904b4fc76a37df362`; Vercel preview signalé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` reste intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; poursuivre l’audit du rendu Chef uniquement par des changements caractérisables et réversibles.

## 2026-08-29 — lecture Chef promue en garde CI critique 09:21 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `580aef05049437c0273cf778f3089ad5f27e1b44`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. L’Advisor Supabase performance, relu sans écriture, ne signale plus les anciennes clés étrangères non indexées et indique uniquement les deux index `inspections_agent_id_idx` et `inspections_materiel_id_idx` comme encore inutilisés.
- Cycle rouge/vert : commit `b4e83ea0787ae2b4f96dfd11273322fdcee44611` a ajouté l’exigence que `v150b2b-inspection-secure-read-contract.test.js` soit un garde critique ; `v150B-2B checks` run `33240526632` a échoué comme attendu avant promotion. Le commit `571f51b4f85bdf5af94ae4e102426892445fd11f` (`test: promote inspection secure-read guard to critical CI`) a ajouté le garde au runner.
- Diagnostic intermédiaire : sur `571f51b4f85bdf5af94ae4e102426892445fd11f`, le test de lecture sécurisée Chef et le contrat du runner sont passés ; l’unique échec restant était documentaire, `v150b2b-test-inventory-contract.test.js`, car l’inventaire humain n’avait pas encore la nouvelle garde critique.
- Documentation synchronisée : commit `28473be568b37abe95153e2723c72250c00a471f` (`docs: record inspection secure-read critical guard`) ajoute cette garde à `docs/v150b2b-test-inventory.md`.
- Vérification finale avant journal : sur `28473be568b37abe95153e2723c72250c00a471f`, `v150B-2B checks` run `33240590031`, `RailOps lifecycle regression` run `33240590025`, `RailOps modules regression` run `33240590004` et `Final RLS hotfix check` run `33240590101` sont tous terminés en `success`.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; poursuivre l’audit des inspections uniquement par des gardes caractérisables, réversibles et sans changement métier.

## 2026-08-29 — types backend verrouillés dans le garde inspections Chef 10:22 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` était synchronisée avec `main` (`behind_by=0`, merge-base `37b216936a6692d54f82cbc004b30c936d13785a`). Supabase `railops` (`tbmzmmamaiftbbbuelgd`) a été relu sans écriture : `public.scans.fonctionnement` et `dommages` sont des booléens, `lat`/`lng` des `double precision`, et `railops_scans_scope()` retourne ces mêmes types.
- Amélioration test uniquement : `tests/v150b2b-inspection-secure-read-contract.test.js` utilise désormais un fixture conforme au schéma réel et vérifie explicitement la conservation des booléens `fonctionnement`/`dommages` et des coordonnées numériques lors du chargement sécurisé Chef.
- Commit test : `34295506248814caf2b6bba1f097eebd5647edb3` (`test: align inspection read fixture with Supabase types`).
- Vérification : `v150B-2B checks` runs `33242971071` et `33242972753`, `RailOps lifecycle regression` `33242972795`, `RailOps modules regression` `33242972802` et `Final RLS hotfix check` `33242972790` sont terminés en `success`; Vercel preview est également `success`.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni changement de `main`.
- Point en attente : aucun choix produit ni test utilisateur requis ; poursuivre les inspections uniquement par des contrôles caractérisables et réversibles.

## 2026-08-29 — valeurs falsy préservées dans la lecture Chef 11:19 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `a67e81c4d81718b289e37e9fde53286b29d3bb98`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) est `ACTIVE_HEALTHY`; Advisor performance inchangé avec uniquement les deux index `inspections_*_idx` encore signalés comme inutilisés.
- Amélioration test uniquement : `tests/v150b2b-inspection-secure-read-contract.test.js` couvre désormais un second enregistrement avec `fonctionnement=false`, `dommages=false`, coordonnées `0` et champs optionnels `null`, afin d’empêcher qu’une future normalisation par vérité/falsité ne perde ces valeurs valides côté Chef ou dans le cache `ro3_s`.
- Commit test : `dba3163fced4dd0bf6b300b067acb35e190de2ba` (`test: preserve falsy inspection values in Chef reads`).
- Vérification : `v150B-2B checks` run `33245202678`, `RailOps modules regression` run `33245202667`, `RailOps lifecycle regression` run `33245202675` et `Final RLS hotfix check` run `33245202670` sont terminés en `success`; Vercel preview est également `success`.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni changement de `main`.
- Point en attente : aucun choix produit ni test utilisateur requis ; poursuivre uniquement par des contrôles d’intégrité ou de rendu caractérisables et réversibles.
