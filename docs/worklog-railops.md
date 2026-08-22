# RailOps — journal de travail

## 2026-08-21 — passage 1

- État vérifié avant changement : PR #1 toujours en brouillon, `main` non modifié, branche de travail `security/v150b2b-rls-ready`.
- Supabase vérifié : projet `railops` `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.
- Security Advisor relevé sans modification de la base : RLS encore désactivée sur `public.deleted_ids` et `public.prix_catalogue`, avertissement `search_path` sur `track_deleted_materiels`, avertissements `SECURITY DEFINER` sur plusieurs RPC et protection mots de passe compromis désactivée.
- Amélioration : ajout de `docs/security-advisor-baseline.md` pour figer cette photographie de sécurité et éviter de traiter automatiquement comme nouvelles des alertes déjà connues.
- Vérification : document relu depuis la branche après commit ; aucune migration, policy, fonction, donnée, règle métier, import, logique Multi-chantier ou purge hebdomadaire modifiés.
- Commit : `7b0dff48bf5e21cc71692375ab76c823a97d13f5` (`docs: capture Supabase security advisor baseline`).
- Point en attente : aucune correction de sécurité appliquée automatiquement ; toute évolution des RLS/droits reste soumise aux smoke-tests et à validation explicite.

## 2026-08-21 — reprise interactive 21:15 Europe/Paris

- Relecture du plan d'implémentation réel avant reprise.
- Correction d'un point documentaire devenu obsolète : le propriétaire conserve le rôle métier `chef`, ouvre RailOps en mode Chef par défaut et n'utilise le périmètre global qu'en mode Administration explicite.
- Mise à jour de la checklist de smoke-test pour séparer clairement le mode Chef propriétaire déjà validé du mode Administration qui reste à tester explicitement, ainsi que le retour au mode Chef et la reconnexion Chef par défaut.
- Commits : `1fe9db233910087981c5a85a8fc1eccf2c19ec02` (`docs: align v150B-2B plan with owner Chef/Admin modes`) et `6b11d7b48ee8a6395421ffb75b4c5aceae77deba` (`tests: split owner Chef and Admin smoke checks`).
- Vérification : cette passe ne modifie aucun code de production, aucune migration, aucune policy, aucune donnée ni règle métier ; `main`, Import, Multi-chantier et purge hebdomadaire restent intacts.
- À suivre : audit statique des adaptateurs client/page de test, puis vérification des écarts fonctionnels encore ouverts avant toute fermeture RLS.

## 2026-08-21 — reprise interactive 21:42 Europe/Paris

- Harness de preview durci en TDD : un module testable `v150b2b-harness-core.js` neutralise le bootstrap legacy et `silentSync()` en mode fail-closed (`LEGACY_BOOTSTRAP_NOT_FOUND` / `LEGACY_SILENT_SYNC_NOT_FOUND`).
- Vérifications locales : test rouge initial (module absent), puis `node tests/v150b2b-harness-core.test.js` vert et `node --check` vert ; le test d'intégration du harness a ensuite été aligné avec le module extrait.
- Commits harness : `2162ca5e2cacbbe75725af55a348c8d2a54a698d`, `130c6f972601052df1cddc5f227257392806b7e7`, `55b3da927da546f3f377455bd0c84c8a377ffc15`, puis `527a32987c1e50f41ac7d8a46cfe72070831b738` pour le câblage de test. Vercel a renvoyé `success` après le refactor.
- Audit Chef de chantier : la couche serveur renvoyait déjà `railops_chef_chantier_tree_stats()` et gardait `S.mat=[]`, mais le dashboard legacy calculait encore `statsFor()` depuis `S.mat`, ce qui pouvait afficher des compteurs à zéro malgré un cloisonnement correct.
- Correction TDD : ajout de `v150b2b-chef-chantier-stats.js`, qui remplace uniquement la source des compteurs pour `chef_chantier` par les agrégats statistiques serveur du chantier + descendants. Aucun matériel, référence, QR ou scan n'est injecté côté client ; les autres rôles utilisent toujours le comportement historique.
- Vérifications locales : test rouge initial (module absent), puis `node tests/v150b2b-chef-chantier-stats.test.js` vert, test du harness vert et `node --check` vert.
- Commits Chef de chantier : `6376ae36785459f64908ade31b6fada03d9cf5ac` (test), `443a9bc173bf38cb8566e1d0fda7f92ba75299a1` (adaptateur), `0cfbac5402433b5de41a50801b00465ff1af16ec` (test de câblage), `449366e22510a3420e8b870d2ad09bcff81171da` (preview build `150b2b9`) et `bebd5fba06462aa37b95b097a0d4de8cf578892a` (checklist smoke-test).
- Déploiement preview : Vercel `success` sur `449366e22510a3420e8b870d2ad09bcff81171da`.
- Garde-fous respectés : aucune donnée Supabase, migration, policy, RLS, règle de rôle, Import, Multi-chantier ou purge hebdomadaire modifiés ; `main` n'a pas été fusionné.
- À valider humainement plus tard : connexion réelle Chef de chantier sur la preview pour confirmer visuellement les compteurs et l'absence totale de références/QR/scans.

## 2026-08-21 — audit scope d'écriture 21:55 Europe/Paris

- Audit en lecture seule de la couche d'écriture, du mode propriétaire, des tombstones et de la migration RLS stricte préparée.
- Constat : les lectures propriétaire distinguent bien Chef/Admin, mais plusieurs écritures continuent à traiter `is_admin=true` comme privilège global. Cela nécessite de décider si le mode Chef est seulement un mode d'interface ou s'il doit aussi borner les écritures serveur du propriétaire.
- Point bloquant identifié : `railops_upsert_material_admin(jsonb)` valide le chantier cible d'un Chef non Admin mais ne valide pas le chantier source lorsqu'un `id` existe déjà avant `ON CONFLICT(id) DO UPDATE`. Comme l'RPC est `SECURITY DEFINER`, un conflit d'identifiant hors scope pourrait écraser/déplacer une ligne d'un autre périmètre.
- Autre point à décider : `saveChantier` conserve encore un chemin d'écriture directe, et la migration RLS stricte maintient des grants directs pour le supporter.
- Documentation créée : `docs/v150b2b-write-scope-audit.md`.
- Commit : `b290092632fbffc2f24a3eaf9594bba87b9366b1` (`docs: audit v150B-2B write scope before strict RLS`).
- Aucune correction serveur/RLS appliquée : ce point est volontairement arrêté avant changement de sécurité ou de règle d'accès et nécessite validation explicite.

## 2026-08-21 — correction intégration Chef de chantier 21:57 Europe/Paris

- Reprise du correctif Chef de chantier avec vérification de bout en bout : le premier adaptateur ne suffisait pas, car `secureLoad()` ne chargeait pas encore `railops_chef_chantier_tree_stats()` et l'écran v148 actif utilisait sa closure `stats148()` basée sur `S.mat`, pas seulement le `statsFor()` global.
- Test rouge ajouté : `tests/v150b2b-chef-chantier-integration.test.js` reproduit les deux ruptures (RPC statistique absent du loader + routeur v148 restant sur le rendu legacy à zéro).
- Correction minimale : `v150b2b-loader.js` charge maintenant uniquement `railops_chef_chantier_tree_stats()` pour `chef_chantier` dans `S.chefChantierStats`, tout en laissant `S.mat=[]` et `S.scans=[]`; `v150b2b-chef-chantier-stats.js` intercepte les routes Dashboard/Chantiers/Détail du rôle et rend les agrégats maître + descendants sans référence individuelle.
- Non-régression : le contrat historique `statsFor()` reste `total/v1/v2`; les autres rôles retombent sur leurs fonctions originales.
- Vérification locale fraîche : test unitaire historique Chef de chantier OK, test d'intégration sécurisé OK, harness core OK, câblage preview OK et `node --check` OK.
- Preview cache-bust passée à `150b2b10`; Vercel `success` sur le head vérifié `df1a7ff124aa1d486f1ff723e01527505c51cb47`.
- Contrôle Supabase lecture seule : les 9 chantiers actifs totalisent actuellement 740 matériels et `retired_count=0`, donc le RPC et l'ancien calcul donnent aujourd'hui le même total sur ce point. Le RPC ne filtre toutefois pas encore explicitement `presence='retire'`; aucune migration serveur n'a été appliquée pour corriger ce cas latent.
- Commits principaux de cette correction : `5fb38c033f301aa2969bc42f973178c2444982e1` (test rouge), `43d45b7132b77a44c50d7727add9453ace2ec7f6` (chargement stats-only), `cb03eb07f55b839a16455cf93b628f111a84c9ea` puis `df1a7ff124aa1d486f1ff723e01527505c51cb47` (rendu sécurisé + contrat legacy), avec build preview `150b2b10` via `e3861c0f72f684c10c037783c8f202dc357a9592` / `4f82c68a22a69f06045554fddf44c42317b34fc7`.
- À valider humainement : connexion réelle Chef de chantier sur la preview pour confirmer visuellement les compteurs, la navigation maître/sous-chantier et l'absence totale de références/QR/scans. La fermeture RLS reste interdite avant les smoke-tests complets.

## 2026-08-21 — vérifications locales unifiées 22:15 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main`, dernier déploiement Vercel vert ; aucune action Supabase ni modification de `main`.
- Amélioration réversible : ajout de `tests/run-v150b2b-checks.js`, un lanceur unique qui enchaîne les quatre tests Node existants puis `node --check` sur les sept adaptateurs v150B-2B. Aucun code de production, comportement métier, permission, Import, Multi-chantier ou purge hebdomadaire modifié.
- Commit : `dbb5c598700558f57802bbb8443690c749a16907` (`tests: add unified v150B-2B verification runner`).
- Vérification : fichier relu depuis GitHub après commit ; syntaxe du lanceur vérifiée avec `node --check` (exit 0) ; Vercel `success` sur `dbb5c598700558f57802bbb8443690c749a16907`.
- Limite de cette passe : le clone réseau GitHub est indisponible dans l'environnement d'exécution, donc le lanceur complet n'a pas pu être exécuté ici contre une copie locale fraîche du dépôt. Les tests individuels qu'il référence restent ceux déjà présents et vérifiés lors de la passe précédente.
- Aucun point nécessitant une décision utilisateur supplémentaire n'a été introduit.

