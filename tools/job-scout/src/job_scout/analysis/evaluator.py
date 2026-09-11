"""Deterministic job eligibility and optional Gemini CLI review."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from collections.abc import Callable, Mapping
from dataclasses import asdict, dataclass
from typing import Any
from urllib.parse import urlparse

from job_scout.hybrid import hybrid_allowed

from .taxonomy import SkillMention, extract_skill_mentions

SENIORITY_RULE_VERSION = "2026.09.1"
_SENIOR = re.compile(
    r"\b(senior|sr\.?|lead|staff|principal|architect|manager|director|gerente|jefe)\b",
    re.IGNORECASE,
)
_UNPAID = re.compile(
    r"\b(unpaid|without pay|sin remuneraci[oó]n|no remunerad[oa])\b", re.IGNORECASE
)
_INTERNSHIP = re.compile(r"\b(intern(ship)?|practicante|becari[oa]|pasant[ií]a)\b", re.IGNORECASE)
_US_ONLY = re.compile(
    r"\b(us (citizen|residen|work authorization)|authorized to work in (the )?u\.?s\.?|must (be )?(located|reside) in (the )?u\.?s\.?|no sponsorship)\b",
    re.IGNORECASE,
)
_CROSS_BORDER = re.compile(
    r"\b(mexico|méxico|latam|latin america|global|worldwide|contractor|employer of record|\beor\b)\b",
    re.IGNORECASE,
)
_YEAR_PATTERNS = (
    re.compile(r"\b(\d+)\s*(?:\+|or more)?\s*years?\b", re.IGNORECASE),
    re.compile(r"\b(\d+)\s*(?:a|to|-)\s*(\d+)\s*years?\b", re.IGNORECASE),
    re.compile(r"\b(\d+)\s*a[nñ]os?\b", re.IGNORECASE),
)


@dataclass(frozen=True)
class ListingReview:
    eligible: bool
    score: int
    segment: str | None
    rejection_reasons: tuple[str, ...] = ()
    evidence: tuple[str, ...] = ()
    skill_mentions: tuple[SkillMention, ...] = ()
    evaluator: str = "deterministic"
    analyzer_error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["skill_mentions"] = [asdict(item) for item in self.skill_mentions]
        return payload


def _valid_apply_url(value: object) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"https", "http"} and bool(parsed.netloc)


def _years_over_two(text: str) -> bool:
    for expression in _YEAR_PATTERNS:
        for match in expression.finditer(text):
            values = [int(part) for part in match.groups() if part]
            if values and max(values) > 2:
                return True
    return False


def classify_segment(listing: Mapping[str, Any]) -> str | None:
    """Classify only markets the candidate explicitly targets."""
    location = str(listing.get("location", ""))
    text = " ".join(
        str(listing.get(key, "")) for key in ("title", "description", "workplace_type", "country")
    )
    combined = f"{location} {text}"
    local = re.search(r"culiac[aá]n|sinaloa", combined, re.IGNORECASE)
    remote = re.search(r"\bremote|remoto|home office\b", combined, re.IGNORECASE)
    mexico = re.search(r"m[eé]xico|mexico", combined, re.IGNORECASE)
    us_signal = re.search(r"\b(?:united states|u\.?s\.?|usa|american)\b", combined, re.IGNORECASE)
    if local and not remote:
        return "culiacan_sinaloa_local"
    if remote and us_signal:
        return "us_remote_from_mexico" if _CROSS_BORDER.search(combined) else None
    if remote and mexico:
        return "remote_mexico_national"
    # A global/LATAM remote job is valid US/international only when it says so.
    if remote and _CROSS_BORDER.search(combined):
        return "us_remote_from_mexico"
    return None


def evaluate_listing(
    listing: Mapping[str, Any], *, candidate_skills: set[str] | None = None
) -> ListingReview:
    """Apply non-negotiable safeguards before any model call or notification."""
    title = str(listing.get("title", ""))
    description = str(listing.get("description", ""))
    combined = f"{title}\n{description}"
    reasons: list[str] = []
    evidence: list[str] = []
    if not _valid_apply_url(listing.get("apply_url")):
        reasons.append("invalid_apply_url")
    if _SENIOR.search(title):
        reasons.append("senior_role")
    if _years_over_two(combined):
        reasons.append("requires_more_than_two_years")
    if _UNPAID.search(combined) and _INTERNSHIP.search(combined):
        reasons.append("unpaid_internship")
    if not hybrid_allowed(str(listing.get("location", "")), combined):
        reasons.append("hybrid_not_allowed")
    if _US_ONLY.search(combined):
        reasons.append("us_only_residency_or_authorization")
    segment = classify_segment(listing)
    if segment is None:
        reasons.append("outside_target_market_or_unproven_cross_border_eligibility")
    mentions = tuple(extract_skill_mentions(combined))
    if segment:
        evidence.append(f"market:{segment}")
    if mentions:
        evidence.append("skills:" + ", ".join(item.skill for item in mentions))
    if reasons:
        return ListingReview(
            False, 0, segment, tuple(dict.fromkeys(reasons)), tuple(evidence), mentions
        )
    candidate_skills = {value.casefold() for value in (candidate_skills or set())}
    matched = sum(mention.skill.casefold() in candidate_skills for mention in mentions)
    title_bonus = (
        20 if re.search(r"\b(junior|entry|associate|trainee|jr\.?)\b", title, re.IGNORECASE) else 8
    )
    score = min(100, 48 + title_bonus + min(20, len(mentions) * 3) + min(12, matched * 4))
    return ListingReview(True, score, segment, (), tuple(evidence), mentions)


GEMINI_SCHEMA = {
    "decision": "eligible|ineligible",
    "score": "integer 0..100",
    "requirements": ["short, source-grounded strings"],
    "risks": ["short, source-grounded strings"],
    "salary_status": "disclosed|not_disclosed|unknown",
}


def build_gemini_prompt(listing: Mapping[str, Any], deterministic: ListingReview) -> str:
    """A small, versionable prompt. The model may refine, never override gates."""
    safe = {
        key: listing.get(key)
        for key in ("title", "company", "location", "description", "apply_url")
    }
    return (
        "You review one already-filtered entry-level job. Use only listing text. "
        "Do not infer residency eligibility, skills, salary, or experience. Return ONLY valid JSON with exactly "
        f"these fields: {json.dumps(GEMINI_SCHEMA)}. Deterministic evidence: {json.dumps(deterministic.to_dict())}. "
        f"Listing: {json.dumps(safe, ensure_ascii=False)}"
    )


def validate_gemini_output(payload: object) -> dict[str, Any] | None:
    """Validate untrusted CLI output before it can affect a Telegram card."""
    if not isinstance(payload, Mapping):
        return None
    # Gemini CLI wraps its text in `response`; tolerate this documented outer shape.
    candidate: object = payload.get("response", payload)
    if isinstance(candidate, str):
        try:
            candidate = json.loads(candidate)
        except json.JSONDecodeError:
            return None
    if not isinstance(candidate, Mapping):
        return None
    if set(candidate) != {"decision", "score", "requirements", "risks", "salary_status"}:
        return None
    if candidate.get("decision") not in {"eligible", "ineligible"}:
        return None
    score = candidate.get("score")
    if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 100:
        return None
    if candidate.get("salary_status") not in {"disclosed", "not_disclosed", "unknown"}:
        return None
    if not all(
        isinstance(candidate.get(key), list)
        and all(isinstance(item, str) for item in candidate[key])
        for key in ("requirements", "risks")
    ):
        return None
    return dict(candidate)


def run_gemini_cli(prompt: str, *, timeout_seconds: int = 45) -> dict[str, Any] | None:
    """Headless Gemini invocation. Missing auth/CLI is an expected fallback path."""
    executable = shutil.which("gemini")
    if not executable:
        return None
    try:
        completed = subprocess.run(
            [executable, "-p", prompt, "--output-format", "json"],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if completed.returncode != 0:
        return None
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError:
        return None


def analyze_listing(
    listing: Mapping[str, Any],
    *,
    candidate_skills: set[str] | None = None,
    gemini_runner: Callable[[str], object] | None = None,
) -> tuple[ListingReview, dict[str, Any] | None]:
    """Return deterministic eligibility and optional, validated Gemini enrichment.

    Failure never loses a queued job: callers persist the deterministic review and
    retry status rather than re-collecting or notifying twice.
    """
    deterministic = evaluate_listing(listing, candidate_skills=candidate_skills)
    if not deterministic.eligible:
        return deterministic, None
    runner = gemini_runner or run_gemini_cli
    try:
        enriched = validate_gemini_output(runner(build_gemini_prompt(listing, deterministic)))
    except (
        OSError,
        RuntimeError,
        TypeError,
        ValueError,
    ) as error:  # Boundary adapter failure, not a model decision.
        return ListingReview(
            **{**deterministic.__dict__, "analyzer_error": type(error).__name__}
        ), None
    if enriched is None:
        return ListingReview(
            **{**deterministic.__dict__, "analyzer_error": "gemini_invalid_or_unavailable"}
        ), None
    # No model can undo deterministic eligibility. It can only lower the final
    # relevance score and add traceable requirements/risks.
    reviewed = ListingReview(
        eligible=True,
        score=min(deterministic.score, enriched["score"])
        if enriched["decision"] == "ineligible"
        else enriched["score"],
        segment=deterministic.segment,
        rejection_reasons=deterministic.rejection_reasons,
        evidence=deterministic.evidence,
        skill_mentions=deterministic.skill_mentions,
        evaluator="gemini_cli",
    )
    return reviewed, enriched


__all__ = [
    "GEMINI_SCHEMA",
    "SENIORITY_RULE_VERSION",
    "ListingReview",
    "analyze_listing",
    "build_gemini_prompt",
    "classify_segment",
    "evaluate_listing",
    "run_gemini_cli",
    "validate_gemini_output",
]
