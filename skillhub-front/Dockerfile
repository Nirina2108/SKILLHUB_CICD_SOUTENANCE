# ============================================================
# Frontend React — Build multi-stage
# ============================================================
# Stage 1 (builder)    : Node 22 alpine + npm ci + npm run build
# Stage 2 (production) : nginx alpine servant le bundle compilé
# ============================================================
# Usage :
#   - Production / CI : docker build -t skillhub-front .       (= stage production)
#   - Développement   : docker compose with `target: builder`  (npm run dev)
# ============================================================

# ─── Stage 1 : builder ────────────────────────────────────────
# Node 22 alpine = image officielle minimale (~50 MB).
FROM node:22-alpine AS builder

# Dossier de travail isolé.
WORKDIR /app

# On copie les manifests d'abord pour profiter du cache Docker :
# tant que package*.json ne change pas, npm install n'est pas re-exécuté.
COPY package*.json ./

# npm ci : installation déterministe basée sur package-lock.json.
# Plus rapide et reproductible que `npm install` en CI.
RUN npm ci

# On copie maintenant le code source (changements fréquents).
COPY . .

# Compilation production : génère le dossier /app/dist optimisé (minifié).
RUN npm run build

# ─── Stage 2 : production ────────────────────────────────────
# Nginx alpine : image ultralégère (~25 MB) pour servir les fichiers statiques.
FROM nginx:alpine AS production

# Copie de la configuration nginx personnalisée (SPA fallback pour React Router).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Récupère le bundle compilé depuis le stage builder.
# Pas besoin d'embarquer node_modules ni le code source : on ne sert que dist/.
COPY --from=builder /app/dist /usr/share/nginx/html

# Port HTTP standard.
EXPOSE 80

# nginx -g "daemon off;" pour rester en foreground (Docker exige un process foreground).
CMD ["nginx", "-g", "daemon off;"]
