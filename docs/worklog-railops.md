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

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; comparaison fraîche `main...security/v150b2b-rls-ready` = **12 commits behind / 127 ahead** au départ), PR non fusionnée ; Supabase `railops` `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Le Security Advisor a été relu en lecture seule, sans correction backend.
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

## 2026-08-23 — cohérence du mode Administration 18:13 Europe/Paris

- État contrôlé avant modification : `security/v150b2b-rls-ready` toujours divergente de `main` (**12 commits behind / 194 ahead** au départ), sans merge/rebase ; Supabase `railops` vérifié `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1 et Security Advisor relu en lecture seule, sans correction backend.
- Amélioration réversible de diagnostic : `v150b2b-diagnostics.js` signale désormais `OWNER_ADMIN_MODE_WITHOUT_OWNER` lorsqu’un état client indique `adminMode=true` sans privilège propriétaire. Ce signal est metadata-only et ne modifie aucun droit, rôle, chargement ni donnée.
- Tests/documentation : `tests/v150b2b-diagnostics-warnings.test.js` couvre l’incohérence ; `docs/v150b2b-diagnostics-guide.md` documente ce code et complète aussi le code existant `CATALOGUE_SCOPE_LEAK`. Commits : `d1d0b1e62756f304b155622ad9a55354bbe35831` (test), `7837e0977cae34174a38f4bb0e76dbb45de87679` (diagnostic) et `b4bd59b3976684379c9e3d883d8d1f4adba35f72` (documentation).
- Vérification fraîche : cycle rouge reproduit localement avant correction ; test ciblé et `node --check v150b2b-diagnostics.js` passent après correction. GitHub Actions `v150B-2B checks` run #254 et `RailOps lifecycle regression` run #203 sont `success` sur `b4bd59b3976684379c9e3d883d8d1f4adba35f72`; Vercel est également `success`.
- État après modification : branche toujours divergente, désormais **12 commits behind / 197 ahead** ; aucun merge/rebase n’a été tenté. Aucun changement de règle métier, permission, migration, donnée Supabase, RLS, Import, Multi-chantier ou purge hebdomadaire.
- Points en attente inchangés : synchronisation avec les 12 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n’a été introduit.

## 2026-08-24 — snapshot Supabase et compatibilité iOS du test 16:32 Europe/Paris

- État contrôlé avant chaque modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; comparaison fraîche après les corrections = **14 commits behind / 261 ahead**. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; toutes les lectures backend de cette passe ont été strictement en lecture seule.
- Amélioration documentaire : ajout puis mise en conformité de `docs/supabase-state/2026-08-24-1620.md`, avec état GitHub, santé Supabase, Advisors et comptage RLS/policies des huit tables cœur. Commits : `0773c5085dc7c5cf6460486dc4778f149b26e9f5`, `b2bd9166ff6879dcf8c7ac5d4dbb2eb78b7eb236` et `8b72b838956d4ab16c7aec4de6e5eef8b0d7048a`.
- Diagnostic CI : le premier snapshot a révélé deux échecs. Le contrat snapshot manquait d'abord la section RLS/policies requise puis une chaîne exacte ; ces deux défauts documentaires ont été corrigés. L'autre échec provenait du test iOS qui inspectait uniquement le CSS inline alors que le `main` actuel extrait les mêmes règles dans `css/railops.css`.
- Correction réversible limitée aux tests : `tests/v150b2b-ios-layout-contract.test.js` suit désormais les feuilles de style locales référencées par `index.html`, tout en gardant les mêmes assertions `viewport-fit`, safe areas, bottom nav et momentum scrolling. Commit : `881a0b9563db8d3b560a0cef900031866397408f`.
- Vérification fraîche sur `8b72b838956d4ab16c7aec4de6e5eef8b0d7048a` : `v150B-2B checks` run #382, `RailOps lifecycle regression` run #270 et `RailOps modules regression` run #40 sont tous `success`; Vercel est également `success`.
- Aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Point en attente inchangé : la branche reste 14 commits derrière `main`; synchronisation et smoke-tests humains restent soumis à validation explicite.

