# RailOps — Habilitations rattachées au profil agent

## Contexte
RailOps dispose déjà des comptes utilisateurs sécurisés, des rôles, des chantiers, du multi-chantier, du scanner, de la synchronisation hors ligne, des rapports et des statistiques Chef de chantier. La table `public.users` ne contient actuellement aucune donnée d’habilitation.

L’objectif est d’ajouter les habilitations sans toucher au fonctionnement existant du scanner, des registres, du multi-chantier, de la synchronisation ou des statistiques.

## Décision produit
L’habilitation est présentée comme une partie du profil professionnel de l’agent.

- L’agent met lui-même à jour son habilitation depuis son propre profil.
- Il dépose son PDF officiel.
- RailOps lit automatiquement le PDF et extrait chaque habilitation avec sa propre date de validité.
- RailOps affiche une prévisualisation des habilitations détectées avant activation.
- L’agent confirme uniquement la lecture automatique ; aucune validation hiérarchique systématique n’est requise.
- Une fois confirmée, la nouvelle habilitation devient active immédiatement.
- L’ancien PDF est archivé automatiquement après activation réussie du nouveau.
- En cas d’échec d’upload, de lecture ou d’extraction, l’ancienne habilitation reste active et aucune donnée existante n’est remplacée.
- Un cas exceptionnel illisible ou ambigu peut être signalé pour correction par un Chef d’équipe ou un Admin, sans créer une validation obligatoire pour tous les dépôts.

## Droits
### Agent
- Lire uniquement sa propre habilitation.
- Déposer/remplacer uniquement son propre PDF.
- Confirmer les données automatiquement extraites de son propre document.
- Ne peut pas modifier son rôle, son badge, les habilitations d’un autre utilisateur ni forcer une habilitation absente du PDF.

### CTE
- Lecture uniquement des habilitations visibles dans son périmètre métier.
- Aucun droit d’écriture.

### Chef d’équipe
- Lecture des habilitations des agents visibles dans son périmètre.
- Peut intervenir sur un cas exceptionnel signalé comme illisible/ambigu.
- Pas de validation quotidienne obligatoire.

### Chef de chantier
- Lecture uniquement selon son périmètre existant.

### Admin
- Lecture globale.
- Correction/suppression d’un document erroné ou d’un cas exceptionnel.

## Modèle de données
Les habilitations ne sont pas ajoutées directement dans `public.users`. Elles sont stockées dans des tables dédiées liées à l’identifiant utilisateur afin de préserver l’historique et de garder le profil utilisateur léger.

### `agent_habilitation_documents`
Une ligne par PDF déposé.

Champs prévus :
- `id` UUID primaire ;
- `user_id` lié à `public.users.id` ;
- `storage_path` ;
- `file_name` ;
- `file_hash` pour détecter un même document redéposé ;
- `status` : `processing`, `active`, `archived`, `needs_review`, `failed` ;
- `uploaded_at` ;
- `activated_at` ;
- `archived_at` ;
- `uploaded_by_auth_user_id` ;
- `extraction_method` : texte PDF ou OCR ;
- `extraction_confidence` facultative.

Contrainte : au maximum un document `active` par agent.

### `agent_habilitations`
Une ligne par habilitation extraite d’un document.

Champs prévus :
- `id` UUID primaire ;
- `document_id` ;
- `user_id` ;
- `code` normalisé, par exemple `H1B1`, `H3B3`, `S11`, `APS9` ;
- `label_source` correspondant au texte lu dans le PDF ;
- `valid_from` si disponible ;
- `valid_until` obligatoire pour considérer l’habilitation exploitable ;
- `created_at`.

Une même habilitation peut donc avoir une échéance différente d’une autre sur le même PDF.

## Stockage des PDF
Les PDF sont stockés dans un bucket Supabase Storage privé dédié, jamais dans un bucket public.

Principes :
- accès authentifié uniquement ;
- l’agent ne peut écrire que dans son propre espace ;
- consultation via URL signée de courte durée ;
- Chef/Admin obtiennent uniquement les accès autorisés par le serveur ;
- aucun service tiers d’IA n’est nécessaire pour lire le document.

## Lecture automatique
La lecture se fait côté application afin de limiter la diffusion des données personnelles.

Ordre de traitement :
1. lecture du texte natif du PDF ;
2. extraction des couples `habilitation + date` ;
3. normalisation des codes ;
4. contrôle qu’une date est bien rattachée à chaque habilitation ;
5. affichage d’une prévisualisation ;
6. confirmation par l’agent ;
7. upload du PDF dans un emplacement privé temporaire/pending ;
8. activation transactionnelle des métadonnées et habilitations côté base.

Si le PDF n’a pas de couche texte exploitable, RailOps tente un OCR en secours, chargé uniquement au moment du dépôt afin de ne pas alourdir le démarrage normal de l’application.

Si RailOps n’est pas suffisamment sûr de l’association entre une habilitation et sa date, le document n’écrase jamais le document actif. Il passe en `needs_review`.

## Règles d’activation
Supabase Storage et PostgreSQL ne partagent pas une transaction unique. RailOps utilise donc un flux en deux phases :

