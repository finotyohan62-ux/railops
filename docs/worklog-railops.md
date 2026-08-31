# RailOps — journal de travail

> Historique intégral jusqu’au passage du 2026-08-30 03:15 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-30-0315.md`. Le journal courant a été consolidé ; les entrées détaillées antérieures restent dans les archives et fragments `docs/worklog-railops-append/`.

## 2026-08-30 — couverture commune des PDF RailOps 13:29 Europe/Paris

- État réel contrôlé : `security/v150b2b-rls-ready` est alignée sur l’ascendance de `main` (`behind_by: 0`) ; `main` reste à `37b216936a6692d54f82cbc004b30c936d13785a` et n’a pas été modifié.
- Inventaire runtime : le code actif prouve une famille PDF classifiable sans ambiguïté — rapports/contrôles/CTE. Les contextes PDF inventaire, étiquette ou inconnus restent volontairement en fallback legacy ; CSV/XLSX restent hors périmètre.
- Changement : ajout du garde-fou global `tests/v150b2b-pdf-coverage-contract.test.js` au commit `c06019f37bfdc21550a5e8700a532c735248076b`, après le moteur graphique commun, le routeur fail-safe et son chargement avant le bootstrap déjà présents sur la branche.
- Vérification avant consolidation : les quatre workflows du commit `c06019f37bfdc21550a5e8700a532c735248076b` sont terminés en `success` : `v150B-2B checks` run `33309472034`, `RailOps modules regression` run `33309472041`, `RailOps lifecycle regression` run `33309472070`, `Final RLS hotfix check` run `33309472040`.
- Garde-fous : aucune modification Supabase, RLS, policy, donnée, schéma, permission, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge et aucun déploiement production.
- Fallback sûr : toute action PDF non prouvée/classifiée conserve son comportement existant au lieu d’être interceptée.

## 2026-08-30 — mise en production du rapport PDF RailOps 13:56 Europe/Paris

- Déploiement explicitement demandé : le lot runtime PDF validé a été porté sur `main` sans fusionner la PR sécurité ni importer ses autres changements.
- `main` est passé de `37b216936a6692d54f82cbc004b30c936d13785a` à `fd590aff348f52aade83f51e838f96457a14402c` (`feat: deploy RailOps PDF report redesign`). Le diff final par rapport à l’ancien `main` contient uniquement `js/core/sync.js` (+24 lignes de chargement) et les cinq modules `js/reports/*` du système de rapport PDF.
- Incident technique corrigé dans la même opération : un commit intermédiaire `34dcf2a2f69ccc03a9d3667b91358f944f8b0ae4` avait ajouté un `README.md` vide par erreur ; le commit final le supprime. Le diff final confirmé ne contient aucun changement `README.md`.
- Vérification production : statut GitHub `Vercel` = `success` sur `fd590aff348f52aade83f51e838f96457a14402c`; workflow `RailOps lifecycle regression` run `33310160560` = `success`.
- Réalignement de la branche sécurité effectué au merge commit `bc3a206d11d2f56571a7bfbd81fb7fb35d4a71db`, sans changement de son arbre applicatif.
- Garde-fous respectés : aucune modification Supabase, RLS, policy, donnée, schéma, permission, règle métier, Import, Multi-chantier ou purge hebdomadaire ; PR #1 non fusionnée et RLS stricte non activée.

## 2026-08-30 — snapshot maintenance lecture seule 14:17 Europe/Paris

- État réel vérifié avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c`, branche `security/v150b2b-rls-ready` au head initial `d139ab9620ee0b89ae90b1bbea8b05b6b4a9c6c6`, comparaison GitHub à 697 commits d’avance / 0 de retard ; `main` laissé intact.
- Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`. Les familles d’avis restent stables : 5 `RLS Enabled No Policy`, plusieurs RPC `SECURITY DEFINER` exécutables par `authenticated`, protection des mots de passe compromis désactivée, et 2 index `inspections_*` signalés inutilisés.
- Changement basse risque : ajout du relevé documentaire `docs/supabase-state/2026-08-30-1417-maintenance.md` au commit `8ee25025f6d7609a72d6af5880151cfacec07b58`. Aucune écriture Supabase ni modification runtime, schéma, RLS, policy, permission, donnée ou règle métier.
- Vérification : `v150B-2B checks` run `33311152255`, `RailOps modules regression` run `33311152264`, `RailOps lifecycle regression` run `33311152247` et `Final RLS hotfix check` run `33311152245` sont tous terminés en `success`.
- Point en attente : aucune action automatique sur les avertissements de sécurité/Auth ni sur les index inutilisés ; ces sujets restent soumis à validation explicite avant tout changement de permissions, Auth ou schéma.

## 2026-08-30 — snapshot maintenance lecture seule 15:13 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c`, branche initialement à `51e922472a4b51bd235f4d4eb4ec935829949026`, PR #1 ouverte/draft/non fusionnée et divergence initiale à 699 commits d’avance / 0 de retard. `main` est resté intact.
- Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`. Lecture fraîche des policies cœur : `agents=0`, `chantiers=4`, `deleted_ids=1`, `inspections=0`, `materiels=4`, `prix_catalogue=1`, `scans=4`, `users=2`, RLS activée sur les huit tables. Les Advisors restent à 5 avis `RLS Enabled No Policy`, 33 avertissements `SECURITY DEFINER` exécutables par `authenticated`, protection des mots de passe compromis désactivée et 2 index `inspections_*` signalés inutilisés.
- Changement basse risque : création puis mise en conformité du snapshot `docs/supabase-state/2026-08-30-1513.md` (`a2bc8f9ed37f6057c9defbbab5e18b8c94f2e511`, `40fa26144604ff961bfc2736022af4e67461128d`, correction finale `0d62a5b1e35e75b411ed828e8b31265daf03ee40`). Les deux échecs intermédiaires ont été diagnostiqués comme des écarts de format documentaire au contrat de snapshot, sans impact runtime.
- Vérification finale du snapshot : `v150B-2B checks` run `33313782154`, `Final RLS hotfix check` run `33313782148`, `RailOps modules regression` run `33313782145` et `RailOps lifecycle regression` run `33313782144` sont tous terminés en `success` sur `0d62a5b1e35e75b411ed828e8b31265daf03ee40`.
- Garde-fous respectés : aucune écriture Supabase, aucune modification de données, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : les avertissements sécurité/Auth et les index inutilisés restent volontairement sans action automatique car toute remédiation toucherait aux permissions, à l'Auth ou au schéma et exige une validation explicite.

## 2026-08-30 — visibilité clavier des contrôles 16:19 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` à `c6ea59ea4117799c60fdd921dd689f73b1fd0bf4`, `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact. Les Advisors Supabase restent inchangés sur les familles connues ; aucune écriture Supabase n’a été effectuée.
- Diagnostic UX : `css/railops.css` ne définissait aucun état `:focus-visible` global, ce qui rendait la navigation clavier peu lisible sur les boutons, liens, champs et contrôles interactifs.
- Cycle rouge/vert : garde-fou ajouté au commit `24ec670b8a332a7350c7f01dac4a8e83ce8d9ade` (`test: require visible keyboard focus states`), avec `v150B-2B checks` run `33316469295` en échec attendu ; correctif minimal au commit `e1855817d90a6b6bd053a8f3659032dd666af15a` (`feat: improve keyboard focus visibility`) ajoutant un contour accentué de 2 px avec offset de 2 px uniquement sur `:focus-visible`.
- Vérification finale sur `e1855817d90a6b6bd053a8f3659032dd666af15a` : `v150B-2B checks` run `33316537014`, `RailOps modules regression` run `33316537028`, `RailOps lifecycle regression` run `33316537010` et `Final RLS hotfix check` run `33316537034` sont tous en `success`.
- Garde-fous respectés : aucune modification de règle métier, permission, RLS, policy, Auth, donnée, schéma, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucun déploiement production. Les deux index `inspections_*` restent simplement signalés comme inutilisés et n’ont pas été modifiés.
- Point en attente : aucun ; amélioration purement réversible et limitée à la visibilité clavier.

## 2026-08-30 — respect de la préférence de mouvement réduit 17:13 Europe/Paris

- État réel contrôlé avant changement : `main` est resté à `fd590aff348f52aade83f51e838f96457a14402c`; branche `security/v150b2b-rls-ready` alignée sur son ascendance (`behind_by: 0`). Supabase `railops` confirmé `ACTIVE_HEALTHY`; Advisors lus en lecture seule, sans écriture ni remédiation automatique.
- Diagnostic UX : plusieurs transitions et animations décoratives (`pulse-red`, faisceau scanner, `pulse-sync`) étaient actives sans prise en compte de `prefers-reduced-motion`.
- Cycle rouge/vert : test `tests/v150b2b-reduced-motion.test.js` ajouté au commit `2100178b9f6bf7b65946d77c031e5c9abdb15b60`, avec `v150B-2B checks` run `33319097150` en échec attendu ; correctif CSS au commit `75233a96295890e08fd3eb098a622ccf3b0cdc8b` désactivant les animations et réduisant les transitions uniquement lorsque le système demande moins de mouvement.
- Vérification finale sur `75233a96295890e08fd3eb098a622ccf3b0cdc8b` : `v150B-2B checks` run `33319205281`, `RailOps modules regression` run `33319205317`, `RailOps lifecycle regression` run `33319205303` et `Final RLS hotfix check` run `33319205325` sont tous en `success`.
- Garde-fous respectés : aucun changement Supabase, RLS, policy, permission, donnée, schéma, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge et aucun déploiement production.
- Point en attente : aucun ; amélioration réversible d’accessibilité/confort uniquement.

## 2026-08-30 — garde-fou CSS accessibilité 18:20 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` au head initial `6447bc1e145d3e675f4a410d731601c50067e6f1`. Supabase `railops` confirmé `ACTIVE_HEALTHY`; Advisors sécurité relus en lecture seule et inchangés sur les familles connues.
- Diagnostic : les améliorations récentes `:focus-visible`, `prefers-reduced-motion` et taille mobile 16 px étaient présentes mais n’étaient pas couvertes ensemble par un contrat de non-régression unique.
- Changement faible risque : ajout de `tests/v150b2b-accessibility-css-contract.test.js` au commit `d4450e80ad2a5ef29edf06b2222534e397f22aaa`, sans modification runtime.
- Vérification : `v150B-2B checks` run `33322115015` terminé en `success` sur le commit de test.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge et aucun déploiement production.
- Point en attente : aucun ; garde-fou réversible uniquement.

## 2026-08-30 — garde-fou tailles tactiles 19:17 Europe/Paris

- État réel contrôlé avant changement : `main` est resté à `fd590aff348f52aade83f51e838f96457a14402c`; branche `security/v150b2b-rls-ready` au head initial `f70dfa1a412b7b44b26f697abd6d822a97387c9b`, puis `24c9f33135dfad755a777d35567847eced9ca0d7`. Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`; Advisors sécurité/performance relus en lecture seule, sans remédiation automatique.
- Diagnostic UX : les principaux contrôles mobiles disposent déjà de zones tactiles d’au moins 44 px (`.tbk`, `.ni`, `.ro`, `.btn`, `.chip`, `.tab`) et le bouton flottant mesure 46×46 px, mais ce confort n’était pas protégé par un test dédié.
- Changement faible risque : ajout du contrat `tests/v150b2b-touch-targets-contract.test.js` au commit `24c9f33135dfad755a777d35567847eced9ca0d7`, sans modification runtime.
- Vérification : `v150B-2B checks` run `33324897028`, `RailOps modules regression` run `33324897033`, `Final RLS hotfix check` run `33324897022` et `RailOps lifecycle regression` run `33324897072` sont tous terminés en `success` sur le commit de test.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun ; garde-fou réversible de confort mobile uniquement.

## 2026-08-30 — retour à la ligne des alertes longues 20:18 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` initialement à `8c46d734fd628099321341b8ed73bc9a9437f88e`, avec divergence de 713 commits d’avance / 0 de retard. Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`; Advisors sécurité/performance relus en lecture seule, sans remédiation.
- Diagnostic UX : le conteneur texte des alertes flex pouvait conserver une largeur minimale implicite et laisser des identifiants ou messages longs déborder sur mobile.
- Cycle rouge/vert : contrat `tests/v150b2b-alert-overflow-contract.test.js` ajouté au commit `1d5e6ed9872f29786a139444ca580ecc37f2321b`, avec `v150B-2B checks` run `33327629675` en échec attendu ; correctif CSS minimal au commit `a33593c8a2f85005d2c1359a071d51e9bbe68b1d` ajoutant `min-width:0` et `overflow-wrap:anywhere` uniquement au texte d’alerte.
- Vérification finale sur `a33593c8a2f85005d2c1359a071d51e9bbe68b1d` : `v150B-2B checks` run `33327692870`, `RailOps modules regression` run `33327692852`, `RailOps lifecycle regression` run `33327692812` et `Final RLS hotfix check` run `33327692831` sont tous terminés en `success`.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun ; amélioration réversible de confort mobile uniquement.

## 2026-08-30 — snapshot maintenance et veille Supabase 21:17 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` initialement à `0464642777e2103ba25751b910a428f719d9bf62`, avec PR #1 ouverte/draft/non fusionnée et divergence de 716 commits d’avance / 0 de retard. Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`.
- Diagnostic lecture seule : les huit tables cœur gardent RLS active avec comptages de policies `agents=0`, `chantiers=4`, `deleted_ids=1`, `inspections=0`, `materiels=4`, `prix_catalogue=1`, `scans=4`, `users=2`; les Advisors restent dans les familles connues (5 RLS sans policy, 33 RPC `SECURITY DEFINER`, protection mots de passe compromis désactivée, 2 index `inspections_*` inutilisés).
- Changement faible risque : ajout du snapshot `docs/supabase-state/2026-08-30-2117.md` au commit `2a246b28ed9497b0c21d82fbc7cf14c01e83c9f8`, puis correction documentaire `168904e99969cdca88f79545dadf7e246b56c604` après diagnostic d’un unique échec du contrat snapshot (section RLS/policies manquante). Aucun runtime ni Supabase n’a été modifié.
- Veille plateforme : le changelog Supabase signale pour le 2026-10-30 un changement d’exposition automatique concernant seulement les nouvelles tables `public`, et depuis le 2026-08-05 l’ignorance du pinning de version des extensions ; aucune occurrence `create extension` n’a été trouvée sur la branche, donc aucune action immédiate n’est requise.
- Vérification finale sur `168904e99969cdca88f79545dadf7e246b56c604` : `v150B-2B checks` run `33330618755`, `RailOps modules regression` run `33330618759`, `RailOps lifecycle regression` run `33330618753` et `Final RLS hotfix check` run `33330618794` sont tous terminés en `success`.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun nouveau point ; les avertissements sécurité/Auth et index connus restent volontairement sans remédiation automatique.

## 2026-08-30 — snapshot maintenance lecture seule 22:16 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` au head initial `7dd24583c6ae2eb11fbfc7c68995161a7f88f662`, à 719 commits d’avance / 0 de retard. Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`.
- Diagnostic lecture seule : les Advisors restent dans les familles déjà connues — tables avec RLS active sans policy, RPC `SECURITY DEFINER` exécutables par `authenticated`, protection des mots de passe compromis désactivée, et 2 index `inspections_*` signalés inutilisés.
- Changement faible risque : ajout du snapshot `docs/supabase-state/2026-08-30-2216.md` au commit `ffcb73ff1db2bce5e197eef67111deb9b1064de3`. Aucun runtime ni Supabase n’a été modifié.
- Vérification : fichier relu depuis la branche après commit ; `main` est resté inchangé. Aucun workflow GitHub n’était attaché à ce commit au moment du contrôle.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun nouveau point ; les avertissements sécurité/Auth et index connus restent volontairement sans remédiation automatique.

## 2026-08-30 — remise en conformité du snapshot 23:17 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` au head initial `c176f7578b687b3cc9a98801a2d2cdf95ba177bb`, à 721 commits d’avance / 0 de retard. Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084` ; comptages RLS/policies relus directement (`agents=0`, `chantiers=4`, `deleted_ids=1`, `inspections=0`, `materiels=4`, `prix_catalogue=1`, `scans=4`, `users=2`).
- Diagnostic : le snapshot de 22:16 ne reprenait pas toutes les sections du contrat documentaire `v150b2b-snapshot-contract`, ce qui pouvait laisser le dernier relevé hors format malgré un état applicatif inchangé.
- Changement faible risque : ajout du snapshot conforme `docs/supabase-state/2026-08-30-2317.md` au commit `ac417e46c8b914e3c9ef597c70bb39d4385ee786`, sans modification runtime ni écriture Supabase.
- Vérification sur `ac417e46c8b914e3c9ef597c70bb39d4385ee786` : `v150B-2B checks` run `33336099825`, `RailOps modules regression` run `33336099862`, `RailOps lifecycle regression` run `33336099827` et `Final RLS hotfix check` run `33336099833` sont tous terminés en `success`.
- Garde-fous respectés : aucune modification de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun nouveau point ; les avertissements sécurité/Auth et les deux index inutilisés restent uniquement documentés, sans remédiation automatique.

## 2026-08-31 — gabarit de snapshot conforme 00:16 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` au head initial `f10242c53c10556e9a484a3767aaa467ca97815c`, à 723 commits d’avance / 0 de retard. Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`.
- Diagnostic lecture seule : les Advisors restent dans les familles connues — RLS activée sans policy sur certaines tables, RPC `SECURITY DEFINER` exécutables par `authenticated`, protection des mots de passe compromis désactivée, et 2 index `inspections_*` signalés inutilisés. Aucune remédiation automatique n’a été engagée.
- Changement faible risque : ajout dans `docs/supabase-state/README.md` d’un gabarit minimal de snapshot conforme au contrat documentaire, avec les huit tables cœur, les marqueurs Advisor obligatoires et les garde-fous à recopier. Commit `4ce42bdd1ec06bd5be186e784a597d53e90f34cf` (`docs: add compliant snapshot template`). Aucun runtime ni Supabase n’a été modifié.
- Vérification sur `4ce42bdd1ec06bd5be186e784a597d53e90f34cf` : `v150B-2B checks` run `33338695446`, `RailOps modules regression` run `33338697133`, `RailOps lifecycle regression` run `33338697128` et `Final RLS hotfix check` run `33338697255` sont tous terminés en `success`; `main` a été revérifié inchangé après le commit.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun nouveau point ; les avertissements sécurité/Auth et les index connus restent volontairement sans remédiation automatique.

## 2026-08-31 — snapshot maintenance lecture seule 01:17 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` au head initial `fa3035a51763087ecf44d1b959c69d8a2a6daa49`, alignée sur l’ascendance de `main` (0 commit de retard). Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`.
- Diagnostic lecture seule : policies cœur relues directement (`agents=0`, `chantiers=4`, `deleted_ids=1`, `inspections=0`, `materiels=4`, `prix_catalogue=1`, `scans=4`, `users=2`) ; Advisors inchangés dans les familles connues (5 RLS sans policy, fonctions `SECURITY DEFINER`, protection mots de passe compromis désactivée, 2 index `inspections_*` inutilisés).
- Changement faible risque : ajout de `docs/supabase-state/2026-08-31-0117.md` au commit `26997c8917f346491c23703ec548d097940e7203`, puis corrections documentaires `6b921af633091a53a5beba585bfbe1dd8b048c03` et `69b27820bdcf32ca77a60124c556c8ced9c3347d` après diagnostic des contrats de snapshot (marqueurs exacts et horodatage du titre). Aucun runtime ni Supabase n’a été modifié.
- Vérification finale sur `69b27820bdcf32ca77a60124c556c8ced9c3347d` : `v150B-2B checks` run `33341637871`, `RailOps modules regression` run `33341637900`, `RailOps lifecycle regression` run `33341637870` et `Final RLS hotfix check` run `33341637857` sont tous terminés en `success`.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun nouveau point ; les avertissements sécurité/Auth et les index connus restent volontairement sans remédiation automatique.

## 2026-08-31 — fraîcheur Advisor et réduction du bruit 02:14 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c` et laissé intact ; branche `security/v150b2b-rls-ready` au head initial `c5939d5e93d2bd6ee643ab592333b0d147aa3763`, à 729 commits d’avance / 0 de retard. Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`.
- Diagnostic lecture seule : Security Advisor observé à `2026-08-31T00:13:14.374Z` et Performance Advisor à `2026-08-31T00:13:18.964Z`; les familles restent celles déjà documentées (5 `RLS Enabled No Policy`, RPC `SECURITY DEFINER` exécutables par `authenticated`, protection des mots de passe compromis désactivée, 2 index `inspections_*` inutilisés). Aucun signal nouveau n'a été identifié.
- Changement faible risque : clarification dans `docs/supabase-state/README.md` de la gestion de fraîcheur (`observed_at`), comparaison par famille/`cache_key`, interprétation `INFO`/`WARN` et règle de notification uniquement sur dérive réelle. Commit `7353e4b8f6b4fa77fda7cfbc3de523eeb12725ba` (`docs: clarify advisor freshness and notification noise`). Aucun runtime ni Supabase n'a été modifié.
- Vérification sur `7353e4b8f6b4fa77fda7cfbc3de523eeb12725ba` : `v150B-2B checks` run `33343951855`, `RailOps modules regression` run `33343951904`, `RailOps lifecycle regression` run `33343952006` et `Final RLS hotfix check` run `33343951838` sont tous terminés en `success`; comparaison finale GitHub à 730 commits d'avance / 0 de retard.
- Garde-fous respectés : aucune écriture Supabase, aucun changement de donnée, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : aucun nouveau point ; les avertissements sécurité/Auth et les index connus restent volontairement sans remédiation automatique.
