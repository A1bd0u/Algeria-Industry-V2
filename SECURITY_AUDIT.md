# Audit de sécurité — Algeria Industry V2

Dernière révision : 29 septembre 2026, base `49baa10` + correctifs de la branche de lancement.

L'audit précédent classait « faible » la plupart des routes, parce qu'elles étaient protégées par un middleware. Or la protection réelle dépendait de données lues dans le JWT (rôle, vérification), de filtres PostgREST construits par concaténation et de politiques RLS permissives. Ce document recense les 13 failles bloquantes (P0) et les failles P1 de la roadmap de lancement, avec le correctif appliqué et le test de régression associé.

## Modèle d'autorisation après correctifs

- **Session** : cookie `httpOnly`, `SameSite=Strict`, JWT de 24 h qui ne porte que `id` et `token_version`.
- **Rôle, suspension, vérifications** : relus en base à chaque requête (`server/middlewares/authMiddleware.ts`). Un changement de rôle, une suspension, une déconnexion ou une réinitialisation de mot de passe incrémentent `token_version`, ce qui révoque toutes les sessions.
- **Deux niveaux de vérification** :
  - `email_verified` : l'adresse est confirmée par un code. Il suffit pour la messagerie, les avis et le dépôt du KYC.
  - `kyc_status = 'approved'` : le dossier KYC est approuvé par un admin. Il est exigé (`requireKyc`) pour publier des produits, des appels d'offres et utiliser la traduction.
- **Paramètres de route** : validés comme UUID (`requireUuidParams`) avant toute requête.
- **RLS** : seconde barrière pour les accès avec la clé `anon`. Le backend utilise la clé `service_role` (voir `AUTHORIZATION.md` pour le passage progressif à un client `anon` + JWT).

## Failles P0 (bloquantes, même pour la beta)

| # | Faille | Correctif | Test |
|---|---|---|---|
| 1 | RLS `users` / `companies` ouvertes via `get_current_user_id() IS NULL` et `owner_id IS NULL` | Migration `20260927090000_security_p0_hardening.sql` : politiques réécrites, `SELECT/INSERT/UPDATE` retirés à `anon`/`authenticated` sur `users`, colonne du hash exclue, trigger qui empêche un utilisateur de modifier rôle et statuts | `security.test.ts` P0-1, `scripts/check-migrations.js` en CI |
| 2 | `GET /api/auth/me` renvoie `select('*')` (hash bcrypt) et se rabat sur le JWT | Liste blanche `PUBLIC_USER_COLUMNS`, plus de repli JWT ; même chose pour `/api/admin/users` et `/api/users/:id/details` | P0-2 |
| 3 | Callback OAuth simulé : JWT émis pour n'importe quel code, `postMessage(..., '*')` | Routes OAuth et boutons Google/LinkedIn supprimés du v1 | P0-3 |
| 4 | Injection de filtre PostgREST (`conversationId`, `id` concaténés dans `.or(...)`) | Middleware `requireUuidParams`, revalidation de l'identifiant de session | P0-4 |
| 5 | Suspension et changement de rôle sans effet pendant 7 jours | Rôle et statut lus en base, `token_version` incrémenté, JWT de 24 h | P0-5, `middlewares.test.ts` |
| 6 | `isVerified` confond e-mail et KYC : le KYC était contourné | Colonnes `email_verified` et `kyc_status`, middleware `requireKyc` | P0-6, `products.test.ts` |
| 7 | Documents KYC dans un bucket public (`getPublicUrl`) | Bucket privé, chemins `<userId>/…`, URL signées de 5 min pour l'admin, contrôle de propriété à la soumission | `upload.test.ts`, `kyc.test.ts` |
| 8 | Avis entreprise renvoyant l'e-mail des acheteurs, fiche publique exposant `kyc_requests` | Seul le nom est public, `kyc_requests` retiré de la fiche (route dédiée réservée au propriétaire) | P0-8 |
| 9 | Journaux contenant cookies et mots de passe ; Sentry Replay sans masquage | `redact()` dans le gestionnaire d'erreurs, Sentry sans cookies ni corps de requête ; Replay masqué et chargé seulement après consentement | P0-9 |
| 10 | CSP avec `unsafe-eval`, `frame-ancestors *`, `connect-src ws:` | `frame-ancestors 'none'`, `X-Frame-Options: DENY`, sans `unsafe-eval` en production, `connect-src` limité à Supabase, Sentry et Turnstile | P0-10 |
| 11 | `GET /api/stats/admin` accessible à tout inscrit | `verifyRole(['admin'])` | P0-11 |
| 12 | Signalement : n'importe qui dépubliait un concurrent | Table `reports` séparée ; le statut ne change que sur décision admin | P0-12 |
| 13 | 18 vulnérabilités npm (1 critique, 11 hautes) | Lockfile mis à jour : **0 vulnérabilité** ; `npm audit --audit-level=high` bloquant en CI | CI |

## Failles P1 (avant le lancement public)

| Sujet | État |
|---|---|
| Rate limiting derrière Cloudflare | ✅ IP lue dans `CF-Connecting-IP` si `BEHIND_CLOUDFLARE=true` |
| Compteurs de rate limiting partagés entre instances Cloud Run | ⏳ Le store est encore en mémoire : brancher Redis/Upstash avant le lancement public |
| Quota d'authentification commun (5 / 15 min, CGNAT) | ✅ Quota par IP + e-mail (10 / 15 min) et plafond par IP (60 / 15 min) |
| Blocage de compte par un tiers après 5 échecs | ✅ Délai progressif (1, 2, 4… min, plafonné à 15 min), levé par la réinitialisation du mot de passe |
| `/verify-code` sans limiteur | ✅ `verifyCodeLimiter`, comparaison en temps constant |
| Énumération de comptes via `/register` | ✅ Réponse identique ; le titulaire existant est prévenu par e-mail ; la session ne s'ouvre qu'après vérification du code |
| `err.message` renvoyé au client (détails SQL) | ✅ Message générique sur toutes les routes |
| Variables non échappées dans les templates e-mail | ✅ `escapeHtml` sur toutes les variables |
| Mots de passe | ✅ 10 caractères minimum, bcrypt coût 12, vérification Have I Been Pwned (k-anonymat) |
| 2FA TOTP pour les admins, `/extranet` derrière Cloudflare Access | ⏳ À faire (après la beta) |
| `/api/campaigns` et `/api/rfqs` trop publics | ✅ Publicités publiées uniquement, sans `user_id` ; RFQ réservées à leur auteur |
| Traduction Gemini | ✅ 2 000 caractères max, texte hors de l'instruction, modèle configurable, clé optionnelle, réservée aux comptes KYC |
| Tracking maison (ipify, clics sans consentement) | ✅ Supprimé |
| Défense en profondeur (client `anon` + JWT) | ⏳ Plan décrit dans `AUTHORIZATION.md` |

## Actions d'exploitation après déploiement

1. Appliquer la migration `20260927090000_security_p0_hardening.sql` sur staging, puis sur la production.
2. **Régénérer tous les secrets** : `JWT_SECRET` (au moins 32 caractères, vérifié au démarrage), clé `service_role` Supabase, clés Resend, Turnstile, Sentry et Gemini. Le dépôt est public et a déjà connu des fuites de clés.
3. Vérifier que `supabase/seeds/` n'a jamais été exécuté en production (compte `admin123`). Créer le premier admin à la main.
4. Tester en navigation privée qu'un document KYC n'est pas accessible sans URL signée.
