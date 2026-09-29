# Algeria Industry - Plateforme B2B

## Description du projet
Algeria Industry est une plateforme B2B complète dédiée à l'industrie algérienne. Elle connecte les acheteurs, les fournisseurs et les exposants à travers un annuaire interactif, un catalogue de produits, une gestion d'appels d'offres, et une messagerie intégrée. 

L'application est construite avec une architecture Full-Stack moderne (React, Vite, Express, Tailwind CSS, et Supabase pour la base de données).

## Prérequis
Avant de commencer, assurez-vous de disposer des éléments suivants :
- **Node.js** (version 18 ou supérieure)
- Un compte **Supabase** (pour la base de données PostgreSQL hébergée)
- Un compte **Resend** (e-mails transactionnels, domaine vérifié SPF/DKIM/DMARC)
- Des clés **Cloudflare Turnstile** (captcha)
- Optionnel : une clé **API Gemini** (traduction des fiches produits)

## Instructions d'installation

1. **Cloner le dépôt et installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configuration de l'environnement** :
   Copiez le fichier d'exemple pour créer votre configuration locale :
   ```bash
   cp .env.example .env
   ```
   Remplissez ensuite le fichier `.env` avec vos informations :
   - `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (depuis votre projet Supabase)
   - `JWT_SECRET` (au moins 32 caractères aléatoires : `openssl rand -base64 48`)
   - `APP_URL`, `RESEND_API_KEY`, `SENDER_EMAIL`, `TURNSTILE_SECRET_KEY` (obligatoires en production)
   - `VITE_LEGAL_*` : identifiants réels de la société éditrice (mentions légales)

   Voir `.env.example` pour la liste complète.

3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   L'application sera accessible localement sur le port configuré (par défaut : 3000).

4. **Base de données** :
   - **Migrations (Schéma)** : `supabase/migrations/` est l'unique source de vérité du schéma. Appliquez-les avec `npm run db:push` (ou dans l'ordre depuis le SQL Editor). `npm run db:check` vérifie leur nommage et l'absence de politiques RLS permissives.
   - **Seeding de Production (Sans utilisateurs démo)** :
     ```bash
     npm run db:seed
     ```
     Ce script peuple la base avec des entreprises et des offres fictives générées à la volée, sans ajouter de comptes utilisateurs prédéfinis.
   - **Seeding de Démo/Développement (Avec utilisateurs de test)** :
     ```bash
     npm run db:seed:demo
     ```
     Ce script charge les données de démonstration figées ainsi que les comptes de test (rôles admin, acheteur, fournisseur, exposant) définis dans `supabase/seeds/`.

> [!WARNING]
> **SÉCURITÉ IMPORTANTE : Le dossier `supabase/seeds/` ne doit JAMAIS être exécuté en production.**
> Il contient des utilisateurs de démonstration et d'administration dotés de mots de passe communs de test publiquement documentés (`admin123`). Son exécution en production présenterait un risque critique de sécurité.

## Qualité et sécurité

```bash
npm run lint      # vérification TypeScript
npm run test      # tests unitaires et de régression sécurité (vitest + supertest)
npm run test:e2e  # parcours Playwright
npm run audit     # npm audit, bloquant en CI pour les niveaux high et critical
npm run db:check  # contrôle des migrations
```

- `SECURITY_AUDIT.md` : failles P0/P1 de la roadmap de lancement et correctifs appliqués.
- `docs/LAUNCH_CHECKLIST.md` : Go/No-Go beta et lancement public, reste à faire.
- `AUTHORIZATION.md` : modèle d'autorisation et plan de défense en profondeur.
- `RUNBOOK.md` : sauvegardes, restauration et rollback.
