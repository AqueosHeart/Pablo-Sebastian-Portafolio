from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parents[1] / "src"))

from job_scout.analysis import (
    analyze_listing,
    cv_evidence_matrix,
    demand_snapshot,
    evaluate_listing,
    extract_skill_mentions,
    validate_gemini_output,
)


def listing(**overrides):
    base = {
        "title": "Junior Full Stack Developer",
        "company": "Example",
        "location": "Remote, Mexico",
        "workplace_type": "remote",
        "description": "Required: Python, JavaScript, React and Next.js. 1 year of experience.",
        "apply_url": "https://jobs.example.com/apply/1",
    }
    return base | overrides


def test_taxonomy_does_not_conflate_java_javascript_or_next_react():
    skills = {item.skill for item in extract_skill_mentions("JavaScript, Java, React and Next.js")}
    assert skills == {"JavaScript", "Java", "React", "Next.js"}
    assert {item.skill for item in extract_skill_mentions("reactive JavaScript")} == {"JavaScript"}


def test_eligibility_accepts_mexico_and_rejects_nonnegotiable_risks():
    assert evaluate_listing(listing()).eligible
    assert (
        "senior_role" in evaluate_listing(listing(title="Senior Python Engineer")).rejection_reasons
    )
    assert (
        "requires_more_than_two_years"
        in evaluate_listing(listing(description="Requires 3 years of Python.")).rejection_reasons
    )
    assert (
        "unpaid_internship"
        in evaluate_listing(
            listing(title="Unpaid Intern", description="Unpaid internship")
        ).rejection_reasons
    )
    assert (
        "invalid_apply_url"
        in evaluate_listing(listing(apply_url="mailto:jobs@example.com")).rejection_reasons
    )


def test_us_roles_require_explicit_cross_border_eligibility():
    allowed = evaluate_listing(
        listing(
            location="Remote, United States",
            description="Remote from LATAM or Mexico. Contractor accepted.",
        )
    )
    denied = evaluate_listing(
        listing(
            location="Remote, United States", description="Must be authorized to work in the US."
        )
    )
    assert allowed.eligible and allowed.segment == "us_remote_from_mexico"
    assert not denied.eligible and "us_only_residency_or_authorization" in denied.rejection_reasons


def test_gemini_invalid_output_falls_back_without_losing_listing():
    review, enrichment = analyze_listing(
        listing(), gemini_runner=lambda _: {"response": "not json"}
    )
    assert review.eligible and review.evaluator == "deterministic"
    assert review.analyzer_error == "gemini_invalid_or_unavailable"
    assert enrichment is None
    assert (
        validate_gemini_output(
            {
                "response": '{"decision":"eligible","score":75,"requirements":[],"risks":[],"salary_status":"unknown"}'
            }
        )["score"]
        == 75
    )


def test_demand_counts_unique_eligible_analyzable_jobs_and_cv_evidence():
    jobs = [
        {
            "canonical_job_id": "one",
            "eligible": True,
            "analyzable": True,
            "segment": "remote_mexico_national",
            "source_name": "greenhouse",
            "skill_mentions": [{"skill": "Python", "requirement": "required"}],
        },
        {
            "canonical_job_id": "one",
            "eligible": True,
            "analyzable": True,
            "segment": "remote_mexico_national",
            "source_name": "serpapi",
            "skill_mentions": [{"skill": "Java", "requirement": "required"}],
        },
        {
            "canonical_job_id": "two",
            "eligible": True,
            "analyzable": True,
            "segment": "remote_mexico_national",
            "source_name": "lever",
            "skill_mentions": [{"skill": "Python", "requirement": "preferred"}],
        },
    ]
    snapshot = demand_snapshot(jobs, "remote_mexico_national")
    python = next(row for row in snapshot["skills"] if row["skill"] == "Python")
    assert (
        snapshot["denominator"] == 2
        and python["matching_jobs"] == 2
        and python["required_jobs"] == 1
    )
    matrix = cv_evidence_matrix(
        snapshot,
        {"Python": [{"url": "https://portfolio.example/python", "dated_at": "2026-09-01"}]},
    )
    assert (
        next(row for row in matrix if row["skill"] == "Python")["recommendation"]
        == "proven_emphasize"
    )
