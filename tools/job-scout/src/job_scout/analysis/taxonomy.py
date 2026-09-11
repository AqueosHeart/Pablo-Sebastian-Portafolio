"""Versioned, explainable technology extraction for Job Scout.

The matcher intentionally uses only evidence in the job text.  It never maps a
language family to one of its members (for example, JavaScript is not Java).
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from dataclasses import dataclass

TAXONOMY_VERSION = "2026.09.1"


@dataclass(frozen=True)
class Technology:
    canonical: str
    family: str
    aliases: tuple[str, ...]
    exclusions: tuple[str, ...] = ()


@dataclass(frozen=True)
class SkillMention:
    skill: str
    family: str
    requirement: str  # required, preferred, mentioned
    source_span: str
    start: int
    end: int
    taxonomy_version: str = TAXONOMY_VERSION
    confidence: float = 1.0


TECHNOLOGIES: tuple[Technology, ...] = (
    Technology("JavaScript", "frontend", ("javascript", "js")),
    Technology("TypeScript", "frontend", ("typescript", "ts")),
    Technology("React", "frontend", ("react",), ("reactive", "reaction")),
    Technology("Next.js", "frontend", ("next.js", "nextjs", "next js")),
    Technology("Angular", "frontend", ("angular",)),
    Technology("Vue", "frontend", ("vue", "vue.js", "vuejs")),
    Technology("HTML", "frontend", ("html",)),
    Technology("CSS", "frontend", ("css",)),
    Technology("Tailwind CSS", "frontend", ("tailwind", "tailwind css")),
    Technology("Node.js", "backend", ("node.js", "nodejs", "node js")),
    Technology("Python", "backend", ("python",)),
    Technology("Java", "backend", ("java",), ("javascript",)),
    Technology("C#", "backend", ("c#", "c sharp", "csharp", ".net", "dotnet")),
    Technology("PHP", "backend", ("php",)),
    Technology("REST APIs", "backend", ("rest api", "restful", "rest APIs")),
    Technology("GraphQL", "backend", ("graphql",)),
    Technology("SQL", "data", ("sql",)),
    Technology("MySQL", "data", ("mysql",)),
    Technology("PostgreSQL", "data", ("postgresql", "postgres")),
    Technology("MongoDB", "data", ("mongodb", "mongo db")),
    Technology("Redis", "data", ("redis",)),
    Technology("Git", "delivery", ("git",), ("github", "gitlab")),
    Technology("Docker", "delivery", ("docker",)),
    Technology("Kubernetes", "delivery", ("kubernetes", "k8s")),
    Technology("CI/CD", "delivery", ("ci/cd", "continuous integration", "continuous delivery")),
    Technology("GitHub Actions", "delivery", ("github actions",)),
    Technology("Linux", "delivery", ("linux",)),
    Technology("AWS", "cloud", ("aws", "amazon web services")),
    Technology("Azure", "cloud", ("azure",)),
    Technology("GCP", "cloud", ("gcp", "google cloud")),
    Technology("Jest", "testing", ("jest",)),
    Technology("Playwright", "testing", ("playwright",)),
    Technology("Cypress", "testing", ("cypress",)),
    Technology("pytest", "testing", ("pytest",)),
    Technology("QA", "testing", ("qa", "quality assurance")),
    Technology("Scrum", "workplace", ("scrum", "agile")),
    Technology("Jira", "workplace", ("jira",)),
    Technology("English", "workplace", ("english", "inglés", "ingles")),
    Technology(
        "Technical Support",
        "workplace",
        ("technical support", "soporte técnico", "soporte tecnico"),
    ),
    Technology("ERP", "workplace", ("erp",)),
    Technology("Automation", "workplace", ("automation", "automatización", "automatizacion")),
)

_REQUIRED = re.compile(
    r"\b(required|requirement|must have|must|requier[ea]|obligatori[oa]|indispensable)\b",
    re.IGNORECASE,
)
_PREFERRED = re.compile(
    r"\b(preferred|nice to have|plus|desired|deseable|preferible)\b", re.IGNORECASE
)


def _alias_pattern(alias: str) -> re.Pattern[str]:
    """Match a literal alias without treating Java as JavaScript."""
    # Dots are meaningful inside aliases such as Next.js.  Letters/digits still
    # form hard boundaries, so the Java alias cannot match JavaScript.
    return re.compile(r"(?<![\w+#])" + re.escape(alias) + r"(?![\w+#])", re.IGNORECASE)


def _requirement_for(text: str, start: int) -> str:
    # A short preceding window retains source-local evidence and avoids making a
    # whole description's heading apply to unrelated skills.
    window = text[max(0, start - 160) : start]
    if _REQUIRED.search(window):
        return "required"
    if _PREFERRED.search(window):
        return "preferred"
    return "mentioned"


def extract_skill_mentions(
    text: str | None, technologies: Iterable[Technology] = TECHNOLOGIES
) -> list[SkillMention]:
    """Return one evidence-backed mention per technology occurrence.

    Source spans are persisted by callers alongside their immutable observation,
    so a later percentage or CV recommendation can be audited.
    """
    if not text:
        return []
    found: list[SkillMention] = []
    for technology in technologies:
        for alias in technology.aliases:
            for match in _alias_pattern(alias).finditer(text):
                value = match.group(0)
                if any(
                    _alias_pattern(exclusion).fullmatch(value)
                    for exclusion in technology.exclusions
                ):
                    continue
                start, end = match.span()
                line_start = text.rfind("\n", 0, start) + 1
                line_end = text.find("\n", end)
                if line_end < 0:
                    line_end = len(text)
                found.append(
                    SkillMention(
                        skill=technology.canonical,
                        family=technology.family,
                        requirement=_requirement_for(text, start),
                        source_span=text[line_start:line_end].strip()[:500],
                        start=start,
                        end=end,
                    )
                )
    # Synonyms can overlap. A canonical skill is counted once per observation,
    # with required > preferred > mentioned as the conservative evidence label.
    priority = {"required": 0, "preferred": 1, "mentioned": 2}
    deduped: dict[str, SkillMention] = {}
    for mention in sorted(
        found, key=lambda item: (item.skill, priority[item.requirement], item.start)
    ):
        deduped.setdefault(mention.skill, mention)
    return sorted(deduped.values(), key=lambda item: (item.start, item.skill))


__all__ = [
    "TAXONOMY_VERSION",
    "TECHNOLOGIES",
    "SkillMention",
    "Technology",
    "extract_skill_mentions",
]
