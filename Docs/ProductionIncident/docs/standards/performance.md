# Performance Expectations

## Runtime Goals

- Multiple sessions should run concurrently without shared mutable state.
- Vote submission should be constant time relative to the active incident.
- Template lookup should be constant time after startup.
- Timers must be centralized and cancellable.
- Cleanup must remove timers and cache entries.

## Avoid

- Scanning every session for each interaction.
- Revalidating static templates during gameplay.
- Building Discord payloads inside hot engine paths.
- Unbounded event history without retention policy.
- Long synchronous work inside Discord interaction handlers.

## Scalability Notes

Initial state can be in memory. Design the ports so future persistence can store:

- Completed session summaries.
- Player progression.
- Leaderboards.
- Template versions.
- Audit/event logs.

