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

## Contrat de colonnes vérifié côté Supabase

Une lecture non destructive de `information_schema.columns` sur le projet Supabase RailOps actif confirme que la table `public.scans` expose actuellement les colonnes suivantes :

`id,materielId,chantierId,agentNom,date,etatGeneral,proprete,fonctionnement,dommages,dommagesDesc,observations,actions,photo,lat,lng`

Cette liste correspond à la requête de rechargement `scans` actuellement présente dans `load()`.

Le champ `fournisseur`, évoqué dans une première version de cet audit, **n'existe pas dans le schéma actuel de `public.scans`**. L'ajouter uniquement à la requête `select` serait donc incorrect et pourrait provoquer une erreur de lecture Supabase. Aucune correction runtime n'est recommandée sur ce point.

Un contrôle complémentaire de `public.materiels` ne montre pas non plus de colonne `fournisseur` dans le schéma actuel. Toute réintroduction éventuelle de cette donnée relèverait donc d'un choix de modèle de données et nécessite une décision explicite avant modification.

## Reproduction automatisée historique

Un test de caractérisation temporaire avait ajouté `fournisseur` au contrat attendu. Sur le commit `d7f1d6a678e8cfd85ba4b3d42be5ecba5364b367`, la suite `v150B-2B checks` avait échoué uniquement sur cette attente, tandis que 52 contrôles sur 53 passaient. Le test avait ensuite été remis à son contrat historique dans `cfdd2270eb535c4ba2d027978ce64d121c002c50`.

La vérification directe du schéma Supabase explique désormais cet échec : l'attente temporaire ne correspondait pas au contrat serveur réel.

## Conclusion

Le chemin de rechargement des inspections est actuellement aligné avec les colonnes présentes dans `public.scans`. Le prochain travail utile sur ce flux peut donc rester centré sur les tests de non-régression de création, persistance et restitution des inspections, sans modification de schéma ni ajout de champ.

## Garde-fous

Cet audit n'a modifié ni Supabase, ni les données, ni les permissions, ni la RLS, ni les règles métier. Il ne touche pas aux comportements Import, Multi-chantier ou purge hebdomadaire.
