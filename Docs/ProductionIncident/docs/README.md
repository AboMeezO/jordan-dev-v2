# The Production Incident Documentation

This documentation expands the source architecture in `Docs/ProductionIncident/Architectures/MainArchitecture.md` into implementation-focused planning documents.

The global architectural rule is non-negotiable:

- Discord is a transport adapter.
- The game engine is pure TypeScript domain logic.
- Engine code must not import `discord.js`.
- Runtime behavior is deterministic, rule-based, and simulation-driven.
- Templates provide data; engine systems provide behavior.

## Structure

- `architecture/` - boundaries, module layout, and dependency rules.
- `implementation/` - implementation roadmap and suggested source layout.
- `standards/` - TypeScript, events, errors, caching, state, rendering, and testing rules.
- `systems/` - dedicated subsystem design documents.
- `flows/` - runtime lifecycle flows and event sequences.
- `patterns/` - reusable architectural patterns.
- `data/` - template and state schema expectations.
- `testing/` - test strategy and coverage expectations.

## Reading Order

1. `architecture/system-overview.md`
2. `architecture/boundaries.md`
3. `implementation/source-layout.md`
4. `standards/typescript.md`
5. `systems/event-bus.md`
6. `systems/session-manager.md`
7. `systems/incident-engine.md`
8. Flow documents relevant to the feature being implemented.

