# RailOps iPhone / Safari Layout V1 — Design

**Date:** 2026-08-23

## Contexte

Des agents utilisant RailOps sur iPhone signalent que l'application entière peut glisser horizontalement de gauche à droite. Une photo réelle montre aussi que la barre de navigation basse paraît mal calée sur iPhone autour de la zone du Home Indicator.

## Objectif

Corriger l'affichage iPhone/Safari sans modifier les règles métier, Supabase, la synchronisation offline ni la PR #6.

## Périmètre validé

- empêcher le débordement horizontal global de `html`, `body`, `#app` et `.screen` ;
- conserver le défilement horizontal uniquement dans les zones prévues comme `.chips` ;
- rendre les conteneurs flex/grid rétractables sur écrans étroits ;
- rendre la barre de navigation basse compatible avec `safe-area-inset-bottom` et garder chaque onglet centré ;
- repositionner le bouton flottant au-dessus de la barre basse et du Home Indicator ;
- utiliser `dvh` comme amélioration progressive pour les modales ;
- ajouter un padding bas de modal compatible safe-area ;
- passer les champs `.fi` à 16 px sur mobile afin d'éviter le zoom automatique Safari au focus ;
- conserver le comportement Android et desktop existant ;
- couvrir les invariants par un test Node exécuté en CI.

## Contraintes

- Aucun changement JavaScript métier.
- Aucun changement de structure de données.
- Aucun changement offline/Supabase.
- Pas de React ni de framework UI.
- Un seul push final de la tranche afin d'éviter les déploiements Vercel intermédiaires.
- Validation réelle finale sur iPhone nécessaire avant de considérer le bug iOS fermé.

## Approche CSS

Le conteneur racine ne combine plus `inset:0` et `width:100%`. Il est contraint par `left:0`, `right:0`, `min-width:0` et `max-width:100%`. Les écrans et principaux conteneurs flex/grid reçoivent des contraintes de rétrécissement. Les grilles deux colonnes utilisent `minmax(0,1fr)` afin qu'un contenu long ne pousse pas la largeur intrinsèque au-delà du viewport.

La barre basse conserve cinq onglets flexibles mais chacun possède `min-width:0` et une cible d'au moins 44 px. Son padding inférieur utilise `max(8px, env(safe-area-inset-bottom,0px))`. Le FAB utilise un offset intégrant `safe-area-inset-bottom`.

Les modales conservent `92vh` comme fallback puis `92dvh` pour Safari moderne, avec padding inférieur safe-area.

## Critères d'acceptation

1. L'application entière ne peut plus être déplacée horizontalement sur iPhone.
2. Les filtres `.chips` restent horizontalement scrollables.
3. Les cinq onglets de navigation restent dans la largeur et leurs labels ne passent pas à la ligne.
4. Le Home Indicator ne chevauche pas le contenu utile de la barre basse.
5. Le FAB reste au-dessus de la barre basse.
6. Une modale ne se prolonge pas sous la zone basse sans padding.
7. Les champs de formulaire ne déclenchent pas le zoom Safari lié aux polices < 16 px sur mobile.
8. Les tests de modularisation/lifecycle existants restent verts.
