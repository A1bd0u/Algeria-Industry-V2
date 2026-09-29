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
| Au moins 30 fournisseurs vérifiés actifs et 10 appels d'offres réels | 🧾 |

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

## Reste à faire (code)

1. Store de rate limiting partagé (Redis/Upstash) : plusieurs instances Cloud Run.
2. 2FA TOTP pour les admins.
3. i18n : 35 vues sans `useTranslation` (priorité : authentification et KYC, puis annuaire et fiches). Traduire côté client les codes d'erreur API (`AUTH_INVALID`, `KYC_REQUIRED`…).
4. URL lisibles `/entreprises/{slug}-{id}` et préfixes de langue `/fr`, `/ar`, `/en` avec `hreflang`.
5. Bouton « contacter sur WhatsApp » sur les fiches fournisseurs (nécessite un champ téléphone vérifié).
6. Recherche plein texte : configurations `french` + `unaccent` et `simple` pour l'arabe.
7. Tuiles cartographiques via un fournisseur (MapTiler, Stadia) plutôt que les serveurs OSM publics.
8. Mesure d'audience sans cookie (Plausible ou Umami).
9. Client Supabase `anon` + JWT pour les lectures utilisateur (défense en profondeur).

## Décisions ouvertes (hors code)

Hébergement (Europe avec autorisation ANPDP, ou hébergeur algérien), structure juridique et RC couvrant l'activité en ligne, nom de marque et domaine (`.dz` / `.com.dz`), secteurs de départ, import Kompass, capacité de développement.
