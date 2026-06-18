# Scheduler and Timer System

## Responsibilities

- Centralize real-time scheduling.
- Provide cancellable timer handles.
- Support fake time in tests.
- Prevent timer leaks across session cleanup.

## Boundaries

- Engine systems depend on `Scheduler` port, not `setTimeout` or `setInterval`.
- Discord adapter should not create game timers.
- Scheduler does not decide game rules.

## Public API

Suggested operations:

- `scheduleOnce(delayMs, task): ScheduledTask`
- `scheduleAt(timestamp, task): ScheduledTask`
- `cancel(taskId): boolean`
- `cancelBySession(sessionId): number`

## Runtime Uses

- Incident spawn delays.
- Voting deadlines.
- Delayed effects.
- Chain reactions.
- Cleanup grace periods.

## Failure Handling

- Timer callback must verify session still exists.
- Timer callback must verify target incident/action is still valid.
- Cleanup must cancel all session-scoped timers.
