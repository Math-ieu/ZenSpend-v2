# ZenSpend Mobile

Application mobile React Native (Expo) de ZenSpend. Elle consomme la **même API
Django REST** que le frontend web (`zenspendproject`).

## Stack

- **Expo SDK 56** (React Native 0.85, React 19)
- **expo-router** — navigation file-based (`app/`)
- **expo-secure-store** — stockage des tokens JWT (access/refresh)
- **AsyncStorage** — cache du profil utilisateur
- TypeScript, sans dépendance UI lourde (StyleSheet natif)

## Configuration

L'URL de l'API est lue depuis `EXPO_PUBLIC_API_URL` (voir `.env.example`).

```bash
cp .env.example .env
# .env :
# EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

Par défaut (sans `.env`), l'app cible :
- `http://10.0.2.2:8000/api` sur l'émulateur Android (loopback hôte)
- `http://localhost:8000/api` ailleurs

> Sur un appareil physique, remplacez par l'IP LAN de votre machine
> (ex. `http://192.168.1.20:8000/api`) et autorisez cette origine dans
> `CORS_ALLOWED_ORIGINS` côté backend.

## Démarrer

```bash
npm install --legacy-peer-deps   # React 19 / react-dom peer mismatch (Expo)
npm start                        # puis 'a' (Android), 'i' (iOS), ou QR Expo Go
```

## Vérifications

```bash
npx tsc --noEmit                 # typecheck
npx expo export --platform android --output-dir /tmp/zs   # bundle Metro complet
```

## Structure

```
app/                     routes expo-router
  _layout.tsx            providers + garde d'authentification
  (auth)/                login, signup, forgot-password
  (tabs)/                Accueil, Transactions, Budgets, Comptes, Plus
  onboarding.tsx
  new-*.tsx              formulaires (transaction, compte, budget, objectif)
  goals|debts|notifications|profile.tsx
src/
  api/                   client (JWT + refresh auto), tokenStore, ressources, auth
  context/AuthContext.tsx
  components/            UI partagée (Button, Card, Field, ProgressBar…)
  lib/                   useFetch, format
  theme/                 tokens (couleurs alignées sur le web)
  types/                 types domaine (portés depuis le web)
```

## Périmètre

Parité avec le **MVP web** : auth, dashboard, transactions, comptes, budgets,
objectifs, dettes, notifications, profil. Fonctionnalités différées côté produit
(sync bancaire réelle, IA, OCR, gamification) non incluses.
