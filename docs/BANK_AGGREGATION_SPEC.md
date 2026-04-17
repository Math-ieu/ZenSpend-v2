# Bank Aggregation Technical Specification

## Objective
Enable ZenSpend to integrate with one or more bank aggregation providers while keeping the product independent from provider-specific APIs.

## Design Principles
- Provider-agnostic contracts at the app layer
- Minimal sensitive data persistence
- Idempotent transaction sync pipeline
- Explicit error and retry handling

## Current Foundation
- Service layer: provider client abstraction
- Sync layer: idempotent ingestion service with external transaction references
- Data models:
  - BankConnection
  - ExternalTransaction
- API endpoints:
  - GET /api/integrations/banking/status/
  - POST /api/integrations/banking/link-session/
  - POST /api/integrations/banking/callback/
  - POST /api/integrations/banking/sync/
- Test coverage for status, link-session, callback, and idempotent sync

## Environment Variables
- BANK_PROVIDER: mock, powens, bridge, tink, yapily
- BANK_PROVIDER_BASE_URL
- BANK_PROVIDER_CLIENT_ID
- BANK_PROVIDER_CLIENT_SECRET

## Proposed Next Components
### 1. Sync Job Orchestrator
- Triggered by webhook or scheduler
- Pull accounts and transactions per connection
- Store sync run metrics and status

### 2. Webhook Verification and Security
- Verify provider signatures for callback/webhook payloads
- Reject unsigned or stale callback requests

### 3. Idempotent Transaction Ingestion Hardening
- Key strategy: provider + external_account_id + external_transaction_id
- Already implemented for direct sync endpoint
- Next: extend to async sync jobs and webhook retries

### 4. Retry and Error Strategy
- Transient errors: exponential backoff
- Permanent errors: mark connection action_required

## API Contracts (v1)
### Integration Status
Response shape:
- status
- integration.provider
- integration.configured
- integration.base_url_present
- integration.client_id_present
- integration.client_secret_present
- capabilities.create_link_session

### Link Session Create
Input:
- redirect_uri (optional URL)
- state (optional)

Response:
- status
- link_session.session_id
- link_session.provider
- link_session.link_url
- link_session.expires_at
- link_session.state

## Security Checklist
- Store client secrets in environment only
- Never expose provider client secret in API response
- Validate redirect_uri domain against allow-list in production
- Add request correlation ID to integration logs
- Rotate provider credentials quarterly

## Rollout Plan
1. Keep mock provider in dev/staging
2. Add one real provider in staging
3. Test full connection and first sync flow
4. Launch progressive rollout to production users
