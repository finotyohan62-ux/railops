# RailOps v150B-2B — guide de vérification

Ce document décrit uniquement la vérification de la branche `security/v150b2b-rls-ready`. Il ne modifie aucune règle métier, donnée, permission ou migration.

## Vérification locale

Depuis la racine du dépôt :

```bash
node tests/run-v150b2b-checks.js
```

Le lanceur découvre automatiquement :

- tous les fichiers `tests/v150b2b-*.test.js` ;
- tous les modules JavaScript `v150b2b-*.js` réellement injectés par `v150b2b-test.html`.

Il exécute d'abord chaque test Node, puis `node --check` sur chaque module de la preview. Une sortie finale `PASS: all v150B-2B local checks completed (...)` confirme que l'ensemble du lanceur s'est terminé sans erreur.

## Vérification GitHub Actions

Le workflow `.github/workflows/v150b2b-checks.yml` s'exécute :

- à chaque push sur `security/v150b2b-rls-ready` ;
- sur les pull requests visant `main`.

Le job doit terminer avec `success`. Les anciens runs de la même branche/PR sont annulés automatiquement quand un nouveau commit les rend obsolètes.

## Lire rapidement un échec

1. **Échec d'un fichier `tests/v150b2b-*.test.js`** : traiter d'abord le message d'assertion ; ne pas modifier plusieurs composants à la fois.
2. **Échec `node --check`** : corriger uniquement la syntaxe du module indiqué avant toute autre modification.
3. **Échec du contrat preview** : vérifier le build tag, l'ordre d'injection et la présence unique de chaque adaptateur dans `v150b2b-test.html`.
4. **Échec d'un invariant de sécurité statique** : arrêter la modification concernée et vérifier qu'elle ne réintroduit pas de lecture sensible, de contournement du cloisonnement ou de dépendance runtime à la migration RLS stricte.
5. **Échec CI sans échec local reproductible** : inspecter les étapes Checkout / Setup Node.js / suite v150B-2B avant de modifier du code applicatif.

## Garde-fous de cette branche

Une suite verte ne donne pas l'autorisation de :

- fusionner la PR ;
- activer la migration RLS stricte ;
- modifier des permissions ou règles de rôle ;
- changer Import, Multi-chantier ou la purge hebdomadaire des vérifications ;
- appliquer une migration ou une correction de données sans validation explicite.

Les smoke-tests humains Admin / Chef / Agent / CTE / Chef de chantier restent requis avant toute fermeture RLS.

## Traçabilité

Après chaque passe de travail réussie, ajouter une entrée datée dans `docs/worklog-railops.md` avec :

- l'état vérifié avant modification ;
- le changement effectué ;
- les commandes/checks ou statuts CI réellement vérifiés ;
- les commits concernés ;
- tout point restant soumis à validation humaine.
