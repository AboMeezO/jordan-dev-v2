# Cleanup Flow

## Trigger

Session end, manual cancellation, unrecoverable adapter failure, timeout, bot shutdown, or stale session detection.

## Participating Systems

- Session manager.
- Runtime state manager.
- Scheduler.
- Voting system.
- Incident engine.
- Discord registry.
- Discord renderer.
- Event bus.

## Flow

1. Cleanup request arrives with reason.
2. Session manager marks session ending or ended.
3. Voting windows close or expire.
4. Active incidents expire without new effects unless configured otherwise.
5. Scheduler cancels session-scoped timers.
6. `session.ended` and `session.cleanedUp` are emitted.
7. Session cache removes entry.
8. Discord adapter disables active components and clears registry entries.

## State Changes

- Running/recovering session -> ended.
- Active runtime data removed.

## Caches Updated

- Session cache deleted.
- Scheduler handles canceled.
- Discord registry deleted.
- Commentary and chain cooldowns cleared.

## Discord Actions

- Edit active prompts to disabled state.
- Send final summary where appropriate.
- Ignore missing/deleted messages during cleanup.

