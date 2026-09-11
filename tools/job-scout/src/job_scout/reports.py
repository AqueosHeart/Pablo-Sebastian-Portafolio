"""Manual, approval-required exports from SQLite to the separate Career OS vault."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import yaml

from .analysis import SEGMENTS, cv_evidence_matrix, demand_snapshot
from .storage import JobRepository


def _markdown_market(
    snapshot: dict[str, object], comparison: dict[str, object], evidence: dict[str, object]
) -> str:
    lines = [
        "---",
        "status: needs-approval",
        f"generated_at: {snapshot['snapshot_at']}",
        "source_of_truth: SQLite Job Scout registry",
        "---",
        "",
        f"# Market signal draft: {snapshot['segment']}",
        "",
        "This is a sanitized draft, not a CV edit or decision. Review source coverage before acting.",
        "",
        f"- Eligible analyzable jobs (30d): {snapshot['denominator']}",
        f"- Extraction coverage: {snapshot['extraction_coverage']}",
        f"- Source mix: {snapshot['source_mix']}",
        f"- Warnings: {', '.join(snapshot['warnings']) or 'none'}",
        f"- Eligible analyzable jobs (90d): {comparison['denominator']}",
        "",
        "## Skills observed",
        "",
        "| Skill | Matching jobs | Denominator | Observed demand | Status |",
        "| --- | ---: | ---: | ---: | --- |",
    ]
    for row in snapshot["skills"]:
        status = "rankable" if row["rankable"] else "; ".join(row["warnings"])
        percent = f"{row['percent']}%" if row["percent"] is not None else "n/a"
        lines.append(
            f"| {row['skill']} | {row['matching_jobs']} | {row['denominator']} | {percent} | {status} |"
        )
    lines.extend(
        (
            "",
            "## CV evidence matrix",
            "",
            f"Demand snapshot for every row: {snapshot['snapshot_at']}",
            "",
            "| Skill | Recommendation | Evidence |",
            "| --- | --- | --- |",
        )
    )
    for row in cv_evidence_matrix(snapshot, evidence):
        items = (
            "; ".join(f"[{item['artifact']}]({item['url']})" for item in row["candidate_evidence"])
            or "Build verified evidence first"
        )
        lines.append(f"| {row['skill']} | {row['recommendation']} | {items} |")
    return "\n".join(lines) + "\n"


def write_approval_drafts(
    repository: JobRepository, vault: Path, evidence_file: Path | None = None
) -> dict[str, object]:
    """Write new dated drafts only; existing notes, CVs, and decisions are never overwritten."""
    approval = vault / "Review" / "Needs Approval"
    if not approval.is_dir():
        raise FileNotFoundError(f"Career OS approval folder not found: {approval}")
    stamp = datetime.now(UTC).strftime("%Y-%m-%d")
    evidence = yaml.safe_load(evidence_file.read_text(encoding="utf-8")) if evidence_file else {}
    evidence_by_skill = evidence.get("evidence", {}) if isinstance(evidence, dict) else {}
    records_30, records_90 = repository.market_records(30), repository.market_records(90)
    written: list[str] = []
    for segment in SEGMENTS:
        path = approval / f"market-signal-{segment}-{stamp}.md"
        if path.exists():
            continue
        snapshot, comparison = (
            demand_snapshot(records_30, segment),
            demand_snapshot(records_90, segment),
        )
        path.write_text(_markdown_market(snapshot, comparison, evidence_by_skill), encoding="utf-8")
        written.append(str(path))
    pipeline_path = approval / f"weekly-pipeline-{stamp}.md"
    if not pipeline_path.exists():
        counts = repository.pipeline_counts()
        pipeline_path.write_text(
            "\n".join(
                (
                    "---",
                    "status: needs-approval",
                    f"generated_at: {datetime.now(UTC).isoformat()}",
                    "source_of_truth: SQLite Job Scout registry",
                    "---",
                    "",
                    "# Weekly pipeline draft",
                    "",
                    "No application, CV, or decision was created or changed.",
                    "",
                    *[f"- {key.replace('_', ' ')}: {value}" for key, value in counts.items()],
                    "",
                    "## Reviewer actions",
                    "",
                    "- Verify Telegram cards before applying.",
                    "- Move only approved, sanitized summaries into Jobs/Applied or Jobs/Rejected.",
                )
            ),
            encoding="utf-8",
        )
        written.append(str(pipeline_path))
    return {"written": written, "skipped_existing": 5 - len(written)}


__all__ = ["write_approval_drafts"]
