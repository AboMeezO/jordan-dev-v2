# Event Bus

## Responsibilities

- Publish typed domain events.
- Preserve deterministic event order.
- Allow systems and adapters to subscribe.
- Support tests with synchronous fake subscribers.

## Public API

Suggested operations:

- `publish(event): void | Promise<void>`
- `publishAll(events): void | Promise<void>`
- `subscribe(type, handler): Unsubscribe`
- `subscribeAll(handler): Unsubscribe`

## Event Shape

Each event includes:

- `type`
- `eventId`
- `sessionId`
- `occurredAt`
- Payload fields.

## Handler Rules

- Handlers should be small.
- Domain handlers that mutate state should call systems, not edit objects directly.
- Adapter handlers may be async.
- Failures should be logged and isolated according to handler category.

## Anti-Patterns

- Untyped Node `EventEmitter` with string payloads.
- Using events as commands.
- Event handlers that silently mutate several unrelated systems.

