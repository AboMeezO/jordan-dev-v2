# State Management Standards

## Source of Truth

The engine session cache is the runtime source of truth. Discord messages, embeds, and components are projections.

## State Shape

State should be explicit:

- Session lifecycle status.
- Player roster.
- Role assignments.
- Current stats.
- Active incidents.
- Voting windows.
- Scheduled effects.
- Event history or summary counters.

Use discriminated unions for lifecycle-specific fields.

## State Transitions

State changes must occur through system methods or application use cases. Each meaningful transition should emit a typed event.

## Immutable Boundaries

Internally, systems may use mutable structures for performance. Public reads should return readonly snapshots or carefully scoped values.

## Cleanup

Cleanup must:

- Mark the session ended.
- Cancel scheduled timers.
- Resolve or expire active incidents.
- Clear session cache entries.
- Emit cleanup events.
- Ask adapters to disable stale Discord components.
