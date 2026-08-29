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
