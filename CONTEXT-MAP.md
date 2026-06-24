# Jordan Devs Platform — Context Map

| Context | Scope | Lives in | Doc |
|---|---|---|---|
| Users & Roles | Clerk-authenticated users, system roles, permissions, role binding (System ↔ Discord) | Backend, Shared, Dashboard | [CONTEXT.md](docs/contexts/users-and-roles/CONTEXT.md) |
| Verification | Membership applications, manual review, automated checks, Discord role grants | Backend, Shared | [CONTEXT.md](docs/contexts/verification/CONTEXT.md) |
| Production Incident Game | Multiplayer engineering simulation — incidents, actions, voting, player stats | Bot | [CONTEXT.md](docs/contexts/production-incident-game/CONTEXT.md) |
| Reminders | Personal and community-wide scheduled reminders with natural-language parsing | Bot | [CONTEXT.md](docs/contexts/reminders/CONTEXT.md) |
| Dashboard | *(future context)* Analytical reporting layer with own read model | Dashboard, Backend | [CONTEXT.md](docs/contexts/dashboard/CONTEXT.md) |

## Cross-cutting infrastructure

| Layer | Description |
|---|---|
| Chat Commands | `!`-prefixed command shell for Discord (infrastructure, not a domain context) |
| Clerk Auth | External authentication provider (not a platform context) |
