# Commentary Flow

## Trigger

Domain events or threshold crossings such as low stability, failed incident resolution, or chain reaction scheduling.

## Participating Systems

- Event bus.
- Commentary system.
- Runtime state manager.
- Discord renderer.
- Discord message registry.

## Flow

1. Domain event is published.
2. Commentary system receives event.
3. System checks rule catalog, session state, cooldowns, and recent cue history.
4. Matching commentary cue is selected.
5. `commentary.cued` is emitted.
6. Discord adapter renders cue as channel message or attached update.

## State Changes

- Commentary does not change core game outcome.
- Cooldowns and recent cue history update.

## Caches Updated

- Commentary cooldown cache.
- Optional recent commentary cache.

## Discord Actions

- Send short channel message.
- Optionally include cue in outcome embed.
- Avoid spam during rapid event bursts.
