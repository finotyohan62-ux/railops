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

## 2026-08-22 — auto-découverte des vérifications 06:15 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main` inchangée ; Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 ; Vercel était vert sur le head de départ.
- Amélioration réversible : `tests/run-v150b2b-checks.js` découvre maintenant automatiquement tous les fichiers `tests/v150b2b-*.test.js` et les modules JavaScript réellement injectés par `v150b2b-test.html`, supprimant les deux listes manuelles qui pouvaient devenir obsolètes.
- Cycle rouge/vert : le garde-fou `tests/v150b2b-runner-coverage.test.js` a d'abord échoué contre l'ancien manifeste, puis passe après l'auto-découverte ; une assertion trop large a été affinée après avoir détecté un faux positif sur la syntaxe dynamique.
- Commits : `dd34269c5ab3b11164b6c85b54c5e8b5d1b003d2` (`tests: require auto-discovered v150B-2B checks`), `daf1fb7bed4641f503e11872dd5ac530db0105fe` (`tests: auto-discover v150B-2B checks`) et `a12efe95cf60b24f0360c9ea6cea5cb9dece7c41` (`tests: refine runner auto-discovery guard`).
- Vérification fraîche : `node --check` du lanceur et du garde-fou passe ; le garde-fou s'exécute avec succès sur une reconstruction locale fidèle (`PASS: aggregate runner auto-discovers 1 tests and 7 preview JavaScript modules`) ; GitHub Actions `v150B-2B checks` run #10 est `success` sur `a12efe95cf60b24f0360c9ea6cea5cb9dece7c41`, et Vercel est également `success` sur ce commit.
- Aucun code de production, règle métier, permission, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — concurrence CI 07:13 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main` inchangée ; Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 et le Security Advisor a été relu en lecture seule, sans aucune correction appliquée.
- Amélioration réversible : ajout de `tests/v150b2b-ci-workflow.test.js` pour verrouiller les invariants de la CI (permissions `contents: read`, timeout de 5 minutes, exécution du lanceur agrégé et annulation des runs obsolètes), puis ajout d'un bloc `concurrency` dans `.github/workflows/v150b2b-checks.yml` avec `cancel-in-progress: true` par workflow + PR/branche.
- Cycle rouge/vert vérifié localement : le nouveau test échoue contre l'ancien workflow faute de bloc `concurrency`, puis passe après la modification (`PASS: v150B-2B CI workflow safety contract`).
- Commits : `51752628950d0ce707eacc1cdbc5463cb51c83ca` (`tests: guard v150B-2B CI workflow safety`) et `d45b240548991b8d7bb0c433f162f894b1cb8c4b` (`ci: cancel stale v150B-2B verification runs`).
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #16 est `success` sur `d45b240548991b8d7bb0c433f162f894b1cb8c4b` et Vercel est également `success` sur ce commit.
- Aucun code de production, règle métier, permission applicative, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — guide de vérification 08:15 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, base `main` inchangée ; head de départ `1fed829366064255d01cb47b9e24b1dcc4912eac` avec GitHub Actions run #18 `success` et Vercel `success`. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.
- Amélioration documentaire réversible : ajout de `docs/v150b2b-verification-guide.md` pour centraliser la commande de vérification locale, l'auto-découverte du lanceur, le comportement de la CI, la lecture des échecs et les garde-fous avant RLS/merge.
- Commit : `d28801539943a4cf3e84eb37d53bc384716b5125` (`docs: add v150B-2B verification guide`).
- Vérification fraîche : le nouveau document a été relu depuis la branche après commit ; la PR reste `draft`, non fusionnée, et cible toujours `main`. Aucun code de production, règle métier, permission, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié.
- Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — contrat guide / CI 09:17 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 et le Security Advisor a été relu en lecture seule, sans correction appliquée.
- Amélioration réversible : ajout de `tests/v150b2b-verification-doc-contract.test.js` pour empêcher une dérive entre le guide de vérification et la CI : commande locale canonique, branche protégée, smoke-tests humains, PR vers `main`, permissions `contents: read`, Node.js 22, annulation des runs obsolètes et même lanceur agrégé.
- Commit : `1380ffae91cfe0028ccdd1d21a7b0a66d44e34e8` (`tests: guard v150B-2B verification docs contract`).
- Vérification fraîche : le nouveau test a été relu depuis GitHub et GitHub Actions `v150B-2B checks` run #24 s'est terminé avec conclusion `success` sur ce commit. Le téléchargement direct raw reste indisponible dans l'environnement (`Could not resolve host: raw.githubusercontent.com`), donc aucune vérification locale supplémentaire n'est revendiquée.
- Aucun code de production, règle métier, permission applicative, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — CI de vérification en lecture seule 10:15 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 et le Security Advisor a été relu en lecture seule, sans correction appliquée.
- Amélioration réversible : le contrat `tests/v150b2b-verification-doc-contract.test.js` interdit désormais explicitement dans la CI de vérification les commandes Supabase de migration/déploiement/link, `psql`, l'exécution de la migration RLS stricte, les déploiements Vercel CLI et les commandes Git de push/merge. Le workflow reste donc limité aux diagnostics et tests.
- Commit : `982f0871f59514dd3413fd78067704cc8714622c` (`tests: keep verification CI diagnostic-only`).
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #28 s'est terminé avec conclusion `success`; le job `checks` confirme Checkout, Node.js 22 et la suite v150B-2B tous verts. Aucune opération Supabase, migration, permission, RLS ou donnée n'a été appliquée.
- Aucun code de production, règle métier, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — diagnostics détaillés du lanceur 11:16 Europe/Paris

- État contrôlé avant chaque modification : PR #1 ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; Supabase `railops` `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1, sans écriture ni migration.
- Amélioration réversible limitée aux tests : le lanceur agrégé affiche désormais explicitement `PASS` pour chaque contrôle réussi et, en cas d'échec, le nom exact du contrôle ainsi que son code de sortie. Aucun comportement applicatif n'est modifié.
- Cycle rouge/vert vérifié : le contrat ajouté dans `tests/v150b2b-runner-coverage.test.js` échouait contre l'ancien lanceur sur l'absence du diagnostic par contrôle, puis passe après la modification minimale de `tests/run-v150b2b-checks.js`.
- Commits : `73b04951e9d3bf208080cb73fe456441c64f5d65` (`tests: require per-check CI diagnostics`) et `aa8b0cb8ea71d30b849973bbb56fda2ced824c03` (`tests: improve aggregate runner diagnostics`).
- Vérification fraîche : garde-fou local vert sur une reconstruction fidèle des deux fichiers concernés ; GitHub Actions `v150B-2B checks` run #34 est terminé avec conclusion `success` sur `aa8b0cb8ea71d30b849973bbb56fda2ced824c03`.
- Aucun code de production, règle métier, permission, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — garde-fou mutation CI 12:12 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Le workflow réel et son contrat de test ont été relus avant changement.
- Amélioration réversible limitée aux tests : `tests/v150b2b-ci-workflow.test.js` interdit désormais directement les commandes de mutation Supabase (`db push`, `migration up`, déploiement de fonctions) ainsi que les commandes `psql` contenant des verbes DDL/DML sensibles. Aucun workflow, code applicatif ou comportement métier n'a été modifié.
- Commit : `f4944eee449bf496431836779f8063456bca5231` (`tests: keep verification workflow diagnostic-only`).
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #38 s'est terminé avec conclusion `success` sur ce commit et Vercel est également `success`. `main` reste intact et aucune opération Supabase, migration, permission, RLS ou donnée n'a été appliquée.
- Aucun changement sur Import, Multi-chantier ou purge hebdomadaire. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — accessibilité des erreurs preview 13:19 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; Vercel était vert et Supabase `railops` restait `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Le Security Advisor a été relu en lecture seule, sans correction appliquée.
- Amélioration UX réversible : l'erreur de chargement de `v150b2b-test.html` est désormais rendue avec `role="alert"` et `aria-live="assertive"` pour être annoncée correctement par les technologies d'assistance. Aucun flux applicatif, rôle, permission ou donnée n'est touché.
- Test associé : `tests/v150b2b-harness.test.js` verrouille ce contrat d'accessibilité. Commits : `00fb4b7e71e796623ea1d31df533674eeca00928` (`tests: require accessible preview errors`) et `5e2a2f7442937748df02b0547d15541ccc3bd2cc` (`ux: announce preview load failures accessibly`).
- Vérification fraîche : le test harness modifié et `node --check` passent localement ; GitHub Actions `v150B-2B checks` run #48 et `RailOps lifecycle regression` run #89 sont tous deux terminés avec conclusion `success` sur `5e2a2f7442937748df02b0547d15541ccc3bd2cc`.
- Aucun code métier, règle de permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — timeout par contrôle 14:14 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; Supabase `railops` vérifié `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Aucun changement de base, RLS, permission ou donnée effectué.
- Amélioration réversible limitée aux tests : `tests/run-v150b2b-checks.js` impose désormais un timeout de 30 secondes à chaque test/syntax check et affiche le nom exact du contrôle bloqué, afin qu'un processus suspendu ne consomme pas les 5 minutes complètes du workflow.
- Cycle rouge/vert vérifié via CI : le commit de contrat `f3a34c4f9e848f97f099a53d6112b88a3642a17d` (`tests: require per-check timeout diagnostics`) a fait échouer `v150B-2B checks` run #52 comme attendu ; la correction minimale `a33942114ebe56e81d68f71ad922ae0f613054e3` (`tests: cap individual v150B-2B checks`) rend la suite verte.
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #54 et `RailOps lifecycle regression` run #92 sont tous deux `success` sur `a33942114ebe56e81d68f71ad922ae0f613054e3` ; Vercel est également `success`.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — garde-fou dérive de `main` 15:13 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; `main` a avancé jusqu'à `283fca36c07f990ad80613d2aac97c2de3ef7bcf` et la comparaison GitHub indique la branche **12 commits behind** et **98 commits ahead**, donc divergente. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 ; le Security Advisor a été relu en lecture seule, sans correction appliquée.
- Amélioration réversible : `tests/v150b2b-verification-doc-contract.test.js` impose maintenant un garde-fou documentaire de dérive ; `docs/v150b2b-verification-guide.md` documente `git fetch origin main` puis `git rev-list --left-right --count origin/main...HEAD`, l'interprétation behind/divergent et l'interdiction de merge/rebase automatique sans validation.
- Cycle rouge/vert vérifié : le commit `c127c4ee985d22d1f48d0d42d3d9e454ea753d03` (`tests: require branch drift checkpoint`) a fait échouer `v150B-2B checks` run #58 comme attendu ; la correction minimale `230006cd1e768f7723c6cd60cf9f8cdb512de009` (`docs: add main drift verification gate`) rend `v150B-2B checks` run #60 et `RailOps lifecycle regression` run #101 tous deux `success`.
- Diagnostic `main` : les commits absents de la branche incluent des changements d'authentification Supabase ainsi que le refactor v155 qui centralise les hooks `render/load/mutation`. Cela peut modifier la compatibilité réelle de la preview v150B-2B ; aucune synchronisation n'a donc été tentée automatiquement.
- Vercel a refusé le build du commit vert uniquement pour limite de builds du compte (`upgradeToPro=build-rate-limit`) ; ce statut n'est pas interprété comme une régression du code, les deux suites GitHub Actions étant vertes.
- Aucun code applicatif de la branche, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié.
- Point nécessitant validation : décider explicitement comment synchroniser `security/v150b2b-rls-ready` avec les 12 commits récents de `main` avant de reprendre les smoke-tests de compatibilité ; aucun merge/rebase n'a été effectué.

