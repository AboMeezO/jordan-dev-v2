# System Overview

The Production Incident is a real-time multiplayer Discord game backed by a standalone simulation engine. The engine owns sessions, incident generation, voting, escalation, effects, chain reactions, timers, commentary decisions, statistics, and end conditions. Discord code only translates user input into engine commands and translates engine view models into Discord messages and components.

## Primary Runtime Areas

### Engine Core

Responsibilities:

- Own active game sessions.
- Generate incidents from validated templates.
- Resolve actions, votes, escalations, chain reactions, and win/loss conditions.
- Emit typed domain events.
- Produce transport-neutral render payloads.
- Maintain deterministic runtime state using injected random and clock services.

Boundaries:

- Must not import `discord.js`.
- Must not know about channels, messages, embeds, buttons, interactions, threads, or ephemeral replies.
- Must not perform direct IO except through injected ports.

### Discord Adapter

Responsibilities:

- Register commands through the existing CommandKit-style architecture.
- Receive slash commands, buttons, selects, and modal submissions.
- Decode component identifiers into typed interaction commands.
- Call engine application services.
- Render engine output using Discord embeds, messages, buttons, select menus, and threads.
- Maintain Discord message references required for edits and cleanup.

Boundaries:

- Must not implement game rules.
- Must not decide incident outcomes.
- Must not mutate engine state directly.
- Must not persist source-of-truth game state in Discord message metadata.

### Data Layer

Responsibilities:

- Load incident templates, action templates, role definitions, commentary rules, escalation rules, and progression tables.
- Validate unknown JSON/YAML data before it enters the engine.
- Expose readonly typed catalogs to engine systems.
- Support future replacement with a database without changing simulation logic.

### Runtime Services

Responsibilities:

- Provide injected `RandomSource`, `Clock`, `Scheduler`, `Logger`, and optional `PersistencePort`.
- Keep deterministic behavior testable.
- Centralize timers and cleanup.

## Dependency Direction

Allowed:

- Discord adapter -> application services -> engine core.
- Engine core -> domain types, catalogs, ports.
- Infrastructure implementations -> ports.

Forbidden:

- Engine core -> Discord adapter.
- Engine core -> `discord.js`.
- Domain models -> persistence, files, environment variables, process globals, network clients.

## High-Level Data Flow

1. A Discord command starts a session.
2. The Discord adapter creates a typed application command.
3. The session manager creates a `GameSession`.
4. Engine systems emit domain events.
5. A projection layer converts events/state into transport-neutral view models.
6. The Discord renderer turns view models into embeds/components.
7. Player interactions return as typed commands.
8. Engine systems update state and emit more events.
9. Cleanup removes timers, cache entries, and stale Discord components.
