from job_scout.domain import JobObservation, SourceKind
from job_scout.policy import assess_eligibility
from job_scout.reports import write_approval_drafts
from job_scout.storage import JobRepository


def test_approval_drafts_are_sanitized_and_never_overwrite(tmp_path):
    repository = JobRepository(tmp_path / "job-scout.sqlite3")
    job = JobObservation(
        source_name="greenhouse",
        source_kind=SourceKind.EMPLOYER_ATS,
        source_url="https://boards.example.com/jobs/1",
        final_url="https://boards.example.com/jobs/1/apply",
        raw_title="Junior Python Developer",
        raw_company="Example",
        raw_location="Remote Mexico",
        raw_description="Remote from Mexico. Required Python. Preferred React.",
    )
    canonical = repository.upsert_observation(job, assess_eligibility(job))

    class Mention:
        skill, requirement, source_span, taxonomy_version, confidence = (
            "Python",
            "required",
            "Required Python",
            "test",
            1.0,
        )

    repository.replace_technology_mentions(canonical.job_id, [Mention()])
    vault = tmp_path / "Career-OS" / "Review" / "Needs Approval"
    vault.mkdir(parents=True)
    first = write_approval_drafts(repository, vault.parents[1])
    second = write_approval_drafts(repository, vault.parents[1])
    assert len(first["written"]) == 5
    assert second["written"] == []
    assert all(
        "Remote from Mexico" not in path.read_text(encoding="utf-8") for path in vault.glob("*.md")
    )
