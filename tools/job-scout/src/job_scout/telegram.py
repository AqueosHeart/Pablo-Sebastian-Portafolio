from __future__ import annotations

import html

import httpx

from .domain import CanonicalJob


class TelegramNotifier:
    def __init__(self, token: str | None, chat_id: str | None, dry_run: bool = False) -> None:
        self.token, self.chat_id, self.dry_run = token, chat_id, dry_run

    @property
    def configured(self) -> bool:
        return bool(self.token and self.chat_id)

    def send(
        self,
        job: CanonicalJob,
        score: int,
        evidence: list[str],
        risks: list[str],
        salary: str | None = None,
    ) -> bool:
        if not self.configured:
            return False
        body = "\n".join(
            (
                f"<b>{html.escape(job.title)}</b>",
                html.escape(job.employer),
                f"Score: <b>{score}/100</b>",
                f"Location: {html.escape(job.location or 'not stated')}",
                f"Evidence: {html.escape('; '.join(evidence) or 'deterministic eligibility')}",
                f"Salary: {html.escape(salary or 'not stated')}",
                f"Risks: {html.escape('; '.join(risks) or 'review requirements before applying')}",
                "Human approval required. This bot never applies for you.",
            )
        )
        if self.dry_run:
            return True
        try:
            response = httpx.post(
                f"https://api.telegram.org/bot{self.token}/sendMessage",
                timeout=20,
                json={
                    "chat_id": self.chat_id,
                    "text": body,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                    "reply_markup": {
                        "inline_keyboard": [
                            [{"text": "Open official application", "url": job.canonical_apply_url}]
                        ]
                    },
                },
            )
            response.raise_for_status()
            return bool(response.json().get("ok"))
        except httpx.HTTPError:
            # Leave the job unsent for a later scheduled run. Do not retry a card blindly.
            return False