## 2026-08-21 — invariants statiques de sécurité 23:13 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main`, Vercel vert ; aucune action Supabase effectuée.
- Amélioration réversible : ajout de `tests/v150b2b-static-invariants.test.js` pour détecter les régressions client évidentes (lecture/exposition de `users.mdp`, accès direct client à `users`, référence runtime à la migration RLS stricte, perte du chargement stats-only Chef de chantier ou mauvais ordre d'injection preview).
- Le test a été ajouté au lanceur unifié `tests/run-v150b2b-checks.js`. Commits : `4e2a4318b8890b4f5d2d4f22eb3225c27a00d1e5` (`tests: add v150B-2B static safety invariants`) et `61bf99078cfdbef968a66e981847f32e84ba74a2` (`tests: include static safety invariants`).
- Vérification fraîche : nouveaux fichiers relus depuis GitHub, `node --check tests/v150b2b-static-invariants.test.js` exécuté localement avec exit 0, Vercel `success` sur `61bf99078cfdbef968a66e981847f32e84ba74a2`.
- Limite inchangée : le clone GitHub reste indisponible dans l'environnement (`Could not resolve host: github.com`), donc le lanceur complet n'a pas été réexécuté localement sur une copie fraîche ; aucune affirmation de passage complet de la suite n'est faite dans cette passe.
- Aucun code de production, règle métier, permission, RLS, donnée, Import, Multi-chantier ou purge hebdomadaire n'a été modifié ; aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — contrat de preview 00:16 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, `main` inchangé ; Supabase `railops` reste `ACTIVE_HEALTHY`. Le Security Advisor a été relu en lecture seule, sans appliquer de correction ni de migration.
- Amélioration réversible : ajout de `tests/v150b2b-preview-contract.test.js` pour verrouiller le contrat technique de la preview : un seul build tag pour tous les adaptateurs, chaque script injecté une seule fois et dans l'ordre attendu, chargement frais de `index.html`, absence de référence directe aux migrations.
- Le nouveau test est inclus dans `tests/run-v150b2b-checks.js`. Commits : `91e1a2c6308834a4df102e90a9a251da674d0d98` (`tests: lock preview adapter contract`) et `38ee6c06045ca4264aa8b35f710cd1593e190a4e` (`tests: include preview contract in local checks`).
- Vérification fraîche : le test de contrat a été exécuté localement contre le `v150b2b-test.html` relu depuis la branche et renvoie `PASS: v150B-2B preview contract (150b2b10)`.
- Aucun code de production, règle métier, permission, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Les points de sécurité déjà documentés restent volontairement en attente de validation humaine.

## 2026-08-22 — couverture du lanceur de vérifications 01:14 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main` inchangée ; Supabase `railops` `ACTIVE_HEALTHY`. Security Advisor relu en lecture seule, sans migration ni modification de droits/RLS.
- Amélioration réversible : ajout de `tests/v150b2b-runner-coverage.test.js`, qui vérifie que chaque module JavaScript chargé par `v150b2b-test.html` est bien présent dans les contrôles de syntaxe du lanceur agrégé et que ce garde-fou est lui-même exécuté par le lanceur.
- Cycle rouge/vert vérifié localement : le nouveau test échouait d'abord car il n'était pas référencé par `tests/run-v150b2b-checks.js`, puis passe après son ajout (`PASS: aggregate runner covers 7 preview JavaScript modules`).
- Commits : `434fb953d52d839f54905ccf08b472ff28ec7fc3` (`tests: guard aggregate preview check coverage`) et `1896a4a41509f09711660ea20c72c438d0178b1a` (`tests: include aggregate runner coverage guard`).
- Aucun code de production, règle métier, permission, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — garde-fou stockage local 02:17 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon sur `security/v150b2b-rls-ready`, `main` non fusionné ; aucun changement Supabase, RLS ou permission effectué.
- Amélioration réversible : ajout de `tests/v150b2b-local-storage-safety.test.js` pour empêcher le retour du cache legacy `ro3_u`, la sérialisation de `S.users` ou la persistance de champs de type mot de passe dans le loader sécurisé.
- Le test est inclus dans `tests/run-v150b2b-checks.js`. Commits : `cd72ae042598ea6b24c123c371f24da2e31e8bce` (`tests: guard secure local storage invariants`) et `a758ad7fbd76f1f32e1e7b7534057f05904ae56e` (`tests: include local storage safety guard`).
- Vérification fraîche : test relu depuis GitHub ; assertions exécutées localement contre les lignes actuelles de persistance du loader avec résultat `PASS: v150B-2B local storage safety invariants` ; Vercel `success` sur `a758ad7fbd76f1f32e1e7b7534057f05904ae56e`.
- Limite connue : le clone GitHub reste indisponible dans l'environnement d'exécution, donc la suite agrégée complète n'a pas été rejouée contre un checkout frais. Aucun code de production, règle métier, permission, Import, Multi-chantier ou purge hebdomadaire n'a été modifié ; aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — exhaustivité du lanceur 03:15 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main` inchangée ; Supabase `railops` reste `ACTIVE_HEALTHY` et le Security Advisor a été relu en lecture seule. Aucun changement de base, RLS ou permission.
- Amélioration réversible : `tests/v150b2b-runner-coverage.test.js` vérifie désormais que **chaque** fichier `tests/v150b2b-*.test.js` présent dans le dossier est référencé par `tests/run-v150b2b-checks.js`, en plus du contrôle existant sur les modules JavaScript injectés dans la preview. Cela évite qu'un nouveau test soit ajouté puis oublié du lanceur agrégé.
- Commit : `edbdd001b50453ff6f18663159c82138955e437c` (`tests: ensure runner includes every v150B-2B test`).
- Vérification fraîche : contrôle exécuté localement sur une reconstruction fidèle de la liste actuelle des tests et des scripts de preview : `PASS: aggregate runner covers 8 tests and 7 preview JavaScript modules`; `node --check` du garde-fou passe également ; Vercel `success` sur le commit.
- Aucun code de production, règle métier, permission, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — relevé Security Advisor 04:13 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main` inchangée ; projet Supabase `railops` `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.
- Amélioration documentaire réversible : ajout d'un relevé comparatif daté dans `docs/security-advisor-baseline.md` afin de tracer les écarts du Security Advisor sans modifier la base. Les anciennes alertes « RLS désactivée » sur `deleted_ids` et `prix_catalogue` ne sont plus remontées ; de nouvelles informations `RLS Enabled No Policy` sont visibles sur cinq tables, les avertissements `SECURITY DEFINER` persistent et la protection contre les mots de passe compromis reste désactivée.
- Commit : `7b3882c2a2d932352dcf9b4016675bba178597df` (`docs: refresh Supabase security advisor snapshot`).
- Vérification : document relu depuis GitHub après commit ; aucune migration, policy, permission, fonction, table ou donnée Supabase n'a été modifiée. Aucun changement de code de production, règle métier, Import, Multi-chantier ou purge hebdomadaire.
- Point en attente inchangé : toute correction de sécurité ou interprétation de la dérive observée reste volontairement hors scope sans validation explicite et smoke-tests complets.

## 2026-08-22 — CI automatique des vérifications 05:13 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main` inchangée ; aucun changement Supabase, RLS, permission ou donnée effectué.
- Amélioration réversible : ajout de `.github/workflows/v150b2b-checks.yml` pour exécuter automatiquement `node tests/run-v150b2b-checks.js` sur les pushes de la branche de sécurité et sur la PR vers `main`, avec permissions GitHub minimales (`contents: read`) et un timeout de 5 minutes.
- Commit CI : `5568d35dcce14207fe84e4c74e8edf801716afeb` (`ci: run v150B-2B verification suite`).
- Vérification fraîche : GitHub Actions a exécuté le job `checks` jusqu'au bout avec conclusion `success` (Checkout, Node.js 22 et suite v150B-2B tous verts) ; Vercel a également renvoyé `success` sur le même commit.
- Aucun code de production, règle métier, Import, Multi-chantier, purge hebdomadaire, migration ou sécurité Supabase modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.
