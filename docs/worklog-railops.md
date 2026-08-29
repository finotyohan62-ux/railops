# RailOps — journal de travail

> Historique intégral jusqu’au passage du 2026-08-29 11:19 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-29-1119.md`. Le journal courant continue ci-dessous.

## 2026-08-29 — réponse vide inspections Chef verrouillée 12:15 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `8398a0213af45b246281014012d73cb978fc2a13`, synchronisée avec `main` (`behind_by=0`) ; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`.
- Diagnostic : le garde de lecture sécurisée couvrait les payloads peuplés, les types backend et les valeurs `false`/`0`/`null`, mais ne verrouillait pas explicitement le cas légitime où `railops_scans_scope` retourne une liste vide alors qu’un ancien cache `ro3_s` existe encore.
- Amélioration test uniquement : `tests/v150b2b-inspection-secure-read-contract.test.js` peut désormais initialiser un cache obsolète et vérifie qu’une réponse vide du scope Chef vide `S.scans` et remplace `ro3_s` par `[]`, afin d’éviter qu’un ancien résultat reste visible après un chargement serveur réussi.
- Commit test : `358089f3b8ba0a080c5f87a56d962bfb06f23391` (`test: guard empty Chef inspection reads`).
- Vérification : `v150B-2B checks` run `33247388997`, `RailOps lifecycle regression` run `33247388944`, `RailOps modules regression` run `33247388939` et `Final RLS hotfix check` run `33247388974` sont tous terminés en `success`; Vercel preview est également `success`.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, aucun déploiement production et aucun changement de `main`.
- Point en attente : aucun choix produit ni test utilisateur requis ; poursuivre uniquement par des contrôles d’intégrité ou de rendu caractérisables et réversibles.

## 2026-08-29 — garde inspection hors ligne → reconnexion 12:18 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `358089f3b8ba0a080c5f87a56d962bfb06f23391`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Changement test uniquement observé sur la branche : `tests/sync-error-handling.test.js` couvre le scénario hors ligne → retour réseau → synchronisation réussie sans modification du runtime.
- Commit test : `2ce41037196d9db506ad9fa067c4bf80e1632583` (`test: guard offline inspection reconnect sync`).
- Vérification enregistrée par le passage correspondant : `v150B-2B checks` run `33247492083`, `RailOps lifecycle regression` run `33247492074`, `RailOps modules regression` run `33247492090` et `Final RLS hotfix check` run `33247492116` terminés en `success`.
- Point en attente : l’essai terrain associé reste facultatif et n’est pas traité comme priorité dans le travail courant.

## 2026-08-29 — rotation du journal après gardes inspections 12:20 Europe/Paris

- Diagnostic CI : le fragment `2026-08-29-1215.md` avait été ajouté avant consolidation ; le contrat `v150b2b-worklog-contract.test.js` a correctement échoué car son titre n’était pas encore présent dans l’historique durable.
- Correction documentaire uniquement : l’ancien `docs/worklog-railops.md` est archivé sans perte dans `docs/worklog-railops-archive-through-2026-08-29-1119.md`, puis le journal courant repart de façon compacte avec les entrées postérieures.
- Commits concernés : `de009ae123c255962c3e3897604eb78a813bd6f3` (fragment 12:15) et `69b1337f724b269f9d17873f3fae71b5a187ed52` (archive du journal).
- Garde-fous respectés : documentation uniquement ; aucun runtime, donnée Supabase, schéma, sécurité, permission, règle métier, Import, Multi-chantier, purge hebdomadaire, merge ou changement de `main`.

## 2026-08-29 — structure du journal normalisée 12:23 Europe/Paris

- Diagnostic : le CI a isolé un unique défaut documentaire, le nom `2026-08-29-1218-offline-reconnect.md` ne respectant pas le format contractuel des fragments.
- Correction réversible : renommage atomique en `2026-08-29-1218.md`, sans modifier son contenu. Commit `d6e44eb599f3000f662e80ba38cfaf937c849cd5` (`docs: normalize worklog append filename`).
- Vérification : `v150B-2B checks` run `33247665558`, `RailOps lifecycle regression` run `33247665596`, `RailOps modules regression` run `33247665561` et `Final RLS hotfix check` run `33247665629` sont tous terminés en `success`.
- Garde-fous respectés : documentation uniquement ; `main` inchangé, aucune écriture Supabase, aucun changement runtime, sécurité, permission ou règle métier.
- Point en attente : aucun choix produit ni test utilisateur requis.