## 2026-08-22 — diagnostic client sans données sensibles 16:21 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; comparaison GitHub toujours divergente avec 12 commits présents sur `main` mais pas sur la branche. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 ; Security Advisor relu en lecture seule, sans correction appliquée.
- Amélioration réversible : ajout de `v150b2b-diagnostics.js`, helper de diagnostic qui expose uniquement version, rôle, mode propriétaire, page, état online et **comptages** (chantiers, matériels, scans, utilisateurs, stats Chef de chantier). Aucun nom, ID, référence matériel, QR ou contenu métier n'est inclus dans le snapshot.
- Cycle rouge/vert vérifié par GitHub Actions : `436a092dd6962121534f649517267eb65f08fc0d` puis `efaf3112013b077f66c1fd3b3f9c2952253d22ea` ont fait échouer `v150B-2B checks` comme attendu avant implémentation/câblage ; `ba32ea62b096a5eba1d262e90294aa01a9d08dc9`, `311b9b80812b0ced5d21aff4406a1aca17ab5269` et `354227a5f8580bd49c6f64f492e2bd2b3a377ea5` ajoutent le helper, l'injection preview build `150b2b11` et les tests associés.
- Vérification fraîche : `v150B-2B checks` run #82 et `RailOps lifecycle regression` run #116 sont tous deux `success` sur `354227a5f8580bd49c6f64f492e2bd2b3a377ea5`. Vercel reste limité par le quota de builds du compte, sans signal de régression applicative provenant des deux suites GitHub Actions.
- Aucun changement de règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire. `main` reste intact et aucun merge/rebase n'a été tenté.
- Point en attente inchangé : la synchronisation avec les 12 commits récents de `main` et les smoke-tests humains restent bloqués sur validation explicite ; aucun nouveau choix produit n'a été introduit par cette passe.

