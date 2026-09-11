"""Allowlisted public employer pages via Scrapling, deliberately without stealth."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from html import unescape
from urllib.parse import urlparse

from .models import CollectionResult, SourceFailure, SourceJob


@dataclass(frozen=True, slots=True)
class PublicCareerPage:
    url: str
    employer: str
    allowlisted_host: str
    job_selector: str
    title_selector: str = "a"
    link_selector: str = "a"
    location_selector: str = ""


class ScraplingPublicPagesSource:
    """Static Fetcher only. Config and code intentionally expose no bypass options."""

    name = "allowlisted_public_career_page"

    def __init__(self, pages: tuple[PublicCareerPage, ...]) -> None:
        self.pages = pages

    async def collect(self) -> CollectionResult:
        jobs: list[SourceJob] = []
        failures: list[SourceFailure] = []
        for page in self.pages:
            try:
                jobs.extend(await asyncio.to_thread(self._fetch_page, page))
            except (ImportError, OSError, ValueError, AttributeError) as error:
                failures.append(SourceFailure(self.name, f"{page.url}: {error}", False))
        return CollectionResult(self.name, tuple(jobs), tuple(failures))

    def _fetch_page(self, page: PublicCareerPage) -> list[SourceJob]:
        host = (urlparse(page.url).hostname or "").lower()
        approved = page.allowlisted_host.lower()
        if host != approved and not host.endswith(f".{approved}"):
            raise ValueError("career page host is not explicitly allowlisted")
        try:
            from scrapling import Fetcher  # type: ignore[import-not-found]
        except ImportError as error:
            raise ImportError(
                "Install Scrapling to enable allowlisted public career pages"
            ) from error
        # Fetcher is intentionally vanilla: no DynamicFetcher, stealth, proxies, login, or CAPTCHA handling.
        response = Fetcher.get(page.url)
        observations: list[SourceJob] = []
        for index, card in enumerate(response.css(page.job_selector)):
            title = _selector_text(card, page.title_selector)
            href = _selector_attr(card, page.link_selector, "href")
            if href.startswith("/"):
                href = f"{urlparse(page.url).scheme}://{host}{href}"
            if title and href.startswith(("https://", "http://")):
                observations.append(
                    SourceJob(
                        self.name,
                        "allowlisted_public_page",
                        page.url,
                        title,
                        page.employer,
                        _selector_text(card, page.location_selector)
                        if page.location_selector
                        else "",
                        _selector_text(card, "*"),
                        href,
                        f"{host}:{index}",
                        metadata={"allowlisted_host": approved},
                    )
                )
        return observations


def _selector_text(node: object, selector: str) -> str:
    selection = node.css(selector)  # type: ignore[attr-defined]
    return unescape(" ".join(selection.getall())).strip()  # type: ignore[attr-defined]


def _selector_attr(node: object, selector: str, attribute: str) -> str:
    selection = node.css(selector)  # type: ignore[attr-defined]
    return str(selection.attrib.get(attribute, ""))  # type: ignore[attr-defined]
