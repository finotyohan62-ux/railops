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
- des comptages : chantiers, matériels, scans, scans en attente, utilisateurs et lignes de statistiques Chef de chantier.

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
    pendingScans: 0,
    users: 0,
    chefChantierStats: 3
  }
}
```

Les nombres de l’exemple sont illustratifs et ne représentent pas les données de production. `pendingScans` est uniquement le nombre de scans locaux marqués `_pending === true` ; il ne révèle ni leur identifiant ni leur contenu.

## Alertes diagnostiques non sensibles

Le champ `warnings` est volontairement absent lorsque l’état est cohérent, afin de garder la forme historique du snapshot. Il n’apparaît que lorsqu’une incohérence détectable sans lire le contenu métier est présente.

Codes actuellement possibles :

- `CHEF_CHANTIER_MATERIAL_SCOPE_LEAK` : un état `chef_chantier` contient au moins une ligne matériel alors que ce rôle doit fonctionner uniquement avec des statistiques agrégées ;
- `CHEF_CHANTIER_SCAN_SCOPE_LEAK` : un état `chef_chantier` contient au moins un scan ;
- `CHEF_CHANTIER_STATS_MISSING` : l’application est en ligne, le rôle `chef_chantier` voit au moins un chantier, mais aucune ligne de statistiques agrégées n’a été chargée ; ce signal aide à distinguer un chargement statistique manquant d’un tableau réellement vide ;
- `CATALOGUE_SCOPE_LEAK` : un rôle autre que `chef` ou `admin` conserve des lignes de catalogue en mémoire ; seul le comptage est signalé, jamais les références ou les prix ;
- `OWNER_ADMIN_MODE_ROLE_MISMATCH` : le mode Administration propriétaire est marqué actif alors que le rôle effectif n’est pas `admin` ;
- `OWNER_ADMIN_MODE_WITHOUT_OWNER` : le mode Administration est marqué actif alors que l’indicateur propriétaire `adminOwner` est faux ; ce signal repère uniquement une incohérence d’état client et ne change aucun droit ;
- `OWNER_ADMIN_ROLE_OUTSIDE_MODE` : le propriétaire a un rôle effectif `admin` alors que le mode Administration explicite est inactif ; ce signal aide à repérer un état client resté trop privilégié sans modifier le rôle ni les permissions ;
- `SESSION_PAGE_WITHOUT_ROLE` : aucun rôle RailOps n’est actif mais l’état client pointe encore vers une page autre que `login` ; ce signal aide à repérer une transition de session incomplète sans provoquer lui-même de navigation ;
- `SESSION_DATA_WITHOUT_ROLE` : aucun rôle RailOps n’est actif mais au moins un des tableaux internes contient encore des lignes ; ce signal permet de repérer un état mémoire résiduel après déconnexion sans exposer le contenu concerné.

Ces codes sont des signaux de diagnostic uniquement. Ils ne modifient aucun droit, aucune donnée, aucun chargement et ne contiennent ni ID ni référence métier. L’alerte `CHEF_CHANTIER_STATS_MISSING` n’est produite que lorsque la connectivité est explicitement confirmée avec `online === true`. Elle n’est donc produite ni en mode hors-ligne, ni lorsque la connectivité est inconnue (`online = null`), afin d’éviter un faux positif lorsque la disponibilité du serveur n’est pas établie.

## Lecture rapide

Pour un `chef_chantier`, `materials: 0` et `scans: 0` sont attendus : les compteurs d’avancement proviennent de statistiques agrégées côté serveur, pas de références matérielles chargées dans le navigateur.

Pour un problème de connexion ou de session, vérifier d’abord `role`, `page`, `online`, les comptages et, s’il existe, le champ `warnings`. `pendingScans > 0` indique uniquement qu’au moins une opération de scan reste marquée en attente dans l’état local ; ce compteur ne prouve ni un échec serveur ni une erreur de permission et doit être recoupé avec le contexte de synchronisation. `SESSION_PAGE_WITHOUT_ROLE` signifie que le rôle a disparu mais que l’état de navigation n’a pas encore rejoint `login`; `SESSION_DATA_WITHOUT_ROLE` signifie qu’un état local contient encore des lignes. Ces diagnostics ne naviguent ni ne suppriment rien eux-mêmes. Un diagnostic nécessitant les données brutes doit être arrêté et traité séparément : ce helper n’a pas vocation à contourner le cloisonnement des rôles.

## Lecture des logs Supabase

Le connecteur de logs expose une fenêtre glissante des dernières **24 h**. Une erreur encore visible dans cette fenêtre peut donc être historique : sa simple présence ne prouve pas qu’elle se reproduit actuellement.

Pour trier un signal sans modifier le backend :

- regrouper les erreurs par message et table/service, sans recopier d’identifiant ni de donnée métier ;
- relever l’horodatage exact du **dernier** événement correspondant ;
- comparer cet horodatage avec le dernier relevé connu et, lorsqu’un test utilisateur existe, avec l’heure de l’action reproduite ;
- considérer un message ancien, sans occurrence plus récente, comme un élément historique à conserver au diagnostic ;
- considérer une occurrence nouvelle après l’action reproduite comme un signal récent à investiguer, sans en déduire automatiquement la cause.

Les logs seuls ne suffisent jamais pour modifier une policy, une permission ou la RLS. Une évolution de sécurité doit rester bloquée jusqu’à une reproduction attribuable, une analyse du chemin client/serveur concerné et une validation explicite. Les erreurs PostgreSQL de routine (`checkpoint`, reconnexions de réplication, EOF de standby) doivent également être séparées des erreurs applicatives avant toute conclusion.

## Garde-fous

- Ne pas étendre ce helper avec des noms, IDs, références, QR ou payloads métier pour faciliter un debug ponctuel.
- Ne pas utiliser ce diagnostic comme justification pour modifier des permissions ou activer la RLS stricte.
- Ne pas synchroniser automatiquement `main` vers la branche sécurité : la dérive de branche doit être revue explicitement avant merge/rebase.
- Ne pas modifier Import, Multi-chantier ou la purge hebdomadaire depuis ce flux de diagnostic.

La commande de vérification technique de la branche reste documentée dans `docs/v150b2b-verification-guide.md`.
