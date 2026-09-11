"""Typed, namespaced settings. Tokens stay in the process environment only."""

from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_path: Path = Field(
        default=Path("data/job_scout.sqlite3"), alias="JOB_SCOUT_DATABASE_PATH"
    )
    telegram_bot_token: str | None = Field(default=None, alias="JOB_SCOUT_TELEGRAM_BOT_TOKEN")
    telegram_chat_id: str | None = Field(default=None, alias="JOB_SCOUT_TELEGRAM_CHAT_ID")
    serpapi_key: str | None = Field(default=None, alias="JOB_SCOUT_SERPAPI_KEY")
    gmail_imap_user: str | None = Field(default=None, alias="JOB_SCOUT_GMAIL_IMAP_USER")
    gmail_imap_app_password: str | None = Field(
        default=None, alias="JOB_SCOUT_GMAIL_IMAP_APP_PASSWORD"
    )
    gmail_mailbox: str = Field(default="JobAlerts", alias="JOB_SCOUT_GMAIL_MAILBOX")
    gemini_command: str = Field(default="gemini", alias="JOB_SCOUT_GEMINI_COMMAND")
    dry_run: bool = Field(default=False, alias="JOB_SCOUT_DRY_RUN")
    notification_threshold: int = Field(default=70, alias="JOB_SCOUT_NOTIFICATION_THRESHOLD")
    max_notifications_per_run: int = Field(
        default=8, ge=1, le=20, alias="JOB_SCOUT_MAX_NOTIFICATIONS_PER_RUN"
    )
    approved_career_pages_file: Path = Field(
        default=Path("config/approved_career_pages.yml"),
        alias="JOB_SCOUT_APPROVED_CAREER_PAGES_FILE",
    )
    career_os_vault: Path = Field(
        default=Path(r"C:\Users\SEBASTIAN\Documents\Career-OS"), alias="JOB_SCOUT_CAREER_OS_VAULT"
    )
