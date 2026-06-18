# Failure Resolution Flow

## Trigger

An action fails, a vote selects a risky option, no players vote, or stats hit a failure threshold.

## Participating Systems

- Voting system.
- Incident engine.
- Runtime state manager.
- Chain reaction system.
- Escalation director.
- Commentary system.
- Statistics system.
- Event bus.

## Flow

1. Vote closes and selected action is passed to incident engine.
2. Incident engine computes success/failure using injected random.
3. Failure effects are applied through runtime state manager.
4. `incident.failed` or `incident.resolved` with failed outcome is emitted.
5. Chain reaction system evaluates follow-up rules.
6. Escalation director evaluates pressure increase.
7. Statistics records failed outcome.
8. Commentary emits failure cue.
9. End condition check may end session.

## State Changes

- Stats decrease.
- Incident marked failed/resolved.
- Chain reaction may be scheduled.
- Session may end if failure thresholds are reached.

## Caches Updated

- Active incident cache.
- Vote cache closes.
- Scheduled chain timers may be added.
- Statistics counters update.

## Discord Actions

- Disable voting components.
- Send failure outcome.
- Send chain reaction or escalation warning where configured.
