# RailOps — diagnostic métadonnées PWA

## Périmètre

Ce document est un garde-fou de maintenance en lecture seule. Il ne modifie ni le runtime, ni Supabase, ni les permissions, ni les règles métier.

## État observé le 2026-08-31

Le `<head>` de `index.html` contient actuellement deux occurrences de chacune des balises Apple suivantes :

- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`

La balise `mobile-web-app-capable` n'apparaît qu'une fois. Les doublons Apple portent les mêmes valeurs, donc ils ne créent pas de divergence fonctionnelle connue ; ils constituent surtout du bruit de maintenance.

## Nettoyage sûr proposé

Lors d'une future modification du runtime, ne conserver qu'une occurrence de chaque balise Apple, sans changer leurs valeurs ni l'ordre des autres métadonnées. Vérifier ensuite :

1. une seule occurrence de `apple-mobile-web-app-capable` ;
2. une seule occurrence de `apple-mobile-web-app-status-bar-style` ;
3. une seule occurrence de `mobile-web-app-capable` ;
4. aucune modification des scripts, imports, règles Multi-chantier, purge hebdomadaire, Auth ou permissions ;
5. la suite `v150B-2B checks` et les régressions RailOps au vert.

## Historique du diagnostic

Un test de caractérisation a volontairement échoué le 2026-08-31 sur le commit `8d52d35613beca639d514feb39fc4d8167685e9c`, confirmant les doublons. Le test a ensuite été retiré au commit `70cf0397fec6f58dcb31dfce8eb5a71c56fa714c` afin de ne pas laisser la branche en échec tant que le nettoyage runtime n'est pas appliqué.
