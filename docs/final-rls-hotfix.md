# Final RLS hotfix

Hotfix production ciblé pour :

- persister les changements d'un matériel existant par un Agent via `UPDATE` au lieu d'un upsert pouvant déclencher la policy `INSERT` ;
- router les mutations de comptes authentifiées via `railops-user-admin` ;
- supprimer l'upsert générique de `users` depuis le chemin `save()`.

Aucune policy RLS, migration ou donnée Supabase n'est modifiée par ce hotfix.
