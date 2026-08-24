# RailOps — baseline Supabase Security Advisor

Date de relevé : 2026-08-21

Ce document capture l'état observé du Security Advisor Supabase avant toute activation des RLS strictes. Il est purement documentaire : aucune policy, permission, fonction, table ou donnée n'a été modifiée lors de ce relevé.

## État projet

- Projet Supabase : `railops`
- Statut observé : `ACTIVE_HEALTHY`
- PostgreSQL : 17.6.1

## Alertes actuellement visibles

### Erreurs

- `public.deleted_ids` : RLS désactivée.
- `public.prix_catalogue` : RLS désactivée.

Ces deux alertes sont cohérentes avec l'état transitoire actuel : la migration `20260821_v150b2b_strict_rls.sql` existe sur la branche mais ne doit pas être appliquée avant validation complète des smoke-tests.

### Avertissements

- `public.track_deleted_materiels` : `search_path` mutable.
- Plusieurs RPC `SECURITY DEFINER` sont exécutables par le rôle `authenticated` et sont signalées par le linter Supabase.
- Protection contre les mots de passe compromis désactivée dans Supabase Auth.

Les avertissements `SECURITY DEFINER` doivent être examinés fonction par fonction avant toute modification : certaines RPC sont volontairement exposées aux utilisateurs authentifiés et appliquent leur propre contrôle d'accès. Aucun changement automatique n'est effectué sur ces droits.

## Garde-fous

Avant toute correction d'une alerte de sécurité :

1. vérifier qu'elle ne change pas les règles métier ni le périmètre des rôles ;
2. conserver `main` intact tant que les tests des 5 profils ne sont pas validés ;
3. ne pas activer les RLS strictes automatiquement ;
4. tester Admin / Chef / Agent / CTE / Chef de chantier après toute modification de sécurité ;
5. préserver l'import, le Multi-chantier et la purge hebdomadaire ;
6. garder le rollback RLS disponible.

## Utilisation de ce baseline

Lors des prochains contrôles, comparer le Security Advisor à cette photographie. Une alerte nouvelle, disparue ou modifiée doit être expliquée dans le worklog avant toute action de sécurité.

## Relevé comparatif — 2026-08-22 04:13 Europe/Paris

Contrôle effectué en lecture seule. Le projet est toujours `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Aucune migration, policy, permission, fonction, table ou donnée n'a été modifiée pendant ce relevé.

Écarts observés par rapport au baseline du 21 août :

- les alertes précédentes « RLS désactivée » sur `public.deleted_ids` et `public.prix_catalogue` ne sont plus remontées dans le relevé courant ;
- le Security Advisor remonte désormais des informations `RLS Enabled No Policy` sur `public.agents`, `public.inspections`, `public.materiel`, `public.railops_auth_throttle` et `public.railops_legacy_credentials` ;
- les avertissements sur les fonctions `SECURITY DEFINER` exécutables par `authenticated` restent présents et couvrent notamment les RPC de périmètre, d'administration, de catalogue, de matériel, de scans, de session et de diagnostic ;
- la protection Supabase Auth contre les mots de passe compromis reste désactivée.

Ce relevé documente uniquement la dérive constatée de l'environnement. Il ne permet pas, à lui seul, d'attribuer ces écarts à une migration particulière ni de conclure que les RLS strictes préparées sur la branche ont été appliquées. Toute correction ou harmonisation de cet état reste soumise aux smoke-tests et à une validation explicite avant changement de sécurité.

## Relevé comparatif — 2026-08-22 20:12 Europe/Paris

Contrôle effectué exclusivement en lecture seule depuis l'état réel Supabase. Le projet `railops` est toujours `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Aucune migration, policy, permission, fonction, table ou donnée n'a été modifiée pendant ce relevé.

État RLS/policies observé dans le catalogue PostgreSQL :

- `public.users` : RLS activée, 2 policies ;
- `public.chantiers` : RLS activée, 4 policies ;
- `public.materiels` : RLS activée, 4 policies ;
- `public.scans` : RLS activée, 4 policies ;
- `public.deleted_ids` : RLS activée, 1 policy ;
- `public.prix_catalogue` : RLS activée, 1 policy ;
- `public.agents` : RLS activée, 0 policy ;
- `public.inspections` : RLS activée, 0 policy ;
- `public.materiel` : RLS activée, 0 policy ;
- `public.railops_auth_throttle` : RLS activée, 0 policy ;
- `public.railops_legacy_credentials` : RLS activée, 0 policy.

Le Security Advisor confirme toujours les cinq informations `RLS Enabled No Policy` sur `agents`, `inspections`, `materiel`, `railops_auth_throttle` et `railops_legacy_credentials`. Il continue aussi de signaler plusieurs RPC `SECURITY DEFINER` exécutables par `authenticated` et la protection contre les mots de passe compromis désactivée.

