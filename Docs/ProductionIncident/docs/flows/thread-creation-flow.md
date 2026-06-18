# Thread Creation Flow

## Trigger

Session creation configuration requires a dedicated Discord thread.

## Participating Systems

- Discord command adapter.
- Discord thread service.
- Session manager.
- Discord registry.
- Renderer.

## Flow

1. Command adapter receives start command.
2. Adapter creates or selects target thread/channel.
3. Adapter calls session creation use case with transport-neutral scope metadata.
4. Session manager creates session.
5. Discord registry maps session ID to thread ID.
6. Renderer sends lobby view into thread.

## State Changes

- Engine session is created independently of Discord thread mechanics.
- Adapter registry stores thread mapping.

## Caches Updated

- Session cache.
- Discord registry.

## Discord Actions

- Create thread when configured.
- Send initial thread message.
- Handle missing permissions with adapter-level error.
