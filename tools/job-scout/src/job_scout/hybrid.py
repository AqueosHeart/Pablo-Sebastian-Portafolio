"""Strict hybrid-work policy shared by ingestion and notification analysis."""

from __future__ import annotations

import re

HYBRID = re.compile(r"\b(hybrid|h[ií]brid[oa])\b", re.IGNORECASE)
CULIACAN_SINALOA = re.compile(r"\b(culiac[aá]n|sinaloa)\b", re.IGNORECASE)
MEXICO = re.compile(r"\b(m[eé]xico|mexico)\b", re.IGNORECASE)
FREQUENT_VISITS = re.compile(
    r"\b(weekly|monthly|once a week|once a month|semanal(?:mente)?|mensual(?:mente)?)\b",
    re.IGNORECASE,
)
RARE_VISITS = re.compile(
    r"\b(occasional(?:ly)?|infrequent(?:ly)?|rare(?:ly)?|as needed|ad[ -]?hoc|once per quarter|quarterly|"
    r"a few times (?:a|per) year|ocasional(?:mente)?|espor[aá]dic[oa](?:mente)?|trimestral(?:mente)?|"
    r"pocas veces (?:al|por) a[nñ]o|seg[uú]n necesidad)\b",
    re.IGNORECASE,
)


def hybrid_allowed(location: str, description: str) -> bool:
    """Allow Culiacán/Sinaloa hybrid, or explicit Mexico roles with rare visits only."""
    text = f"{location} {description}"
    if not HYBRID.search(text):
        return True
    if CULIACAN_SINALOA.search(text):
        return True
    return bool(
        MEXICO.search(text) and RARE_VISITS.search(text) and not FREQUENT_VISITS.search(text)
    )


__all__ = ["hybrid_allowed"]
