# Incident Engine

## Responsibilities

- Select incident templates using weighted deterministic randomization.
- Generate runtime incidents from templates.
- Bind generated root cause, service, severity, title, description, and action options.
- Resolve chosen actions into outcomes.
- Emit incident lifecycle events.

## Boundaries

- Does not schedule timers directly unless through `Scheduler`.
- Does not know how incidents are displayed.
- Does not accept Discord button IDs.

## Public APIs

- `generateIncident(sessionId, context): IncidentGeneratedResult`
- `resolveIncident(command): IncidentResolvedResult`
- `expireIncident(command): IncidentExpiredResult`
- `getActiveIncident(sessionId, incidentId): Incident | undefined`

## Runtime Behavior

Incident generation uses:

- Current session stats.
- Difficulty level.
- Recent incident history.
- Template weights.
- Allowed categories/tags.
- Injected `RandomSource`.

Resolution applies success/failure effects, emits outcome events, and may request chain reactions or escalation changes through events.

## Integration Points

- Template catalog for source data.
- Runtime state manager for stat updates.
- Voting system for winning action.
- Chain reaction system for follow-up incidents.
- Commentary system for narrative cues.

## Edge Cases

- No eligible template: emit controlled no-op or fallback incident.
- No available actions: reject template during validation if possible.
- Incident already resolved: return typed error.
- Session ended during voting: expire incident without stat effects.
