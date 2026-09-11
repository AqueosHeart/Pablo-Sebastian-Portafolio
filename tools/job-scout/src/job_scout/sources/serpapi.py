"""SerpApi Google Jobs adapter; key is supplied at runtime, never persisted."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from .http import AsyncHttpClient, HttpRequestError
from .models import CollectionResult, SourceFailure, SourceJob


@dataclass(slots=True)
class SerpApiGoogleJobsSource:
    query: str
    api_key: str
    client: AsyncHttpClient
    location: str = "Mexico"
    name: str = "serpapi_google_jobs"

    async def collect(self) -> CollectionResult:
        if not self.api_key:
            return CollectionResult(
                self.name,
                failures=(SourceFailure(self.name, "SERPAPI_KEY is not configured", False),),
            )
        try:
            payload = await self.client.get_json(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google_jobs",
                    "q": self.query,
                    "location": self.location,
                    "api_key": self.api_key,
                },
            )
            jobs: list[SourceJob] = []
            for item in payload.get("jobs_results", []):
                if not isinstance(item, Mapping):
                    continue
                apply_options = item.get("apply_options") or []
                apply_url = next(
                    (
                        str(option.get("link"))
                        for option in apply_options
                        if isinstance(option, Mapping) and option.get("link")
                    ),
                    "",
                )
                detected = item.get("detected_extensions") or {}
                jobs.append(
                    SourceJob(
                        self.name,
                        "google_jobs_api",
                        str(item.get("share_link") or apply_url),
                        str(item.get("title") or ""),
                        str(item.get("company_name") or ""),
                        str(item.get("location") or ""),
                        str(item.get("description") or ""),
                        apply_url,
                        str(item.get("job_id") or "") or None,
                        metadata={
                            "query": self.query,
                            "via": item.get("via", ""),
                            "extensions": detected,
                        },
                    )
                )
            return CollectionResult(
                self.name, tuple(job for job in jobs if job.title and job.apply_url)
            )
        except (HttpRequestError, AttributeError, TypeError) as error:
            return CollectionResult(
                self.name,
                failures=(
                    SourceFailure(self.name, str(error), getattr(error, "retryable", False)),
                ),
            )
