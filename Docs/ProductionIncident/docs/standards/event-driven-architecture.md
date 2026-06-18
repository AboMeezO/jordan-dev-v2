# Event-Driven Architecture Standards

## Event Purpose

Events record meaningful domain facts that already happened. They are not commands.

Examples:

- `session.started`
- `player.joined`
- `incident.generated`
- `vote.submitted`
- `incident.resolved`
- `escalation.triggered`
- `chainReaction.scheduled`
- `session.ended`

## Event Contracts

Each event must include:

- `type`
- `eventId`
- `sessionId`
- `occurredAt`
- Typed payload fields

Events should not include Discord objects or mutable domain entities.

## Event Bus Responsibilities

- Publish typed events in deterministic order.
- Allow multiple subscribers.
- Keep handler failures isolated.
- Support synchronous engine tests.
- Support async adapter reactions when needed.

## Event Flow

1. Application use case calls an engine system.
2. System validates state transition.
3. System mutates or replaces state.
4. System emits a domain event.
5. Projection/commentary/statistics/scheduler subscribers react.
6. Discord adapter renders user-facing output.

## Best Practices

- Emit events after successful state changes.
- Keep event payloads small and stable.
- Include IDs instead of whole object graphs.
- Use event history for statistics where practical.
- Keep event naming domain-oriented.

## Anti-Patterns

- Using events as remote procedure calls.
- Emitting speculative events before validation.
- Letting event handlers mutate unrelated session state without going through a system.
- Swallowing all handler errors silently.
- Using untyped string payloads.
