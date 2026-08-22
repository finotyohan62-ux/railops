# RailOps v150B-2B — audit du scope d'écriture

Date : 2026-08-21

Cet audit est documentaire. Aucune migration Supabase, policy RLS, donnée métier, règle de rôle, logique Import/Multi-chantier ou purge hebdomadaire n'a été modifiée pendant ce relevé.

## 1. Propriétaire : mode Chef vs privilège Admin

Le propriétaire reste enregistré avec le rôle métier `chef` et `is_admin=true`. Les lectures v150B-2B séparent maintenant correctement :

- mode Chef : RPC métier et périmètre Chef ;
- mode Administration : RPC globales explicites réservées au propriétaire.

La couche d'écriture plus ancienne, en revanche, considère encore `is_admin=true` comme une autorisation globale dans plusieurs RPC (`railops_can_access_chantier`, `railops_save_material_state`, `railops_upsert_scan`, `railops_save_tournees`, `railops_upsert_material_admin`, `railops_delete_material`, tombstones).

Ce comportement est cohérent avec le fait que le propriétaire possède réellement le privilège Admin. En revanche, il signifie que le mode Chef n'est pas une frontière d'autorisation serveur pour le propriétaire : c'est actuellement une frontière d'affichage/chargement client.

### Décision à figer avant RLS strictes

Deux modèles sont possibles :

1. **Mode Chef = confort d'interface uniquement** : le propriétaire reste techniquement autorisé globalement côté serveur, même quand l'interface est en mode Chef.
2. **Mode Chef = scope d'écriture serveur** : les écritures quotidiennes du propriétaire sont limitées à son périmètre Chef et seules des RPC Admin explicites peuvent écrire globalement.

Le deuxième modèle protège mieux contre une écriture globale accidentelle depuis un flux client Chef, mais demande une adaptation des RPC et des tests supplémentaires. Aucun choix n'est appliqué automatiquement dans cet audit.

## 2. Point bloquant concret : `railops_upsert_material_admin`

La fonction actuelle vérifie le **chantier cible** pour un Chef non propriétaire, puis exécute :

`insert ... on conflict(id) do update ... chantierId = excluded.chantierId ...`

Elle ne vérifie pas, avant le `ON CONFLICT`, si une ligne portant déjà ce `id` appartient à un autre périmètre Chef.

Comme la fonction est `SECURITY DEFINER`, la RLS ne constitue pas une seconde barrière à l'intérieur de cette RPC. Un Chef authentifié qui fournit volontairement ou accidentellement un `id` déjà existant hors de son scope pourrait donc provoquer la mise à jour/déplacement de cette ligne vers un chantier cible qu'il contrôle.

### Correction requise avant activation RLS stricte

Avant l'upsert :

- verrouiller/rechercher la ligne existante par `id` ;
- si elle existe, vérifier son chantier source ;
- pour un Chef non Admin, refuser avec `RAILOPS_OUT_OF_SCOPE` si la source n'est pas dans son scope ;
- vérifier également le chantier cible ;
- conserver le comportement actuel pour une création réellement nouvelle dans le scope autorisé ;
- tester en transaction rollbackée : création autorisée, mise à jour même scope autorisée, conflit hors scope refusé.

Cette correction ne doit pas être appliquée à l'aveugle : le registre utilise encore une clé primaire globale `materiels.id`, alors que la règle métier autorise la même référence logique sur plusieurs chantiers. Il faut préserver la convention d'identifiants actuelle (`__MC__`/référence métier) et les non-régressions Import/Multi.

## 3. `saveChantier` et RLS stricte

Le client v150B-2B conserve encore un chemin d'écriture direct pour la sauvegarde d'un chantier. La migration RLS stricte préparée conserve donc des grants directs sur `chantiers`, `materiels`, `scans`, `deleted_ids` et `prix_catalogue` avec des policies métier.

Avant fermeture RLS, il faut décider si :

- ce chemin direct Chef reste volontairement supporté et testé ; ou
- la sauvegarde chantier est déplacée vers une RPC contrôlée, ce qui permettrait de réduire davantage les grants directs.

Aucune modification n'est faite dans cet audit.

## 4. Migration RLS stricte : statut

`20260821_v150b2b_strict_rls.sql` utilise encore `railops_policy_is_admin()` comme bypass global et s'appuie sur `railops_can_access_chantier()` pour les scopes directs.

Conclusion : la migration reste **préparée mais NON applicable en l'état du processus de validation**. Elle ne doit être exécutée qu'après :

1. correction/test du conflit d'upsert hors scope ;
2. décision sur la portée serveur du mode Chef propriétaire ;
3. décision/test du chemin `saveChantier` ;
4. smoke-tests des cinq contextes ;
5. validation preview puis production compatible.

## Garde-fous maintenus

- `main` reste intact ;
- aucune RLS stricte activée ;
- aucune donnée Supabase modifiée ;
- aucune règle Import/Multi changée ;
- aucune purge hebdomadaire changée ;
- aucun changement de rôle propriétaire (`chef` + `is_admin=true`).
