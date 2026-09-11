from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from .config import Settings
from .runner import (
    ScoutRunner,
    load_alert_sources,
    load_ats_sources,
    load_career_page_sources,
    load_google_jobs_sources,
)
from .storage import JobRepository


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(prog="job-scout")
    result.add_argument("command", choices=("scan", "run", "notify", "draft", "reclassify"))
    result.add_argument(
        "scope", nargs="?", choices=("ats", "google-jobs", "alerts", "career-pages")
    )
    result.add_argument("--dry-run", action="store_true")
    result.add_argument("--backfill-days", type=int, choices=(30,))
    return result


def main() -> None:
    args = parser().parse_args()
    settings = Settings(dry_run=args.dry_run)
    root = Path(__file__).resolve().parents[2]
    repo = JobRepository(
        settings.database_path
        if settings.database_path.is_absolute()
        else root / settings.database_path
    )
    runner = ScoutRunner(settings, repo)
    if args.command == "notify":
        print(runner.notify_pending())
        return
    if args.command == "draft":
        from .reports import write_approval_drafts

        print(
            write_approval_drafts(
                repo, settings.career_os_vault, root / "config" / "candidate_evidence.yml"
            )
        )
        return
    if args.command == "reclassify":
        print(runner.reclassify_active_jobs())
        return
    scope = args.scope or "ats"
    if scope == "ats":
        report = asyncio.run(runner.collect(load_ats_sources(root), "async-python-patterns"))
    elif scope == "google-jobs":
        report = asyncio.run(
            runner.collect(load_google_jobs_sources(root, settings), "python-resilience")
        )
    elif scope == "alerts":
        report = asyncio.run(runner.collect(load_alert_sources(settings), "python-configuration"))
    elif scope == "career-pages":
        report = asyncio.run(
            runner.collect(load_career_page_sources(root, settings), "async-python-patterns")
        )
    else:
        # Adapters remain intentionally disabled until their config and credentials are supplied.
        report = {
            "received": 0,
            "eligible": 0,
            "failures": 0,
            "note": f"{scope} requires configuration",
        }
    print(report)
    print(runner.notify_pending())


if __name__ == "__main__":
    main()
