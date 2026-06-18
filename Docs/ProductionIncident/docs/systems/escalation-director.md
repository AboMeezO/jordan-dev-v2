# Escalation Director

## Responsibilities

- Control pacing and pressure.
- Decide when incidents should spawn.
- Increase difficulty as time passes or stats degrade.
- Trigger escalation events.
- Coordinate simultaneous incidents when rules allow it.

## Boundaries

- Does not render warnings.
- Does not choose Discord timing behavior.
- Does not mutate stats directly except through approved state manager APIs.

## Runtime Lifecycle

1. Subscribe to `session.started`.
2. Schedule first incident tick.
3. On each tick, inspect session state.
4. Compute next pacing decision.
5. Request incident generation or escalation.
6. Reschedule next tick.
7. Stop on `session.ended` or cleanup.

## Suggested Types

- `EscalationLevel`
- `PacingDecision`
- `EscalationRule`
- `DirectorTickContext`

## Cache Expectations

- Store scheduled timer handles by session ID.
- Store lightweight pacing state such as current escalation level and last spawn time.
- Cleanup must cancel pending handles.

## Anti-Patterns

- Hard-coded `setInterval` calls in Discord handlers.
- Escalation based on rendered message content.
- Unbounded incident spawning without active incident limits.
