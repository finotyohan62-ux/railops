# v150B-2B — checklist de changement sûr

Cette checklist s'applique uniquement à la branche `security/v150b2b-rls-ready`. Elle sert à éviter qu'une amélioration de confort, de documentation ou de diagnostic déborde vers le runtime ou la production.

## Avant tout changement

- Confirmer que la branche active est `security/v150b2b-rls-ready` et relever son SHA.
- Relever le SHA actuel de `main` sans le modifier.
- Relever le merge-base ainsi que les compteurs `behind/ahead` entre `main` et la branche afin de rendre toute dérive explicite avant la passe.
- Si `main` contient des commits absents de la branche, classer leurs fichiers par impact (`app/runtime`, `tests/CI`, `backend`, `docs`, `autre`) et ne jamais les intégrer automatiquement ; toute dérive runtime/backend reste un sujet de revue séparé.
- Relire l'état Supabase en lecture seule lorsque le sujet touche au backend, aux permissions ou aux diagnostics.
- Vérifier que le changement envisagé ne modifie ni règle métier, ni permission applicative, ni import, ni Multi-chantier, ni purge de vérification hebdomadaire.
- Refuser tout merge, rebase, cherry-pick, déploiement production, migration, activation de RLS forcée ou mutation de données dans ce flux.

## Changements autorisés sans validation produit

- Documentation et diagnostics.
- Tests de non-régression et garde-fous CI.
- Nettoyage inoffensif et réversible sans effet runtime.
- Polish d'affichage ou confort dont le comportement est évident et strictement local à la branche.

## Vérification minimale

- Exécuter ou attendre la suite `v150B-2B checks` sur le commit créé.
- Contrôler que les tests de régression concernés restent verts.
- Vérifier à nouveau que `main` n'a pas bougé du fait de la passe.
- En cas de doute sur l'impact produit, sécurité, données ou permissions, ne pas appliquer le changement et le laisser en point d'attention.

## Journalisation

Après une passe réussie, ajouter une entrée datée dans `docs/worklog-railops.md` avec : état contrôlé, changement effectué, vérifications, commit(s) et éventuel point en attente.
