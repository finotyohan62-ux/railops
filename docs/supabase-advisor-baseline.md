# RailOps — baseline Supabase Advisor

Dernier relevé : **2026-08-29 00:15 Europe/Paris**.

Ce document est un **instantané de diagnostic en lecture seule**. Il ne constitue pas une demande de migration et ne doit pas être utilisé pour appliquer automatiquement des changements de schéma, de permissions ou de RLS.

## État du projet

- Projet Supabase : `railops` (`tbmzmmamaiftbbbuelgd`).
- Statut observé : `ACTIVE_HEALTHY`.
- Région : `eu-north-1`.

## Alertes de sécurité observées

### RLS activée sans policy

Supabase signale `rls_enabled_no_policy` sur plusieurs tables, notamment :

- `public.agents`
- `public.inspections`
- `public.materiel`
- `public.railops_auth_throttle`
- `public.railops_legacy_credentials`

Ces alertes ne doivent **pas** déclencher de création de policy ou d’activation RLS stricte sans validation explicite, car elles peuvent correspondre à des tables internes, historiques ou à un état transitoire volontaire.

### Fonctions `SECURITY DEFINER` exécutables par `authenticated`

Supabase signale plusieurs fonctions exposées aux utilisateurs authentifiés, dont les RPC de scope et d’administration RailOps (`railops_*_scope`, `railops_session_context`, `railops_save_material_state`, etc.).

Le linter recommande potentiellement de révoquer `EXECUTE`, passer en `SECURITY INVOKER` ou déplacer ces fonctions hors du schéma exposé. **Aucune de ces actions n’est considérée comme faible risque** : elles peuvent modifier les permissions et casser les flux applicatifs. Elles nécessitent donc une revue dédiée avant toute modification.

### Protection contre les mots de passe compromis

Supabase signale `auth_leaked_password_protection` désactivé. L’activation change la politique d’authentification et doit rester une décision explicite.

## Règle pour les passages automatisés

Les passages de maintenance sur `security/v150b2b-rls-ready` peuvent :

- relire ces advisors ;
- vérifier qu’aucune nouvelle alerte inattendue n’apparaît ;
- compléter la documentation ou les tests statiques ;
- signaler une dérive notable.

Ils ne doivent pas, sans validation explicite :

- créer/supprimer des policies ;
- forcer la RLS ;
- modifier les grants ou `EXECUTE` ;
- changer `SECURITY DEFINER` / `SECURITY INVOKER` ;
- modifier la politique de mot de passe ;
- déployer une migration corrective issue de ces advisors.

## Références Supabase

- RLS activée sans policy : https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Fonction `SECURITY DEFINER` exécutable : https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Protection contre les mots de passe compromis : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