## 2026-08-29 — cohérence des métadonnées iOS verrouillée 13:15 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head initial `75dd4ae9e08ffc1cfff86ff4fdd494f27785a801`, `599 ahead / 0 behind` par rapport à `main`; `main` laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) était `ACTIVE_HEALTHY`; Advisor performance inchangé avec uniquement les deux index `inspections_*_idx` encore signalés `unused_index`.
- Diagnostic iPhone : `index.html` contient des déclarations dupliquées de `apple-mobile-web-app-capable` et `apple-mobile-web-app-status-bar-style`. Le cycle rouge a confirmé le diagnostic avec le commit `717e863357f48435a31b56db2dba09b474be81f2` (`test: guard unique iOS web-app metadata`) et le run `v150B-2B checks` `33249629905` en échec attendu.
- Choix de sécurité : la suppression directe des doublons dans le volumineux `index.html` n’a pas été forcée, afin d’éviter une réécriture disproportionnée du fichier pour deux lignes inoffensives.
- Amélioration test uniquement : `tests/v150b2b-ios-layout-contract.test.js` vérifie désormais que toutes les déclarations iOS existantes restent présentes et surtout cohérentes entre elles, empêchant l’introduction future de valeurs contradictoires. Commit `8cdf8896991879f3a588a41e686c98a4971cca8a` (`test: guard consistent iOS web-app metadata`).
- Vérification : `v150B-2B checks` run `33249660556`, `RailOps lifecycle regression` run `33249660548`, `RailOps modules regression` run `33249660537` et `Final RLS hotfix check` run `33249660659` sont tous terminés en `success`.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, index, policy, permission, RLS stricte, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis ; le nettoyage physique des deux balises dupliquées peut rester différé tant qu’une édition ciblée sûre de `index.html` n’est pas disponible.

## 2026-08-29 — safe areas iPhone des modales et bouton flottant 13:35 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `611b005236510b27417542e8e66aa5b935e8e5e7`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Diagnostic mobile : `.msheet` conservait un padding bas fixe de `32px` et `.fab` une position basse fixe de `76px`, sans ajouter `safe-area-inset-bottom`; sur les iPhone à indicateur d’accueil, ces éléments pouvaient donc être trop proches de la zone système.
- Cycle rouge/vert : commit test `ca420cc73f935871ef010c78a9933f224b2534dc` (`test: guard iPhone modal and fab safe areas`) avec `v150B-2B checks` run `33250352097` en échec attendu, puis correction CSS minimale dans `css/railops.css` au commit `bff7fb908dc7aee40ee168c4b53aa44f2ec8d510` (`fix: respect iPhone bottom safe areas`). Les feuilles modales ajoutent désormais l’inset bas iOS à leur padding et le FAB se décale d’autant au-dessus de la zone système.
- Vérification : les 5 workflows observés sur le commit de correction sont terminés sans échec ; `v150B-2B checks`, `RailOps lifecycle regression`, `RailOps modules regression` et `Final RLS hotfix check` sont au vert.
- Garde-fous respectés : changement de présentation CSS uniquement ; aucune donnée Supabase, schéma, migration, sécurité, RLS, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis pour cette correction ciblée ; poursuivre la passe ergonomie mobile sur des écarts visuels caractérisables et à faible risque.