## 2026-08-22 — guide de diagnostic sûr 17:15 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; `main` reste à `283fca36c07f990ad80613d2aac97c2de3ef7bcf` avec 12 commits absents de la branche, qui reste divergente. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.
- Amélioration documentaire réversible : ajout de `docs/v150b2b-diagnostics-guide.md`, qui documente l’usage du snapshot de diagnostic, les champs autorisés, l’interdiction d’y ajouter noms/IDs/références/QR/payloads métier et la lecture attendue du cas Chef de chantier sans matériels/scans chargés.
- Commit d'amélioration : `2aca165f81f32e7226c19091886d11703e866150` (`docs: document safe v150B-2B diagnostics`).
- Vérification fraîche : le document a été relu depuis la branche ; GitHub Actions `v150B-2B checks` run #86 et `RailOps lifecycle regression` run #118 sont `success` sur ce commit, et Vercel est également `success`.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n’a été modifié. `main` reste intact ; aucun merge/rebase n’a été tenté.
- Point en attente inchangé : la synchronisation de la branche avec les 12 commits récents de `main` et les smoke-tests humains nécessitent toujours une validation explicite ; aucun nouveau choix produit n’a été introduit par cette passe.

## 2026-08-22 — garde-fou dérive Supabase runtime 18:17 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; comparaison GitHub fraîche `main...security/v150b2b-rls-ready` = **12 commits behind / 114 ahead**, `main` à `283fca36c07f990ad80613d2aac97c2de3ef7bcf`. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.
- Diagnostic Supabase strictement en lecture seule : les tables cœur `users`, `chantiers`, `materiels`, `scans`, `deleted_ids` et `prix_catalogue` ont actuellement RLS activé ; les policies réelles diffèrent du baseline initial, avec notamment des policies métier sur `chantiers/materiels/scans` et des lectures legacy encore ouvertes sur `deleted_ids`, `prix_catalogue` et l'accès anon historique de `users`. Aucun DDL/DML, migration, permission, policy ou donnée n'a été modifié.
- Amélioration réversible : `tests/v150b2b-verification-doc-contract.test.js` exige maintenant un checkpoint Supabase RLS/policies en lecture seule avant toute conclusion de compatibilité ; `docs/v150b2b-verification-guide.md` explique de stopper la conclusion si l'état backend a changé indépendamment de la branche.
- Cycle rouge/vert local vérifié sur les fichiers concernés : le nouveau contrat échoue contre l'ancien guide avec l'assertion Supabase attendue, puis passe après la documentation (`PASS: v150B-2B verification documentation and CI contract`). Commits : `ed2bc45932655735a1ab8f6df02f1b43a3decca5` (`tests: require Supabase drift checkpoint`) et `d3e62191731a23c4d22a803e298e0543bb72340e` (`docs: add Supabase runtime drift gate`). Vercel est `success` sur le commit de test ; aucune conclusion GitHub Actions complète n'est revendiquée avant son statut final.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Point nécessitant validation inchangé mais désormais renforcé : avant les smoke-tests, décider explicitement comment synchroniser la branche avec les 12 commits de `main` et revalider sa compatibilité avec l'état Supabase actuel, qui a évolué depuis le baseline historique.

