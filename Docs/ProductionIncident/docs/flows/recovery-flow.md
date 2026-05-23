# Recovery Flow

## Trigger

Players successfully resolve enough incidents, stats stabilize, or a dedicated recovery action succeeds.

## Participating Systems

- Incident engine.
- Runtime state manager.
- Escalation director.
- Commentary system.
- Statistics system.
- Event bus.

## Flow

1. Incident outcome applies positive effects.
2. Runtime state manager updates stats.
3. Threshold checks detect recovery condition.
4. Escalation director lowers pressure or changes phase.
5. `session.recoveryStarted` or `stat.recovered` is emitted.
6. Commentary system emits recovery cue.
7. Statistics records recovery contribution.

## State Changes

- Stats increase or return above threshold.
- Escalation level may decrease.
- Session phase may enter recovery or stable state.

## Caches Updated

- Session state.
- Director pacing cache.
- Statistics counters.
- Commentary cooldowns.

## Discord Actions

- Send recovery update.
- Reflect improved stats in next rendered view.

