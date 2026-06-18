# Implementation Roadmap

## Phase 1: Engine Contracts

Deliverables:

- Branded IDs for session, player, incident, action, vote, and template identifiers.
- Core domain types for players, roles, stats, incidents, actions, votes, and game status.
- Typed event bus contracts.
- Runtime service ports for random, clock, scheduler, logger, and template catalogs.

Exit criteria:

- Engine compiles without importing `discord.js`.
- Public APIs expose explicit return types.
- No `any` is introduced.

## Phase 2: Template Loading

Deliverables:

- Incident template schema.
- Action template schema.
- Commentary rule schema.
- Runtime validation from `unknown`.
- Readonly template catalog.

Exit criteria:

- Invalid template data fails at startup.
- Engine receives only validated readonly data.

## Phase 3: Session Runtime

Deliverables:

- Session manager.
- Runtime state manager.
- Join/leave/role assignment.
- Session lifecycle events.
- Cleanup lifecycle.

Exit criteria:

- Multiple sessions can run independently.
- Each session has isolated state and timers.

## Phase 4: Incidents and Voting

Deliverables:

- Incident generation.
- Action option generation.
- Voting windows.
- Vote tally and deterministic tie handling.
- Outcome resolution.

Exit criteria:

- Unit tests cover incident generation, vote resolution, no-vote behavior, and stat effects.

## Phase 5: Escalation, Chain Reactions, Commentary

Deliverables:

- Escalation director.
- Delayed effects.
- Chain reaction rules.
- Commentary cues from domain events.

Exit criteria:

- Severe state transitions cause predictable escalations.
- Delayed effects are cancellable during cleanup.

## Phase 6: Discord Adapter

Deliverables:

- Slash commands.
- Interaction router.
- Renderer.
- Discord message registry.
- Thread creation.
- Component disabling and cleanup.

Exit criteria:

- Discord commands call application use cases only.
- Renderers consume transport-neutral views.

## Phase 7: Statistics and Progression

Deliverables:

- End-of-session summary.
- Player contribution stats.
- Reward/progression rules.
- Persistence port for future storage.

Exit criteria:

- Stats can be computed from session state and event history.