Point de diagnostic important : `public.materiel` et `public.materiels` existent simultanément et n'ont pas le même état de policies (`0` contre `4`). Cette observation est uniquement consignée pour éviter une confusion de nom de table lors des prochains audits ; aucune conclusion fonctionnelle ni correction automatique n'en est déduite.

Ce snapshot ne permet pas d'attribuer l'état actuel à une migration précise ni de considérer la migration préparée `20260821_v150b2b_strict_rls.sql` comme appliquée. Toute modification de sécurité, de droits ou de schéma reste explicitement hors périmètre sans validation utilisateur.

## Relevé comparatif — 2026-08-23 02:12 Europe/Paris

Contrôle effectué en lecture seule avant toute nouvelle intervention sur la branche. Le projet `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1. Aucun changement Supabase n'a été appliqué pendant ce relevé.

Le Security Advisor est stable sur les points déjà documentés :

- les cinq informations `RLS Enabled No Policy` restent présentes sur `public.agents`, `public.inspections`, `public.materiel`, `public.railops_auth_throttle` et `public.railops_legacy_credentials` ;
- les avertissements `SECURITY DEFINER` exécutables par `authenticated` restent présents sur les RPC RailOps exposées ;
- la protection Supabase Auth contre les mots de passe compromis reste désactivée ;
- aucune alerte « RLS désactivée » sur `public.deleted_ids` ou `public.prix_catalogue` n'est remontée par le relevé courant.

Le Performance Advisor signale par ailleurs deux clés étrangères non indexées sur `public.inspections` (`inspections_agent_id_fkey` et `inspections_materiel_id_fkey`). Ces informations sont consignées comme diagnostic uniquement : aucune création d'index ni modification de schéma n'est effectuée automatiquement.

Côté GitHub, `security/v150b2b-rls-ready` est observée divergente de `main` avec 141 commits d'avance et 12 commits de retard au moment du relevé. Cette dérive interdit toute assimilation automatique entre le code de la branche et l'état actuel de production ; aucun merge/rebase n'est tenté depuis ce flux.

Conclusion de ce relevé : aucun nouvel élément ne justifie une modification automatique de sécurité, de permissions ou de schéma. Les écarts restent à traiter uniquement après décision explicite et smoke-tests adaptés.

## Relevé comparatif — 2026-08-24 17:20 Europe/Paris

Contrôle effectué uniquement en lecture seule depuis l'état réel GitHub/Supabase. Le projet `railops` reste `ACTIVE_HEALTHY` sous PostgreSQL 17.6.1.084 ; aucune migration, policy, permission, fonction, donnée ou configuration Auth n'a été modifiée.

État RLS/policies observé sur les huit tables cœur suivies :

- `public.agents` : RLS activée, 0 policy ;
- `public.chantiers` : RLS activée, 4 policies ;
- `public.deleted_ids` : RLS activée, 1 policy ;
- `public.inspections` : RLS activée, 0 policy ;
- `public.materiels` : RLS activée, 4 policies ;
- `public.prix_catalogue` : RLS activée, 1 policy ;
- `public.scans` : RLS activée, 4 policies ;
- `public.users` : RLS activée, 2 policies.

Le Security Advisor ne présente pas de nouvelle famille d'alerte par rapport aux relevés récents : cinq informations `RLS Enabled No Policy` restent présentes sur `agents`, `inspections`, `materiel`, `railops_auth_throttle` et `railops_legacy_credentials`, les avertissements concernant les fonctions `SECURITY DEFINER` exécutables par `authenticated` restent présents, et la protection contre les mots de passe compromis reste désactivée.

Le Performance Advisor reste également stable : seules les deux clés étrangères non indexées déjà connues sur `public.inspections` sont signalées (`inspections_agent_id_fkey` et `inspections_materiel_id_fkey`). Aucun index n'est créé automatiquement.

Côté GitHub, la PR #1 est toujours ouverte, en brouillon et non fusionnée. La branche `security/v150b2b-rls-ready` est observée divergente de `main` à **262 commits d'avance / 14 commits de retard**, avec merge-base `4b50df53ee449c4c907bae6a215672be3a2597d9`. Les trois workflows associés au head observé (`RailOps modules regression`, `v150B-2B checks`, `RailOps lifecycle regression`) sont en succès, tout comme le statut Vercel.

Conclusion : aucun changement de sécurité, de schéma, de données ou de règle métier n'est justifié automatiquement par ce relevé. La divergence Git reste un point volontairement sans action : aucun merge/rebase n'est tenté depuis cette branche de maintenance.