## 2026-08-24 — relevé Supabase / GitHub 17:20 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon, non fusionnée, sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **14 commits behind / 262 ahead**. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084.
- Amélioration documentaire réversible : `docs/security-advisor-baseline.md` reçoit un relevé comparatif daté avec le comptage frais RLS/policies des huit tables cœur, les catégories Security/Performance Advisor et l'état GitHub/CI observé. Commit : `ac65c6ba2c717229e53ab6ae4267c34e7ea457eb` (`docs: refresh Supabase security baseline snapshot`).
- Vérification : le relevé a été relu depuis la branche ; les trois workflows du head de départ (`RailOps modules regression` #41, `v150B-2B checks` #384, `RailOps lifecycle regression` #271) étaient `success`, ainsi que Vercel. Aucune écriture Supabase, migration, policy, permission, fonction, index, donnée, règle métier, Import, Multi-chantier ou purge hebdomadaire n'a été modifiée.
- Garde-fous : `main` reste intact ; aucun merge/rebase ni activation de RLS stricte n'a été tenté.
- Point en attente inchangé : la branche reste 14 commits derrière `main`; synchronisation et smoke-tests humains restent soumis à validation explicite. Aucun nouveau choix produit n'a été introduit.

## 2026-08-24 — relevé GitHub / Supabase 19:13 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon sur `security/v150b2b-rls-ready`, non fusionnée ; comparaison fraîche avec `main` = **14 commits behind / 267 ahead**. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-24-1913.md`, photographie metadata-only de la divergence GitHub, de l'état RLS/policies des huit tables cœur et des familles Security/Performance Advisor. Commit : `5a87f179d434fe7f10518a2a0e510c2d2a21b4ab` (`docs: snapshot GitHub and Supabase state at 19:13`).
- Vérification fraîche : le snapshot a été relu après commit ; Vercel est `success` sur `5a87f179d434fe7f10518a2a0e510c2d2a21b4ab`. Les lectures Supabase de cette passe étaient strictement en lecture seule ; aucune nouvelle famille d'alerte n'a été observée.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Point en attente inchangé : synchronisation avec les 14 commits de `main` et smoke-tests humains restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-24 — snapshot diagnostic et couverture RLS 20:13 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon, non fusionnée, sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **14 commits behind / 269 ahead** au début de la passe. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; toutes les lectures backend ont été strictement en lecture seule.
- Amélioration réversible : `tests/v150b2b-snapshot-contract.test.js` exige désormais que le snapshot le plus récent consigne explicitement les huit tables cœur (`agents`, `chantiers`, `deleted_ids`, `inspections`, `materiels`, `prix_catalogue`, `scans`, `users`) et leur comptage de policies RLS. Commit initial : `0f2882ca12cc18c60a5cbecf768c64425ce2feaa`.
- Snapshot ajouté : `docs/supabase-state/2026-08-24-2013.md` avec divergence GitHub, santé Supabase, comptages RLS/policies et familles Security/Performance Advisor. Commit : `bcd0b3a6c15ca27c7e7cd9fbeb87da6cd58f9968`.
- Diagnostic CI : la première version du test contenait un échappement de backticks invalide dans une template string et a fait échouer `v150B-2B checks` run #402, tandis que les deux workflows fonctionnels restaient verts. Cause reproduite localement ; correction minimale appliquée en construisant la RegExp par concaténation. Commit : `908c3276b2df4fca7fc8d5f6d52407050f1c79cd`.
- Vérification fraîche sur `908c3276b2df4fca7fc8d5f6d52407050f1c79cd` : `v150B-2B checks` run #404, `RailOps lifecycle regression` run #283 et `RailOps modules regression` run #53 sont tous `success`; Vercel est également `success`.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Point en attente inchangé : synchronisation avec les 14 commits de `main` et smoke-tests humains restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-24 — fuseau explicite des snapshots 21:15 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon, non fusionnée, sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **14 commits behind / 273 ahead** au début de la passe. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; Security/Performance Advisors et comptages RLS/policies ont été relus strictement en lecture seule, sans nouvelle famille d'alerte.
- Amélioration réversible limitée aux tests/diagnostics : `tests/v150b2b-snapshot-timestamp.test.js` exige désormais `Europe/Paris` pour les snapshots créés à partir de `2026-08-24-2115.md`; les relevés historiques antérieurs restent acceptés. Commits : `d55acc4103b58c303ae994e65935b2bbc6efcfbd` (contrat initial) puis `1d1b6870890daaaa949a470879266d16345bec14` (application prospective après diagnostic CI).
- Snapshot ajouté : `docs/supabase-state/2026-08-24-2115.md`, commit `4b03a3cc88547bfa40ff92b2ad4302c7de874ca3`, avec divergence GitHub, santé Supabase, comptages RLS/policies et familles Advisors.
- Diagnostic CI : le premier contrat appliquait à tort le nouveau fuseau aux anciens snapshots et a fait échouer `v150B-2B checks` run #410 sur `2026-08-23-0714.md`; cause isolée puis correction minimale prospective. Vérification fraîche : `v150B-2B checks` run #412, `RailOps lifecycle regression` run #287 et `RailOps modules regression` run #57 sont tous `success`; Vercel est également `success` sur `1d1b6870890daaaa949a470879266d16345bec14`.
- État après correction : branche toujours divergente, **14 commits behind / 276 ahead** avant cette entrée ; aucun merge/rebase ni changement de `main` effectué.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié. Points en attente historiques inchangés : synchronisation avec `main` et smoke-tests humains restent soumis à validation explicite.

## 2026-08-24 — relevé GitHub / Supabase 23:17 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon, non fusionnée, sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **15 commits behind / 279 ahead** au début de la passe. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-24-2317.md`, photographie metadata-only de la divergence GitHub, de l'état RLS/policies des huit tables cœur et des familles Security/Performance Advisor. Commit : `fbb8edf46179dd007dcb0becdf8bb8acafb5ca0f` (`docs: snapshot GitHub and Supabase state at 23:17`).
- Vérification fraîche : snapshot relu depuis la branche ; `v150B-2B checks` #420, `RailOps lifecycle regression` #293 et `RailOps modules regression` #62 sont tous `success`, ainsi que Vercel sur le commit du snapshot. Les lectures Supabase de cette passe étaient strictement en lecture seule ; aucune nouvelle famille d'alerte n'a été observée.
- Diagnostic CI de journalisation : `v150B-2B checks` #422 a détecté que le fragment `docs/worklog-railops-append/2026-08-24-2317.md` n'avait pas encore été recopié dans le journal primaire ; `RailOps lifecycle regression` #294, `RailOps modules regression` #63 et Vercel sont restés verts. Cause isolée : contrat `v150b2b-worklog-contract.test.js`, sans régression applicative.
- État avant correction du journal primaire : branche toujours divergente, **15 commits behind / 281 ahead** ; aucun merge/rebase ni changement de `main` effectué.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié.
- Points en attente historiques inchangés : synchronisation avec `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — diagnostic catalogue résiduel 00:17 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **15 commits behind / 282 ahead**. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; Security Advisor relu strictement en lecture seule, sans changement backend.
- Amélioration réversible de diagnostic : `v150b2b-diagnostics.js` signale désormais `SESSION_DATA_WITHOUT_ROLE` lorsqu'un catalogue de prix reste en mémoire alors qu'aucun rôle RailOps n'est actif. Le snapshot reste metadata-only et n'expose aucune référence ni prix.
- Cycle rouge/vert : `dc6a4a91d0f4b8e7793905be51888991f3be8f3d` ajoute le test qui reproduit la zone aveugle ; `345c5890a9ad7eea031b33703ca8b30eafcf70b2` applique la correction minimale. Reproduction locale rouge puis test ciblé et `node --check` verts.
- Vérification fraîche : GitHub Actions `v150B-2B checks` #428, `RailOps modules regression` #67 et `RailOps lifecycle regression` #298 sont tous `success` sur `345c5890a9ad7eea031b33703ca8b30eafcf70b2`.
- Garde-fous : aucun rôle, droit, règle métier, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact, sans merge/rebase.
- Points en attente historiques inchangés : synchronisation avec `main`, smoke-tests humains et toute correction sécurité restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — relevé GitHub / Supabase 01:20 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **16 commits behind / 286 ahead**. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-25-0120.md`, photographie metadata-only de la divergence GitHub, de l'état RLS/policies des huit tables cœur, des migrations observées et des familles Security/Performance Advisor. Commit : `1cb1dc305e689d0fcdd67f9c32b48cd483ce72ed` (`docs: snapshot GitHub and Supabase state at 01:20`).
- Vérification fraîche : snapshot relu depuis la branche ; Vercel était `success` sur le head de départ. Toutes les lectures Supabase de cette passe étaient strictement en lecture seule ; aucune nouvelle famille d'alerte n'a été observée.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec les 16 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — relevé GitHub / Supabase 02:28 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **16 commits behind / 290 ahead**. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-25-0228.md`, photographie metadata-only de la divergence GitHub, de l'état RLS/policies des huit tables cœur et des familles Security/Performance Advisor. Commit : `5435b35540ccf97b1164a4ad43a214559c88623e` (`docs: refresh GitHub Supabase state snapshot`).
- Vérification fraîche : snapshot relu depuis la branche ; `v150B-2B checks` #442, `RailOps lifecycle regression` #306 et `RailOps modules regression` #74 sont tous `success`, ainsi que Vercel sur le commit du snapshot. Toutes les lectures Supabase de cette passe étaient strictement en lecture seule ; aucune nouvelle famille d'alerte n'a été observée.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec les 16 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — relevé GitHub / Supabase 03:52 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **16 commits behind / 292 ahead**. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; Security/Performance Advisors et comptages RLS/policies relus strictement en lecture seule.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-25-0352.md`, photographie metadata-only de la divergence GitHub, de l'état RLS/policies et des familles Advisors. Commits : `2f0fce17c8263554596ce9122e87bdecb4aca836` (snapshot) puis `b30cacb44fbe683714c628e063fff656e90dfe63` (alignement du format avec le contrat de vérification existant).
- Diagnostic CI : le premier snapshot a fait échouer uniquement `v150B-2B checks` #446 parce que les lignes de policies avaient changé de forme (`RLS activé, N policy`) alors que le contrat historique attend `- table : N ;`. Les régressions modules #76 et lifecycle #308 étaient déjà vertes ; cause isolée au format documentaire, sans régression applicative.
- Vérification fraîche après correction : `v150B-2B checks` #448, `RailOps lifecycle regression` #309 et `RailOps modules regression` #77 sont tous `success`; Vercel est également `success` sur `b30cacb44fbe683714c628e063fff656e90dfe63`.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec les 16 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — diagnostic scans en attente 05:15 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` à `0ac1ad936137d926312c9029106f774e44556e7c`, PR #1 toujours en brouillon et non fusionnée ; comparaison fraîche avec `main` = **16 commits behind / 296 ahead**. Supabase `railops` vérifié `ACTIVE_HEALTHY`; Security Advisor relu strictement en lecture seule.
- Amélioration réversible de diagnostic : `v150b2b-diagnostics.js` expose désormais uniquement le **nombre** `pendingScans` de scans marqués `_pending`, sans ID, QR, observation, position ni autre contenu métier. Cela facilite le diagnostic des opérations encore en attente sans modifier la synchronisation ni les données.
- Cycle test/correction : `477c0ea3ecd69684fa887f6bde9a9680f3a1d493` ajoute la couverture fonctionnelle ; `c844b180f130bcbe693d2ba56cded51fba071513` ajoute le compteur. La première CI v150B-2B a révélé que le contrat de confidentialité devait accepter ce nouveau agrégat ; cause isolée puis correction minimale dans `1ba453f1959f349f4597d0829ca2c67ac00295f5`.
- Vérification fraîche : test ciblé et `node --check` passent localement ; GitHub Actions `v150B-2B checks` #458, `RailOps lifecycle regression` #314 et `RailOps modules regression` #82 sont tous `success` sur `1ba453f1959f349f4597d0829ca2c67ac00295f5`.
- Garde-fous : aucun droit, rôle, règle métier, flux de synchronisation, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — documentation du compteur de scans en attente 06:26 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` à `5e44496108089e6196464bdd633ceb3e2fecc370`, PR #1 ouverte, en brouillon et non fusionnée ; comparaison fraîche avec `main` = **16 commits behind / 301 ahead**. Supabase `railops` vérifié en lecture seule : RLS actif sur les huit tables cœur suivies ; comptages observés inchangés (`agents` 0 policy, `chantiers` 4, `deleted_ids` 1, `inspections` 0, `materiels` 4, `prix_catalogue` 1, `scans` 4, `users` 2).
- Amélioration documentaire réversible : `docs/v150b2b-diagnostics-guide.md` décrit désormais explicitement le champ `counts.pendingScans`, l'ajoute à l'exemple de snapshot et précise qu'il s'agit uniquement du nombre de scans locaux marqués `_pending === true`, sans ID ni contenu métier. Commit : `b227445a5066d273a650affde50304e607035a2b` (`docs: document pending scan diagnostic count`).
- Vérification fraîche : le guide a été relu depuis la branche ; GitHub Actions `v150B-2B checks` #464, `RailOps lifecycle regression` #317 et `RailOps modules regression` #85 sont tous `success` sur `b227445a5066d273a650affde50304e607035a2b`; Vercel est également `success`.
- Garde-fous : aucune donnée, migration, policy, permission, fonction Supabase, règle métier, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifiée ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec les 16 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — relevé GitHub / Supabase 07:13 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **16 commits behind / 303 ahead**. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; RLS/policies et Security/Performance Advisors ont été relus strictement en lecture seule.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-25-0713.md`, photographie metadata-only de la divergence GitHub, de l'état RLS/policies des huit tables cœur et des familles Advisors. Commit : `6016b72a0b03785e85120a3f3e9ca1830067c89b` (`docs: snapshot GitHub and Supabase state 2026-08-25 0713`).
- Vérification fraîche : snapshot relu depuis la branche ; GitHub Actions `v150B-2B checks` #468, `RailOps lifecycle regression` #319 et `RailOps modules regression` #87 sont tous `success`; Vercel est également `success` sur le commit du snapshot.
- Garde-fous : aucune donnée, migration, policy, permission, fonction Supabase, règle métier, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifiée ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec les 16 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — triage sûr des logs Supabase 08:17 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **16 commits behind / 306 ahead** au début de la passe. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; RLS/policies et Security/Performance Advisors ont été relus strictement en lecture seule.
- Amélioration réversible : `docs/v150b2b-diagnostics-guide.md` documente désormais une méthode de triage des logs Supabase fondée sur la fenêtre de 24 h, l'horodatage de la dernière occurrence, la distinction historique/récente et l'interdiction de déduire un changement de policy/permission/RLS des logs seuls. Le garde-fou associé est `tests/v150b2b-diagnostics-log-guide.test.js`.
- Cycle rouge/vert vérifié localement : le test a d'abord échoué sur l'absence de section, puis passe après la documentation ; une assertion trop rigide a été remplacée par un contrôle sémantique. Commits : `cfcf7aacefc4fc7ac70fb7a8f59257173505b0e5` (test rouge), `37d1f7672df0af89b8a1aaabbf50aa454f682e67` (documentation) et `575b04b20dfd9d64cef89d698165549b426a721f` (garde-fou sémantique).
- Vérification fraîche sur `575b04b20dfd9d64cef89d698165549b426a721f` : `v150B-2B checks` #478, `RailOps modules regression` #92 et `RailOps lifecycle regression` #324 sont `success`; Vercel est également `success`. Le relevé metadata-only `docs/supabase-state/2026-08-25-0817.md` a ensuite été ajouté via `baa4fa6cd8dad7d6b4875d1cfc5d8c4cf9ab0e2e`.
- Diagnostic logs : les refus RLS `materiels` visibles dans la fenêtre consultée sont historiques ; la dernière occurrence correspondante retournée est `2026-08-24T23:02:28.854Z` et aucune occurrence plus récente du même message n'a été observée. Aucune cause n'est attribuée et aucune correction backend n'est appliquée.
- Garde-fous : aucune donnée, migration, policy, permission, fonction Supabase, règle métier, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifiée ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec les 16 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — diagnostics groupés du runner 09:13 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **16 commits behind / 312 ahead**. Supabase `railops` est `ACTIVE_HEALTHY`; Security Advisor relu strictement en lecture seule.
- Amélioration réversible limitée aux tests/diagnostics : `tests/run-v150b2b-checks.js` regroupe désormais les causes d’échec (`timeout`, codes de sortie, erreurs de lancement) et les affiche dans la sortie console ainsi que dans le GitHub Step Summary. Le contrat est verrouillé par `tests/v150b2b-runner-coverage.test.js`.
- Commits : `a10a6f2793dd68c1f15918eff90903e1bc6cd55c` (contrat) et `295c3f05a6ff88d63afa02f13936800f40a2ea67` (implémentation).
- Vérification fraîche : `RailOps lifecycle regression` run #329 est `success` sur `295c3f05a6ff88d63afa02f13936800f40a2ea67`; Vercel est également `success`.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n’a été modifié ; `main` reste intact et aucun merge/rebase n’a été tenté.
- Points en attente historiques inchangés : synchronisation avec les 16 commits de `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n’a été introduit.

## 2026-08-25 — snapshot et robustesse du diagnostic de dérive 13:17 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte, en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; `main` observé à `20f7e028ac5e3d0ac401d41ec3561af09e252694`; comparaison fraîche = **17 commits behind / 329 ahead**. Supabase a été relu strictement en lecture seule : les huit tables cœur ont RLS activé avec les comptages de policies `agents` 0, `chantiers` 4, `deleted_ids` 1, `inspections` 0, `materiels` 4, `prix_catalogue` 1, `scans` 4 et `users` 2; Security/Performance Advisors inchangés dans leurs familles connues.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-25-1317.md` via `c4909b9362a963c9915c2ab62bfdbd7040a108c8`, puis alignement au contrat de snapshot via `a54393fbdadd72a3311484554afa52bdf1907d52` après détection CI de la section RLS/policies manquante.
- Diagnostic CI : le run du premier snapshot a aussi révélé un exit 141 dans le diagnostic de dérive, causé par `head` sous `bash -o pipefail` lorsque la sortie `main` est longue. Le garde-fou `tests/v150b2b-ci-branch-drift.test.js` a été durci dans `0e86805141e75bb4817a0e31c4a215e6e6e711c8`, puis `.github/workflows/v150b2b-checks.yml` utilise désormais `sed -n` pour borner les listes sans SIGPIPE via `6fdb649960fa42349c7758902fe83a1f79419c87`.
- Vérification fraîche : `v150B-2B checks` run #517 est `success`; le step `Report branch drift (non-blocking)` et la suite v150B-2B sont tous deux `success`. Aucun code runtime RailOps n'a été modifié.
- Garde-fous : aucune donnée, migration, policy, permission, fonction, index ou schéma Supabase n'a été modifié ; aucun changement de règle métier, Import, logique Multi-chantier ou purge hebdomadaire ; aucun merge/rebase ni changement volontaire de `main`.
- Points en attente historiques inchangés : synchronisation de la branche avec `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — diagnostic de dérive depuis l’ancêtre commun 14:20 Europe/Paris

- État contrôlé avant modification : PR #1 ouverte, en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **17 commits behind / 335 ahead** avant cette passe. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; Security Advisor relu strictement en lecture seule, sans correction backend.
- Amélioration réversible limitée aux tests/diagnostics : le diagnostic CI des fichiers présents côté `main` utilise désormais l’ancêtre commun (`merge-base`) comme origine du diff, afin de ne pas masquer un fichier touché sur `main` lorsqu’il a aussi divergé sur la branche. Le SHA complet de l’ancêtre commun est conservé pour les calculs et une version courte uniquement pour l’affichage.
- Commits : `a3bbada79dbad3bbbf9f57801fe13db9706337e6` (`tests: require merge-base scoped drift diagnostics`) et `7c54755bffef0c7480183df6988adc443eef68cc` (`ci: scope main drift files from merge base`).
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #520 est `success`; le step `Report branch drift (non-blocking)` et la suite agrégée sont tous deux `success`.
- Garde-fous : aucun code runtime RailOps, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n’a été modifié ; `main` reste intact et aucun merge/rebase n’a été tenté.
- Points en attente historiques inchangés : synchronisation avec `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n’a été introduit.

## 2026-08-25 — lecture guidée du diagnostic de dérive CI 15:17 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; comparaison fraîche avec `main` = **17 commits behind / 342 ahead** après les changements de cette passe. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; Security Advisor relu en lecture seule, sans correction backend.
- Amélioration réversible limitée aux tests/documentation : le guide de vérification explique désormais comment lire le Step Summary `Report branch drift (non-blocking)`, pourquoi le diff part du `merge-base`, et comment interpréter les catégories `app`, `tests`, `backend`, `docs` et `other` sans en déduire une autorisation de merge/rebase.
- Cycle TDD vérifié : `0c7daba89fa0dd401cebac2a1af998197c24650b` a ajouté le contrat documentaire et le workflow `v150B-2B checks` #523 a échoué comme attendu ; `521a96dff5f9f261efe15d5093e228446a360d7d` a ajouté la documentation et le run #524 est `success`.
- Garde-fous : aucun code runtime RailOps, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact et aucun merge/rebase n'a été tenté.
- Points en attente historiques inchangés : synchronisation avec `main`, smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-25 — snapshot de sécurité 21:23 Europe/Paris

- État contrôlé avant changement : PR #1 ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; `main` observé à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`; comparaison fraîche = **1 commit behind / 355 ahead**, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`. Aucun merge, rebase ou cherry-pick n'a été tenté.
- Supabase relu strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.084 ; RLS activé sur les huit tables cœur avec comptages de policies `agents` 0, `chantiers` 4, `deleted_ids` 1, `inspections` 0, `materiels` 4, `prix_catalogue` 1, `scans` 4 et `users` 2. Les familles Security/Performance Advisor restent celles déjà connues.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-25-2123.md`. Commits : `c6d3d4043a81fc043e02bdd5a0ea92abe15b7269` (snapshot initial), `38b99fe6c9a268fa36a0592e03e34791c86158ac` puis `ae2127510e3b5d07e741d88a84a828cc6dee8f6a` pour aligner le format sur le contrat historique.
- Diagnostic CI : les deux premières exécutions ont détecté uniquement des écarts de forme documentaire ; aucune régression runtime n'a été diagnostiquée. Vérification fraîche sur `ae2127510e3b5d07e741d88a84a828cc6dee8f6a` : GitHub Actions `v150B-2B checks` run #544 est `success`, y compris `Report branch drift (non-blocking)` et la suite agrégée.
- Garde-fous : aucun code applicatif, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact.
- Point en attente inchangé : le commit de rafraîchissement de déploiement présent uniquement sur `main` reste volontairement non copié ; smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite. Aucun nouveau choix produit n'a été introduit.

## 2026-08-26 — contexte événement/run des contrôles CI 00:19 Europe/Paris

- État contrôlé avant modification : PR #1 toujours ouverte en brouillon et non fusionnée sur `security/v150b2b-rls-ready`; `main` observé à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`. Supabase `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; Security Advisor relu strictement en lecture seule, sans correction backend.
- Amélioration réversible limitée aux tests/diagnostics : ajout de `tests/v150b2b-ci-context.test.js`; `tests/run-v150b2b-checks.js` affiche désormais aussi `GITHUB_EVENT_NAME` et `GITHUB_RUN_ID` dans le contexte console et le GitHub Step Summary, afin de rattacher immédiatement un diagnostic à son type d'événement et à son run.
- Cycle TDD vérifié : `51cebbfd1d5f4e075e0d9be0a95225daafbc8c43` (`tests: require CI event and run diagnostics`) a fait échouer `v150B-2B checks` run #559 comme attendu ; `765cf8afd831cd0d8ac09dcc496570afe893a747` (`tests: enrich v150B2B CI run context`) rend le job `checks` du run #560 `success`.
- État après changement : comparaison fraîche avec `main` = **1 commit behind / 366 ahead**, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`. Aucun merge, rebase ou cherry-pick n'a été tenté.
- Garde-fous : aucun code runtime RailOps, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact.
- Point en attente inchangé : le commit de rafraîchissement de déploiement présent uniquement sur `main` reste volontairement non copié ; smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite. Aucun nouveau choix produit n'a été introduit.

## 2026-08-26 — garde-fou adaptateur Chef de chantier 02:16 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` à `319300bb35c88c1f1f900ff82dcc2f6cf562949f`; `main` n’a pas été modifié. Supabase `railops` est `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; Security Advisor relu strictement en lecture seule, sans correction backend.
- Amélioration réversible limitée aux tests : `tests/v150b2b-static-invariants.test.js` verrouille désormais que `v150b2b-chef-chantier-stats.js` reste un adaptateur d’affichage pur, sans appel direct `db.*` à Supabase et sans primitive de mutation `insert/update/upsert/delete`.
- Commit : `55be4ec31f5b02b699b7264ac490ae4e830cb115` (`tests: keep Chef chantier stats adapter read-only`).
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #568 est terminé avec conclusion `success` sur ce commit. Aucune écriture Supabase, migration, policy, permission, donnée ou RLS n’a été appliquée.
- Garde-fous : aucun code runtime RailOps, règle métier, Import, logique Multi-chantier ou purge hebdomadaire n’a été modifié ; aucun merge/rebase/cherry-pick n’a été tenté et `main` reste intact.
- Points en attente inchangés : smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n’a été introduit.

## 2026-08-26 — snapshot GitHub / Supabase 03:18 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` à `88107545796c92da61b6a7f4847af012082d7cb2`; `main` observé à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`; comparaison fraîche = **1 commit behind / 371 ahead**, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`. Aucun merge, rebase ou cherry-pick n'a été tenté.
- Supabase relu strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.084 ; RLS activé sur les huit tables cœur avec comptages de policies `agents` 0, `chantiers` 4, `deleted_ids` 1, `inspections` 0, `materiels` 4, `prix_catalogue` 1, `scans` 4 et `users` 2. Security Advisor : mêmes familles connues ; Performance Advisor : deux clés étrangères non indexées sur `public.inspections`.
- Amélioration documentaire réversible : ajout de `docs/supabase-state/2026-08-26-0318.md` via `405593bb3b52ee60019f6534f32f18a98b13b598` (`docs: snapshot RailOps state at 03:18`).
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #573 est terminé avec conclusion `success` sur le commit du snapshot.
- Garde-fous : aucun code runtime RailOps, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact.
- Points en attente inchangés : le commit de rafraîchissement de déploiement présent uniquement sur `main`, les smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-26 — snapshot GitHub / Supabase 04:14 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` observée à `ce01f47575b3e45fffb9fea2a33b178f390cc2e0`; `main` à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`; comparaison fraîche = **1 commit behind / 373 ahead**, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`. Aucun merge, rebase ou cherry-pick n'a été tenté.
- Supabase relu strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.084 ; RLS/policies des huit tables cœur inchangés (`agents` 0, `chantiers` 4, `deleted_ids` 1, `inspections` 0, `materiels` 4, `prix_catalogue` 1, `scans` 4, `users` 2). Advisors : familles connues inchangées.
- Amélioration documentaire réversible : ajout puis alignement de `docs/supabase-state/2026-08-26-0414.md`; commits `193ae36568c62d969f722ba7f78158ee8741c3ba` et `0490622516daa8311df733e461eb9776ced785cc`.
- Vérification fraîche : workflows de régression observés verts sur le head final, sans modification runtime/backend.
- Garde-fous : aucun code runtime, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; `main` reste intact.
- Points en attente inchangés : le commit de rafraîchissement de déploiement présent uniquement sur `main`, les smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite.

## 2026-08-26 — snapshot GitHub / Supabase 05:14 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` à `0490622516daa8311df733e461eb9776ced785cc`; `main` observé à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`; comparaison fraîche = **1 commit behind / 375 ahead**, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`. Aucun merge, rebase ou cherry-pick n'a été tenté.
- Supabase relu strictement en lecture seule : `railops` `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.084 ; RLS/policies des huit tables cœur inchangés (`agents` 0, `chantiers` 4, `deleted_ids` 1, `inspections` 0, `materiels` 4, `prix_catalogue` 1, `scans` 4, `users` 2). Security/Performance Advisors : mêmes familles connues, dont deux clés étrangères non indexées sur `public.inspections`.
- Amélioration documentaire réversible : ajout et mise en conformité de `docs/supabase-state/2026-08-26-0514.md`; commits `1cb269605f5a6ea312afe6efc82d75e2392b3537`, `3e7934a83b5fdecdeecddd4571dc1d7ec20111e7` puis `47ef8828b39643837580bfe30e0267d671eaf39b`.
- Diagnostic CI : la première mise en conformité restait sensible à la casse sur le marqueur `aucun merge, rebase ou changement de main`; correction purement documentaire appliquée. Vérification fraîche : GitHub Actions `v150B-2B checks` run #584 est `success` sur `47ef8828b39643837580bfe30e0267d671eaf39b`.
- Garde-fous : aucune donnée, migration, policy, permission, fonction, index, schéma, code runtime, règle métier, Import, Multi-chantier ou purge hebdomadaire n'a été modifié ; RLS stricte non activée et `main` reste intact.
- Points en attente inchangés : le commit de rafraîchissement de déploiement présent uniquement sur `main`, les smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-26 — garde-fou confidentialité du journal 06:14 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` à `09116da48f4d1f5afca4de9b6dca07a87cfe9c14`; `main` observé à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`; Supabase `railops` `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084. Security Advisor relu strictement en lecture seule, sans correction backend.
- Amélioration réversible limitée aux tests : ajout de `tests/v150b2b-worklog-privacy.test.js`, qui vérifie `docs/worklog-railops.md` et les fragments Markdown de `docs/worklog-railops-append/` contre les JWT, clés Supabase secrètes/service-role et en-têtes Bearer accidentellement journalisés.
- Commit d'amélioration : `8f108be525f117b5b6bc27cc82c742dfc8ecc053` (`tests: guard RailOps worklogs against secret leaks`).
- Vérification fraîche : GitHub Actions `v150B-2B checks` run #588 est terminé avec conclusion `success` sur ce commit. Comparaison fraîche avant journalisation : **1 commit behind / 380 ahead**, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Garde-fous : aucun code runtime RailOps, règle métier, permission, migration, donnée Supabase, RLS, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; aucun merge/rebase/cherry-pick ni changement de `main` n'a été tenté.
- Points en attente inchangés : le commit de rafraîchissement de déploiement présent uniquement sur `main`, les smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.

## 2026-08-26 — snapshot GitHub / Supabase 08:13 Europe/Paris

- État contrôlé avant modification : branche `security/v150b2b-rls-ready` à `502335f2bc68e457580055605413c8458bf24793`; `main` observé à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`; comparaison initiale = **1 commit behind / 384 ahead**, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`. Aucun merge, rebase ou cherry-pick n'a été tenté.
- Supabase relu strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.084 ; RLS activé sur les huit tables cœur avec comptages de policies `agents` 0, `chantiers` 4, `deleted_ids` 1, `inspections` 0, `materiels` 4, `prix_catalogue` 1, `scans` 4 et `users` 2. Security/Performance Advisors : mêmes familles connues, dont deux clés étrangères non indexées sur `public.inspections`.
- Amélioration documentaire réversible : ajout et mise en conformité de `docs/supabase-state/2026-08-26-0813.md`; commits `f2e1f6864183e70db4832530956de54f1974b3ae`, `5089a2e53c753618c8cd3cd116636a7ae26d119d`, `37bbcf92360137a5e6492e9799185efac89f754f` et `dc7d71740ebcb578166f9e8f309cfbd2b36c133c`.
- Diagnostic CI : les premières exécutions ont détecté uniquement des écarts de forme documentaire (marqueur exact, ponctuation et format pluriel de divergence), sans régression runtime. Vérification fraîche : GitHub Actions `v150B-2B checks` run #605 est `success` sur `dc7d71740ebcb578166f9e8f309cfbd2b36c133c`.
- Garde-fous : aucune donnée, migration, policy, permission, fonction, index, schéma, code runtime, règle métier, Import, logique Multi-chantier ou purge hebdomadaire n'a été modifié ; RLS stricte non activée et `main` reste intact.
- Points en attente inchangés : le commit de rafraîchissement de déploiement présent uniquement sur `main`, les smoke-tests humains et toute correction sécurité/performance restent soumis à validation explicite ; aucun nouveau choix produit n'a été introduit.