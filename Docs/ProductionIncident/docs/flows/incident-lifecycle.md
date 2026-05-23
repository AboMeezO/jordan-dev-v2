# Incident Lifecycle Flow

## Trigger

The escalation director requests an incident spawn, or a chain reaction schedules a follow-up incident.

## Participating Systems

- Escalation director.
- Incident engine.
- Action generation system.
- Runtime state manager.
- Voting system.
- Event bus.
- Discord renderer.

## Flow

1. Director emits or calls incident generation request.
2. Incident engine builds generation context from session state.
3. Template catalog returns eligible templates.
4. Incident engine selects template and runtime variants.
5. Action generation system selects available actions.
6. Runtime state manager adds incident to active incidents.
7. `incident.generated` is emitted.
8. Voting system opens vote window.
9. Discord renderer sends incident prompt.
10. Vote closes by timer or configured condition.
11. Incident engine resolves selected action.
12. Runtime state manager removes or marks incident resolved.
13. `incident.resolved` or `incident.failed` is emitted.

## State Changes

- Active incidents gains one incident.
- Vote window opens.
- Incident becomes resolved, failed, or expired.
- Stats may change after resolution.

## Caches Updated

- Session active incident map.
- Vote cache.
- Scheduler vote timeout handle.
- Discord registry prompt message mapping.

## Discord Actions

- Send incident prompt.
- Edit vote progress if supported.
- Disable components after close.
- Send outcome summary.

