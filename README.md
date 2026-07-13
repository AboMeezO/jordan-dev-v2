# JordanDevs Platform

Monorepo for the JordanDevs ecosystem — a Discord bot, API backend, web app, and server dashboard.

## Status

[![CI Status](https://github.com/AboMeezO/jordan-dev-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/AboMeezO/jordan-dev-v2/actions/workflows/ci.yml)

## Monorepo Map

| Package           | Description                                                                         | Stack                                    |
| ----------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `apps/bot`        | Discord bot with chat commands, production incident game, reminders, and moderation | discord.js, CommandKit, Zod              |
| `apps/backend`    | REST API for dashboard integration and verification                                 | NestJS, Fastify, Clerk                   |
| `apps/web`        | Public-facing website (verification, landing)                                       | TanStack Start, React 19, Tailwind, Vite |
| `apps/dashboard`  | Server management dashboard (**deprecated**, see its README)                        | Next.js 13, Chakra UI, React 18          |
| `packages/shared` | Shared types, Zod schemas, and utilities                                            | TypeScript, Zod                          |

## Quick Start

```bash
pnpm install
pnpm dev
```

This starts the bot. See `package.json` scripts for other targets (`dev:backend`, `dev:web`, `dev:dashboard`).

## Environment Variables

Copy `.env.example` to `.env` in the root and configure:

| Variable                   | Required For | Description                                         |
| -------------------------- | ------------ | --------------------------------------------------- |
| `TOKEN`                    | Bot          | Discord bot token                                   |
| `DEV_GUILD_ID`             | Bot          | Guild ID for dev command registration               |
| `CLERK_SECRET_KEY`         | Backend, Web | Clerk API secret                                    |
| `CLERK_PUBLISHABLE_KEY`    | Web          | Clerk publishable key                               |
| `CLERK_JWT_KEY`            | Backend      | Clerk JWT verification key                          |
| `CLERK_AUTHORIZED_PARTIES` | Backend      | Allowed CORS origins                                |
| `DISCORD_VERIFIED_ROLE_ID` | Backend      | Role ID to assign on verification                   |
| `VITE_API_URL`             | Web          | Backend URL for API calls                           |
| `OWNER_IDS`                | Bot          | Comma-separated Discord user IDs (bypass cooldowns) |
| `DEV_IDS`                  | Bot          | Comma-separated developer Discord IDs               |
| `GITHUB_TOKEN`             | Bot          | GitHub PAT (raises rate limit to 5k/hr)             |

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start the bot in watch mode      |
| `pnpm build`        | Build all packages and apps      |
| `pnpm lint`         | Run ESLint across the repo       |
| `pnpm format`       | Format all files with Prettier   |
| `pnpm format:check` | Check formatting without writing |

## Deployment

The backend is deployable on Render via `render.yaml`. Other apps can be deployed independently (Vercel, Fly.io, etc.).

## Tech Stack

- **Runtime:** Node 22, TypeScript 6, pnpm 10
- **Linting:** ESLint 10 with typescript-eslint, Prettier 3
- **Testing:** Vitest (web), tsx (bot tests)

## Verification

This project uses [Cosign](https://github.com/sigstore/cosign) to cryptographically sign release artifacts via keyless signing. You can verify the integrity and authenticity of downloaded binaries using the signature (`.sig`) and certificate (`.pem`) provided in the release assets.

### Prerequisites

Install the Cosign CLI tool:

```bash
# Using Homebrew (macOS/Linux)
brew install cosign

# Using Go
go install [github.com/sigstore/cosign/v2/cmd/cosign@latest](https://github.com/sigstore/cosign/v2/cmd/cosign@latest)
```