## 2026-08-22 — couverture secrets du diagnostic 19:13 Europe/Paris

- État contrôlé avant modification : PR #1 toujours sur `security/v150b2b-rls-ready`, sans merge ; comparaison fraîche avec `main` toujours divergente (**12 commits behind / 117 ahead**) et projet Supabase `railops` `ACTIVE_HEALTHY`. Le Security Advisor a été relu en lecture seule ; aucune correction backend n'a été appliquée.
- Amélioration réversible limitée aux tests : `tests/v150b2b-diagnostics.test.js` couvre désormais explicitement l'absence de badge, `mdp`, mot de passe, access/refresh token et clé API, y compris lorsqu'ils sont présents dans l'état ou le runtime fourni au helper de diagnostic.
- Commit d'amélioration : `4b752e3f2226de18f1eed4d8d10cc458985e7a54` (`tests: harden safe diagnostics secret coverage`).
- Vérification fraîche : test relu depuis GitHub puis exécuté localement avec le helper actuel (`PASS: v150B-2B diagnostics snapshot is metadata-only`) ; `node --check` du test passe également.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — durées par contrôle CI 20:19 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, cible `main`, non fusionnée ; comparaison fraîche toujours divergente (**12 commits behind / 121 ahead**) et projet Supabase `railops` `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Le Security Advisor a été relu en lecture seule, sans correction backend.
- Amélioration réversible limitée aux tests/diagnostics : `tests/run-v150b2b-checks.js` mesure maintenant la durée de chaque contrôle et l'affiche avec son `PASS`, ce qui facilite l'identification d'un test qui ralentit avant d'atteindre le timeout de 30 secondes.
- Cycle rouge/vert vérifié par GitHub Actions : `9c55b36dff3214ab58162afa4d1fe15a2a8c1ebc` (`tests: require per-check duration diagnostics`) a fait échouer `v150B-2B checks` run #104 comme attendu ; `b0d1271d9dc7e487b19011cfe8909e90615ea9e1` (`tests: report per-check durations`) rend `v150B-2B checks` run #106 et `RailOps lifecycle regression` run #128 tous deux `success`.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Point en attente inchangé : la synchronisation de la branche avec les 12 commits récents de `main` et les smoke-tests humains nécessitent toujours une validation explicite ; aucun nouveau choix produit n'a été introduit par cette passe.

## 2026-08-22 — contexte d’exécution des contrôles 21:15 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` toujours divergente de `main` (**12 commits behind / 124 ahead** au départ de la passe) ; Supabase `railops` `ACTIVE_HEALTHY`. Contrôle RLS/policies effectué en lecture seule : RLS reste actif sur `users`, `chantiers`, `materiels`, `scans`, `agents`, `inspections`, `deleted_ids` et `prix_catalogue`; aucune écriture backend n’a été effectuée.
- Amélioration réversible limitée aux tests/diagnostics : `tests/run-v150b2b-checks.js` affiche désormais avant la suite la version Node, la ref GitHub (ou `local`) et un SHA compact, ainsi que le nombre de tests et de contrôles de syntaxe découverts. Cela facilite l’identification immédiate du contexte d’un log CI sans toucher au runtime RailOps.
- Cycle rouge/vert vérifié par GitHub Actions : `4fd142e864d2740ec16bdd29397eb8475a875ced` (`test: require CI context diagnostics in v150B2B runner`) fait échouer `v150B-2B checks` run #110 comme attendu ; `9fb72a2e89229d9ab67afbc889aeea8b9b5da6cc` (`test: print CI context in v150B2B runner`) rend `v150B-2B checks` run #112 et `RailOps lifecycle regression` run #131 tous deux `success`. Vercel est également `success` sur le commit vert.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n’a été modifié ; `main` reste intact et aucun merge/rebase n’a été tenté.
- Point en attente inchangé : la synchronisation avec les 12 commits de `main` et les smoke-tests humains restent soumis à validation explicite ; aucun nouveau choix produit n’a été introduit.

