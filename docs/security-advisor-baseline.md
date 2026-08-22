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
