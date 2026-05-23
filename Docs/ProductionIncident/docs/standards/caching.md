# Caching Standards

## Cache Types

### Session Cache

Source-of-truth runtime session store:

- Key: `SessionId`.
- Value: active `GameSessionRuntime`.
- Owned by session manager.
- Removed during cleanup.

### Template Cache

Readonly startup catalog:

- Key: template/action/rule IDs.
- Value: validated template data.
- Owned by template infrastructure and exposed through catalog ports.

### Discord Registry Cache

Adapter mapping:

- Engine IDs to Discord channel/thread/message IDs.
- Owned by Discord adapter.
- Not used by engine rules.

### Derived Projection Cache

Optional cached view models or summaries:

- Must be invalidated by events.
- Must never become source of truth.

## Expectations

- Prefer `Map` over plain objects for runtime caches.
- Use branded IDs as keys.
- Do not expose mutable cache internals.
- Define cache ownership clearly.
- Cleanup must cancel timers and delete registry entries.

## Anti-Patterns

- Storing Discord message IDs inside `Incident`.
- Recomputing template indexes during every incident generation.
- Keeping ended sessions forever.
- Mutating cached templates during runtime.

