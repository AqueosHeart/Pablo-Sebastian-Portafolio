"""Small dependency-free HTTP port with bounded transient retries."""

from __future__ import annotations

import asyncio
import json
import random
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class HttpRequestError(RuntimeError):
    def __init__(self, message: str, *, retryable: bool) -> None:
        super().__init__(message)
        self.retryable = retryable


@dataclass(frozen=True, slots=True)
class HttpResponse:
    status: int
    text: str
    url: str


class AsyncHttpClient:
    """Stdlib transport; all external calls have a timeout and bounded retries."""

    def __init__(self, *, timeout_seconds: float = 20.0, attempts: int = 3) -> None:
        self.timeout_seconds = timeout_seconds
        self.attempts = max(1, attempts)

    async def get_json(self, url: str, *, params: Mapping[str, str] | None = None) -> Any:
        response = await self.get(url, params=params)
        try:
            return json.loads(response.text)
        except json.JSONDecodeError as error:
            raise HttpRequestError(
                f"Invalid JSON from {response.url}: {error}", retryable=False
            ) from error

    async def get(self, url: str, *, params: Mapping[str, str] | None = None) -> HttpResponse:
        target = f"{url}?{urlencode(params)}" if params else url
        last_error: HttpRequestError | None = None
        for attempt in range(self.attempts):
            try:
                return await asyncio.to_thread(self._get_once, target)
            except HttpRequestError as error:
                last_error = error
                if not error.retryable or attempt + 1 == self.attempts:
                    raise
                await asyncio.sleep(min(4.0, 0.4 * (2**attempt)) + random.random() * 0.2)
        raise last_error or HttpRequestError("HTTP request failed", retryable=True)

    def _get_once(self, target: str) -> HttpResponse:
        request = Request(
            target,
            headers={
                "Accept": "application/json, text/html;q=0.9",
                "User-Agent": "CareerOS-JobScout/1.0 (+public-job-collection)",
            },
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                return HttpResponse(
                    status=response.status,
                    text=response.read().decode("utf-8", errors="replace"),
                    url=response.url,
                )
        except HTTPError as error:
            retryable = error.code in {429, 500, 502, 503, 504}
            raise HttpRequestError(
                f"HTTP {error.code} for {target}", retryable=retryable
            ) from error
        except (URLError, TimeoutError, OSError) as error:
            raise HttpRequestError(
                f"Network error for {target}: {error}", retryable=True
            ) from error