## 2026-08-22 — collecte complète des échecs CI 22:16 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` toujours divergente de `main` (**12 commits behind / 127 ahead** au départ), PR non fusionnée ; Supabase `railops` `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Le Security Advisor a été relu en lecture seule, sans correction backend.
- Amélioration réversible limitée aux tests/diagnostics : `tests/run-v150b2b-checks.js` ne s'arrête plus au premier contrôle en échec ; il exécute tous les tests et `node --check`, collecte les échecs, imprime un résumé final puis retourne un code non nul si nécessaire. Cela améliore le diagnostic CI sans toucher au runtime RailOps.
- Commits : `a86eecf7f44b3e60136b65103185172c8335b4e2` (`tests: require full v150B-2B failure collection`) et `cf3a5d288c182711caba9a447fade9d1326a9ded` (`tests: report all v150B-2B check failures`).
- Vérification fraîche : Vercel `success`; GitHub Actions `v150B-2B checks` run #118 et `RailOps lifecycle regression` run #134 sont tous deux `success` sur `cf3a5d288c182711caba9a447fade9d1326a9ded`.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit.

## 2026-08-22 — alertes de diagnostic de périmètre 23:21 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon, non fusionnée, sur `security/v150b2b-rls-ready`; comparaison fraîche toujours divergente (**12 commits behind / 130 ahead** au départ). Supabase `railops` reste `ACTIVE_HEALTHY`; Security Advisor relu en lecture seule, sans aucune correction backend.
- Amélioration réversible : `v150b2b-diagnostics.js` ajoute uniquement des codes `warnings` metadata-only lorsque des incohérences de périmètre sont détectées : matériel ou scans présents dans un état `chef_chantier`, ou mode Administration propriétaire actif avec un rôle effectif différent de `admin`. Le champ reste absent quand l'état est sain afin de préserver la forme historique du snapshot.
- Cycle rouge/vert local : le test dédié échoue d'abord avec `warnings === undefined`, puis passe après l'implémentation minimale; `node --check v150b2b-diagnostics.js` passe également. Commits : `1397af6c23f43b7a2491ce5281b805758f2f2f80` (`test: cover safe diagnostics scope warnings`), `6208a62ff6f6294a6a9e508764dd0e9c91833208` (`feat: add metadata-only diagnostics warnings`) et `477e194bf6988020b86f5b2b8f74db6c5fb19b61` (`docs: document diagnostics warning codes`).
- Documentation mise à jour : `docs/v150b2b-diagnostics-guide.md` décrit les trois codes et rappelle qu'ils ne modifient aucun droit, chargement ni donnée et n'exposent aucun ID/référence métier.
- Aucun changement de règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire; `main` reste intact et aucun merge/rebase n'a été tenté.
- Point en attente inchangé : la synchronisation avec les 12 commits de `main` et les smoke-tests humains nécessitent toujours une validation explicite; aucun nouveau choix produit n'a été introduit par cette passe.

