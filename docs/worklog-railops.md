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
