from job_scout.domain import JobObservation, SourceKind
from job_scout.policy import assess_eligibility
from job_scout.storage import JobRepository


def _job(**overrides):
    value = {
        "source_name": "fixture",
        "source_kind": SourceKind.EMPLOYER_ATS,
        "source_url": "https://jobs.example.com/one",
        "final_url": "https://jobs.example.com/apply/one",
        "raw_title": "Junior Software Engineer",
        "raw_company": "Example",
        "raw_location": "Remote, Mexico",
        "raw_description": "Remote role open from Mexico. Requires Python and React.",
    }
    value.update(overrides)
    return JobObservation(**value)


def test_policy_accepts_remote_mexico_and_rejects_us_only():
    accepted = assess_eligibility(_job())
    rejected = assess_eligibility(
        _job(
            raw_location="Remote, United States",
            raw_description="Remote US only. Must be authorized to work in the United States.",
        )
    )
    assert accepted.eligible
    assert not rejected.eligible
    assert "us_only_or_authorization_required" in rejected.reasons


def test_repository_deduplicates_by_canonical_application_url(tmp_path):
    repository = JobRepository(tmp_path / "scout.sqlite3")
    first = _job(source_name="greenhouse", source_url="https://board.example.com/a")
    second = _job(
        source_name="email_alert",
        source_kind=SourceKind.OFFICIAL_EMAIL_ALERT,
        source_url="https://mail.example.com/a",
    )
    one = repository.upsert_observation(first, assess_eligibility(first))
    two = repository.upsert_observation(second, assess_eligibility(second))
    assert one.job_id == two.job_id
    assert two.source_count == 2


def test_policy_rejects_hybrid_except_local_or_explicitly_rare_mexico_visits():
    rejected = assess_eligibility(
        _job(
            raw_location="Hybrid, Mexico",
            raw_description="Hybrid schedule with monthly office visits in Mexico.",
        )
    )
    culiacan = assess_eligibility(
        _job(raw_location="Hybrid, Culiacán", raw_description="Hybrid role in Culiacán.")
    )
    rare_mexico = assess_eligibility(
        _job(
            raw_location="Remote hybrid, Mexico",
            raw_description="Remote Mexico role; office visits are occasional, a few times per year.",
        )
    )
    assert "hybrid_not_allowed" in rejected.reasons
    assert culiacan.eligible
    assert rare_mexico.eligible
