# Source adapters change log

## 2026-09-11

- Applied `async-python-patterns`: adapters expose an async collection boundary and
  keep blocking stdlib / Scrapling calls behind `asyncio.to_thread`.
- Applied `python-resilience`: outbound HTTP has explicit timeouts, bounded retry
  with jitter for transient errors only, and structured per-source failures instead
  of dropping the collection run.
- Policy boundary: these adapters access public ATS APIs, a user-owned Gmail alert
  mailbox, SerpApi, or explicitly allowlisted public employer pages only. They do
  not automate LinkedIn, Indeed, OCC, Computrabajo, Wellfound, logins, CAPTCHA
  solving, proxies, browser stealth, or application submission.
