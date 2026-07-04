# Cahier des Charges Détaillé - Plateforme Industrielle B2B (Algiers Industry)

## 1. Présentation du Projet et Vision
**Nom du projet :** Algiers Industry Virtual Exhibition & B2B Portal
**Objectif principal :** Créer le premier salon virtuel permanent et la première plateforme de mise en relation B2B pour le secteur industriel en Algérie, permettant la digitalisation des achats et des ventes (e-procurement).
**Pourquoi cette plateforme ?**
Le marché industriel nécessite de la confiance, de la vérification (KYC) et de la fluidité dans les échanges. Les salons physiques étant limités dans le temps et l'espace, cette plateforme offre un écosystème continu où les fournisseurs (exposants) publient leurs catalogues et où les acheteurs soumettent des appels d'offres et demandes de devis.

## 2. Charte Graphique, UI/UX et Identité Visuelle
L'interface a été conçue pour refléter le sérieux, la haute technologie et la simplicité requise par les professionnels.

### 2.1. Palette de Couleurs (Theme Tailwind)
*   **Couleur Primaire (Primary - Anthracite/Bleu Nuit) :** Utilisée pour le texte principal et les éléments structurels. *Pourquoi ?* Elle inspire l'autorité, le sérieux financier et la confiance institutionnelle. C'est la norme dans les logiciels B2B (SaaS industriels).
*   **Couleur Secondaire (Secondary - Teal/Orange Industriel) :** Utilisée pour les boutons d'appel à l'action (Demander un devis, S'inscrire). *Pourquoi ?* Ces couleurs contrastent fortement avec le fond neutre pour guider l'œil de l'utilisateur vers les actions génératrices de revenus.
*   **Neutral Background (Gris perle et Blanc) :** *Pourquoi ?* Pour mettre en valeur les images des machines et les données des tableaux de bord sans fatiguer les yeux lors d'utilisations prolongées.
*   **Couleurs de Statut (Success/Urgent/Warning) :** 
    *   *Rouge* : Appels d'offres urgents.
    *   *Vert* : Entreprises vérifiées (KYC approuvé) ou requêtes abouties.

### 2.2. Typographie
*   **Inter / Roboto (Sans-serif) :** Pour les textes longs, les descriptions de produits et la navigation. Très lisible sur tous les écrans.
*   **Police Monospace (JetBrains Mono) :** Utilisée pour les prix, les numéros d'identification, et les dimensions techniques. *Pourquoi ?* Pour aligner parfaitement les chiffres et donner un aspect "fiche technique" très apprécié des ingénieurs.

### 2.3. Internationalisation (i18n) et Accessibilité
*   Support natif de 3 langues : Français, Anglais, Arabe.
*   Basculement automatique de l'interface en mode **RTL (Right-To-Left)** lorsque l'arabe est sélectionné, avec ajustement des marges et des icônes.

## 3. Architecture Technique (Stack)

### 3.1. Frontend (Côté Client)
*   **Framework :** React 18 avec TypeScript et Vite.
*   **Routage :** React Router.
*   **Stylisation :** Tailwind CSS (approche Utility-first, responsive design Mobile-First).
*   **Animations :** Framer Motion (Transitions douces entre les pages, micro-interactions sur les cartes produits pour fluidifier l'expérience).
*   **Icônes :** Lucide React.

### 3.2. Backend (Côté Serveur)
*   **Environnement :** Node.js avec Express.js (réécrit en TypeScript pour la robustesse).
*   **Compilation :** esbuild pour un bundle serveur ultra-rapide (déploiement optimisé).
*   **Sécurité des API :**
    *   `helmet` : Protection des en-têtes HTTP (XSS, Clickjacking).
    *   `express-rate-limit` : Protection contre les attaques DDoS et le Brute-Force (ex. 200 requêtes / 15 min).
    *   Support des proxies (`trust proxy`) pour le déploiement sur le Cloud.

### 3.3. Base de Données (PostgreSQL / Supabase)
Le modèle relationnel (schéma) gère :
*   `Users` : Identifiants, Rôles, statut de vérification.
*   `Companies` : Profils des entreprises, secteurs d'activité, localisation.
*   `Products` : Catalogues, références techniques, lien avec les entreprises.
*   `Tenders` : Appels d'offres avec gestion des dates limites, budgets, et statuts (ouvert/fermé).
*   `RFQs` : Demandes de cotation (Request For Quotation) privées.
*   `Messages` : Messagerie B2B pour le support et les négociations.

## 4. Fonctionnalités Détaillées (Features)

### 4.1. Côté Utilisateur / Visiteur Public
*   **Accueil (Home) :** Recherche globale, affichage dynamique des produits mis en avant (Featured) et des derniers appels d'offres.
*   **Annuaire (Directory) :** Moteur de recherche avancé (filtre par région, secteur, certification). Vue en "Liste" ou cartographie géographique.
*   **Catalogue Produits (Products) :** Fiches techniques détaillées, possibilité d'ajouter aux favoris ou de contacter directement le fournisseur.
*   **Appels d'Offres (Tenders) :** Listes des marchés publics ou privés. Indicateurs d'urgence.
*   **Salon Immersif :** Navigation 2.5D entre différents halls thématiques (selon la FAQ) pour simuler l'expérience physique.

### 4.2. Espace Connecté (Acheteur / Exposant)
*   **Authentification et Autorisation :** Connexion via token JWT stocké dans des cookies `HttpOnly` (prévient les vols de session). Middlewares stricts pour restreindre l'accès (`requireAuth`).
*   **Dashboard B2B :** Vue d'ensemble sur les produits publiés, les messages non lus, les favoris et les réponses aux appels d'offres.
*   **Création de RFQ / Appels d'Offres :** Formuliare complexe en plusieurs étapes pour publier des besoins d'approvisionnement.

### 4.3. Console Administrateur (ConsolePro)
*   **Gestion du KYC (Know Your Customer) :** L'admin vérifie l'identité des entreprises et valide leur statut. (Statut *Pending, Approved, Rejected*).
*   **Modération du contenu :** Activation/désactivation des annonces, des produits et des appels d'offres hors-sujet.

## 5. Stratégie SEO (Search Engine Optimization)
*   **Server-Side Rendering (SSR) / Static Rendering :** (Évolutions prévues avec de l'hydratation ou meta tags dynamiques si migration vers framework SSR) Actuellement, la structure sémantique en HTML5 (balises `<article>`, `<section>`, `<h1>`, `<h2>`) aide fortement l'indexation.
*   **URLs propres (Clean URLs) :** `/products/123`, `/tenders` plutôt que des paramètres d'URL complexes pour faciliter le crawl.
*   **Performance (Core Web Vitals) :** Chargement asynchrone des données (`Promise.all` dans les `useEffect`), squelettes de chargement (Skeletons) qui préservent le layout shift (CLS).
*   **Attributs des images :** Textes alternatifs systématiques et utilisation du Lazy Loading implicite des navigateurs modernes.

## 6. Sécurité Systémique Spécifique
*   **JWT dans Cookies :** Les accès API n'exposent jamais les jetons dans le Javascript local (LocalStorage), réduisant les failles XSS.
*   **Contrôle d'Accès Basé sur les Rôles (RBAC) :** Le backend vérifie systématiquement via le middleware `requireRole(['admin', 'fournisseur', 'acheteur'])` qui tente d'écrire dans la BDD. Un acheteur ne peut pas publier un produit s'il n'est pas vendeur/exposant.
*   **Validation des Inputs :** Rejet des requêtes incomplètes (ex: Titres et descriptions obligatoires pour les Appels d'offres).

## Conclusion
Cette architecture allie la vitesse d'une SPA (Single Page Application) moderne avec React à la robustesse et la sécurité requises par le B2B grâce à son backend Express Node.js fortement sécurisé et son typage strict. La charte graphique est volontairement pensée pour maximiser la confiance, prioriser l'information métier et encourager les conversions (transactions/mises en relation).