## 2026-08-23 — synthèse des contrôles les plus lents 00:15 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; comparaison fraîche `main...security/v150b2b-rls-ready` = **12 commits behind / 134 ahead**. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 ; Security Advisor relu en lecture seule, sans aucune correction backend.
- Amélioration réversible limitée aux tests/diagnostics : `tests/run-v150b2b-checks.js` conserve désormais les durées de tous les contrôles et affiche en fin de run les **trois contrôles les plus lents**, afin de rendre visibles les régressions de performance CI sans modifier le runtime RailOps.
- Cycle rouge/vert vérifié : `1a2ae692f20b2ad3d579d33088bc98036a046b96` (`test: require slowest-check CI summary`) fait échouer `v150B-2B checks` run #130 comme attendu ; `e7dda209410474cb2b940a6290cc9f18d8f702aa` (`test: summarize slowest v150B2B checks`) passe le garde-fou local et `node --check`, avec le job `v150B-2B checks` run #132 `success`, `RailOps lifecycle regression` run #141 `success` et Vercel `success`.
- État après modification : branche toujours divergente, désormais **12 commits behind / 136 ahead** ; aucun merge/rebase n'a été tenté.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié.
- Point en attente inchangé : la synchronisation avec les 12 commits de `main` et les smoke-tests humains nécessitent toujours une validation explicite ; aucun nouveau choix produit n'a été introduit par cette passe.

## 2026-08-23 — diagnostic stats Chef de chantier manquantes 01:20 Europe/Paris

