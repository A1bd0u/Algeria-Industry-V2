# Checklist de lancement

Suivi de la roadmap de lancement du 24 septembre 2026 : beta privée le **25 octobre 2026**, lancement public le **15 novembre 2026**.

✅ = fait dans le code · ⏳ = reste à faire dans le code · 🧾 = action hors code (juridique, administratif, exploitation)

## Go/No-Go beta (25 octobre)

| Critère | État |
|---|---|
| Les 13 failles P0 sont corrigées et couvertes par un test | ✅ Voir `SECURITY_AUDIT.md` et `test/security.test.ts` |
| Tous les secrets régénérés après les correctifs | 🧾 |
| Plus aucun `setTimeout` simulé, `[EMAIL SIMULATION]` ni image picsum | ✅ |
| Inscription → e-mail → KYC → approbation → e-mail → produit publié, sur staging puis en production | 🧾 Parcours implémenté ; à dérouler sur staging |
| Documents KYC inaccessibles sans URL signée | ✅ Bucket privé ; 🧾 à tester en navigation privée |
| Mentions légales réelles, déclaration ANPDP déposée, bandeau cookies actif | ✅ Bandeau et mentions pilotées par `VITE_LEGAL_*` ; 🧾 renseigner les vrais identifiants, déposer l'ANPDP |
| Restauration de sauvegarde testée ; alertes Sentry et sondes actives | 🧾 `/health` et `/ready` disponibles, Sentry échantillonné à 10 % |
| Compte admin avec 2FA, seeds de démo absents de la production | 🧾 / ⏳ (2FA) |

## Go/No-Go public (15 novembre)

| Critère | État |
|---|---|
| Failles P1 corrigées (rate limiting derrière Cloudflare en particulier) | ✅ sauf store partagé Redis/Upstash ⏳ et 2FA admin ⏳ |
| Parcours d'authentification, annuaire et fiches traduits en arabe et en anglais, relus | ⏳ |
| Balises SEO injectées côté serveur, sitemap dynamique soumis, domaine définitif actif | ✅ Injection et sitemap ; 🧾 domaine et Search Console |
| LCP mobile sous 2,5 s (accueil, fiche entreprise) | ✅ Carrousel limité à l'accueil, polices auto-hébergées ; 🧾 à mesurer avec Lighthouse |
| CGV publiées, facturation prête | 🧾 |
| Au moins 30 fournisseurs vérifiés actifs | 🧾 |

## Ce qui a changé dans le code

### Sécurité
Voir `SECURITY_AUDIT.md`.

### Parcours rendus réels
- Formulaire de contact : `POST /api/contact` (Turnstile, table `contact_messages`, e-mail à `SUPPORT_EMAIL`).
- Demande de publicité : `POST /api/campaigns/request`.
- Mise à jour du profil : `PUT /api/users/me`. Export et suppression du compte en libre-service : `GET /api/users/me/export` et `DELETE /api/users/me`.
- Fiche entreprise du tableau de bord : `PUT /api/companies/:id`.
- Messagerie : ouverture d'une conversation depuis une fiche produit ou entreprise ; plus de fausse réponse automatique.
- E-mails KYC réels (`kycApproved` / `kycRejected`).
- Retirés : assistant IA, lien « [Simulation] » de réinitialisation, faux paiement Stripe, faux numéros de support, conversion de devises (DZD uniquement).

### Données fictives supprimées
Images picsum, prix par défaut de 850 000 DA, caractéristiques et spécifications inventées, analytics admin codées en dur, replis fictifs (`/roles`, `/support/tickets`, `/exhibitors`, `/moderation`), visites calculées comme « produits × 5 », chiffres inventés de l'accueil, logos de marques tierces, slides publicitaires de marques réelles.

### Déploiement
- Les templates d'e-mail sont copiés dans l'image Docker ; le conteneur tourne en utilisateur `node`.
- En production, l'expéditeur `onboarding@resend.dev` est refusé ; `SENDER_EMAIL` est obligatoire.
- Un seul schéma de référence : `supabase/migrations/`. `database_setup_full.sql` et `server/db/schema.sql` sont supprimés.
- Incohérence `owner_id` / `company_id` sur `products` corrigée : les deux champs sont renseignés à la création, et la migration complète l'existant.
- Fichiers résiduels supprimés (`fix_legal.js`, `app/applet/`, `metadata.json`, mentions AI Studio) ; le paquet s'appelle `algeria-industry`.

### SEO
Balises `title`, description, Open Graph, `canonical` et JSON-LD (`Organization`, `LocalBusiness`, `Product`, `BreadcrumbList`) injectées côté serveur pour `/directory/:id`, `/products/:id` et `/blog/:id` ; `robots.txt` et sitemaps générés depuis la base (entreprises vérifiées, produits actifs, articles) ; `noindex` sur les pages privées et les fiches non revendiquées sans description ; image OG et favicon de la marque.