1. le fichier est envoyé dans un emplacement privé `pending` ;
2. une fonction/RPC serveur exécute dans une transaction PostgreSQL : création du document, création de toutes ses habilitations, passage du nouveau document à `active` et archivage de l’ancien actif ;
3. si la transaction échoue, l’ancien document reste actif et le fichier pending est supprimé ou marqué pour nettoyage ;
4. si la transaction réussit, le document devient la référence active.

L’état métier actif est donc atomique même si le stockage fichier lui-même est une étape distincte. Un échec réseau ou serveur ne peut pas laisser le profil sans habilitation active.

## Statuts affichés
Chaque habilitation possède son propre statut calculé à partir de `valid_until` :
- vert : plus de 60 jours avant échéance ;
- orange : 60 jours ou moins avant échéance ;
- rouge : date dépassée.

Le nombre de jours restant est affiché lorsque l’échéance approche. Aucun cron n’est nécessaire pour afficher correctement le statut : il est recalculé à l’ouverture/rafraîchissement du profil.

Le profil affiche aussi un statut global basé sur la situation la plus défavorable des habilitations actives.

## UX du profil agent
Dans le profil :

- bloc `Habilitations` ;
- liste des habilitations avec date individuelle et statut ;
- bouton `Voir le PDF` ;
- bouton `Mettre à jour mon habilitation` visible uniquement sur son propre profil ;
- historique accessible sans encombrer la vue principale ;
- état de traitement clair pendant l’analyse du PDF.

Après sélection du PDF, un écran de prévisualisation affiche les habilitations et dates détectées. L’agent peut confirmer ou annuler. Il ne dispose pas d’un champ libre permettant d’ajouter arbitrairement une habilitation absente de la lecture.

## Cas d’erreur
- Fichier autre que PDF : refus avant upload.
- PDF vide/corrompu : refus, ancien document conservé.
- Aucune habilitation reconnue : document non activé.
- Habilitation détectée sans date fiable : document `needs_review`, ancien actif conservé.
- Perte réseau pendant l’upload : aucun archivage de l’ancien document.
- Échec transactionnel après upload : ancien actif conservé, fichier pending nettoyé ou marqué pour nettoyage.
- Double clic / retry : opération idempotente par identifiant de document et hash du fichier.
- Document déjà déposé : éviter un doublon actif.

## Sécurité
- Toutes les tables exposées ont RLS activée.
- Les règles d’écriture vérifient l’utilisateur authentifié côté serveur, jamais seulement le rôle présent dans l’interface.
- L’agent ne peut écrire que pour son propre profil lié à `auth.uid()`.
- Les accès Chef/Admin sont validés côté serveur selon les règles de rôle RailOps existantes.
- Les PDF restent privés.
- Aucun `service_role` n’est exposé dans le navigateur.
- Les actions sensibles sont journalisées : dépôt, activation, archivage, correction exceptionnelle.

## Isolation technique
Nouvelle logique dans un module dédié, sans modifier le cœur du scanner/import sauf branchement UI minimal :

- `js/core/habilitations.js` : état, parsing, prévisualisation et intégration profil ;
- SQL/migration dédiée pour tables, fonctions et RLS ;
- stockage privé Supabase ;
- fonction/RPC serveur dédiée à l’activation transactionnelle ;
- tests dédiés `tests/habilitations-*.test.js` ;
- chargement du lecteur PDF/OCR uniquement à la demande.

Le `legacy-core.js` n’est modifié que si un petit point d’intégration est indispensable ; aucune refonte générale n’est incluse dans ce chantier.

## Tests obligatoires avant fusion
- un agent ne peut déposer que pour lui-même ;
- un agent ne peut lire le PDF privé d’un autre agent ;
- CTE ne peut pas modifier ;
- Chef/Admin conservent leurs droits prévus ;
- extraction de plusieurs habilitations avec dates différentes ;
- PDF texte ;
- fallback OCR ;
- erreur de parsing sans perte de l’ancien actif ;
- erreur réseau sans perte de l’ancien actif ;
- activation transactionnelle ;
- archivage de l’ancien uniquement après réussite ;
- nettoyage/gestion d’un fichier pending après échec ;
- détection de doublon ;
- affichage valide / bientôt expirée / expirée ;
- non-régression auth, rôles, chantiers, scanner, registre et synchronisation.

## Déploiement
- développement sur branche dédiée `feat/agent-habilitations-profile` ;
- aucune modification directe de `main` ;
- tests avant toute modification sensible ;
- une PR dédiée ;
- changements Supabase appliqués seulement après validation ;
- vérification des advisors sécurité après DDL/RLS ;
- un seul déploiement Vercel final autant que possible.

## Hors périmètre de cette première version
- blocage automatique d’affectation d’un agent à un chantier selon ses habilitations ;
- matrice chantier ↔ habilitations requises ;
- notifications push/email ;
- IA externe ;
- refonte générale du profil ou du dashboard ;
- nouvelle refonte du scanner, du registre ou de la synchro.

Ces éléments pourront être ajoutés ensuite une fois la gestion des habilitations stable en production.
