# Audit de Sécurité des Routes (API)

| Fichier | Méthode | Route | Protection (Middleware) | Risque / Évaluation |
|---|---|---|---|---|
| `admin.ts` | `GET` | `/dashboard` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `admin.ts` | `GET` | `/analytics` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `admin.ts` | `GET` | `/audit-logs` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `ads.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `ads.ts` | `POST` | `/` | `requireAuth` | 🟢 Faible (Protégé) |
| `ai.ts` | `POST` | `/translate` | `requireAuth` | 🟢 Faible (Protégé) |
| `articles.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `articles.ts` | `GET` | `/:id` | `Aucune` | 🟢 Faible (Lecture publique) |
| `articles.ts` | `POST` | `/` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `articles.ts` | `PUT` | `/:id` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `articles.ts` | `DELETE` | `/:id` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `auth.ts` | `GET` | `/me` | `Aucune` | 🟠 Moyen (Vérifie probablement le token/session en interne, mais manque de middleware formel) |
| `auth.ts` | `POST` | `/login` | `Aucune` | 🟢 Faible (Auth flow - Légitime) |
| `auth.ts` | `POST` | `/register` | `Aucune` | 🟢 Faible (Auth flow - Légitime) |
| `auth.ts` | `POST` | `/forgot-password` | `Aucune` | 🟢 Faible (Auth flow - Légitime) |
| `auth.ts` | `POST` | `/reset-password` | `Aucune` | 🟢 Faible (Auth flow - Légitime) |
| `auth.ts` | `POST` | `/logout` | `Aucune` | 🟢 Faible (Auth flow - Légitime) |
| `auth.ts` | `GET` | `/oauth/url` | `Aucune` | 🟢 Faible (Lecture publique) |
| `auth.ts` | `POST` | `/verify-code` | `Aucune` | 🟢 Faible (Auth flow - Légitime) |
| `auth.ts` | `POST` | `/resend-code` | `Aucune` | 🟢 Faible (Auth flow - Légitime) |
| `catalogues.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `companies.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `companies.ts` | `GET` | `/:id` | `Aucune` | 🟢 Faible (Lecture publique) |
| `companies.ts` | `POST` | `/` | `Aucune` | 🔴 CRITIQUE (Création d'entreprise non protégée par l'authentification) |
| `companies.ts` | `PUT` | `/:id` | `requireAuth` | 🟠 Moyen (Vérifier si l'utilisateur est bien le propriétaire de l'entreprise avant modification) |
| `companies.ts` | `DELETE` | `/:id` | `requireAuth` | 🟢 Faible (Protégé) |
| `companies.ts` | `GET` | `/:id/reviews` | `Aucune` | 🟢 Faible (Lecture publique) |
| `companies.ts` | `POST` | `/:id/reviews` | `requireAuth` | 🟢 Faible (Protégé) |
| `events.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `favorites.ts` | `GET` | `/` | `requireAuth` | 🟢 Faible (Protégé) |
| `favorites.ts` | `DELETE` | `/item/:itemId` | `requireAuth` | 🟢 Faible (Protégé) |
| `favorites.ts` | `DELETE` | `/:id` | `requireAuth` | 🟢 Faible (Protégé) |
| `favorites.ts` | `POST` | `/` | `requireAuth` | 🟢 Faible (Protégé) |
| `kyc.ts` | `GET` | `/` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `kyc.ts` | `POST` | `/submit` | `requireAuth` | 🟢 Faible (Protégé) |
| `kyc.ts` | `POST` | `/:id/approve` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `kyc.ts` | `POST` | `/:id/reject` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `messages.ts` | `GET` | `/conversations` | `requireAuth` | 🟢 Faible (Protégé) |
| `messages.ts` | `GET` | `/:conversationId` | `requireAuth` | 🟢 Faible (Protégé) |
| `messages.ts` | `POST` | `/` | `requireAuth` | 🟢 Faible (Protégé) |
| `products.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `products.ts` | `GET` | `/my` | `requireAuth` | 🟢 Faible (Protégé) |
| `products.ts` | `POST` | `/` | `verifyRole(['fournisseur', 'admin'])` | 🟢 Faible (Protégé par rôle) |
| `products.ts` | `PUT` | `/:id` | `verifyRole(['fournisseur', 'admin'])` | 🟢 Faible (Protégé par rôle) |
| `products.ts` | `DELETE` | `/:id` | `verifyRole(['fournisseur', 'admin'])` | 🟢 Faible (Protégé par rôle) |
| `products.ts` | `PUT` | `/:id/status` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `products.ts` | `POST` | `/:id/report` | `requireAuth` | 🟢 Faible (Protégé) |
| `rfqs.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `rfqs.ts` | `POST` | `/` | `requireAuth` | 🟢 Faible (Protégé) |
| `search.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `stats.ts` | `GET` | `/dashboard` | `requireAuth` | 🟢 Faible (Protégé) |
| `stats.ts` | `GET` | `/admin` | `requireAuth` | 🟢 Faible (Protégé) |
| `tenders.ts` | `GET` | `/` | `Aucune` | 🟢 Faible (Lecture publique) |
| `tenders.ts` | `GET` | `/my` | `requireAuth` | 🟢 Faible (Protégé) |
| `tenders.ts` | `POST` | `/` | `verifyRole(['acheteur', 'admin'])` | 🟢 Faible (Protégé par rôle) |
| `tenders.ts` | `GET` | `/:id` | `Aucune` | 🟢 Faible (Lecture publique) |
| `tenders.ts` | `PUT` | `/:id/status` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `tenders.ts` | `POST` | `/:id/report` | `requireAuth` | 🟢 Faible (Protégé) |
| `tenders.ts` | `DELETE` | `/:id` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `upload.ts` | `POST` | `/` | `requireAuth` | 🟢 Faible (Protégé) |
| `users.ts` | `GET` | `/` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `users.ts` | `PUT` | `/:id/role` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `users.ts` | `PUT` | `/:id/status` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `users.ts` | `GET` | `/:id/details` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
| `users.ts` | `DELETE` | `/:id` | `verifyRole(['admin'])` | 🟢 Faible (Protégé par rôle) |
