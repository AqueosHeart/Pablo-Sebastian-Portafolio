"""Pure, audit-friendly market-signal and CV-evidence calculations."""

from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any

SEGMENTS = (
    "culiacan_sinaloa_local",
    "remote_mexico_national",
    "us_remote_from_mexico",
    "combined_target_market",
)


@dataclass(frozen=True)
class SkillDemand:
    skill: str
    segment: str
    matching_jobs: int
    denominator: int
    percent: float | None
    required_jobs: int
    preferred_jobs: int
    rankable: bool
    warnings: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _mentions(job: Mapping[str, Any]) -> list[Mapping[str, Any]]:
    values = job.get("skill_mentions", ())
    return [item for item in values if isinstance(item, Mapping)]


def demand_snapshot(
    jobs: Iterable[Mapping[str, Any]], segment: str, *, now: datetime | None = None
) -> dict[str, Any]:
    """Compute demand only for unique eligible analyzable canonical jobs."""
    if segment not in SEGMENTS:
        raise ValueError(f"unknown segment: {segment}")
    all_jobs = [job for job in jobs if job.get("eligible") and job.get("analyzable", True)]
    selected = (
        all_jobs
        if segment == "combined_target_market"
        else [job for job in all_jobs if job.get("segment") == segment]
    )
    unique: dict[str, Mapping[str, Any]] = {}
    for job in selected:
        key = str(
            job.get("canonical_job_id") or job.get("job_id") or job.get("canonical_apply_url") or ""
        )
        if key:
            unique.setdefault(key, job)
    selected = list(unique.values())
    denominator = len(selected)
    by_skill: dict[str, dict[str, int]] = defaultdict(
        lambda: {"matching": 0, "required": 0, "preferred": 0}
    )
    for job in selected:
        strongest: dict[str, str] = {}
        for mention in _mentions(job):
            skill = str(mention.get("skill", "")).strip()
            if not skill:
                continue
            current = strongest.get(skill)
            requirement = str(mention.get("requirement", "mentioned"))
            priority = {"required": 2, "preferred": 1, "mentioned": 0}
            if current is None or priority.get(requirement, 0) > priority.get(current, 0):
                strongest[skill] = requirement
        for skill, requirement in strongest.items():
            by_skill[skill]["matching"] += 1
            if requirement == "required":
                by_skill[skill]["required"] += 1
            elif requirement == "preferred":
                by_skill[skill]["preferred"] += 1
    source_mix = Counter(str(job.get("source_name", "unknown")) for job in selected)
    coverage = sum(bool(_mentions(job)) for job in selected) / denominator if denominator else 0.0
    warnings: list[str] = []
    if denominator < 30:
        warnings.append("sample_under_30_no_skill_ranking")
    if coverage < 0.8:
        warnings.append("extraction_coverage_below_80_percent")
    if denominator and source_mix and max(source_mix.values()) / denominator > 0.6:
        warnings.append("source_concentration_over_60_percent")
    rows: list[SkillDemand] = []
    for skill, counts in by_skill.items():
        row_warnings = list(warnings)
        if counts["matching"] < 5:
            row_warnings.append("fewer_than_five_matching_jobs")
        rankable = denominator >= 30 and counts["matching"] >= 5 and coverage >= 0.8
        rows.append(
            SkillDemand(
                skill=skill,
                segment=segment,
                matching_jobs=counts["matching"],
                denominator=denominator,
                percent=round(100 * counts["matching"] / denominator, 1) if denominator else None,
                required_jobs=counts["required"],
                preferred_jobs=counts["preferred"],
                rankable=rankable,
                warnings=tuple(dict.fromkeys(row_warnings)),
            )
        )
    return {
        "snapshot_at": (now or datetime.now(UTC)).isoformat(),
        "segment": segment,
        "denominator": denominator,
        "source_mix": dict(source_mix),
        "extraction_coverage": round(coverage, 3),
        "warnings": warnings,
        "skills": [
            row.to_dict()
            for row in sorted(rows, key=lambda item: (-item.matching_jobs, item.skill))
        ],
    }


def cv_evidence_matrix(
    snapshot: Mapping[str, Any], evidence_by_skill: Mapping[str, Iterable[Mapping[str, Any]]]
) -> list[dict[str, Any]]:
    """Separate honest CV changes from market interest with no candidate proof."""
    snapshot_at = snapshot.get("snapshot_at")
    rows: list[dict[str, Any]] = []
    for demand in snapshot.get("skills", []):
        if not isinstance(demand, Mapping):
            continue
        skill = str(demand.get("skill", ""))
        evidence = [
            dict(item)
            for item in evidence_by_skill.get(skill, ())
            if isinstance(item, Mapping) and item.get("url") and item.get("dated_at")
        ]
        if evidence:
            category = "proven_emphasize"
        elif demand.get("rankable") and (demand.get("percent") or 0) >= 20:
            category = "high_demand_requires_evidence"
        else:
            category = "not_recommended_yet"
        rows.append(
            {
                "skill": skill,
                "recommendation": category,
                "demand_snapshot_at": snapshot_at,
                "demand": dict(demand),
                "candidate_evidence": evidence,
                "traceable": bool(snapshot_at and (evidence or category != "proven_emphasize")),
            }
        )
    return rows


__all__ = ["SEGMENTS", "SkillDemand", "cv_evidence_matrix", "demand_snapshot"]