## Console admin (mise à jour du 30 septembre)

- **Abonnements & factures** : émission de facture (numérotation continue FA-AAAA-00001), activation pour 12 mois à réception du virement ou du chèque, annulation, facture imprimable (TVA 19 %), encaissements réels issus des transactions. Migration `20260930090000_admin_billing_and_support.sql`.
- **Publicités** : publication, refus motivé et fin de campagne enregistrés en base.
- **Support** : boîte de réception du formulaire de contact, note interne, suivi nouveau → en cours → traité.
- **Catalogue produits** : retrait, remise en ligne, suppression.
- **Blog** : création, édition, brouillon/publication et suppression d'articles ; API articles alignée sur le schéma.
- **Menu** : badges des tâches en attente ; écrans sans données réelles retirés (rôles, exposants, catégories, configuration, télémétrie) ; vrai nom de l'admin connecté ; menu mobile.
- 🧾 Renseigner `LEGAL_RIB` (ou `VITE_LEGAL_RIB`) pour afficher le RIB sur les factures.

## Paiement client (mise à jour du 1er octobre)

- **Souscription en libre-service** : depuis `/tarifs` ou l'onglet « Abonnement » du tableau de bord, le titulaire de la fiche entreprise choisit Basic ou Pro ; la facture en attente est émise au prix officiel (le montant n'est jamais lu depuis le client). Une seule facture en attente par offre.
- **Virement** : RIB et référence de facture copiables, envoi du justificatif (stockage privé), visible par l'admin via une URL signée de 5 minutes. L'admin active ensuite depuis la console.
- **Paiement en ligne CIB / Edahabia** (Chargily Pay v2) : activé dès que `CHARGILY_SECRET_KEY` est renseignée. Le webhook signé HMAC active l'abonnement automatiquement après contrôle du montant ; les événements sont journalisés (`payment_events`) et jamais traités deux fois.
- **Limites des offres appliquées** : 5 produits en gratuit, 15 en Basic, illimité en Pro / fondateur (erreur `PLAN_LIMIT_REACHED`). Une offre échue repasse aux limites gratuites.
- Migration `20261001090000_online_payments.sql`.
- 💳 Ouvrir un compte marchand Chargily, déclarer le webhook `https://<domaine>/api/payments/chargily/webhook`, tester avec une clé `test_sk_…` puis passer `CHARGILY_MODE=live`.

## Sécurité des comptes (mise à jour du 2 octobre)

- **Double authentification TOTP** (Google Authenticator, Microsoft Authenticator, Aegis…) : activation par QR code depuis « Mon profil », 10 codes de secours à usage unique, régénération, désactivation (mot de passe + code). Secrets chiffrés AES-256-GCM dans `user_mfa` (inaccessible hors backend), anti-rejeu, verrouillage 15 min après 5 codes faux, alerte e-mail à l'usage d'un code de secours.
- **Obligatoire pour les admins** : sans 2FA, un compte admin perd tous ses droits admin côté API (`MFA_SETUP_REQUIRED`) et la console affiche l'écran d'activation. Un admin peut réinitialiser la 2FA d'un autre utilisateur (journalisé) ; jamais la sienne.
- La connexion par code e-mail (`/verify-code`) n'ouvre plus de session pour un compte protégé par 2FA.
- **Rate limiting partagé** : store Upstash Redis (API REST) pour tous les limiteurs, repli automatique sur la mémoire si Redis ne répond pas.
- Migration `20261002090000_two_factor_auth.sql`.
- 🔐 Générer `MFA_ENCRYPTION_KEY` (`openssl rand -hex 32`) avant la première activation, puis activer la 2FA de chaque admin.
- ☁️ Créer une base Upstash Redis (région Europe) et renseigner `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` avant de passer à plusieurs instances.

## Finitions (mise à jour du 3 octobre)

- **Traductions** : tout le site public et l'espace fournisseur en français, anglais et arabe (RTL) ; erreurs de l'API traduites par code ; test de parité des clés. La console admin reste en français.
- **Fonctionnalités factices retirées** : fausse page /subscriptions, événements, ressources, devenir exposant, brochure, statut « en ligne », faux téléchargements.
- **Recherche** : configuration `fr_unaccent` commune à l'index et aux requêtes (« securite » trouve « sécurité », pluriels, arabe) ; seuls les produits publiés remontent.
- **WhatsApp** sur les fiches des entreprises vérifiées ; RC et NIF verrouillés après validation KYC.
- **Carte** : dépendances Leaflet inutilisées supprimées.
- **Audience** : Plausible sans cookie, activé par `VITE_PLAUSIBLE_DOMAIN`.
- **Déploiement** : variables `VITE_*` passées au build Docker ; guide `docs/DEPLOYMENT.md`.
- Migration `20261003090000_search_and_whatsapp.sql`.
- **Événements** : création, modification et suppression depuis la console admin (journalisées).