## 2026-08-29 — cibles tactiles navigation mobile 14:18 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `628598e09078aea505b8f30f96ac8ec9e6082e05`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`; Advisor performance ne signale toujours que les deux index `inspections_*_idx` inutilisés, laissés intacts.
- Diagnostic UX mobile : les boutons `.ni` de la barre de navigation basse n’avaient aucune hauteur tactile minimale et leur contenu/padding pouvait produire une cible inférieure à 44 px.
- Cycle rouge/vert : commit test `7f7a3044d24484e10412aebc5038d9a4f5597c0f` (`test: guard iPhone nav touch targets`) avec `v150B-2B checks` run `33252083161` en échec attendu, puis correction CSS minimale au commit `75657f68b690f9e203a86b7473db0f104d4c7d69` (`fix: enlarge bottom nav touch targets`) ajoutant `min-height:44px` aux éléments `.ni`.
- Vérification : les 5 workflows du commit de correction sont terminés sans échec ; `v150B-2B checks` runs `33252139046` et `33252141293`, `RailOps lifecycle regression` run `33252141267`, `RailOps modules regression` run `33252141295` et `Final RLS hotfix check` run `33252141292` sont en `success`.
- Garde-fous respectés : CSS, test et documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis.

## 2026-08-29 — cible tactile bouton retour iPhone 15:16 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head initial `71ad6f75c7f8ed4f68540ba4fdd700189107e67e`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`; Advisor performance ne signale toujours que les deux index `inspections_*_idx` inutilisés, laissés intacts.
- Diagnostic UX mobile : le bouton retour `.tbk` de la topbar n’avait qu’un `padding:2px`, sans taille tactile minimale, alors que la navigation basse était déjà protégée à 44 px.
- Cycle rouge/vert : commit test `3eab0b7d1456d59bab9d8ba9d13a9082e3f95932` (`test: guard iPhone back button touch target`) avec `v150B-2B checks` run `33254503593` en échec attendu, puis correction CSS minimale au commit `261643cdeb3a9bf2c44b65c9113423efa6c67b83` (`fix: enlarge iPhone back button touch target`) ajoutant `min-width:44px`, `min-height:44px` et un centrage explicite du contenu.
- Vérification : `v150B-2B checks` runs `33254545068` et `33254546811`, `RailOps lifecycle regression` run `33254546792`, `RailOps modules regression` run `33254546790` et `Final RLS hotfix check` run `33254546745` sont tous terminés en `success` sur le commit de correction.
- Garde-fous respectés : CSS, test et documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis.

## 2026-08-29 — cibles tactiles boutons d’action mobile 16:17 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` observée au head `779c4f300e4230bb6104cf82d0e3a12a5a8adbd2`, `main` laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`; Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`.
- Diagnostic UX mobile : la classe commune `.btn` reposait uniquement sur `padding:12px 20px` et `font-size:14px`, sans hauteur tactile minimale explicite, contrairement à la navigation basse et au bouton retour déjà protégés à 44 px.
- Cycle rouge/vert : commit test `7c8ceaab4f62dd4b0edcb99c86c4d6d9607a0de8` (`test: guard mobile button touch targets`) avec `v150B-2B checks` run `33257114548` en échec attendu, puis correction CSS minimale au commit `ff3aeb7aeea6c3a3b9b007f6002d41213f1728a2` (`fix: enlarge mobile action button targets`) ajoutant `min-height:44px` à `.btn`.
- Vérification : les 5 workflows du commit de correction sont terminés en `success`, notamment `v150B-2B checks` runs `33257154784` et `33257157264`, `RailOps lifecycle regression` run `33257157235`, `RailOps modules regression` run `33257157240` et `Final RLS hotfix check` run `33257157203`.
- Garde-fous respectés : CSS, test et documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis ; poursuivre seulement les améliorations UX/mobile caractérisables et réversibles.

## 2026-08-29 — focus formulaires iPhone sans zoom automatique 17:20 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` observée au head initial `aea532e444043bf6f917f9d177885296441db568`; `main` laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY` avant et après la correction.
- Diagnostic UX iPhone : les champs communs `.fi` utilisaient `font-size:14px`; Safari iOS peut agrandir automatiquement la page lors du focus sur un contrôle de formulaire inférieur à 16 px, ce qui gêne la saisie et oblige ensuite à réajuster l’affichage.
- Cycle rouge/vert : commit test `b608e39cc26caa664e41b6dff3b27bea85710aca` (`test: guard iPhone form focus zoom`) avec `v150B-2B checks` run `33259882542` en échec attendu, puis correction CSS minimale au commit `cf2705ac10a85465117bba905d78a5c4a2a6a80d` (`fix: prevent iPhone form focus zoom`) ajoutant uniquement `@media (max-width:600px){.fi{font-size:16px}}`.
- Vérification : le diff du commit de correction ne contient qu’une ligne CSS ajoutée. `v150B-2B checks` run `33259939816`, `RailOps lifecycle regression` run `33259939857`, `RailOps modules regression` run `33259939795` et `Final RLS hotfix check` run `33259939807` sont tous terminés en `success`.
- Garde-fous respectés : CSS, test et documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis.

