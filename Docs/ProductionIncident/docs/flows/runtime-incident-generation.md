# Runtime Incident Generation Flow

## Trigger

Director tick, manual debug command, chain reaction, or recovery complication.

## Participating Systems

- Incident engine.
- Template catalog.
- Action generation system.
- Random source.
- Clock.
- Runtime state manager.
- Event bus.

## Flow

1. Build generation context from session snapshot.
2. Filter templates by category, tags, severity, cooldown, and active incident limits.
3. Select weighted template through injected random source.
4. Select title, description, root cause, affected service, and severity.
5. Generate action options.
6. Validate generated incident invariants.
7. Add incident to active state.
8. Emit `incident.generated`.

## State Changes

- Active incident map gains a generated incident.
- Recent incident history updates.

## Caches Updated

- Template catalog is read only.
- Session active incident cache updates.
- Optional incident cooldown cache updates.

## Discord Actions

None directly. Renderer reacts to emitted view/event.

