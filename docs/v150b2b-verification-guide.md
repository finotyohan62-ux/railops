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

## Vérifier l'écart avec `main`

Avant un smoke-test humain ou toute conclusion sur la compatibilité de la branche, rafraîchir uniquement la référence distante puis mesurer l'écart, sans modifier la branche :

```bash
git fetch origin main
git rev-list --left-right --count origin/main...HEAD
```

Le premier nombre indique les commits présents sur `main` mais absents de la branche ; le second indique les commits propres à la branche. Si le premier nombre est supérieur à zéro, la branche est **behind** par rapport à `main`. Si les deux nombres sont supérieurs à zéro, les historiques sont **divergents**.

Dans ce cas, arrêter toute conclusion de compatibilité avec la version courante de `main`. Ne pas fusionner, merge ou rebase automatiquement la branche sans validation explicite : la synchronisation doit être décidée après examen des changements intervenus sur `main`.

### Triage en lecture seule lorsque la branche est behind

Pour préparer une décision sans toucher à l'historique Git, relever d'abord les commits absents de la branche et les fichiers modifiés sur `main` depuis l'ancêtre commun :

```bash
git log --oneline --no-decorate HEAD..origin/main
git diff --name-only "$(git merge-base origin/main HEAD)"..origin/main
```

Ce relevé sert uniquement à qualifier l'impact potentiel. Si les changements de `main` touchent le runtime applicatif, `supabase/`, l'import, le Multi-chantier, la purge hebdomadaire, les permissions ou les règles métier, ne pas tenter de résolution automatique : consigner le périmètre concerné et attendre une décision explicite. Si seuls des fichiers documentaires ou des tests indépendants sont concernés, la branche reste néanmoins divergente ; cela ne constitue pas une autorisation de merge/rebase.

### Cas d'un commit de rafraîchissement de déploiement

Un commit absent de la branche peut avoir été créé uniquement pour provoquer une nouvelle livraison ou une révalidation de cache. Le message de commit ne suffit jamais pour conclure qu'il est sans impact : inspecter le patch réel et les fichiers touchés avant de le classer.

Pour un écart limité à ce type de commit, consigner séparément :

- le SHA du commit `main` absent de la branche ;
- les fichiers réellement modifiés et le nombre de lignes changées ;
- si le patch modifie du comportement exécutable ou seulement un commentaire/marqueur de rafraîchissement ;
- le statut de la CI et, si pertinent, du déploiement correspondant.

Même lorsqu'un patch est purement documentaire dans un fichier runtime (par exemple un commentaire ajouté pour forcer une révalidation), **ne pas le recopier, cherry-pick, merge ou rebase automatiquement**. Le diagnostic sert seulement à distinguer une dérive fonctionnelle d'une dérive de livraison et à éviter de déclencher inutilement une décision produit ou sécurité.

### Lire le résumé de dérive CI

Sur les pushes de la branche, l'étape `Report branch drift (non-blocking)` ajoute au GitHub Step Summary un diagnostic de dérive purement informatif. Elle ne réalise aucun merge, rebase ni autre mutation Git.

Le diagnostic conserve le SHA de `main`, le SHA de la branche et le **merge-base** (ancêtre commun), puis mesure les fichiers touchés sur `main` depuis cet ancêtre commun. Cette origine évite de masquer un changement intervenu sur `main` simplement parce que le même fichier a aussi évolué sur la branche.

La ligne `Main-only impact` classe ces fichiers en cinq groupes :

- `app` : code applicatif et modules web ;
- `tests` : tests et workflow GitHub ;
- `backend` : fichiers sous `supabase/` ;
- `docs` : documentation ;
- `other` : fichiers qui ne rentrent pas dans les catégories précédentes.

Ces compteurs servent uniquement au triage. Une valeur `backend > 0` ou `app > 0` ne donne aucune autorisation de synchroniser automatiquement la branche ; elle indique seulement qu'une revue de compatibilité doit précéder tout smoke-test ou décision de merge/rebase.

## Vérifier la dérive de l'état Supabase

Avant un smoke-test ou une conclusion de compatibilité, relire l'état réel du projet Supabase **en lecture seule** : santé du projet, activation RLS sur les tables concernées et noms/portées des policies effectivement présentes. Cette vérification est un diagnostic ; elle ne doit appliquer aucune migration, policy, permission ou correction de données.

Comparer ce constat au dernier état documenté dans `docs/worklog-railops.md` et aux hypothèses de la branche. Si l'état Supabase a changé, diffère du baseline attendu ou dérive des hypothèses v150B-2B, **arrêter la conclusion de compatibilité** et documenter l'écart avant toute modification. Une suite locale ou CI verte ne prouve pas à elle seule que la preview reste compatible avec un backend qui a évolué indépendamment.

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