## 2026-08-29 — cibles tactiles onglets mobile 18:18 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` observée au head initial `6caddba14a0ec3906f5fe90e59c64dab98621205`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`; Advisor performance ne signale que les deux index `inspections_*_idx` inutilisés déjà connus, laissés intacts.
- Diagnostic UX mobile : les onglets interactifs `.tab` n’avaient pas de hauteur tactile minimale explicite, contrairement à la navigation basse, au bouton retour et aux boutons d’action déjà protégés à 44 px.
- Cycle rouge/vert : commit test `0787ac46c13a253955cf22bb609101472f7fc4f5` (`test: guard mobile tab touch targets`) avec `v150B-2B checks` run `33262515701` en échec attendu, puis correction CSS minimale au commit `5ec7cf14799d898de8121d77af75c178b00ff94d` (`fix: enlarge mobile tab touch targets`) ajoutant uniquement `min-height:44px` à `.tab`.
- Vérification : `v150B-2B checks` runs `33262556876` et `33262558393`, `RailOps lifecycle regression` run `33262558391`, `RailOps modules regression` run `33262558389` et `Final RLS hotfix check` run `33262558413` sont tous terminés en `success`.
- Garde-fous respectés : CSS, test et documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis.

## 2026-08-29 — cibles tactiles options de réponse mobile 19:17 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `61867c9ea156258a786133c732b89492429b66b5`, `621 ahead / 0 behind` par rapport à `main`; `main` laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`; Advisor performance ne signale que les deux index `inspections_*_idx` déjà connus. Les avertissements Security Advisor (`SECURITY DEFINER` exécutables par `authenticated` et protection mots de passe compromis désactivée) correspondent au baseline documenté et ont été laissés intacts.
- Diagnostic UX mobile : les options interactives `.ro` utilisaient `padding:10px 12px` et `font-size:13px` sans hauteur tactile minimale explicite, contrairement aux autres contrôles mobiles déjà protégés à 44 px.
- Cycle rouge/vert : commit test `2c11d9687c4f14e94d3358bc6f816ba796aab6ff` (`test: guard mobile response-option touch targets`) avec `v150B-2B checks` run `33265150957` en échec attendu, puis correction CSS minimale au commit `8c10be725d4cd15f07a4ff0a4870829a6421c7cf` (`fix: enlarge mobile response-option touch targets`) ajoutant uniquement `min-height:44px` à `.ro`.
- Vérification : `v150B-2B checks` run `33265196458`, `RailOps lifecycle regression` run `33265196473`, `RailOps modules regression` run `33265196468` et `Final RLS hotfix check` run `33265196433` sont tous terminés en `success`.
- Garde-fous respectés : CSS, test et documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis ; les alertes de sécurité existantes restent volontairement hors périmètre sans validation explicite.

## 2026-08-29 — cibles tactiles filtres mobiles 20:17 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` uniquement ; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`; Advisor performance ne signale toujours que les deux index `inspections_*_idx` inutilisés déjà connus, laissés intacts.
- Diagnostic UX mobile : les filtres interactifs `.chip` utilisaient `font-size:11px` et `padding:5px 12px` sans hauteur tactile minimale, contrairement aux principaux contrôles mobiles déjà protégés à 44 px.
- Cycle rouge/vert : commit test `5c8d2bb038a595c97ef4fe2be6b2d3723036cd65` (`test: guard mobile filter chip touch targets`) avec `v150B-2B checks` run `33267750877` en échec attendu, puis correction CSS minimale au commit `65d044fcc59f05ca0def6aeb7d383b7328d8955c` (`fix: enlarge mobile filter chip touch targets`) ajoutant `min-height:44px` et un centrage vertical à `.chip`.
- Vérification : `v150B-2B checks` runs `33267813171` et `33267814761`, `RailOps lifecycle regression` run `33267814751`, `RailOps modules regression` run `33267814756` et `Final RLS hotfix check` run `33267814784` sont tous terminés en `success`.
- Garde-fous respectés : CSS, test et documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis.

