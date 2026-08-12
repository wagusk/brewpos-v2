"""M35 — Payment provider abstraction.

Pluggable payment providers: the backend never hardcodes provider logic.
Each provider implements the same protocol. The active provider is selected
per-request (cashier can pick 'mock', 'stripe', etc.) and the provider
handles initiate → confirm semantics.

To add a real provider:
    1. Create a class implementing PaymentProvider
    2. Register it in PROVIDERS dict below
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ProviderResult:
    """Result returned by every provider operation."""
    ok: bool
    external_id: str = ""
    error: str = ""
    # Whether the amount was validated against the expected amount
    # during this call.
    amount_validated: bool = False


class PaymentProvider(ABC):
    """Abstract payment provider."""

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def initiate(self, amount: float, method: str, idempotency_key: str) -> ProviderResult:
        """Start a payment. Returns an external_id to track it."""

    @abstractmethod
    def confirm(self, external_id: str, expected_amount: float) -> ProviderResult:
        """Confirm the payment succeeded. Validates amount matches."""


class MockProvider(PaymentProvider):
    """Mock provider — always succeeds, no network call.

    Used for testing and as the safe default. Generates synthetic
    external_ids so the full state machine is exercised even without
    a real payment gateway.
    """

    def __init__(self, failure_rate: float = 0.0):
        """failure_rate in [0, 1) — probability of simulate failure."""
        self._failure_rate = failure_rate
        import random
        self._rand = random.random

    @property
    def name(self) -> str:
        return "mock"

    def initiate(self, amount: float, method: str, idempotency_key: str) -> ProviderResult:
        import uuid
        ext = f"mock_{uuid.uuid4().hex[:12]}"
        # Simulate a processing delay being required — real providers
        # return immediately and the client polls/confirms later.
        return ProviderResult(ok=True, external_id=ext)

    def confirm(self, external_id: str, expected_amount: float) -> ProviderResult:
        import random
        if self._failure_rate > 0 and random.random() < self._failure_rate:
            return ProviderResult(
                ok=False, external_id=external_id,
                error="Simulated provider failure",
            )
        # Amount validation: provider confirms the exact amount captured.
        return ProviderResult(
            ok=True, external_id=external_id, amount_validated=True,
        )


# ── Registry ──────────────────────────────────────────────────────────

PROVIDERS: dict[str, type[PaymentProvider]] = {
    "mock": MockProvider,
}


def get_provider(name: str) -> PaymentProvider:
    """Resolve a provider by name. Falls back to mock for unknown names."""
    cls = PROVIDERS.get(name) or MockProvider
    return cls()


def register_provider(name: str, cls: type[PaymentProvider]) -> None:
    """Register a new provider class. Used by plugins or future integrations."""
    PROVIDERS[name] = cls
