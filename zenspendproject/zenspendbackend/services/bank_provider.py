from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import os
import secrets
from typing import Dict, List, Optional


@dataclass(frozen=True)
class BankProviderConfig:
    provider: str
    base_url: str
    client_id: str
    client_secret: str

    @classmethod
    def from_env(cls) -> "BankProviderConfig":
        return cls(
            provider=os.environ.get("BANK_PROVIDER", "mock").strip().lower(),
            base_url=os.environ.get("BANK_PROVIDER_BASE_URL", "").strip(),
            client_id=os.environ.get("BANK_PROVIDER_CLIENT_ID", "").strip(),
            client_secret=os.environ.get("BANK_PROVIDER_CLIENT_SECRET", "").strip(),
        )

    def is_complete(self) -> bool:
        if self.provider == "mock":
            return True
        return bool(self.base_url and self.client_id and self.client_secret)


class BankProviderError(Exception):
    pass


@dataclass
class BankLinkSession:
    session_id: str
    provider: str
    link_url: str
    expires_at: datetime
    state: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "session_id": self.session_id,
            "provider": self.provider,
            "link_url": self.link_url,
            "expires_at": self.expires_at.isoformat(),
            "state": self.state,
        }


class BaseBankProviderClient:
    def __init__(self, config: BankProviderConfig):
        self.config = config

    @property
    def provider_name(self) -> str:
        return self.config.provider

    @property
    def is_configured(self) -> bool:
        return self.config.is_complete()

    def healthcheck(self) -> Dict[str, object]:
        return {
            "provider": self.provider_name,
            "configured": self.is_configured,
            "base_url_present": bool(self.config.base_url),
            "client_id_present": bool(self.config.client_id),
            "client_secret_present": bool(self.config.client_secret),
        }

    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        raise NotImplementedError

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        raise NotImplementedError


class MockBankProviderClient(BaseBankProviderClient):
    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        session_id = f"mock_{secrets.token_hex(8)}"
        state_token = state or secrets.token_urlsafe(24)
        callback_uri = redirect_uri or "https://example.com/zenspend/callback"
        link_url = (
            f"{callback_uri}?mock_bank_link=1"
            f"&session_id={session_id}"
            f"&provider={self.provider_name}"
            f"&state={state_token}"
        )

        return BankLinkSession(
            session_id=session_id,
            provider=self.provider_name,
            link_url=link_url,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            state=state_token,
        )

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        account_external_id = f"{external_connection_id}_main"

        return [
            {
                'id': f"{external_connection_id}_salary",
                'account_external_id': account_external_id,
                'amount': str(Decimal('2650.00')),
                'description': 'Salaire',
                'date': '2026-04-13T09:00:00+00:00',
                'payee': 'Employeur',
                'status': 'cleared',
                'notes': '',
            },
            {
                'id': f"{external_connection_id}_groceries",
                'account_external_id': account_external_id,
                'amount': str(Decimal('-64.90')),
                'description': 'Courses',
                'date': '2026-04-14T18:20:00+00:00',
                'payee': 'Supermarche',
                'status': 'cleared',
                'notes': '',
            },
            {
                'id': f"{external_connection_id}_transport",
                'account_external_id': account_external_id,
                'amount': str(Decimal('-18.40')),
                'description': 'Transport',
                'date': '2026-04-15T07:45:00+00:00',
                'payee': 'RATP',
                'status': 'cleared',
                'notes': '',
            },
        ]


class GenericConfiguredBankProviderClient(BaseBankProviderClient):
    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        if not self.is_configured:
            raise BankProviderError("Bank provider is not configured.")

        session_id = f"{self.provider_name}_{secrets.token_hex(8)}"
        state_token = state or secrets.token_urlsafe(24)
        safe_base_url = self.config.base_url.rstrip("/")
        link_url = (
            f"{safe_base_url}/connect"
            f"?client_id={self.config.client_id}"
            f"&session_id={session_id}"
            f"&state={state_token}"
        )

        if redirect_uri:
            link_url += f"&redirect_uri={redirect_uri}"

        return BankLinkSession(
            session_id=session_id,
            provider=self.provider_name,
            link_url=link_url,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            state=state_token,
        )

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        raise BankProviderError(
            f"Provider transaction sync is not implemented for '{self.provider_name}'."
        )


def get_bank_provider_client() -> BaseBankProviderClient:
    config = BankProviderConfig.from_env()

    if config.provider == "mock":
        return MockBankProviderClient(config)

    return GenericConfiguredBankProviderClient(config)
