"""Read-only parser for official job-alert email, never website login automation."""

from __future__ import annotations

import asyncio
import email
import imaplib
import re
from dataclasses import dataclass
from email.message import Message
from email.policy import default
from html import unescape
from html.parser import HTMLParser

from .models import CollectionResult, SourceFailure, SourceJob


class _AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href = ""
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a":
            self._href = dict(attrs).get("href") or ""
            self._parts = []

    def handle_data(self, data: str) -> None:
        if self._href:
            self._parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._href:
            self.links.append((" ".join(self._parts).strip(), self._href))
            self._href, self._parts = "", []


@dataclass(slots=True)
class GmailAlertSource:
    username: str
    app_password: str
    mailbox: str = "JobAlerts"
    host: str = "imap.gmail.com"
    max_messages: int = 100
    name: str = "gmail_official_alerts"

    async def collect(self) -> CollectionResult:
        if not self.username or not self.app_password:
            return CollectionResult(
                self.name,
                failures=(SourceFailure(self.name, "Gmail credentials are not configured", False),),
            )
        try:
            return await asyncio.to_thread(self._collect_sync)
        except (imaplib.IMAP4.error, OSError, ValueError) as error:
            return CollectionResult(
                self.name, failures=(SourceFailure(self.name, str(error), True),)
            )

    def _collect_sync(self) -> CollectionResult:
        with imaplib.IMAP4_SSL(self.host) as client:
            client.login(self.username, self.app_password)
            status, _ = client.select(self.mailbox, readonly=True)
            if status != "OK":
                raise ValueError(f"Cannot open mailbox {self.mailbox}")
            status, ids = client.search(None, "ALL")
            if status != "OK":
                raise ValueError("Cannot list Gmail alert messages")
            observations: list[SourceJob] = []
            for message_id in ids[0].split()[-self.max_messages :]:
                status, payload = client.fetch(message_id, "(BODY.PEEK[])")
                if status != "OK" or not payload or not isinstance(payload[0], tuple):
                    continue
                message = email.message_from_bytes(payload[0][1], policy=default)
                observations.extend(
                    self._parse_message(message, message_id.decode(errors="replace"))
                )
            return CollectionResult(self.name, tuple(observations))

    def _parse_message(self, message: Message, message_id: str) -> list[SourceJob]:
        sender = str(message.get("From", ""))
        subject = str(message.get("Subject", ""))
        body = _message_body(message)
        parser = _AnchorParser()
        parser.feed(body)
        platform = _platform_from_sender(sender)
        return [
            SourceJob(
                self.name,
                "official_email_alert",
                href,
                label or subject,
                "",
                "",
                _plain_text(body),
                href,
                f"{message_id}:{index}",
                metadata={"platform": platform, "sender": sender, "subject": subject},
            )
            for index, (label, href) in enumerate(parser.links)
            if href.startswith(("https://", "http://"))
        ]


def _message_body(message: Message) -> str:
    for part in message.walk():
        if (
            part.get_content_type() == "text/html"
            and part.get_content_disposition() != "attachment"
        ):
            return part.get_content()
    return message.get_body(preferencelist=("plain",)).get_content() if message.get_body() else ""


def _plain_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def _platform_from_sender(sender: str) -> str:
    lowered = sender.lower()
    for platform in ("linkedin", "indeed", "occ", "computrabajo", "wellfound"):
        if platform in lowered:
            return platform
    return "other"
