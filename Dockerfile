# Étape 1 : Build
FROM node:20-slim AS builder

WORKDIR /app

# Copier les fichiers de dépendances et installer TOUTES les dépendances (y compris dev)
COPY package.json package-lock.json ./
RUN npm ci

# Copier le reste du code de l'application
COPY . .

# Variables publiques du front (VITE_*) : Vite les inscrit dans le bundle au
# build. .env étant exclu de l'image, elles sont passées en --build-arg
# (voir docs/DEPLOYMENT.md). Aucune variable secrète ici.
ARG VITE_APP_URL
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_SENTRY_DSN
ARG VITE_PLAUSIBLE_DOMAIN
ARG VITE_PLAUSIBLE_SRC
ARG VITE_SUPPORT_EMAIL
ARG VITE_SUPPORT_PHONE
ARG VITE_SUPPORT_WHATSAPP
ARG VITE_LEGAL_COMPANY_NAME
ARG VITE_LEGAL_COMPANY_FORM
ARG VITE_LEGAL_ADDRESS
ARG VITE_LEGAL_RC
ARG VITE_LEGAL_NIF
ARG VITE_LEGAL_PHONE
ARG VITE_LEGAL_EMAIL
ARG VITE_LEGAL_DPO_EMAIL
ARG VITE_LEGAL_DIRECTOR
ARG VITE_LEGAL_HOST
ENV VITE_APP_URL=$VITE_APP_URL \
    VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_PLAUSIBLE_DOMAIN=$VITE_PLAUSIBLE_DOMAIN \
    VITE_PLAUSIBLE_SRC=$VITE_PLAUSIBLE_SRC \
    VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL \
    VITE_SUPPORT_PHONE=$VITE_SUPPORT_PHONE \
    VITE_SUPPORT_WHATSAPP=$VITE_SUPPORT_WHATSAPP \
    VITE_LEGAL_COMPANY_NAME=$VITE_LEGAL_COMPANY_NAME \
    VITE_LEGAL_COMPANY_FORM=$VITE_LEGAL_COMPANY_FORM \
    VITE_LEGAL_ADDRESS=$VITE_LEGAL_ADDRESS \
    VITE_LEGAL_RC=$VITE_LEGAL_RC \
    VITE_LEGAL_NIF=$VITE_LEGAL_NIF \
    VITE_LEGAL_PHONE=$VITE_LEGAL_PHONE \
    VITE_LEGAL_EMAIL=$VITE_LEGAL_EMAIL \
    VITE_LEGAL_DPO_EMAIL=$VITE_LEGAL_DPO_EMAIL \
    VITE_LEGAL_DIRECTOR=$VITE_LEGAL_DIRECTOR \
    VITE_LEGAL_HOST=$VITE_LEGAL_HOST


# Construire le front-end (Vite) et le back-end (esbuild)
RUN npm run build

# Étape 2 : Image de production finale
FROM node:20-slim

WORKDIR /app

# Définir l'environnement en production
ENV NODE_ENV=production
# Le port est dynamique et peut être injecté par l'environnement cloud (ex: Cloud Run)
ENV PORT=3000

# Copier les fichiers de dépendances pour installer uniquement celles de production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copier les fichiers construits depuis l'étape de build
COPY --from=builder /app/dist ./dist

# Templates d'e-mail lus sur disque par emailService.ts : sans eux, aucun code
# de vérification ni lien de réinitialisation ne part en production.
COPY --from=builder /app/server/services/emailTemplates ./server/services/emailTemplates

# Ne pas exécuter le serveur en root
USER node

# Exposer le port
EXPOSE ${PORT}

# Démarrer le serveur Express compilé
CMD ["node", "dist/server.cjs"]