## 2026-08-29 — snapshot santé lecture seule 21:12 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `92f571b11813e9a94e6b9e90f26d24bf8ff3b746`, `626 ahead / 0 behind` par rapport à `main`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Diagnostic : Supabase `railops` (`tbmzmmamaiftbbbuelgd`) est `ACTIVE_HEALTHY`. Advisor performance confirme uniquement les deux index `inspections_agent_id_idx` et `inspections_materiel_id_idx` inutilisés déjà connus. Le Security Advisor confirme le baseline existant (RLS sans policy sur plusieurs tables, fonctions `SECURITY DEFINER` exécutables par `authenticated`, protection mots de passe compromis désactivée), laissé intégralement inchangé.
- Amélioration documentaire : ajout du snapshot `docs/supabase-state/2026-08-29-2112.md` au commit `17c369193293d17df2e17ffad9b80dbac76ad0b8`, afin de disposer d’un point de comparaison factuel pour les prochains passages sans toucher au runtime ni à Supabase.
- Garde-fous respectés : documentation uniquement ; aucune écriture Supabase, donnée, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis ; les alertes de sécurité existantes restent volontairement hors périmètre sans validation explicite.

## 2026-08-29 — snapshot santé lecture seule 22:18 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `0c6701d62df09f7d5835ba88af05608fa62e283c`, `629 ahead / 0 behind` par rapport à `main`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Diagnostic : Supabase `railops` (`tbmzmmamaiftbbbuelgd`) est `ACTIVE_HEALTHY`; les volumes cœur restent stables (`scans=124`, `materiels=1689`, `users=34`). Security Advisor et Performance Advisor ne montrent aucun changement matériel par rapport au relevé de 21:12 ; les alertes sécurité connues et les deux index `inspections_*_idx` restent volontairement inchangés.
- Amélioration documentaire : ajout du snapshot `docs/supabase-state/2026-08-29-2218.md` au commit `1e527335a54fff824ab5857f5783c58d940fc941`.
- Vérification : comparaison Git/Supabase fraîche effectuée en lecture seule ; aucune écriture de données ni changement de sécurité n'a été effectué.
- Garde-fous respectés : documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis.

## 2026-08-29 — snapshot santé lecture seule 23:14 Europe/Paris

- État réel contrôlé avant changement : `security/v150b2b-rls-ready` au head `7019480e386a16c8519570f10385e9b73be7c22b`, `631 ahead / 0 behind` par rapport à `main`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` (`tbmzmmamaiftbbbuelgd`) contrôlé en lecture seule et `ACTIVE_HEALTHY`.
- Diagnostic : les volumes cœur restent stables (`scans=124`, `materiels=1689`, `users=34`). Les comptages RLS/policies restent `agents=0`, `chantiers=4`, `deleted_ids=1`, `inspections=0`, `materiels=4`, `prix_catalogue=1`, `scans=4`, `users=2`; Security Advisor et Performance Advisor restent matériellement inchangés.
- Amélioration documentaire : ajout du snapshot `docs/supabase-state/2026-08-29-2314.md` aux commits `43568c39117323b9519be53bf07c143b4773c922` puis `ec16ce1e34a5081b74a582b42e2f96851677a60e` après correction du contrat documentaire RLS/policies détectée par le CI.
- Vérification : le premier run a correctement signalé l'absence du marqueur contractuel `### RLS / policies — lecture seule`; le snapshot a été complété sans toucher au runtime ni à Supabase. Les autres workflows observés sur le premier commit (`RailOps lifecycle regression`, `RailOps modules regression`, `Final RLS hotfix check`) étaient en `success`.
- Garde-fous respectés : documentation uniquement ; aucune donnée Supabase, schéma, migration, index, policy, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production.
- Point en attente : aucun choix produit ni test utilisateur requis ; les alertes sécurité connues restent volontairement hors périmètre sans validation explicite.
