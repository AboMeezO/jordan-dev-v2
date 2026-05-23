# Cache Layer

## Responsibilities

- Provide explicit ownership for runtime maps.
- Avoid accidental cross-session contamination.
- Support fast lookup by branded IDs.
- Define cleanup semantics.

## Cache Inventory

- Active sessions: session manager.
- Templates: template catalog.
- Active timers: scheduler system.
- Discord messages: Discord registry.
- Commentary cooldowns: commentary system.
- Chain cooldowns: chain reaction system.
- Statistics counters: statistics system.

## Rules

- Caches must have clear owners.
- Cache keys must be typed or branded.
- Runtime caches must be emptied on cleanup.
- Template caches are readonly after startup.
- Adapter caches must not become domain state.

## Scalability Notes

In-memory caches are acceptable initially. Keep APIs shaped so distributed storage can later replace:

- Session cache.
- Player progression.
- Leaderboards.
- Audit/event history.

