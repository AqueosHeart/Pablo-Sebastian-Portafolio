from __future__ import annotations

import asyncio
import uuid
from collections.abc import Iterable
from pathlib import Path

import yaml

from .config import Settings
from .domain import JobObservation, SourceKind
from .policy import assess_eligibility
from .storage import JobRepository
from .telegram import TelegramNotifier


def _source_kind(value: str) -> SourceKind:
    return {
        "public_ats": SourceKind.EMPLOYER_ATS,
        "google_jobs_api": SourceKind.SEARCH_INDEX,
        "official_email_alert": SourceKind.OFFICIAL_EMAIL_ALERT,
        "approved_public_page": SourceKind.EMPLOYER_CAREERS_PAGE,
    }.get(value, SourceKind.EMPLOYER_CAREERS_PAGE)


def to_observation(source_job: object) -> JobObservation:
    """Translate the source port's immutable input without leaking credentials."""
    return JobObservation(
        source_name=source_job.source_name,
        source_kind=_source_kind(source_job.source_kind),
        source_url=source_job.source_url,
        raw_title=source_job.title,
        raw_company=source_job.employer,
        raw_location=source_job.location,
        raw_description=source_job.description,
        final_url=source_job.apply_url,
        source_job_id=source_job.source_job_id,
        raw_posted_at=source_job.posted_at.isoformat() if source_job.posted_at else None,
        captured_at_utc=source_job.captured_at.isoformat(),
        metadata=dict(source_job.metadata),
    )


class ScoutRunner:
    def __init__(self, settings: Settings, repository: JobRepository) -> None:
        self.settings, self.repository = settings, repository

    async def collect(
        self, sources: Iterable[object], selected_skill: str = "architecture-patterns"
    ) -> dict[str, int]:
        run_id = str(uuid.uuid4())
        self.repository.record_run_start(run_id, selected_skill)
        results = await asyncio.gather(
            *(source.collect() for source in sources), return_exceptions=True
        )
        received = eligible = failures = 0
        try:
            for result in results:
                if isinstance(result, Exception):
                    failures += 1
                    continue
                failures += len(result.failures)
                for source_job in result.jobs:
                    received += 1
                    observation = to_observation(source_job)
                    canonical = self.repository.upsert_observation(
                        observation, assess_eligibility(observation)
                    )
                    eligible += int(canonical.eligibility.eligible)
            report = {"received": received, "eligible": eligible, "failures": failures}
            self.repository.finish_run(run_id, "completed", report)
            return report
        except Exception as error:
            self.repository.finish_run(
                run_id, "failed", {"received": received, "error": type(error).__name__}
            )
            raise

    def notify_pending(self, evaluator: object | None = None) -> dict[str, int]:
        from .analysis import analyze_listing

        notifier = TelegramNotifier(
            self.settings.telegram_bot_token, self.settings.telegram_chat_id, self.settings.dry_run
        )
        sent = held = failed = 0
        for job in self.repository.eligible_unsent_jobs():
            listing = {
                "title": job.title,
                "company": job.employer,
                "location": job.location,
                "description": job.description,
                "apply_url": job.canonical_apply_url,
            }
            evaluation, gemini = analyze_listing(listing)
            self.repository.replace_technology_mentions(job.job_id, list(evaluation.skill_mentions))
            self.repository.save_gemini_result(
                job.job_id, "completed" if gemini else "fallback", gemini
            )
            score = evaluation.score
            evidence = list(evaluation.evidence) or ["passed deterministic target-market gate"]
            risks = (
                list(gemini.get("risks", []))
                if gemini
                else [
                    evaluation.analyzer_error
                    or "Gemini CLI unavailable; deterministic evaluation retained"
                ]
            )
            if score < self.settings.notification_threshold:
                held += 1
                continue
            if sent >= self.settings.max_notifications_per_run:
                held += 1
                continue
            if notifier.send(job, score, evidence, risks, getattr(evaluation, "salary", None)):
                self.repository.mark_notified(job.job_id)
                sent += 1
            else:
                failed += 1
                break
        return {
            "sent": sent,
            "held": held,
            "failed": failed,
            "configured": int(notifier.configured),
        }

    def reclassify_active_jobs(self) -> dict[str, int]:
        """Apply current deterministic policy to saved records without external delivery."""
        changed = rejected = 0
        for job in self.repository.active_jobs():
            observation = JobObservation(
                source_name="policy_recheck",
                source_kind=SourceKind.EMPLOYER_ATS,
                source_url=job.canonical_apply_url,
                final_url=job.canonical_apply_url,
                raw_title=job.title,
                raw_company=job.employer,
                raw_location=job.location,
                raw_description=job.description,
            )
            eligibility = assess_eligibility(observation)
            if eligibility != job.eligibility:
                self.repository.update_eligibility(job.job_id, eligibility)
                changed += 1
                rejected += int(not eligibility.eligible)
        return {"reclassified": changed, "rejected": rejected}


def load_ats_sources(project_root: Path):
    from .sources import AshbySource, AsyncHttpClient, GreenhouseSource, LeverSource

    contents = (
        yaml.safe_load((project_root / "config" / "ats_boards.yml").read_text(encoding="utf-8"))
        or {}
    )
    client = AsyncHttpClient()
    return [
        *[GreenhouseSource(board, client) for board in contents.get("greenhouse", [])],
        *[LeverSource(site, client) for site in contents.get("lever", [])],
        *[AshbySource(board, client) for board in contents.get("ashby", [])],
    ]


def load_google_jobs_sources(project_root: Path, settings: Settings):
    from .sources import AsyncHttpClient, SerpApiGoogleJobsSource

    contents = (
        yaml.safe_load(
            (project_root / "config" / "google_jobs_queries.yml").read_text(encoding="utf-8")
        )
        or {}
    )
    queries = contents.get("queries", [])
    if len(queries) != 7:
        raise ValueError("Google Jobs configuration must contain exactly seven broad daily queries")
    client = AsyncHttpClient()
    return [SerpApiGoogleJobsSource(query, settings.serpapi_key or "", client) for query in queries]


def load_alert_sources(settings: Settings):
    """Read official alert email only; this port never opens job-board websites."""
    from .sources import GmailAlertSource

    return [
        GmailAlertSource(
            username=settings.gmail_imap_user or "",
            app_password=settings.gmail_imap_app_password or "",
            mailbox=settings.gmail_mailbox,
        )
    ]


def load_career_page_sources(project_root: Path, settings: Settings):
    """Only instantiate pages listed in the explicit local allowlist."""
    from .sources import PublicCareerPage, ScraplingPublicPagesSource

    path = settings.approved_career_pages_file
    if not path.is_absolute():
        path = project_root / path
    contents = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    pages = tuple(PublicCareerPage(**item) for item in contents.get("pages", []))
    return [ScraplingPublicPagesSource(pages)] if pages else []
