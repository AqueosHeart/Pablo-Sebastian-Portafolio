from __future__ import annotations

import re
from urllib.parse import urlparse

from .domain import Eligibility, JobObservation, MarketSegment
from .hybrid import hybrid_allowed

SENIOR_TERMS = re.compile(
    r"\b(senior|sr\.?|lead|staff|principal|manager|architect|director)\b", re.IGNORECASE
)
UNPAID_TERMS = re.compile(r"\b(unpaid|sin remuneraci[oó]n|no remunerad[oa])\b", re.IGNORECASE)
US_ONLY_TERMS = re.compile(
    r"\b(us[- ]?only|u\.?s\.?\s*(citizen|resident|work authorization)|must be authorized to work in the (united states|u\.?s\.?)|no sponsorship)\b",
    re.IGNORECASE,
)
CROSS_BORDER_TERMS = re.compile(
    r"\b(mexico|m[eé]xico|latam|latin america|global|worldwide|international|contractor|employer of record|eor)\b",
    re.IGNORECASE,
)
REMOTE_TERMS = re.compile(r"\b(remote|remoto|remota|work from home|teletrabajo)\b", re.IGNORECASE)
LOCAL_TERMS = re.compile(r"\b(culiac[aá]n|sinaloa)\b", re.IGNORECASE)
YEAR_PATTERNS = [
    re.compile(
        r"\b(\d+)\s*(?:\+|plus)?\s*(?:years?|a[nñ]os?)\s+(?:of\s+)?experience\b", re.IGNORECASE
    ),
    re.compile(
        r"\b(?:experiencia\s+(?:de\s+)?)?(\d+)\s*(?:\+|m[aá]s)?\s*a[nñ]os?\b", re.IGNORECASE
    ),
]


def valid_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def inferred_experience_max(text: str) -> int | None:
    years = [int(match.group(1)) for pattern in YEAR_PATTERNS for match in pattern.finditer(text)]
    return max(years) if years else None


def assess_eligibility(job: JobObservation) -> Eligibility:
    text = f"{job.raw_title} {job.raw_location} {job.raw_description}"
    apply_url = job.final_url or job.source_url
    reasons: list[str] = []
    segments: list[MarketSegment] = []
    years = inferred_experience_max(text)
    if not valid_http_url(apply_url):
        reasons.append("invalid_apply_url")
    if SENIOR_TERMS.search(text):
        reasons.append("senior_role")
    if years is not None and years > 2:
        reasons.append("more_than_two_years")
    if UNPAID_TERMS.search(text):
        reasons.append("unpaid")
    if not hybrid_allowed(job.raw_location, job.raw_description):
        reasons.append("hybrid_not_allowed")
    if US_ONLY_TERMS.search(text):
        reasons.append("us_only_or_authorization_required")
    local = bool(LOCAL_TERMS.search(text)) and not bool(REMOTE_TERMS.search(text))
    remote = bool(REMOTE_TERMS.search(text))
    if local:
        segments.append(MarketSegment.CULIACAN_SINALOA_LOCAL)
    if remote and CROSS_BORDER_TERMS.search(text):
        if re.search(r"\b(u\.?s\.?|united states|american company)\b", text, re.IGNORECASE):
            segments.append(MarketSegment.US_REMOTE_FROM_MEXICO)
        else:
            segments.append(MarketSegment.REMOTE_MEXICO_NATIONAL)
    if not segments:
        reasons.append("outside_target_market")
    if segments:
        segments.append(MarketSegment.COMBINED_TARGET_MARKET)
    return Eligibility(
        eligible=not reasons,
        segments=tuple(segments),
        seniority="senior" if SENIOR_TERMS.search(text) else "entry_or_unspecified",
        experience_required_max_years=years,
        reasons=tuple(reasons),
    )
