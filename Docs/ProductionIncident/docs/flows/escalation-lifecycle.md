# Escalation Lifecycle Flow

## Trigger

Elapsed time, degraded stats, failed incidents, or configured thresholds.

## Participating Systems

- Escalation director.
- Runtime state manager.
- Incident engine.
- Chain reaction system.
- Commentary system.
- Scheduler.
- Event bus.

## Flow

1. Director tick fires.
2. Director reads readonly session snapshot.
3. Director evaluates pacing and escalation rules.
4. If threshold crossed, director emits `escalation.triggered`.
5. Director requests more severe incident generation or shorter next delay.
6. Commentary system may emit warning cue.
7. Scheduler stores next director tick.

## State Changes

- Escalation level may increase.
- Incident spawn cadence may shorten.
- Active incident cap may increase.

## Caches Updated

- Director pacing cache.
- Scheduler timer handles.
- Commentary cooldown cache.

## Discord Actions

- Send escalation warning or status update through renderer.
- No direct Discord action from director.
