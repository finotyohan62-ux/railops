## 2026-09-01 — mise en production de l’inscription sécurisée

- Déploiement explicitement demandé par Yohan après validation du correctif sur `security/v150b2b-rls-ready`.
- Production portée de `main` `fd590aff348f52aade83f51e838f96457a14402c` au lot minimal : `a414c55c3963ffbd39beaa3ef96c6b7dbacaaa46` (adaptateur `js/core/secure-register.js`), `246c9aacbb743386ff3402f9b5a660fd659c01b2` (chargement depuis `js/core/sync.js`) puis `078e1390a4c1618b80efd4c79d4cc945c4b768c9` (garde-fou de régression).
- Comportement déployé : `doInscription` appelle `railops-register`, installe la session Supabase renvoyée et reprend le chargement RailOps ; aucun `insert/upsert` direct vers `public.users` n’est présent dans l’adaptateur.
- Vérification production : statut GitHub `Vercel` = `success` sur `078e1390a4c1618b80efd4c79d4cc945c4b768c9` (`Deployment has completed`) ; workflow `RailOps lifecycle regression` run `33517754213` = `success`.
- Le correctif identique avait déjà passé sur la branche sécurité les quatre workflows `v150B-2B checks`, `RailOps modules regression`, `RailOps lifecycle regression` et `Final RLS hotfix check` au commit `50fb469207eb6c9d17feb1f6c127971ae81b2665`.
- Garde-fous : aucune fusion de la PR sécurité, aucune activation de RLS stricte, aucune modification Supabase, donnée, schéma, permission, Import, Multi-chantier ou purge hebdomadaire.
- Validation utilisateur restante : refaire une inscription neuve avec Lahsini El Mahdi puis confirmer sa présence dans l’annuaire/affectation chantier. Aucun ancien profil de Lahsini n’a été migré ou réutilisé.
