# RailOps v150B-2B — guide de diagnostic sans données sensibles

Ce document décrit l’usage du helper `v150b2b-diagnostics.js` présent uniquement sur la branche de sécurité/preview. Son objectif est d’aider à diagnostiquer un problème de chargement ou de rôle sans recopier de données métier sensibles dans un ticket, un message ou une capture.

## Snapshot disponible

Le module exporte `RailOpsDiagnostics150B2B.createDiagnosticsSnapshot(state, runtime)`.

Le résultat contient uniquement :

- la version du runtime ;
- le rôle courant ;
- les indicateurs `adminOwner` et `adminMode` ;
- la page courante ;
- l’état online/offline ;
- des comptages : chantiers, matériels, scans, utilisateurs et lignes de statistiques Chef de chantier.

Le snapshot ne doit pas contenir de nom de chantier, nom d’agent, identifiant, référence matériel, QR, détail de scan, photo, signature ou contenu de tournée.

## Utilisation depuis la preview

Dans la console du navigateur, créer un snapshot à partir de l’état courant et du runtime :

```js
RailOpsDiagnostics150B2B.createDiagnosticsSnapshot(S, {
  version: RailOpsSecurity150B2B?.version,
  online: navigator.onLine,
})
```

Exemple de forme attendue :

```js
{
  version: "150B2B-client-2",
  role: "chef_chantier",
  adminOwner: false,
  adminMode: false,
  page: "dashboard",
  online: true,
  counts: {
    chantiers: 3,
    materials: 0,
    scans: 0,
    users: 0,
    chefChantierStats: 3
  }
}
```

Les nombres de l’exemple sont illustratifs et ne représentent pas les données de production.

## Alertes diagnostiques non sensibles

Le champ `warnings` est volontairement absent lorsque l’état est cohérent, afin de garder la forme historique du snapshot. Il n’apparaît que lorsqu’une incohérence détectable sans lire le contenu métier est présente.

Codes actuellement possibles :

- `CHEF_CHANTIER_MATERIAL_SCOPE_LEAK` : un état `chef_chantier` contient au moins une ligne matériel alors que ce rôle doit fonctionner uniquement avec des statistiques agrégées ;
- `CHEF_CHANTIER_SCAN_SCOPE_LEAK` : un état `chef_chantier` contient au moins un scan ;
- `CHEF_CHANTIER_STATS_MISSING` : l’application est en ligne, le rôle `chef_chantier` voit au moins un chantier, mais aucune ligne de statistiques agrégées n’a été chargée ; ce signal aide à distinguer un chargement statistique manquant d’un tableau réellement vide ;
- `OWNER_ADMIN_MODE_ROLE_MISMATCH` : le mode Administration propriétaire est marqué actif alors que le rôle effectif n’est pas `admin` ;
- `SESSION_DATA_WITHOUT_ROLE` : aucun rôle RailOps n’est actif mais au moins un des tableaux internes contient encore des lignes ; ce signal permet de repérer un état mémoire résiduel après déconnexion sans exposer le contenu concerné.

Ces codes sont des signaux de diagnostic uniquement. Ils ne modifient aucun droit, aucune donnée, aucun chargement et ne contiennent ni ID ni référence métier. L’alerte `CHEF_CHANTIER_STATS_MISSING` n’est pas produite en mode hors-ligne afin d’éviter un faux positif lorsque le serveur n’est pas joignable.

## Lecture rapide

Pour un `chef_chantier`, `materials: 0` et `scans: 0` sont attendus : les compteurs d’avancement proviennent de statistiques agrégées côté serveur, pas de références matérielles chargées dans le navigateur.

Pour un problème de connexion ou de session, vérifier d’abord `role`, `page`, `online`, les comptages et, s’il existe, le champ `warnings`. `SESSION_DATA_WITHOUT_ROLE` signifie uniquement qu’un état local mérite d’être inspecté ou réinitialisé par le flux normal ; ce diagnostic ne supprime rien lui-même. Un diagnostic nécessitant les données brutes doit être arrêté et traité séparément : ce helper n’a pas vocation à contourner le cloisonnement des rôles.

## Garde-fous

- Ne pas étendre ce helper avec des noms, IDs, références, QR ou payloads métier pour faciliter un debug ponctuel.
- Ne pas utiliser ce diagnostic comme justification pour modifier des permissions ou activer la RLS stricte.
- Ne pas synchroniser automatiquement `main` vers la branche sécurité : la dérive de branche doit être revue explicitement avant merge/rebase.
- Ne pas modifier Import, Multi-chantier ou la purge hebdomadaire depuis ce flux de diagnostic.

La commande de vérification technique de la branche reste documentée dans `docs/v150b2b-verification-guide.md`.
