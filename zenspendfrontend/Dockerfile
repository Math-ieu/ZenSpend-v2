# Étape 1 : Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY zenspendfrontend/package*.json ./
RUN npm install

COPY zenspendfrontend/ ./
RUN npm run build

# Étape 2 : Serveur web statique (nginx)
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
