# RailOps v150B-2B — Smoke test avant RLS strictes

> La migration `20260821_v150b2b_strict_rls.sql` ne doit PAS être appliquée tant que cette checklist n'est pas validée.

## Contrôles automatiques déjà effectués

- [x] Couche lecture RPC installée sans suppression de policy.
- [x] Couche écriture RPC installée sans suppression de policy.
- [x] Agent : écriture état terrain autorisée, métadonnées/création matériel bloquées (test transactionnel rollbacké).
- [x] CTE : écriture état terrain autorisée, métadonnées/création matériel bloquées (test transactionnel rollbacké).
- [x] Chef de chantier : accès/écriture matériel bloqués (test transactionnel rollbacké).
- [x] Propriétaire Admin : accès global conservé (test transactionnel rollbacké).
- [x] Chef de chantier : RPC lecture renvoie 0 matériel/scan et statistiques d'arbre uniquement.
- [x] Suppressions serveur : tombstones nouveaux cloisonnés par `chantier_id`; anciens tombstones conservés.
- [x] Build locale complète : 18 scripts JavaScript, 0 erreur `node --check`.
- [x] Build locale complète : 0 occurrence insensible à la casse de `sferis`.

## Test 1 — Propriétaire Admin

- [ ] Connexion avec les identifiants habituels.
- [ ] Dashboard et tous les chantiers disponibles.
- [ ] Gestion comptes accessible.
- [ ] Modifier temporairement un rôle/badge de compte de test puis remettre sa valeur.
- [ ] Catalogue prix lisible et modifiable.
- [ ] Import registre possible.
- [ ] Suppression d'une référence de TEST crée une suppression persistante.
- [ ] Déconnexion / reconnexion OK.

## Test 2 — Chef non propriétaire

- [ ] Connexion et migration Auth automatique si nécessaire.
- [ ] Uniquement ses chantiers + sous-chantiers.
- [ ] Aucune référence d'un autre Chef dans le registre.
- [ ] Import sur son chantier OK.
- [ ] Multi-chantier affiche uniquement le nom de l'autre emplacement, jamais son registre/état/scans.
- [ ] Création/gestion de son chantier OK.

## Test 3 — Agent

- [ ] Uniquement chantier(s) affecté(s).
- [ ] Scan / vérification possible.
- [ ] Mise à jour présence/état/vérifications possible.
- [ ] Impossible de créer, déplacer ou supprimer une référence.
- [ ] File hors-ligne : créer une opération hors connexion, reconnecter, vérifier la synchronisation.

## Test 4 — CTE

- [ ] Uniquement chantier(s) affecté(s).
- [ ] Fonctions CTE / tournée accessibles.
- [ ] Enregistrement d'une tournée OK.
- [ ] Vérifications/scan dans le scope OK.
- [ ] Impossible de créer/déplacer/supprimer du matériel.

## Test 5 — Chef de chantier

- [ ] Voit les maîtres actifs et sous-chantiers statistiques.
- [ ] Voit l'avancement global des vérifications.
- [ ] Ne voit aucune référence matérielle.
- [ ] Ne voit aucun QR / détail / scan individuel.
- [ ] Aucun registre matériel accessible par navigation détournée.

## Non-régression métier obligatoire

- [ ] CDG reste à son nombre attendu après chargement/import test.
- [ ] Lison ne recrée aucune ligne-titre parasite.
- [ ] Une même référence sur deux chantiers reste deux occurrences indépendantes.
- [ ] Une référence identique deux fois dans le même chantier/sous-chantier reste interdite.
- [ ] Les chantiers archivés/terminés ne génèrent ni Multi ni statistiques opérationnelles.
- [ ] La purge hebdomadaire des états/historiques de vérification est inchangée.
- [ ] Le logo RailOps reste présent et aucun branding Sferis ne réapparaît.

## Après validation complète

1. Déployer la version compatible sur la cible Vercel/production.
2. Refaire les tests critiques en ligne.
3. Appliquer seulement ensuite `supabase/migrations/20260821_v150b2b_strict_rls.sql`.
4. Refaire immédiatement les 5 tests.
5. En cas de blocage : exécuter `supabase/rollback/20260821_v150b2b_strict_rls_rollback.sql`.
