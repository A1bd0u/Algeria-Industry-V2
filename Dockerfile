# Étape 1 : Build
FROM node:20-slim AS builder

WORKDIR /app

# Copier les fichiers de dépendances et installer TOUTES les dépendances (y compris dev)
COPY package.json package-lock.json ./
RUN npm ci

# Copier le reste du code de l'application
COPY . .

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

# Exposer le port
EXPOSE ${PORT}

# Démarrer le serveur Express compilé
CMD ["node", "dist/server.cjs"]
