# RailOps v150B-2B — référence des alertes diagnostics

Ce document décrit les codes d’alerte émis par `v150b2b-diagnostics.js`. Il sert au support et au diagnostic uniquement : il ne définit aucune règle métier et n’autorise aucune action corrective automatique.

## Principes d’utilisation

- Une alerte est un **indice de diagnostic**, pas une preuve suffisante pour modifier des données, des permissions ou le schéma.
- Toujours confirmer l’état réel GitHub/Supabase avant toute correction.
- En cas de doute, conserver l’état tel quel et escalader plutôt que modifier la production.
- Les alertes liées au Chef de chantier dépendent du contexte de session et, pour certaines, de la connectivité connue.

## Codes

### `CHEF_CHANTIER_MATERIAL_SCOPE_LEAK`

Un profil `chef_chantier` expose au moins un matériel dans le snapshot local. Le rôle Chef de chantier ne devrait pas charger cette collection via la couche diagnostics prévue. Vérifier le chargement/scoping en lecture seule avant toute action.

### `CHEF_CHANTIER_SCAN_SCOPE_LEAK`

Un profil `chef_chantier` expose au moins un scan dans le snapshot local. Vérifier le chargement/scoping en lecture seule ; ne pas modifier les données pour faire disparaître l’alerte.

### `CHEF_CHANTIER_STATS_MISSING`

Le profil est `chef_chantier`, la connectivité est explicitement connue comme en ligne, au moins un chantier est chargé, mais aucune statistique Chef de chantier n’est présente. Cette alerte n’est volontairement pas émise lorsque l’état réseau est hors ligne ou indéterminé.

### `CATALOGUE_SCOPE_LEAK`

Un rôle autre que `chef` ou `admin` dispose d’éléments dans `prixCatalogue`. Vérifier la source du chargement et le scope de lecture avant toute correction.

### `OWNER_ADMIN_MODE_ROLE_MISMATCH`

Le mode propriétaire Admin est actif alors que le rôle effectif n’est pas `admin`. Contrôler la cohérence de l’état de session et du mode propriétaire.

### `OWNER_ADMIN_MODE_WITHOUT_OWNER`

Le mode propriétaire Admin est actif alors que la session n’est pas marquée comme propriétaire Admin. Ne pas corriger les permissions automatiquement ; vérifier d’abord le contexte d’authentification réel.

### `OWNER_ADMIN_ROLE_OUTSIDE_MODE`

La session est propriétaire Admin et le rôle effectif est `admin`, mais le marqueur de mode Admin n’est pas actif. Vérifier la transition de mode et le cycle de chargement de session.

### `SESSION_PAGE_WITHOUT_ROLE`

Aucun rôle n’est présent alors que la page courante n’est ni nulle ni `login`. Vérifier la restauration/fermeture de session sans modifier les données métier.

### `SESSION_DATA_WITHOUT_ROLE`

Aucun rôle n’est présent alors que le snapshot contient encore des collections ou un catalogue non vides. Vérifier le nettoyage d’état local et la restauration de session ; ne pas supprimer les données serveur pour traiter cette alerte.

## Limites

Le snapshot diagnostics ne contient volontairement que des rôles, drapeaux d’état, compteurs, informations de page/connectivité et codes d’alerte. Il n’a pas vocation à exposer des noms d’agents, identifiants métier, références matériel ou contenu détaillé de chantiers/scans.
