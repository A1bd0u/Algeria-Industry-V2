# Algiers Industry - Plateforme B2B

## Description du projet
Algiers Industry est une plateforme B2B complète dédiée à l'industrie algérienne. Elle connecte les acheteurs, les fournisseurs et les exposants à travers un annuaire interactif, un catalogue de produits, une gestion d'appels d'offres, et une messagerie intégrée. 

L'application est construite avec une architecture Full-Stack moderne (React, Vite, Express, Tailwind CSS, et Supabase pour la base de données).

## Prérequis
Avant de commencer, assurez-vous de disposer des éléments suivants :
- **Node.js** (version 18 ou supérieure)
- Un compte **Supabase** (pour la base de données PostgreSQL hébergée)
- Une clé **API Gemini** (Google AI Studio, pour les fonctionnalités d'intelligence artificielle)

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
   - `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (depuis votre projet Supabase)
   - `GEMINI_API_KEY` (depuis Google AI Studio)
   - `JWT_SECRET` (une chaîne de caractères sécurisée de votre choix)

3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   L'application sera accessible localement sur le port configuré (par défaut : 3000).

4. **Base de données** :
   Vous pouvez initialiser la base de données en exécutant les fichiers SQL disponibles dans le dossier `supabase/migrations/` depuis le SQL Editor de votre tableau de bord Supabase. Le fichier `20260705000002_seed_test_users.sql` contient les utilisateurs de test (mot de passe par défaut : `admin123`).