- État contrôlé avant modifications : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; comparaison fraîche avec `main` toujours divergente (**12 commits behind / 137 ahead** au départ). Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 ; Security Advisor relu en lecture seule, sans correction backend.
- Amélioration réversible de diagnostic : `v150b2b-diagnostics.js` ajoute `CHEF_CHANTIER_STATS_MISSING` uniquement lorsqu’un Chef de chantier est en ligne, voit au moins un chantier et n’a reçu aucune ligne de statistiques agrégées. Le signal est désactivé hors ligne pour éviter un faux positif et n’expose aucune donnée métier.
- Tests/documentation : `tests/v150b2b-diagnostics-warnings.test.js` couvre le cas en ligne et l’absence d’alerte hors ligne ; `docs/v150b2b-diagnostics-guide.md` documente le nouveau code et son usage. Commits : `3761a848af96aac239880f706abaa765556c72eb` (test), `774249b192c28bdc51c4a8ea1dcaa0d83f4bda8a` (diagnostic) et `a38a8417d363798aeed10a4d532569f3facdb709` (documentation).
- Vérification fraîche : test ciblé et `node --check` passent localement ; GitHub Actions `v150B-2B checks` run #140 et `RailOps lifecycle regression` run #145 sont tous deux `success` sur `a38a8417d363798aeed10a4d532569f3facdb709`; Vercel est également `success`.
- État après modification : branche toujours divergente, désormais **12 commits behind / 140 ahead** ; aucun merge/rebase n’a été tenté. Aucun changement de règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire.
- Point en attente inchangé : synchronisation avec les 12 commits de `main` et smoke-tests humains toujours soumis à validation explicite ; aucun nouveau choix produit n’a été introduit par cette passe.

## 2026-08-23 — relevé advisors en lecture seule 02:12 Europe/Paris

- État contrôlé avant modification : `security/v150b2b-rls-ready` toujours divergente de `main` (**12 commits behind / 141 ahead** au départ), sans merge ; Supabase `railops` toujours `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.
- Amélioration documentaire réversible : `docs/security-advisor-baseline.md` reçoit un nouveau relevé comparatif daté. Le Security Advisor reste stable sur les cinq `RLS Enabled No Policy`, les avertissements `SECURITY DEFINER` et la protection contre les mots de passe compromis désactivée. Le Performance Advisor signale deux clés étrangères non indexées sur `public.inspections`, consignées uniquement comme diagnostic.
- Commit documentation : `823ecf9bc7afa66452768cc060e6e0932d5ebf66` (`docs: refresh Supabase advisor snapshot 2026-08-23`).
- Vérification : le nouveau relevé a été relu depuis la branche ; aucune écriture Supabase, migration, policy, permission, index, donnée, règle métier, Import, Multi-chantier ou purge hebdomadaire n'a été modifiée. Aucun merge/rebase n'a été tenté et `main` reste intact.
- Point en attente inchangé : la synchronisation avec les 12 commits de `main`, les smoke-tests humains et toute correction de sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-23 — temps total des contrôles CI 03:16 Europe/Paris

- État contrôlé avant modification : `security/v150b2b-rls-ready` toujours divergente de `main` (**12 commits behind / 143 ahead** au départ), sans merge ; Supabase `railops` vérifié `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Contrôle RLS/policies effectué en lecture seule : RLS actif sur les huit tables cœur suivies et aucune policy publique `qual=true` détectée.
- Amélioration réversible limitée aux tests/diagnostics : `tests/run-v150b2b-checks.js` additionne désormais les durées de tous les contrôles enfants et affiche `total check time`, afin de rendre visible une dérive globale du coût CI en complément du top 3 des checks les plus lents.
- Cycle test/implémentation : `1da66d700e10db03ec9c5fdcea102482092ad8d3` (`test: require total v150B2B check duration`) pose le contrat ; `91870a62d53a7f2b30221cc33c90be0b54b5cb06` (`tests: report total v150B2B check time`) ajoute l'implémentation minimale.
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #150 et `RailOps lifecycle regression` run #150 sont tous deux `success` sur `91870a62d53a7f2b30221cc33c90be0b54b5cb06`; Vercel est également `success` sur ce commit.
- État avant journalisation : branche toujours divergente, désormais **12 commits behind / 145 ahead** ; aucun merge/rebase n'a été tenté.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire n'a été modifié. Aucun nouveau point nécessitant une décision utilisateur n'a été introduit ; les points en attente historiques (synchronisation de `main`, smoke-tests humains, corrections sécurité/performance) restent inchangés.
