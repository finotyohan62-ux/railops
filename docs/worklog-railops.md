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
- Commit : `b290092632fbffc2f24a3eaf9594bba87b9366b1` (`docs: audit v150B2B write scope before strict RLS`).
- Aucune correction serveur/RLS appliquée : ce point est volontairement arrêté avant changement de sécurité ou de règle d'accès et nécessite validation explicite.
