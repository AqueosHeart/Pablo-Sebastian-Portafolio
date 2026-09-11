"""Policy-safe external source adapters for the Job Scout."""

from .ats import AshbySource, GreenhouseSource, LeverSource
from .base import JobSource
from .gmail_alerts import GmailAlertSource
from .http import AsyncHttpClient, HttpRequestError
from .models import CollectionResult, SourceFailure, SourceJob
from .scrapling_pages import PublicCareerPage, ScraplingPublicPagesSource
from .serpapi import SerpApiGoogleJobsSource

__all__ = [
    "AshbySource",
    "AsyncHttpClient",
    "CollectionResult",
    "GmailAlertSource",
    "GreenhouseSource",
    "HttpRequestError",
    "JobSource",
    "LeverSource",
    "PublicCareerPage",
    "ScraplingPublicPagesSource",
    "SerpApiGoogleJobsSource",
    "SourceFailure",
    "SourceJob",
]
