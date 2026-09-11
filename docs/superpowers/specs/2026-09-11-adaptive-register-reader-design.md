# RailOps Adaptive Register Reader — Design

## Goal

Permettre à RailOps de lire plusieurs architectures réelles de registres Excel utilisées par différents chefs d’équipe sans imposer un modèle unique, tout en conservant les garanties actuelles du moteur v156.5.

## Principles

1. Aucun changement de modèle Supabase ni de RPC n’est nécessaire.
2. Les registres déjà compatibles avec v156.5 doivent garder exactement le même comportement.
3. Toute source Excel est d’abord convertie vers un modèle interne unique avant import.
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

Un même onglet peut contenir plusieurs blocs successifs. Un bloc commence par un marqueur de site reconnu (`SITE : X`, `CHANTIER : X`, `ZONE : X`, ou une ligne-titre suivie d’un tableau de références). Chaque bloc est converti en groupe séparé. Une référence répétée dans le même groupe est dédupliquée ; la même référence dans deux groupes distincts reste un multi-chantier légitime.

### E. Single-sheet / single-site register

Pour un fichier à un seul tableau sans colonne Site, RailOps extrait les références comme aujourd’hui et laisse la destination être résolue par le flux existant. Aucun comportement ne change pour les chantiers seuls.

## Detection strategy

Chaque parser expose un `detect(workbookModel)` retournant une note de confiance et un `parse(workbookModel)` retournant le modèle canonique.

Priorité :

1. structured-table
2. inventory-site-sheets
3. sheet-per-site
4. block-per-site
5. single-sheet

La priorité évite qu’un fichier structuré déjà connu soit reclassé par un parser plus permissif.

Le moteur choisit le parser avec la meilleure note au-dessus du seuil de confiance. En cas d’égalité ou de résultat ambigu, il ne devine pas et laisse le flux historique prendre la main.

## Integration with v156

`register-import-v156.js` reste propriétaire des règles métier : normalisation, réconciliation, affichage, appel RPC et blocage avant écriture.

Le nouveau module `register-adaptive-reader.js` est uniquement responsable de :

- inspection des onglets ;
- reconnaissance des variantes d’en-têtes ;
- détection des formats ;
- extraction vers le modèle canonique ;
- avertissements de parsing.

v156 consomme le modèle adaptatif lorsqu’il est disponible et suffisamment fiable. Sinon il conserve son traitement actuel.

## Safety rules

- Aucun appel Supabase depuis le lecteur adaptatif.
- Aucun déplacement de référence par simple heuristique lorsque plusieurs sites sont possibles.
- Les onglets de métadonnées ne deviennent jamais automatiquement des chantiers.
- Les lignes de titre/section ne deviennent jamais des références.
- Les cellules fusionnées/vides de continuation conservent le dernier site explicite uniquement dans un tableau structuré.
- Les vrais multi-chantiers explicitement présents restent autorisés.

## User feedback

L’écran d’import doit afficher le format détecté et, si utile :

- nombre de destinations ;
- nombre de références ;
- références récupérées depuis une source secondaire ;
- conflits non bloquants ;
- conflits bloquants.

En cas de confiance insuffisante, RailOps ne présente pas le fichier comme compris avec certitude et repasse sur le lecteur historique.

## Testing

Ajouter des tests dédiés pour :

1. tableau multi-site existant ;
2. INVENTAIRE + onglets site ;
3. un onglet par site ;
4. plusieurs blocs dans un onglet ;
5. registre simple à un chantier ;
6. cellules fusionnées ;
7. vrai multi-chantier ;
8. onglets de métadonnées ignorés ;
9. architecture inconnue -> fallback, aucune écriture nouvelle ;
10. ambiguïté de source -> blocage avant RPC.

Les suites modules, lifecycle et RLS doivent rester vertes avant fusion.
