# POC — Intégration bancaire GoCardless (Bank Account Data)

Synchronisation automatique des transactions via l'API **GoCardless Bank Account
Data** (ex-Nordigen), conforme DSP2 / Open Banking. Offre gratuite en EU.

Ce POC se branche sur la couche d'agrégation déjà présente (`BankConnection`,
`ExternalTransaction`, endpoints `integrations/banking/*`) — voir aussi
[`BANK_AGGREGATION_SPEC.md`](BANK_AGGREGATION_SPEC.md).

## 1. Obtenir des identifiants

1. Créer un compte sur le portail GoCardless Bank Account Data.
2. Générer une paire **secret_id / secret_key**.

## 2. Configuration (`.env`)

```env
BANK_PROVIDER=gocardless
BANK_PROVIDER_CLIENT_ID=<secret_id>
BANK_PROVIDER_CLIENT_SECRET=<secret_key>
# Optionnel :
BANK_PROVIDER_INSTITUTION_ID=        # vide => sandbox SANDBOXFINANCE_SFIN0000
BANK_PROVIDER_COUNTRY=fr
BANK_PROVIDER_BASE_URL=              # vide => https://bankaccountdata.gocardless.com
```

Vérifier la config :

```bash
curl -H "Authorization: Bearer <jwt>" http://localhost:8000/api/integrations/banking/status/
```

## 3. Tester end-to-end (sandbox, sans banque réelle)

Le sandbox `SANDBOXFINANCE_SFIN0000` renvoie comptes et transactions fictifs,
aucun login bancaire requis.

```bash
# 1) Créer le lien de consentement
python manage.py sync_gocardless --email user@zenspend.local --link
#   -> affiche requisition_id + lien de consentement

# 2) Ouvrir le lien dans un navigateur, valider le consentement (sandbox)

# 3) Importer comptes + transactions
python manage.py sync_gocardless --email user@zenspend.local --sync --requisition <requisition_id>
```

## 4. Flux côté API (production / frontend)

| Étape | Endpoint | Rôle |
|------|----------|------|
| 1 | `POST integrations/banking/link-session/` | crée une requisition, renvoie le lien de consentement |
| 2 | (redirection utilisateur vers sa banque) | consentement + SCA |
| 3 | `POST integrations/banking/callback/` | enregistre `BankConnection` + comptes (le frontend fournit les comptes après lecture de la requisition) |
| 4 | `POST integrations/banking/sync-from-provider/` | récupère et importe les transactions (dédupliquées) |

## Détails d'implémentation

- Client : `zenspendbackend/services/bank_provider.py` → `GoCardlessBankProviderClient`.
- Mapping transactions GoCardless → format interne dans `_normalize_transaction`
  (`transactionAmount.amount`, `remittanceInformationUnstructured`, `bookingDate`…).
- Déduplication / upsert : `services/bank_sync.py` (inchangé) via `ExternalTransaction`.
- Tests : `GoCardlessProviderClientTests` dans `tests.py` (HTTP mocké).

## Limites du POC / pistes production

- **Token** récupéré à chaque requête (pas de cache) — à mettre en cache (Django
  cache / refresh token) pour la prod.
- **Consentement DSP2** à renouveler (~90 jours) : surveiller `consent_expires_at`
  et relancer un link-session.
- **RGPD / Play Store** : données bancaires sensibles — chiffrement, minimisation,
  déclaration Data Safety. Voir le plan de lancement Play Store.
- Type de compte forcé à `checking` ; affiner via les métadonnées GoCardless.
- Synchronisation à planifier (cron) plutôt que manuelle.
