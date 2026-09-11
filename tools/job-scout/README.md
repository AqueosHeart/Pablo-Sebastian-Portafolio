# Career Job Scout

Private, review-first discovery for entry/junior technology roles in Culiacán/Sinaloa, remote Mexico, and US-company remote roles that explicitly allow Mexico, LATAM, global, contractor, or EOR hiring.

It is deliberately **not** an application bot. It never logs into, scrapes, or automates LinkedIn, Indeed, OCC, or Computrabajo. Those platforms enter only through the user's official email alerts. Public ATS APIs, approved public career pages, and optional SerpApi Google Jobs discovery are collected as independent sources.

## Setup

Run from this directory with Python 3.11+:

```powershell
uv sync --group dev
Copy-Item .env.example .env
uv run job-scout scan --dry-run
uv run pytest
```

`JOB_SCOUT_TELEGRAM_BOT_TOKEN`, `JOB_SCOUT_TELEGRAM_CHAT_ID`, `JOB_SCOUT_SERPAPI_KEY`, and Gmail credentials are optional. Keep them in `.env`, never in the vault or source control. An unconfigured integration is skipped and recorded in the run log; jobs are retained for a later run.

## Schedules

- `ats`: every six hours.
- `alerts`: every fifteen minutes, using only official emails in Gmail.
- `career-pages`: twice daily, only URLs in `config/approved_career_pages.yml`.
- `google-jobs`: daily, using exactly the seven configured broad queries. The first execution may use `--backfill-days 30`.

Use `scripts/Register-JobScoutTasks.ps1` to register Windows tasks after reviewing it. It does not run automatically during installation.

Create non-destructive Career OS drafts manually with `uv run job-scout draft`. It writes one dated pipeline draft and four dated market-signal drafts under `Review/Needs Approval`, and refuses to overwrite an existing draft.

## Eligibility and data contract

The deterministic gate rejects senior/lead/staff roles, explicit requirements above two years, unpaid work, invalid application URLs, and US-only residency/work-authorization requirements. A US-company remote role needs explicit cross-border eligibility in its text. Gemini is a post-filter structured reviewer; its absence, auth failure, or malformed response falls back to deterministic scoring.

Skill demand is explicitly labeled “observed demand in collected eligible listings.” It is calculated from unique canonical jobs with analyzable descriptions, and retains source observations, taxonomy/matcher version, text spans, freshness, and coverage warnings in SQLite.

## Scoped skills policy

Every Job Scout code or workflow change must first select an applicable installed skill and record it in `run_log.selected_skill` or `CHANGELOG.md`. Current implementation uses `before-you-build`, `architecture-patterns`, `python-project-structure`, `python-configuration`, `python-resilience`, `async-python-patterns`, `python-testing-patterns`, `prompt-engineering-patterns`, and `llm-evaluation` as applicable. This policy is scoped to this tool; it does not modify global Codex behavior.
