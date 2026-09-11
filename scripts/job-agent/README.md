# Telegram Job Scout

Local job discovery and approval pipeline for Pablo's junior software-engineering search.

It reads public Greenhouse job boards, scores fresh roles against the software-engineering résumé, prevents duplicate notifications, and sends only strong matches to Telegram. The Telegram buttons record **Accept** or **Reject** locally. Accepting a role adds it to the preparation queue; it does not submit an application.

## Safety boundaries

- No LinkedIn or Indeed scraping or browser automation.
- No automatic application submission.
- No invented experience or screening answers.
- Telegram credentials and job decisions stay outside Git.
- Senior, lead, staff, principal, management, and internship titles are excluded by default.

## Telegram setup

The scout uses `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. It first checks this repository's `.env`, then the sibling `remotion-auto-editor/.env` so the already configured Telegram bot can be reused without copying secrets.

To use a different bot, add these values to this repository's `.env`:

```text
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_private_chat_id
```

## Commands

```bash
npm run jobs:dry-run
npm run jobs:telegram-test
npm run jobs:scan
npm run jobs:cycle
npm run jobs:listen
```

- `jobs:dry-run` searches and scores without Telegram messages.
- `jobs:scan` sends new strong matches.
- `jobs:cycle` processes pending Telegram decisions and then scans.
- `jobs:listen` keeps a low-traffic Telegram long poll open for immediate button responses. The scheduled cycle also processes queued decisions as a fallback if the listener is not running.

The scheduled automation should run `npm run jobs:cycle`. Edit `config.json`, or create ignored `config.local.json`, to change thresholds, companies, locations, or role families.
