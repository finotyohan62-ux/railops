# RailOps — système de design PDF commun

## Objectif
Unifier tous les documents PDF existants de RailOps sous une même identité visuelle, sans changer leur contenu métier, leur emplacement dans l'interface, leur visibilité par rôle ni leurs règles d'accès.

## Périmètre
Sont concernés tous les générateurs PDF existants détectés dans l'application : rapports de contrôle, inventaires, documents de suivi, étiquettes ou autres sorties PDF déjà présentes.

Ne sont pas concernés : exports CSV/XLSX, données Supabase, permissions, règles métier, import, Multi-chantier, purge hebdomadaire et RLS.

## Architecture retenue
Créer une couche de présentation PDF commune, réutilisable par les générateurs existants.

Cette couche fournit :
- en-tête RailOps homogène ;
- titre et sous-titre du document ;
- bloc contexte (chantier, période, agent ou autre métadonnée pertinente) ;
- palette, typographie, marges et espacements communs ;
- composants de tableaux et blocs de synthèse ;
- style d'alerte/anomalie ;
- pied de page et pagination ;
- règles d'impression A4 cohérentes.

Chaque générateur garde :
- son contenu métier actuel ;
- ses champs actuels ;
- ses filtres actuels ;
- son nom de fichier si possible ;
- son bouton et son emplacement ;
- sa visibilité et ses droits actuels.

## Stratégie d'intégration
1. Inventorier les générateurs PDF réellement actifs dans le runtime.
2. Extraire la charte visuelle déjà validée du nouveau rapport dans un module commun.
3. Raccorder les générateurs un par un à cette couche commune.
4. Ne remplacer que la présentation et le moteur de rendu nécessaire ; ne pas modifier la logique de sélection des données.
5. Conserver un comportement de repli sûr si un type de document ne peut pas encore utiliser le moteur commun sans risque.

## Compatibilité
La couche commune doit supporter le rendu HTML imprimable déjà utilisé pour le nouveau rapport et, lorsque nécessaire, rester compatible avec jsPDF / AutoTable déjà chargés par RailOps.

Aucun changement de schéma ou d'API serveur n'est requis.

## Sécurité et non-régression
- aucune écriture Supabase supplémentaire ;
- aucun changement RLS ;
- aucun élargissement de rôle ;
- aucun nouveau bouton métier ;
- aucun changement des règles de calcul ;
- échappement systématique des contenus utilisateur injectés dans les documents ;
- conservation des identifiants et données manquantes selon les comportements existants.

## Tests
Le travail suit TDD :
- test de contrat de la charte PDF commune ;
- test d'inventaire des générateurs raccordés ;
- test de conservation des contenus/identifiants ;
- test d'échappement HTML ;
- tests spécifiques par générateur lors de son raccordement ;
- suite CI complète avant toute déclaration de fin.

## Critère de réussite
Tous les documents PDF existants accessibles dans RailOps présentent la même identité visuelle validée, tout en conservant strictement leur contenu, leurs boutons, leur portée métier et leurs droits actuels.
