# Runtime State Manager

## Responsibilities

- Apply stat changes.
- Clamp values to valid ranges.
- Track lifecycle-specific state.
- Provide readonly snapshots.
- Centralize state mutation rules.

## Boundaries

- Does not choose incidents.
- Does not render state.
- Does not schedule timers.

## State Areas

- Session lifecycle.
- Players and roles.
- Stability, happiness, sanity, and future metrics.
- Active incidents.
- Vote windows.
- Scheduled effects.
- Recent incident history.
- Statistics counters.

## Best Practices

- Mutate through explicit methods such as `applyStatDelta`.
- Emit threshold-crossed events when values move across configured boundaries.
- Keep stat clamping consistent.
- Use readonly snapshots at API boundaries.

## Anti-Patterns

- Directly editing stats from unrelated systems.
- Duplicating session status in multiple caches.
- Returning mutable arrays/maps.
