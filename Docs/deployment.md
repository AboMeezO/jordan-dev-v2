# Deployment

The Discord bot stays local. Only the web app and backend API are meant to be hosted.

## Web: Vercel

Import `https://github.com/AboMeezO/jordan-dev-v2` in Vercel.

- Root directory: `apps/web`
- Framework preset: `TanStack Start`
- Build command: leave as detected
- Output directory: leave as detected

Environment variables:

```text
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
VITE_API_URL=https://<render-backend-url>
```

After the backend is deployed, update `VITE_API_URL` to the Render service URL and redeploy the Vercel project.

## Backend: Render

Use the root `render.yaml` blueprint, or create a free Web Service manually from the same GitHub repo.

Manual settings:

- Runtime: `Node`
- Build command: `pnpm install --frozen-lockfile && pnpm run build:shared && pnpm run build:backend`
- Start command: `pnpm --dir apps/backend start`
- Plan: `Free`

Environment variables:

```text
CLERK_SECRET_KEY=...
CLERK_JWT_KEY=...
CLERK_AUTHORIZED_PARTIES=https://<vercel-web-url>
```

Render injects `PORT`, so do not set it manually in production.

## Clerk

Configure Discord as a social connection in Clerk. The verification page expects links in this shape:

```text
https://<vercel-web-url>/?discordUserId=<discord-user-id>&guildId=<guild-id>
```

For local development:

```text
VITE_API_URL=http://localhost:3001
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
```
