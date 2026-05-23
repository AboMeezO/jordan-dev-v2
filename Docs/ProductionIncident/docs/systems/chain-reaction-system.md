# Chain Reaction System

## Responsibilities

- Evaluate whether incident outcomes trigger follow-up events.
- Schedule delayed incidents or delayed stat effects.
- Emit chain reaction events.
- Prevent runaway loops.

## Boundaries

- Does not render follow-up messages directly.
- Does not bypass incident generation rules.
- Does not own global timers outside the scheduler port.

## Runtime Behavior

1. Listen to `incident.resolved` and relevant stat events.
2. Match configured chain rules.
3. Check cooldowns and maximum depth.
4. Schedule delayed effect or incident request.
5. Emit `chainReaction.scheduled`.
6. Execute through engine systems when timer fires.

## Cache Expectations

- Per-session chain depth.
- Cooldowns by chain rule ID.
- Scheduled handles for cancellation.

## Failure Handling

- If session ends before delayed reaction, cancel it.
- If target template is missing, fail startup validation.
- If rule would exceed depth, emit skipped diagnostic event.

