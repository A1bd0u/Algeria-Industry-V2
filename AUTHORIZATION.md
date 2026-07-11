# Stratégie d'Autorisation et de Sécurité

Cette architecture utilise un backend Express comme proxy devant Supabase. Le backend Express utilise principalement la clé `service_role`, ce qui a des implications directes sur la façon dont la sécurité est gérée.

## 1. Backend Express (Clé Service Role)

La clé `service_role` **contourne totalement les politiques RLS (Row Level Security)** de Supabase. Cela signifie que :
- La base de données ne bloque aucune requête provenant du backend.
- **Toute la logique d'autorisation métier doit impérativement résider dans les middlewares Express** (ex: `verifyRole`, `authenticateToken`).
- Le backend est la seule ligne de défense pour ces requêtes. S'il y a une faille d'autorisation dans Express, les données sont compromises.

### Avantages :
- Permet de cacher la complexité des requêtes et les clés API côté serveur.
- Flexible pour exécuter des tâches administratives et manipuler des données inter-tables complexes.

## 2. Le Rôle du RLS (Row Level Security)

Bien que le backend contourne le RLS, le RLS reste **critique et indispensable** dans les scénarios suivants :

- **Accès direct depuis le client (SPA)** : Si le frontend (React) utilise directement `@supabase/supabase-js` avec la clé `anon` pour s'abonner à des changements en temps réel (Realtime) ou pour certaines requêtes directes.
- **Supabase Storage** : Le téléchargement direct de fichiers (images, documents) depuis le client vers les buckets Supabase dépend fortement du RLS pour vérifier qui a le droit de lire ou d'uploader.
- **Supabase Realtime** : Pour écouter les événements de la base de données (ex: notifications, chat en direct) directement depuis le navigateur, le RLS garantit que l'utilisateur ne reçoit que les événements qui le concernent.

## 3. Utilisation de la clé Anon côté Serveur

Actuellement, le fichier `server/db/supabaseClient.ts` initialise un client unique avec la clé `service_role` (si disponible).
Pour réduire la surface d'attaque, il est recommandé de :
- Utiliser le client `service_role` uniquement pour les opérations d'écriture/modification ou les accès administrateur.
- Créer une seconde instance Supabase dans Express en utilisant la clé `anon` (et en passant le JWT de l'utilisateur dans les headers) pour les opérations de lecture publique ou spécifiques à un utilisateur, afin d'appliquer une double vérification (Express + RLS).

## Conclusion

1. **Protégez vos routes Express** : Utilisez des middlewares robustes pour vérifier l'identité et les permissions à chaque appel API.
2. **Ne désactivez pas le RLS** : Configurez vos politiques RLS de manière stricte sur toutes vos tables pour sécuriser le Storage, le Realtime, et empêcher tout accès direct non autorisé.
