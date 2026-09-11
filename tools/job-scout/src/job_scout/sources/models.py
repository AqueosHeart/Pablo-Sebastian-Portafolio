"""Source-neutral input models. Persistence and scoring live outside this package."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True, slots=True)
class SourceJob:
    """An immutable observation collected from one permitted source."""

    source_name: str
    source_kind: str
    source_url: str
    title: str
    employer: str
    location: str = ""
    description: str = ""
    apply_url: str = ""
    source_job_id: str | None = None
    posted_at: datetime | None = None
    captured_at: datetime = field(default_factory=utc_now)
    metadata: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class SourceFailure:
    source_name: str
    message: str
    retryable: bool


@dataclass(frozen=True, slots=True)
class CollectionResult:
    source_name: str
    jobs: tuple[SourceJob, ...] = ()
    failures: tuple[SourceFailure, ...] = ()
