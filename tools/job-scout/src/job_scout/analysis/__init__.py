"""Public analysis API for Job Scout."""

from .demand import SEGMENTS, SkillDemand, cv_evidence_matrix, demand_snapshot
from .evaluator import (
    ListingReview,
    analyze_listing,
    classify_segment,
    evaluate_listing,
    validate_gemini_output,
)
from .taxonomy import TAXONOMY_VERSION, SkillMention, Technology, extract_skill_mentions

__all__ = [
    "SEGMENTS",
    "TAXONOMY_VERSION",
    "ListingReview",
    "SkillDemand",
    "SkillMention",
    "Technology",
    "analyze_listing",
    "classify_segment",
    "cv_evidence_matrix",
    "demand_snapshot",
    "evaluate_listing",
    "extract_skill_mentions",
    "validate_gemini_output",
]
