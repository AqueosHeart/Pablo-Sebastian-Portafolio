from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from hashlib import sha256
from typing import Any


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


class SourceKind(StrEnum):
    EMPLOYER_ATS = "employer_ats"
    EMPLOYER_CAREERS_PAGE = "employer_careers_page"
    SEARCH_INDEX = "search_index"
    OFFICIAL_EMAIL_ALERT = "official_email_alert"


class MarketSegment(StrEnum):
    CULIACAN_SINALOA_LOCAL = "culiacan_sinaloa_local"
    REMOTE_MEXICO_NATIONAL = "remote_mexico_national"
    US_REMOTE_FROM_MEXICO = "us_remote_from_mexico"
    COMBINED_TARGET_MARKET = "combined_target_market"


@dataclass(frozen=True)
class JobObservation:
    source_name: str
    source_kind: SourceKind
    source_url: str
    raw_title: str
    raw_company: str
    raw_location: str = ""
    raw_description: str = ""
    final_url: str | None = None
    source_job_id: str | None = None
    raw_posted_at: str | None = None
    captured_at_utc: str = field(default_factory=utc_now)
    http_status: int | None = None
    extraction_version: str = "v1"
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def content_sha256(self) -> str:
        material = (
            f"{self.raw_title}\n{self.raw_company}\n{self.raw_location}\n{self.raw_description}"
        )
        return sha256(material.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class Eligibility:
    eligible: bool
    segments: tuple[MarketSegment, ...]
    seniority: str
    experience_required_max_years: int | None
    reasons: tuple[str, ...]


@dataclass(frozen=True)
class CanonicalJob:
    job_id: str
    title: str
    employer: str
    location: str
    canonical_apply_url: str
    description: str
    first_seen_at: str
    last_seen_at: str
    eligibility: Eligibility
    source_count: int = 1
