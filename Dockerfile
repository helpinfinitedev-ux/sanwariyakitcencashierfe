# syntax=docker/dockerfile:1

# ---- Stage 1: build the Vite SPA ----
FROM node:22-alpine AS build

WORKDIR /app

# Vite inlines env vars at build time, so the API URL must be present
# during `vite build`. Pass it with --build-arg to avoid baking in the
# localhost value from the committed .env file.
ARG VITE_PUBLIC_API_URL
ENV VITE_PUBLIC_API_URL=${VITE_PUBLIC_API_URL}

# Install dependencies against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the static output into /app/dist.
COPY . .
RUN npm run build

# ---- Stage 2: serve the static files with nginx ----
FROM nginx:1.27-alpine AS runtime

# Cloud Run injects PORT (default 8080); nginx renders this into its
# config via the official image's envsubst template mechanism.
ENV PORT=8080

# SPA-aware nginx config (template is processed on container start).
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy the built assets.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# The nginx:alpine entrypoint runs envsubst over /etc/nginx/templates/*
# and then starts nginx in the foreground.
CMD ["nginx", "-g", "daemon off;"]
