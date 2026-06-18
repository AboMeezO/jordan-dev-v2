# Session Lifecycle Flow

## Trigger

A player starts the game through a Discord command such as `/dev incident`.

## Participating Systems

- Discord command adapter.
- Application session use case.
- Session manager.
- Role system.
- Event bus.
- Discord renderer.
- Discord message registry.
- Scheduler/director after start.

## Flow

1. Discord command adapter validates guild/channel context.
2. Adapter creates `StartSessionCommand` or `CreateSessionCommand`.
3. Session manager creates a waiting session and stores it in the active session cache.
4. `session.created` is emitted.
5. Discord renderer sends lobby view.
6. Players join through interactions.
7. Session manager records players and emits `player.joined`.
8. Start condition is met manually or automatically.
9. Role system assigns roles.
10. Session status changes to running.
11. `session.started` and `roles.assigned` are emitted.
12. Escalation director schedules first incident.

## State Changes

- No session -> waiting session.
- Waiting session -> running session.
- Player roster grows.
- Role assignments become immutable for the session unless a future rule explicitly allows reassignment.

## Caches Updated

- Session cache adds active session.
- Discord registry stores lobby/thread/message references.
- Scheduler stores session-scoped timer handles after start.

## Discord Actions

- Reply to command.
- Optionally create thread.
- Send lobby message.
- Send role information through ephemeral responses or private follow-ups where supported.
