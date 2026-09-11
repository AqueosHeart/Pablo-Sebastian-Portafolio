from __future__ import annotations

import json
import re
import sqlite3
from hashlib import sha256
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from .domain import CanonicalJob, Eligibility, JobObservation, MarketSegment, utc_now

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS observations (
  observation_id TEXT PRIMARY KEY, captured_at_utc TEXT NOT NULL, source_name TEXT NOT NULL,
  source_kind TEXT NOT NULL, source_url TEXT NOT NULL, final_url TEXT, source_job_id TEXT,
  raw_title TEXT NOT NULL, raw_company TEXT NOT NULL, raw_location TEXT NOT NULL,
  raw_description TEXT NOT NULL, raw_posted_at TEXT, http_status INTEGER,
  extraction_version TEXT NOT NULL, raw_content_sha256 TEXT NOT NULL, metadata_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL,
  active_status TEXT NOT NULL DEFAULT 'active', canonical_apply_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL, employer TEXT NOT NULL, location TEXT NOT NULL, description TEXT NOT NULL,
  seniority TEXT NOT NULL, experience_required_max_years INTEGER,
  eligible_for_target_market INTEGER NOT NULL, segments_json TEXT NOT NULL,
  rejection_reasons_json TEXT NOT NULL, duplicate_confidence REAL NOT NULL DEFAULT 1.0,
  notification_sent_at TEXT, gemini_status TEXT NOT NULL DEFAULT 'not_run', gemini_json TEXT
);
CREATE TABLE IF NOT EXISTS job_observations (
  job_id TEXT NOT NULL REFERENCES jobs(job_id), observation_id TEXT NOT NULL REFERENCES observations(observation_id),
  PRIMARY KEY(job_id, observation_id)
);
CREATE TABLE IF NOT EXISTS technology_mentions (
  mention_id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES jobs(job_id),
  observation_id TEXT NOT NULL REFERENCES observations(observation_id), skill TEXT NOT NULL,
  classification TEXT NOT NULL, source_span TEXT NOT NULL, taxonomy_version TEXT NOT NULL,
  matcher_version TEXT NOT NULL, confidence REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS run_log (
  run_id TEXT PRIMARY KEY, started_at_utc TEXT NOT NULL, completed_at_utc TEXT,
  selected_skill TEXT NOT NULL, status TEXT NOT NULL, details_json TEXT NOT NULL
);
"""


def canonical_url(raw: str) -> str:
    parts = urlsplit(raw)
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), "", ""))


def _token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def job_fingerprint(observation: JobObservation) -> str:
    stable = "|".join(
        (
            _token(observation.raw_company),
            _token(observation.raw_title),
            _token(observation.raw_location),
        )
    )
    return sha256(stable.encode()).hexdigest()[:24]


class JobRepository:
    def __init__(self, path: Path) -> None:
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA)

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def record_run_start(self, run_id: str, selected_skill: str) -> None:
        with self.connect() as db:
            db.execute(
                "INSERT INTO run_log VALUES (?, ?, NULL, ?, 'running', '{}')",
                (run_id, utc_now(), selected_skill),
            )

    def finish_run(self, run_id: str, status: str, details: dict[str, object]) -> None:
        with self.connect() as db:
            db.execute(
                "UPDATE run_log SET completed_at_utc=?, status=?, details_json=? WHERE run_id=?",
                (utc_now(), status, json.dumps(details), run_id),
            )

    def upsert_observation(
        self, observation: JobObservation, eligibility: Eligibility
    ) -> CanonicalJob:
        apply_url = canonical_url(observation.final_url or observation.source_url)
        observation_id = sha256(
            (observation.source_name + observation.source_url + observation.content_sha256).encode()
        ).hexdigest()
        fallback_id = job_fingerprint(observation)
        with self.connect() as db:
            db.execute(
                """INSERT OR IGNORE INTO observations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    observation_id,
                    observation.captured_at_utc,
                    observation.source_name,
                    observation.source_kind,
                    observation.source_url,
                    observation.final_url,
                    observation.source_job_id,
                    observation.raw_title,
                    observation.raw_company,
                    observation.raw_location,
                    observation.raw_description,
                    observation.raw_posted_at,
                    observation.http_status,
                    observation.extraction_version,
                    observation.content_sha256,
                    json.dumps(observation.metadata),
                ),
            )
            row = db.execute(
                "SELECT * FROM jobs WHERE canonical_apply_url=?", (apply_url,)
            ).fetchone()
            if row is None and observation.source_job_id:
                row = db.execute(
                    """SELECT j.* FROM jobs j JOIN job_observations jo ON jo.job_id=j.job_id
                    JOIN observations o ON o.observation_id=jo.observation_id WHERE o.source_name=? AND o.source_job_id=?""",
                    (observation.source_name, observation.source_job_id),
                ).fetchone()
            if row is None:
                row = db.execute("SELECT * FROM jobs WHERE job_id=?", (fallback_id,)).fetchone()
            if row is None:
                db.execute(
                    """INSERT INTO jobs (job_id,first_seen_at,last_seen_at,canonical_apply_url,title,employer,location,description,seniority,experience_required_max_years,eligible_for_target_market,segments_json,rejection_reasons_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        fallback_id,
                        observation.captured_at_utc,
                        observation.captured_at_utc,
                        apply_url,
                        observation.raw_title,
                        observation.raw_company,
                        observation.raw_location,
                        observation.raw_description,
                        eligibility.seniority,
                        eligibility.experience_required_max_years,
                        int(eligibility.eligible),
                        json.dumps([segment.value for segment in eligibility.segments]),
                        json.dumps(eligibility.reasons),
                    ),
                )
                row = db.execute("SELECT * FROM jobs WHERE job_id=?", (fallback_id,)).fetchone()
            else:
                db.execute(
                    "UPDATE jobs SET last_seen_at=? WHERE job_id=?",
                    (observation.captured_at_utc, row["job_id"]),
                )
                row = db.execute("SELECT * FROM jobs WHERE job_id=?", (row["job_id"],)).fetchone()
            db.execute(
                "INSERT OR IGNORE INTO job_observations VALUES (?, ?)",
                (row["job_id"], observation_id),
            )
        return self.get_job(row["job_id"])

    def get_job(self, job_id: str) -> CanonicalJob:
        with self.connect() as db:
            row = db.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
            if row is None:
                raise KeyError(job_id)
            sources = db.execute(
                "SELECT COUNT(*) FROM job_observations WHERE job_id=?", (job_id,)
            ).fetchone()[0]
        eligibility = Eligibility(
            bool(row["eligible_for_target_market"]),
            tuple(MarketSegment(item) for item in json.loads(row["segments_json"])),
            row["seniority"],
            row["experience_required_max_years"],
            tuple(json.loads(row["rejection_reasons_json"])),
        )
        return CanonicalJob(
            row["job_id"],
            row["title"],
            row["employer"],
            row["location"],
            row["canonical_apply_url"],
            row["description"],
            row["first_seen_at"],
            row["last_seen_at"],
            eligibility,
            sources,
        )

    def eligible_unsent_jobs(self) -> list[CanonicalJob]:
        with self.connect() as db:
            ids = [
                row[0]
                for row in db.execute(
                    "SELECT job_id FROM jobs WHERE eligible_for_target_market=1 AND notification_sent_at IS NULL"
                )
            ]
        return [self.get_job(job_id) for job_id in ids]

    def active_jobs(self) -> list[CanonicalJob]:
        with self.connect() as db:
            ids = [
                row[0] for row in db.execute("SELECT job_id FROM jobs WHERE active_status='active'")
            ]
        return [self.get_job(job_id) for job_id in ids]

    def update_eligibility(self, job_id: str, eligibility: Eligibility) -> None:
        with self.connect() as db:
            db.execute(
                "UPDATE jobs SET eligible_for_target_market=?, seniority=?, experience_required_max_years=?, segments_json=?, rejection_reasons_json=? WHERE job_id=?",
                (
                    int(eligibility.eligible),
                    eligibility.seniority,
                    eligibility.experience_required_max_years,
                    json.dumps([segment.value for segment in eligibility.segments]),
                    json.dumps(eligibility.reasons),
                    job_id,
                ),
            )

    def mark_notified(self, job_id: str) -> None:
        with self.connect() as db:
            db.execute("UPDATE jobs SET notification_sent_at=? WHERE job_id=?", (utc_now(), job_id))

    def replace_technology_mentions(self, job_id: str, mentions: list[object]) -> None:
        """Keep source-grounded matcher output auditable and idempotent per canonical job."""
        with self.connect() as db:
            observation = db.execute(
                "SELECT observation_id FROM job_observations WHERE job_id=? ORDER BY observation_id LIMIT 1",
                (job_id,),
            ).fetchone()
            if observation is None:
                return
            db.execute("DELETE FROM technology_mentions WHERE job_id=?", (job_id,))
            for mention in mentions:
                material = (
                    f"{job_id}|{mention.skill}|{mention.source_span}|{mention.taxonomy_version}"
                )
                db.execute(
                    "INSERT INTO technology_mentions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        sha256(material.encode()).hexdigest(),
                        job_id,
                        observation[0],
                        mention.skill,
                        mention.requirement,
                        mention.source_span,
                        mention.taxonomy_version,
                        "deterministic-v1",
                        mention.confidence,
                    ),
                )

    def save_gemini_result(
        self, job_id: str, status: str, result: dict[str, object] | None
    ) -> None:
        with self.connect() as db:
            db.execute(
                "UPDATE jobs SET gemini_status=?, gemini_json=? WHERE job_id=?",
                (status, json.dumps(result) if result else None, job_id),
            )

    def market_records(self, since_days: int) -> list[dict[str, object]]:
        """Return sanitized, traceable analytic inputs; raw descriptions never leave SQLite."""
        with self.connect() as db:
            rows = db.execute(
                """SELECT j.*, GROUP_CONCAT(DISTINCT o.source_name) AS source_names
                FROM jobs j JOIN job_observations jo ON jo.job_id=j.job_id
                JOIN observations o ON o.observation_id=jo.observation_id
                WHERE j.eligible_for_target_market=1
                  AND j.last_seen_at >= datetime('now', ?)
                GROUP BY j.job_id""",
                (f"-{since_days} days",),
            ).fetchall()
            records: list[dict[str, object]] = []
            for row in rows:
                mentions = db.execute(
                    "SELECT skill, classification AS requirement, source_span FROM technology_mentions WHERE job_id=?",
                    (row["job_id"],),
                ).fetchall()
                segments = json.loads(row["segments_json"])
                for segment in segments:
                    if segment == MarketSegment.COMBINED_TARGET_MARKET.value:
                        continue
                    records.append(
                        {
                            "job_id": row["job_id"],
                            "canonical_job_id": row["job_id"],
                            "segment": segment,
                            "eligible": True,
                            "analyzable": bool(row["description"].strip()),
                            "source_name": row["source_names"] or "unknown",
                            "last_seen_at": row["last_seen_at"],
                            "skill_mentions": [dict(item) for item in mentions],
                        }
                    )
            return records

    def pipeline_counts(self) -> dict[str, int]:
        with self.connect() as db:
            return {
                "eligible_unsent": db.execute(
                    "SELECT COUNT(*) FROM jobs WHERE eligible_for_target_market=1 AND notification_sent_at IS NULL"
                ).fetchone()[0],
                "notified": db.execute(
                    "SELECT COUNT(*) FROM jobs WHERE notification_sent_at IS NOT NULL"
                ).fetchone()[0],
                "rejected": db.execute(
                    "SELECT COUNT(*) FROM jobs WHERE eligible_for_target_market=0"
                ).fetchone()[0],
                "all_canonical_jobs": db.execute("SELECT COUNT(*) FROM jobs").fetchone()[0],
            }
