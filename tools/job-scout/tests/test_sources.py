from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from job_scout.sources import AshbySource, GreenhouseSource, LeverSource, SerpApiGoogleJobsSource


class FakeClient:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    async def get_json(self, url, *, params=None):
        self.calls.append((url, params))
        return self.payload


def test_greenhouse_keeps_direct_url_and_source_id():
    client = FakeClient(
        {
            "jobs": [
                {
                    "id": 12,
                    "title": "Junior Python Developer",
                    "absolute_url": "https://boards.greenhouse.io/acme/jobs/12",
                    "location": {"name": "Remote - Mexico"},
                    "content": "Python",
                }
            ]
        }
    )
    result = asyncio.run(GreenhouseSource("acme", client).collect())
    assert result.failures == ()
    assert result.jobs[0].source_job_id == "12"
    assert result.jobs[0].apply_url.endswith("/12")
    assert client.calls[0][1] == {"content": "true"}


def test_lever_parses_location_without_account_access():
    client = FakeClient(
        [
            {
                "id": "abc",
                "text": "QA Engineer",
                "hostedUrl": "https://jobs.lever.co/acme/abc",
                "applyUrl": "https://jobs.lever.co/acme/abc/apply",
                "descriptionPlain": "Entry level",
                "categories": {"location": "Mexico", "commitment": "Full-time"},
            }
        ]
    )
    result = asyncio.run(LeverSource("acme", client).collect())
    assert result.jobs[0].location == "Mexico"
    assert result.jobs[0].apply_url.endswith("/apply")


def test_ashby_tolerates_missing_optional_timestamp():
    client = FakeClient(
        {
            "jobs": [
                {
                    "id": "a1",
                    "title": "Support Engineer",
                    "jobUrl": "https://jobs.ashbyhq.com/acme/a1",
                    "location": "Culiacan",
                }
            ]
        }
    )
    result = asyncio.run(AshbySource("acme", client).collect())
    assert len(result.jobs) == 1
    assert result.jobs[0].posted_at is None


def test_serpapi_requires_key_and_only_returns_applicable_jobs():
    no_key = asyncio.run(SerpApiGoogleJobsSource("junior remote", "", FakeClient({})).collect())
    assert no_key.jobs == ()
    assert "not configured" in no_key.failures[0].message
    client = FakeClient(
        {
            "jobs_results": [
                {
                    "job_id": "g1",
                    "title": "Junior React",
                    "company_name": "Acme",
                    "location": "Remote Mexico",
                    "description": "React",
                    "apply_options": [{"link": "https://apply.example/g1"}],
                }
            ]
        }
    )
    result = asyncio.run(
        SerpApiGoogleJobsSource("junior remote", "secret-not-logged", client).collect()
    )
    assert result.jobs[0].source_job_id == "g1"
    assert "secret-not-logged" not in repr(result)
