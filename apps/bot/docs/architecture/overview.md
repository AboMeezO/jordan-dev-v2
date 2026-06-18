# Bot Architecture

## Entrypoint

`apps/bot/index.ts` — loads environment variables in cascade order (root `.env` → app `.env` → `.env.local`), then creates and starts the `Bot` class.

```ts
// index.ts
config({ path: resolve(import.meta.dirname, "../../.env") });
config({ path: resolve(import.meta.dirname, ".env") });
config({ path: resolve(import.meta.dirname, ".env.local"), override: true });
```

## Bot Class

`src/app.ts` — `Bot` class initializes the Discord client with all intents, runs config validation and audit schema migration, then boots CommandKit for slash commands.

## Command Systems

Two independent command systems coexist:

1. **Slash commands** — handled by CommandKit (`src/Commands/`, `src/Events/`, `src/Validations/`)
2. **Chat commands** — custom system (`src/ChatCommands/`) with shell-like prefix syntax

## Data Flow

```
Discord Gateway → Client → Events/
  ├── messageCreate/chatCommands.ts → ChatCommandRegistry → dispatchChatCommand()
  └── (interactions) → CommandKit → Commands/
```

## Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Logger | `src/Logger/` | Zero-dependency logging with levels |
| Config | `src/config.ts` | Environment config accessors |
| Database | `src/Database/` | Multi-driver database abstraction |
| AuditLog | `src/audit-log.ts` | Command execution audit trail |
| ComponentsV2 | `src/ComponentsV2/` | Reusable Discord Components V2 builders |
| EmojiRegistry | `src/EmojiRegistry/` | Emoji config management |