## Bandeau publicitaire de l'accueil (octobre)

- **Annonces en carrousel** en haut de l'accueil : visuel de fond, logo, annonceur, titre, sous-titre et bouton vers un lien interne ou externe (`rel="sponsored"`). Défilement automatique avec pause, flèches, points, glissement sur mobile, RTL.
- **Console > Publicités** : préparation du visuel d'une demande reçue, création directe d'une annonce, aperçu en direct, période de diffusion (début/fin), ordre d'affichage, nombre de clics par campagne.
- Seules les annonces publiées **et** dans leur période sont servies (8 au plus). Sans annonce en ligne, le bandeau présente la plateforme : inscription gratuite, offre fondateur et « Votre annonce ici » vers la page Publicité.
- Liens limités à http(s) ou aux chemins internes, images limitées au stockage de la plateforme.
- Migration `20261006090000_ad_creatives.sql`.
- **Bannières image** (migration `20261008090000_ad_banner_mode.sql`) : une annonce peut être un visuel PNG/JPG complet (textes et logo inclus), affiché tel quel et cliquable, avec une version mobile facultative. Formats conseillés : accueil 1920 × 384 px (mobile 1200 × 675), autres pages 1920 × 240 px (mobile 1200 × 400). La console vérifie les dimensions et prévient si le visuel sera rogné. Le mode « Modèle avec textes » reste disponible.
- **Ciblage** (migration `20261007090000_ad_targeting.sql`) : chaque annonce choisit ses pages — accueil (grand bandeau), catalogue (produits, fiche produit, recherche, comparateur), fournisseurs (annuaire, fiche entreprise), contenus (actualités, événements, catalogues PDF, ressources) — et, en option, des catégories produit (groupes A à E). Une annonce ciblée par catégorie n'apparaît que sur les pages qui affichent cette catégorie. Hors accueil, le bandeau est compact ; sans annonce, il présente la plateforme. Jamais de bandeau sur les formulaires, l'espace client, la console, les pages juridiques, Tarifs, FAQ ni Contact. Les annonces existantes restent sur l'accueil.

## Statistiques, catalogues et CGV (mise à jour du 2 octobre)

- **Statistiques fournisseur** (onglet « Statistiques ») : vues de la fiche et des produits en Basic ; en Pro, en plus, clics WhatsApp, catalogues ouverts, acheteurs qui ont écrit et produits les plus vus, sur 7, 30 ou 90 jours. Mesure anonyme (empreinte quotidienne hachée, sans IP ni cookie), un visiteur compté une fois par jour et par élément, robots et visites du fournisseur exclus.
- **Catalogues PDF** (onglet « Mes catalogues PDF ») : dépôt (10 Mo max) réservé aux entreprises vérifiées, 1 en gratuit, 5 en Basic, illimité en Pro ; affichés sur la fiche entreprise et la page Catalogues ; retrait par l'entreprise ou un admin.
- **CGV** : page `/cgv` (fr/en/ar), lien en pied de page et sur Tarifs ; case obligatoire avant toute souscription, date et version (`2026-10`) enregistrées sur la facture. 🧾 Faire relire les CGV par un juriste avant le lancement.
- **Tarifs** : la mise en avant de produits est retirée de la page et du comparatif ; les catalogues PDF y figurent.
- **Objectifs Plausible** : voir `docs/DEPLOYMENT.md` § 7.
- Migration `20261011090000_supplier_stats_catalogues_terms.sql`.

## Reste à faire (code, non bloquant pour le lancement)

1. **Préfixes de langue** `/fr`, `/ar`, `/en` avec `hreflang` : l'interface est traduite côté client, mais les contenus (fiches, produits, articles) n'existent qu'en français. À envisager quand des contenus traduits existeront ; les URL lisibles `{slug}-{id}` sont déjà en place.
2. **Client Supabase `anon` + JWT** pour les lectures utilisateur (défense en profondeur) : aujourd'hui toutes les requêtes passent par le backend avec la clé service_role, et chaque route vérifie l'accès (couvert par les tests). Chantier transverse à planifier après le lancement.

## Décisions ouvertes (hors code)

Hébergement (Europe avec autorisation ANPDP, ou hébergeur algérien), structure juridique et RC couvrant l'activité en ligne, nom de marque et domaine (`.dz` / `.com.dz`), secteurs de départ, import Kompass, capacité de développement.
