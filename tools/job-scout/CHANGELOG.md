# Change log

## 2026-09-11 - Initial Python replacement foundation

Selected skills: `before-you-build`, `architecture-patterns`, `python-project-structure`, `python-configuration`, `python-resilience`, and `python-testing-patterns`.

Risk verdict: preserve the existing Node implementation until this package passes its parity tests; prohibit account automation; persist before AI evaluation or Telegram delivery so outages cannot lose candidates.

## 2026-09-11 - Telegram burst protection

Selected skill: `python-resilience`. Telegram delivery is bounded to eight cards per run; a transport or rate-limit failure stops that run and leaves every unsent job in SQLite for a later cycle.

## 2026-09-11 - Hybrid location policy

Selected skill: `python-testing-patterns`. Reject hybrid jobs by default. Exceptions are hybrid jobs in Culiacán/Sinaloa and Mexico-eligible roles whose text explicitly limits visits to rare or occasional occurrences, never weekly or monthly. Existing records can be safely reclassified without delivery.
