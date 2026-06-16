# POC — Intégration bancaire Enable Banking (PSD2 / AIS)

Synchronisation des transactions en **lecture seule** via l'API
[Enable Banking](https://enablebanking.com), agrégateur Open Banking conforme
DSP2. Inscription développeur self-service (contrairement à GoCardless / ex-Nordigen,
dont les nouvelles inscriptions sont fermées). Tier gratuit pour le dev / usage perso.

Ce POC se branche sur la couche d'agrégation déjà présente (`BankConnection`,
`ExternalTransaction`, endpoints `integrations/banking/*`) — voir aussi
[`GOCARDLESS_POC.md`](GOCARDLESS_POC.md) pour le provider équivalent.

## 1. Obtenir des identifiants

1. Créer un compte sur le portail Enable Banking et enregistrer une **application**.
2. Générer une paire de clés RSA et **uploader la clé publique** sur le portail :
   ```bash
   openssl genrsa -out enablebanking_private.pem 2048
   openssl rsa -in enablebanking_private.pem -pubout -out enablebanking_public.pem
   ```
3. Récupérer l'**Application ID** (sert de `kid` dans le JWT signé).

> Le KYC société (RC/ICE) n'est requis que pour l'accès **production**. En
> **sandbox**, l'application suffit pour développer sans société immatriculée.

## 2. Configuration (`.env`)

```env
BANK_PROVIDER=enablebanking
BANK_PROVIDER_CLIENT_ID=<Application ID>
# Clé privée RSA : SOIT un chemin de fichier, SOIT le contenu PEM inline.
BANK_PROVIDER_PRIVATE_KEY_PATH=/chemin/vers/enablebanking_private.pem
# BANK_PROVIDER_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
BANK_PROVIDER_INSTITUTION_ID=        # nom d'ASPSP (cf. étape 3), requis
BANK_PROVIDER_COUNTRY=fr
BANK_PROVIDER_BASE_URL=              # vide => https://api.enablebanking.com
```

Vérifier la config :

```bash
curl -H "Authorization: Bearer <jwt>" http://localhost:8000/api/integrations/banking/status/
```

## 3. Tester end-to-end (sandbox)

```bash
# 1) Lister les banques (ASPSP) du pays pour choisir BANK_PROVIDER_INSTITUTION_ID
#    (choisir une banque sandbox pour tester sans login réel).
python manage.py sync_enablebanking --list-aspsps

# 2) Démarrer le consentement
python manage.py sync_enablebanking --email user@zenspend.local --link
#    -> affiche authorization_id + lien de consentement

# 3) Ouvrir le lien, valider le consentement. La banque redirige vers le
#    redirect_url avec ?code=<code>. Copier ce code.

# 4) Échanger le code, importer comptes + transactions
python manage.py sync_enablebanking --email user@zenspend.local --sync --code <code>
```

## 4. Flux côté API (production / frontend)

| Étape | Endpoint / appel | Rôle |
|------|----------|------|
| 1 | `POST integrations/banking/link-session/` | démarre une autorisation, renvoie le lien de consentement |
| 2 | (redirection utilisateur vers sa banque) | consentement + SCA, puis redirect avec `?code=...` |
| 3 | `EnableBankingBankProviderClient.create_session(code)` | échange le `code` → `session_id` (= `external_connection_id`) |
| 4 | `POST integrations/banking/callback/` | enregistre `BankConnection` + comptes |
| 5 | `POST integrations/banking/sync-from-provider/` | récupère et importe les transactions (dédupliquées) |

> ⚠️ **Différence avec GoCardless** : chez GoCardless le `requisition_id` (=
> `external_connection_id`) est connu dès le link-session. Chez Enable Banking,
> l'identifiant de connexion durable (`session_id`) n'existe qu'**après**
> consentement, via `create_session(code)`. Le frontend doit donc échanger le
> `code` avant d'appeler le callback (un petit endpoint d'échange côté backend
> reste à ajouter pour le flux 100 % API ; le POC le fait dans la commande).

## Détails d'implémentation

- Client : `zenspendbackend/services/bank_provider.py` → `EnableBankingBankProviderClient`.
- **Auth** : JWT **RS256** signé à chaque requête (claims `iss=enablebanking.com`,
  `aud=api.enablebanking.com`, header `kid=<Application ID>`), mis en cache ~1h.
  Nécessite `PyJWT` + `cryptography`.
- Mapping transactions Enable Banking → format interne dans `_normalize_transaction`
  (`transaction_amount.amount` + `credit_debit_indicator` pour le signe,
  `remittance_information`, `booking_date`, `status` BOOK/PDNG → cleared/pending).
- Pagination des transactions gérée via `continuation_key`.
- Déduplication / upsert : `services/bank_sync.py` (inchangé) via `ExternalTransaction`.
- Tests : `EnableBankingProviderClientTests` dans `tests.py` (HTTP + JWT mockés).

## Limites du POC / pistes production

- **Échange du code** côté API : ajouter un endpoint `POST .../session-exchange/`
  pour le flux frontend (le POC le fait dans la commande de management).
- **Consentement DSP2** à renouveler (~90 jours, `ENABLEBANKING_MAX_ACCESS_DAYS`) :
  surveiller `consent_expires_at` et relancer un link-session.
- **RGPD / Play Store** : données bancaires sensibles — chiffrement, minimisation,
  déclaration Data Safety. Voir le plan de lancement Play Store.
- Type de compte forcé à `checking` ; affiner via les métadonnées Enable Banking.
- Synchronisation à planifier (cron) plutôt que manuelle.
