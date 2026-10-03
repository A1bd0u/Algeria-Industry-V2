# Déploiement en production

L'application est **un seul service** : un serveur Express (API + rendu SEO)
qui sert aussi le front React compilé. Cible recommandée : **Google Cloud Run**
(conteneur Docker), derrière **Cloudflare** (DNS, proxy, WAF).

> Cloudflare Workers ne peut pas exécuter ce serveur tel quel (Express,
> multer, accès disque aux modèles d'e-mail) : un build Workers ne publierait
> que le front statique, sans API. Utiliser Workers uniquement comme proxy
> devant Cloud Run, ou désactiver ce build.

## 1. Prérequis

| Service | Rôle |
|---|---|
| Supabase (plan Pro conseillé) | Base Postgres, stockage des fichiers, sauvegardes/PITR |
| Google Cloud (projet + facturation) | Cloud Run, Artifact Registry, Secret Manager |
| Cloudflare | DNS du domaine, proxy HTTPS, Turnstile (captcha) |
| Resend | E-mails transactionnels |
| Chargily Pay (optionnel) | Paiement CIB / Edahabia |
| Upstash Redis (optionnel) | Rate limiting partagé si plusieurs instances |
| Sentry, Plausible (optionnels) | Erreurs, audience sans cookie |

## 2. Base de données

1. Créer le projet Supabase (région Europe, ex. Francfort).
2. Appliquer **toutes** les migrations, dans l'ordre :
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   (ou coller chaque fichier de `supabase/migrations/` dans le SQL editor, dans l'ordre).
3. Vérifier : `npm run db:check` en local, puis dans Supabase que les tables
   `user_mfa`, `payment_events` et la colonne `companies.whatsapp` existent.
4. Activer les sauvegardes / PITR (voir `RUNBOOK.md`).

## 3. Variables d'environnement

Deux catégories — ne jamais les mélanger :

**Publiques, lues au build du front** (inscrites dans le JavaScript servi) :
passées en `--build-arg` à Docker. Voir la liste des `ARG` du `Dockerfile` :
`VITE_APP_URL`, `VITE_TURNSTILE_SITE_KEY`, `VITE_SENTRY_DSN`,
`VITE_PLAUSIBLE_DOMAIN`, `VITE_SUPPORT_*`, `VITE_LEGAL_*`.

**Secrètes, lues au démarrage du serveur** : dans **Secret Manager**, exposées
à Cloud Run comme variables d'environnement :

| Variable | Obligatoire | Note |
|---|---|---|
| `JWT_SECRET` | oui | `openssl rand -base64 48` |
| `MFA_ENCRYPTION_KEY` | oui | `openssl rand -hex 32` — ne jamais la changer après la 1re activation 2FA |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | oui | clé service_role : serveur uniquement |
| `TURNSTILE_SECRET_KEY` | oui | sans elle, connexion et inscription sont refusées en production |
| `APP_URL` | oui | URL publique, ex. `https://algeria-industry.dz` |
| `RESEND_API_KEY`, `SENDER_EMAIL` | oui | codes de vérification, réinitialisation (domaine d'envoi vérifié chez Resend) |
| `BEHIND_CLOUDFLARE` | oui derrière Cloudflare | `true` : l'IP réelle est lue dans `CF-Connecting-IP` (rate limiting par visiteur) |
| `LEGAL_RIB`, `LEGAL_*` | oui | factures |
| `CHARGILY_SECRET_KEY`, `CHARGILY_MODE` | non | paiement en ligne |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | si > 1 instance | rate limiting partagé |
| `SENTRY_DSN` | non | erreurs serveur |
| `CRON_SECRET` | oui | secret de la tâche quotidienne (§ 6) : `openssl rand -hex 32` |
| `ADMIN_ALERT_EMAILS` | non | destinataires des alertes internes ; vide = tous les comptes admin |
| `VITE_PLAUSIBLE_DOMAIN`, `VITE_PLAUSIBLE_SRC` | non | à redonner au runtime : la CSP du serveur autorise leur origine |

La liste complète et commentée est dans `.env.example`.

## 4. Construire et déployer sur Cloud Run

```bash
PROJECT=<projet-gcp>
REGION=europe-west1
IMAGE=$REGION-docker.pkg.dev/$PROJECT/algeria-industry/app:$(git rev-parse --short HEAD)

# Construire l'image avec les variables publiques du front
docker build \
  --build-arg VITE_APP_URL=https://algeria-industry.dz \
  --build-arg VITE_TURNSTILE_SITE_KEY=<site-key> \
  --build-arg VITE_SENTRY_DSN=<dsn-front> \
  --build-arg VITE_SUPPORT_EMAIL=support@algeria-industry.dz \
  --build-arg VITE_LEGAL_COMPANY_NAME="<raison sociale>" \
  -t $IMAGE .
docker push $IMAGE

# Déployer (secrets depuis Secret Manager)
gcloud run deploy algeria-industry \
  --image $IMAGE --region $REGION --platform managed \
  --allow-unauthenticated --port 3000 \
  --min-instances 1 --max-instances 1 \
  --memory 1Gi --cpu 1 \
  --set-env-vars NODE_ENV=production,APP_URL=https://algeria-industry.dz,BEHIND_CLOUDFLARE=true,SENDER_EMAIL=noreply@algeria-industry.dz \
  --set-secrets JWT_SECRET=jwt-secret:latest,MFA_ENCRYPTION_KEY=mfa-key:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role:latest,TURNSTILE_SECRET_KEY=turnstile-secret:latest,RESEND_API_KEY=resend-key:latest,CRON_SECRET=cron-secret:latest \
  --set-env-vars SUPABASE_URL=https://<ref>.supabase.co
```

- `--max-instances 1` tant qu'Upstash n'est pas configuré (les compteurs de
  rate limiting sont en mémoire). Avec Upstash : augmenter librement.
- `--min-instances 1` évite le démarrage à froid sur la première visite.
- Sondes : `/health` (vivant) et `/ready` (base joignable).

## 5. Domaine et Cloudflare

1. Cloud Run → **Manage custom domains** → ajouter `algeria-industry.dz` et
   `www.` ; créer chez Cloudflare les enregistrements indiqués.
2. Cloudflare : proxy activé (nuage orange), SSL **Full (strict)**,
   « Always Use HTTPS », HSTS.
3. Avec `BEHIND_CLOUDFLARE=true`, le serveur lit l'IP réelle dans
   `CF-Connecting-IP`. Cet en-tête est falsifiable si l'URL `*.run.app` reste
   joignable directement : la garder confidentielle, ou restreindre l'ingress
   Cloud Run (« Internal and Cloud Load Balancing ») derrière un load balancer.
4. Turnstile : ajouter le domaine de production au widget.

## 6. Après le premier déploiement

- [ ] Créer le compte admin, **activer sa 2FA** (obligatoire pour la console).
- [ ] Chargily : déclarer le webhook `https://<domaine>/api/payments/chargily/webhook`,
      tester avec `test_sk_…`, puis `CHARGILY_MODE=live`.
- [ ] Vérifier `robots.txt` et `sitemap.xml`, soumettre le sitemap à Google Search Console.
- [ ] Parcours complet : inscription → code e-mail → KYC → validation admin →
      publication d'un produit → souscription → facture.
- [ ] Alertes : Sentry (erreurs), Cloud Monitoring (5xx, latence), budget GCP.
- [ ] Tâche quotidienne : créer un job Cloud Scheduler qui appelle
      `POST https://<domaine>/api/cron/daily` chaque jour (ex. 6 h, fuseau
      Africa/Algiers) avec l'en-tête `Authorization: Bearer <CRON_SECRET>`.
      Elle expire les abonnements échus, envoie les rappels J-30, J-7 et
      l'avis d'expiration, puis les relances d'accompagnement des fournisseurs
      (KYC non déposé, aucun produit, fiche incomplète) ; relancée, elle ne
      renvoie aucun e-mail.
      ```bash
      gcloud scheduler jobs create http algeria-industry-daily \
        --location $REGION --schedule "0 6 * * *" --time-zone "Africa/Algiers" \
        --uri https://algeria-industry.dz/api/cron/daily --http-method POST \
        --headers "Authorization=Bearer <CRON_SECRET>"
      ```

## 7. Mesure d'audience (Plausible)

Avec `VITE_PLAUSIBLE_DOMAIN` renseigné au build, le site envoie ces
événements. Les déclarer dans Plausible > Site settings > Goals > Custom event,
avec exactement ces noms :

| Objectif | Déclenché quand |
|---|---|
| `Inscription` | un compte est créé (propriété `role`) |
| `Contact fournisseur` | premier message d'une conversation |
| `Clic WhatsApp` | clic sur le bouton WhatsApp d'une fiche entreprise ou produit |
| `Souscription` | une facture d'abonnement est émise (propriété `plan`) |
| `Paiement en ligne` | redirection vers le paiement CIB / Edahabia |
| `Telechargement catalogue` | ouverture d'un catalogue PDF |

Les statistiques des fournisseurs (vues, clics, téléchargements) sont
mesurées par l'application elle-même (table `audience_events`), sans cookie et
indépendamment de Plausible.

## 8. Mises à jour

Chaque fusion sur `main` : appliquer les nouvelles migrations **avant** de
déployer l'image qui en dépend, puis reconstruire et redéployer (section 4).
Retour arrière : voir `RUNBOOK.md` §3.
