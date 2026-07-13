# Contributing

## Development Workflow

```bash
pnpm install          # Install all workspace dependencies
pnpm dev              # Start the bot in watch mode
pnpm lint             # Check for lint issues
pnpm format:check     # Check Prettier formatting
pnpm format           # Auto-format everything
```

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type       | Usage                               |
| ---------- | ----------------------------------- |
| `feat`     | New feature or command              |
| `fix`      | Bug fix                             |
| `chore`    | Tooling, dependencies, config       |
| `refactor` | Code change with no behavior change |
| `style`    | Formatting, lint fixes only         |
| `docs`     | Documentation                       |
| `test`     | Adding or fixing tests              |
| `perf`     | Performance improvement             |

### Scopes

Common scopes: `bot`, `backend`, `web`, `dashboard`, `shared`, `deps`.

### Examples

```
feat(bot): add json format/validate/minify command
fix(backend): handle expired Clerk sessions
chore(deps): upgrade discord.js to v14.26
docs: add deployment guide to README
```

## Code Style

- **Quotes:** Double quotes by default (single quotes in dashboard and web — use Prettier per-app configs)
- **Semicolons:** Required
- **Trailing commas:** Always where valid
- **Imports:** Sorted automatically via `eslint-plugin-simple-import-sort`
- **Types:** Use `import type` for type-only imports
- **No unused imports:** Enforced by linter
- **No floating promises:** All async calls must be awaited or handled

## Pull Request Process

1. Create a branch from `master` with a descriptive name
2. Make your changes, keeping commits small and conventional
3. Run `pnpm lint` and `pnpm format:check` before pushing
4. Open a PR with a summary of changes and any relevant context
5. Ensure CI passes (if configured)

## Project Structure

```
apps/
  bot/        # Discord bot — chat commands, events, game engine
  backend/    # NestJS REST API
  web/        # TanStack Start public website
  dashboard/  # Deprecated Next.js dashboard
packages/
  shared/     # Shared types and schemas
```
