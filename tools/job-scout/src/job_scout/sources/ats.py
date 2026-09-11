"""Public, documented-style ATS endpoints. No account or browser automation."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime

from .http import AsyncHttpClient, HttpRequestError
from .models import CollectionResult, SourceFailure, SourceJob


def _text(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def _location(value: object) -> str:
    if isinstance(value, Mapping):
        return _text(value.get("name")) or _text(value.get("location"))
    return _text(value)


def _failure(name: str, error: Exception) -> CollectionResult:
    return CollectionResult(
        name, failures=(SourceFailure(name, str(error), getattr(error, "retryable", False)),)
    )


@dataclass(slots=True)
class GreenhouseSource:
    board_token: str
    client: AsyncHttpClient
    name: str = "greenhouse"

    async def collect(self) -> CollectionResult:
        try:
            payload = await self.client.get_json(
                f"https://boards-api.greenhouse.io/v1/boards/{self.board_token}/jobs",
                params={"content": "true"},
            )
            jobs = tuple(
                SourceJob(
                    self.name,
                    "public_ats",
                    _text(item.get("absolute_url")),
                    _text(item.get("title")),
                    self.board_token,
                    _location(item.get("location")),
                    _text(item.get("content")),
                    _text(item.get("absolute_url")),
                    str(item.get("id")),
                    metadata={
                        "board": self.board_token,
                        "departments": item.get("departments", []),
                    },
                )
                for item in payload.get("jobs", [])
                if _text(item.get("title")) and _text(item.get("absolute_url"))
            )
            return CollectionResult(self.name, jobs)
        except (HttpRequestError, AttributeError, TypeError) as error:
            return _failure(self.name, error)


@dataclass(slots=True)
class LeverSource:
    site: str
    client: AsyncHttpClient
    name: str = "lever"

    async def collect(self) -> CollectionResult:
        try:
            payload = await self.client.get_json(
                f"https://api.lever.co/v0/postings/{self.site}", params={"mode": "json"}
            )
            jobs = tuple(
                SourceJob(
                    self.name,
                    "public_ats",
                    _text(item.get("hostedUrl")),
                    _text(item.get("text")),
                    self.site,
                    _location(item.get("categories", {}).get("location")),
                    _text(item.get("descriptionPlain")) or _text(item.get("description")),
                    _text(item.get("applyUrl")) or _text(item.get("hostedUrl")),
                    _text(item.get("id")),
                    metadata={
                        "site": self.site,
                        "commitment": item.get("categories", {}).get("commitment", ""),
                        "workplaceType": item.get("workplaceType", ""),
                    },
                )
                for item in payload
                if isinstance(item, Mapping)
                and _text(item.get("text"))
                and _text(item.get("hostedUrl"))
            )
            return CollectionResult(self.name, jobs)
        except (HttpRequestError, AttributeError, TypeError) as error:
            return _failure(self.name, error)


@dataclass(slots=True)
class AshbySource:
    board_name: str
    client: AsyncHttpClient
    name: str = "ashby"

    async def collect(self) -> CollectionResult:
        try:
            payload = await self.client.get_json(
                f"https://api.ashbyhq.com/posting-api/job-board/{self.board_name}"
            )
            jobs = tuple(
                SourceJob(
                    self.name,
                    "public_ats",
                    _text(item.get("jobUrl")) or _text(item.get("applyUrl")),
                    _text(item.get("title")),
                    self.board_name,
                    _text(item.get("location")),
                    _text(item.get("descriptionPlain")) or _text(item.get("descriptionHtml")),
                    _text(item.get("applyUrl")) or _text(item.get("jobUrl")),
                    _text(item.get("id")),
                    _parse_timestamp(item.get("publishedAt")),
                    metadata={
                        "board": self.board_name,
                        "workplaceType": item.get("workplaceType", ""),
                    },
                )
                for item in payload.get("jobs", [])
                if _text(item.get("title"))
                and (_text(item.get("jobUrl")) or _text(item.get("applyUrl")))
            )
            return CollectionResult(self.name, jobs)
        except (HttpRequestError, AttributeError, TypeError) as error:
            return _failure(self.name, error)


def _parse_timestamp(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None
