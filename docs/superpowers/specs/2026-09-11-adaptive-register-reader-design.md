# RailOps Adaptive Register Reader — Design

## Goal

Permettre à RailOps de lire plusieurs architectures réelles de registres Excel utilisées par différents chefs d’équipe sans imposer un modèle unique, tout en conservant les garanties du moteur v156 existant.

## Principles

1. Aucun changement de modèle Supabase ni de RPC n’est nécessaire.
2. Les registres déjà compatibles avec v156 doivent garder exactement le même comportement.
3. Toute source Excel comprise par le lecteur adaptatif est convertie vers un modèle interne unique avant import.
4. Une référence ne doit jamais être déplacée ou supprimée sur la base d’une déduction ambiguë.
5. Une référence peut légitimement exister sur plusieurs chantiers lorsque le fichier l’indique explicitement.
6. Les anciens lecteurs restent disponibles comme secours contrôlé lorsque le lecteur adaptatif ne peut pas conclure avec suffisamment de confiance.

## Canonical internal model

Chaque parseur produit :

```js
{
  format: 'structured-table' | 'inventory-site-sheets' | 'sheet-per-site' | 'block-per-site' | 'single-sheet',
  confidence: 0..1,
  groups: [
    {
      site: 'LISON',
      siteKey: 'LISON',
      items: [
        { id, reference, nom, cat, echeance }
      ]
    }
  ],
  warnings: [],
  conflicts: [],
  blockingConflicts: []
}
```

Le reste de RailOps ne doit pas dépendre de l’architecture originale du fichier.

## Supported format families

### A. Structured multi-site table

Un tableau contient une colonne Référence et une colonne Site/Chantier. Le comportement v156 existant reste prioritaire, notamment la gestion des cellules fusionnées et des références multi-chantier explicites.

### B. INVENTAIRE + site sheets

Un onglet INVENTAIRE fait autorité pour les affectations explicites. Les onglets site peuvent compléter les références absentes lorsqu’une seule affectation est cohérente. Les contradictions avec INVENTAIRE sont signalées mais n’écrasent jamais l’affectation explicite. Une référence absente d’INVENTAIRE présente sur plusieurs sites est bloquante.

### C. One sheet per site

Chaque onglet matériel représente un chantier/site. Le nom du site est déterminé d’abord à partir d’un titre explicite du type `SITE : VEMARS`, puis du nom de l’onglet. Les onglets de métadonnées (dashboard, audit, alertes, historique, etc.) sont ignorés.

### D. Multiple site blocks in one sheet

Un même onglet peut contenir plusieurs blocs successifs. Un bloc peut commencer par un marqueur explicite (`SITE : X`, `CHANTIER : X`, `ZONE : X`, etc.) ou par une ligne-titre simple placée juste avant un tableau de références. La déduction d’un titre simple n’est activée que si au moins deux tableaux répétés présentent ce motif dans le même onglet, afin de ne pas transformer un titre isolé en chantier.

Chaque bloc est converti en groupe séparé. Une référence répétée dans le même groupe est dédupliquée ; la même référence dans deux groupes distincts reste un multi-chantier légitime.

### E. Single-sheet / single-site register

Pour un fichier à un seul tableau sans colonne Site, RailOps conserve le flux d’import simple historique. Le lecteur adaptatif peut reconnaître le format, mais v156 ne lui invente pas de destination. Aucun comportement ne change pour les chantiers seuls.

## Detection strategy

Le lecteur inspecte les onglets, les en-têtes et les marqueurs puis retourne un format et un niveau de confiance.

Priorité de sécurité :

1. le parser structuré v156 existant reste prioritaire dans le flux réel ;
2. le lecteur adaptatif est utilisé seulement si le parser actuel n’a trouvé aucune destination structurée ;
3. dans le lecteur adaptatif : INVENTAIRE + onglets site, tableau structuré, blocs, un onglet par site, puis simple feuille ;
4. les formats à confiance insuffisante retombent sur le flux historique.

Cette stratégie évite qu’un fichier déjà bien compris soit reclassé par un parser plus permissif.

## Integration with v156

`register-import-v156.js` reste propriétaire des règles métier : normalisation, réconciliation, affichage, appel RPC et blocage avant écriture.

Le nouveau module `register-adaptive-reader.js` est uniquement responsable de :

- inspection des onglets ;
- reconnaissance des variantes d’en-têtes ;
- détection des formats ;
- extraction vers le modèle canonique ;
- avertissements et conflits de parsing.

Le parser v156 historique est exécuté d’abord. Si celui-ci ne trouve aucune structure exploitable, v156 charge `register-adaptive-reader.js` à la demande dans le navigateur (ou le `require` directement dans les tests Node), puis n’accepte que les formats multi-destination à confiance suffisante. Il n’est donc pas nécessaire de modifier le gros `index.html` ni de charger le module adaptatif pour les registres qui fonctionnent déjà.

## Safety rules

- Aucun appel Supabase depuis le lecteur adaptatif.
- Aucun déplacement de référence par simple heuristique lorsque plusieurs sites sont possibles.
- Les onglets de métadonnées ne deviennent jamais automatiquement des chantiers.
- Les lignes de titre/section ne deviennent jamais des références.
- Une ligne-titre simple ne peut devenir un marqueur de chantier que dans un motif répété d’au moins deux tableaux.
- Les cellules fusionnées/vides de continuation conservent le dernier site explicite uniquement dans un tableau structuré.
- Les vrais multi-chantiers explicitement présents restent autorisés.
- Un registre simple à un seul chantier conserve le flux historique.

## User feedback

L’écran d’import affiche le format détecté lorsque le lecteur adaptatif prend la main, ainsi que les destinations et quantités déjà affichées par v156. Les conflits bloquants interrompent le flux avant toute RPC.

En cas de confiance insuffisante, RailOps ne présente pas le fichier comme compris avec certitude et repasse sur le lecteur historique.

## Testing

Les tests couvrent :

1. tableau multi-site existant ;
2. INVENTAIRE + onglets site ;
3. un onglet par site ;
4. plusieurs blocs explicites dans un onglet ;
5. plusieurs blocs avec titres de chantier simples ;
6. registre simple à un chantier ;
7. cellules fusionnées via les régressions existantes ;
8. vrai multi-chantier via les régressions existantes ;
9. onglets de métadonnées ignorés ;
10. ambiguïté de source -> blocage avant RPC ;
11. intégration v156 : format adaptatif multi-destination pris en charge, format simple renvoyé au flux historique.

Les suites modules, lifecycle et RLS doivent rester vertes avant fusion.
