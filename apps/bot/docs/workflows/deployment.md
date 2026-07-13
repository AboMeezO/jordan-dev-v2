# Deployment

## Build

```bash
pnpm --dir apps/bot build
```

## Environment

Required environment variables (see `apps/bot/.env.example`):

- `TOKEN` — Discord bot token
- `DEV_GUILD_ID` — Dev guild for slash command registration

Optional:

- `PREFIX` — Chat command prefix (default `!`)
- `OWNER_IDS` — Comma-separated Discord user IDs
- `DEV_IDS` — Comma-separated dev user IDs
- `GITHUB_TOKEN` — GitHub API token
- `VIRUSTOTAL_API_KEY` — VirusTotal API key
- `DATABASE_DRIVER` — Database driver (default `sqlite`)
- `DATABASE_URL` — Database connection URL
- `JOBS_CHANNEL` — Jobs channel ID

## Start

```bash
pnpm --dir apps/bot start
```

## Env Loading Order

1. Root `.env` (`../../.env`)
2. App `.env` (`apps/bot/.env`)
3. App `.env.local` (overrides, gitignored)
