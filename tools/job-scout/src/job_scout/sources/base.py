"""Ports for policy-safe job collection adapters."""

from __future__ import annotations

from typing import Protocol

from .models import CollectionResult


class JobSource(Protocol):
    """An asynchronous source adapter with no persistence side effects."""

    name: str

    async def collect(self) -> CollectionResult: ...
