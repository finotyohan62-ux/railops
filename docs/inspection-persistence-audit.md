# Audit du flux de persistance des inspections

Date du relevé : 2026-08-29.
Branche auditée : `security/v150b2b-rls-ready`.

## Flux actuel confirmé

Le flux historique d'inspection s'appuie sur `S.scans` dans `js/legacy-core.js` :

1. l'état local initialise une collection `scans` ;
2. `save()` conserve cette collection dans la clé locale `ro3_s` ;
3. les enregistrements en attente sont envoyés vers la table Supabase `scans` par `upsert` avec `onConflict: 'id'` ;
4. `load()` recharge les scans distants puis fusionne les données par identifiant afin d'éviter les doublons locaux.

Ce contrat est couvert par `tests/v150b2b-inspection-persistence-contract.test.js`.

## Écart de champ diagnostiqué

Les objets d'inspection peuvent contenir le champ `fournisseur`, mais la requête de rechargement `scans` actuellement présente dans `load()` sélectionne :

`id,materielId,chantierId,agentNom,date,etatGeneral,proprete,fonctionnement,dommages,dommagesDesc,observations,actions,photo,lat,lng`

Le champ `fournisseur` n'est donc pas relu par cette requête. En conséquence, une inspection déjà persistée peut perdre cette information dans l'état local après un rechargement, même si la valeur existe côté stockage.

## Reproduction automatisée

Un test de caractérisation temporaire a ajouté `fournisseur` au contrat attendu. Sur le commit `d7f1d6a678e8cfd85ba4b3d42be5ecba5364b367`, la suite `v150B-2B checks` a échoué uniquement sur cette attente, tandis que 52 contrôles sur 53 passaient. Le test a ensuite été remis à son contrat historique dans `cfdd2270eb535c4ba2d027978ce64d121c002c50` afin de ne pas laisser la branche rouge.

## Correction minimale recommandée

La correction fonctionnelle minimale consiste à ajouter uniquement `fournisseur` à la liste de colonnes sélectionnées lors du rechargement de `scans`, puis à remettre le test de persistance en exigence stricte sur ce champ.

Cette correction ne nécessite ni modification de schéma, ni migration, ni changement de RLS, permission ou règle métier. Elle doit toutefois être réalisée par une édition fiable de `js/legacy-core.js` : ce fichier est actuellement minifié sur une très grande ligne, et une réécriture complète via l'éditeur de contenu GitHub disponible pendant cet audit serait disproportionnée par rapport au changement d'un seul champ.

Aucun monkey-patch du client Supabase n'est recommandé : ce serait plus indirect et plus risqué qu'une modification locale de la requête elle-même.

## Garde-fous

Cet audit n'a modifié ni Supabase, ni les données, ni les permissions, ni la RLS, ni les règles métier. Il ne touche pas aux comportements Import, Multi-chantier ou purge hebdomadaire.
