# Ports and Adapters Pattern

The project should use ports and adapters to keep simulation logic independent from Discord and future presentation systems.

## Ports

Ports are interfaces owned by the engine or application layer. They describe what the engine needs without naming the implementation.

Suggested ports:

- `RandomSource`
- `Clock`
- `Scheduler`
- `TemplateCatalog`
- `GameEventPublisher`
- `Logger`
- `PersistencePort`

## Adapters

Adapters implement ports or translate external input into application commands.

Examples:

- `NodeScheduler` implements `Scheduler`.
- `CryptoRandomSource` or `SeededRandomSource` implements `RandomSource`.
- `JsonTemplateCatalog` implements `TemplateCatalog`.
- `DiscordIncidentRenderer` renders engine view models.
- `CommandKitStartIncidentCommand` converts slash commands into `StartSessionCommand`.

## Best Practices

- Keep port methods narrow and explicit.
- Return domain values, not infrastructure objects.
- Prefer immutable input objects.
- Keep adapter failures out of domain state until translated into typed application errors.
- Test engine systems with fake ports.

## Anti-Patterns

- Creating one large `InfrastructureService`.
- Passing Discord objects through ports.
- Letting adapters decide domain outcomes.
- Hiding randomization inside static helpers instead of injecting `RandomSource`.

