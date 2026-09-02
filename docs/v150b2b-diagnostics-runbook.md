# RailOps v150B-2B — diagnostics non sensibles

Ce document décrit l’usage sûr de `v150b2b-diagnostics.js` sur la preview de la branche `security/v150b2b-rls-ready`.

## Objectif

Le module de diagnostic produit uniquement un instantané agrégé de l’état client. Il sert à repérer rapidement une incohérence de session ou de périmètre sans exporter le contenu métier.

L’instantané contient uniquement :

- la version de preview ;
- le rôle courant et l’état du mode Administration propriétaire ;
- la page courante et l’état en ligne/hors ligne ;
- des compteurs de chantiers, matériels, scans, scans en attente, utilisateurs et statistiques Chef de chantier ;
- des codes d’alerte techniques lorsque certains invariants de périmètre ne sont pas respectés.

Il ne doit jamais contenir les références matériel, noms de chantier, noms d’agents, badges, mots de passe, jetons de session, clés API ou contenu détaillé des scans.

## Lecture ponctuelle

Dans la console de la preview, après chargement complet de RailOps :

```js
RailOpsDiagnostics150B2B.createDiagnosticsSnapshot(S, {
  version: 'v150B-2B',
  online: navigator.onLine,
})
```

Le résultat peut être copié pour un diagnostic à condition de vérifier qu’il ne contient que les métadonnées agrégées décrites ci-dessus.

## Codes d’alerte actuels

- `CHEF_CHANTIER_MATERIAL_SCOPE_LEAK` : un Chef de chantier a des matériels détaillés dans `S.mat` alors que son écran doit rester agrégé.
- `CHEF_CHANTIER_SCAN_SCOPE_LEAK` : un Chef de chantier a des scans détaillés dans `S.scans`.
- `CHEF_CHANTIER_STATS_MISSING` : en ligne, des chantiers sont chargés mais les agrégats Chef de chantier sont absents.
- `CATALOGUE_SCOPE_LEAK` : un rôle hors Chef/Admin possède un catalogue prix chargé.
- `OWNER_ADMIN_MODE_ROLE_MISMATCH` : le mode Administration propriétaire est actif sans rôle `admin` effectif.
- `OWNER_ADMIN_MODE_WITHOUT_OWNER` : le mode Administration est actif sans statut propriétaire.
- `OWNER_ADMIN_ROLE_OUTSIDE_MODE` : le propriétaire a un rôle `admin` alors que le mode Administration n’est pas actif.
- `SESSION_PAGE_WITHOUT_ROLE` : une page authentifiée semble affichée sans rôle chargé.
- `SESSION_DATA_WITHOUT_ROLE` : des données restent chargées alors qu’aucun rôle n’est présent.

## Garde-fous

- Le diagnostic est en lecture seule : il ne doit appeler aucun RPC d’écriture ni modifier `S`, Supabase ou le stockage local.
- Une alerte est un signal de vérification, pas une autorisation de modifier les permissions, RLS ou règles métier.
- Les anomalies de sécurité ou de périmètre doivent être reproduites et validées avant toute correction serveur.
- Aucun diagnostic ne justifie d’activer la RLS stricte, de modifier les imports, le Multi-chantier ou la purge hebdomadaire sans validation explicite.

Le test `tests/v150b2b-diagnostics.test.js` protège le caractère « métadonnées uniquement » du snapshot et vérifie l’absence de secrets dans la sortie.
