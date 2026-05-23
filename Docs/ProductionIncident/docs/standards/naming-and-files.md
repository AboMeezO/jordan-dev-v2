# Naming and File Architecture Standards

## Naming

- Classes: `PascalCase`.
- Interfaces: `PascalCase`, no `I` prefix.
- Type aliases: `PascalCase`.
- Functions and methods: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` only for true constants.
- Event names: lowercase domain phrases in code only when wrapped by typed constants.
- Files: kebab-case or PascalCase consistently within each folder. Prefer kebab-case for docs and data, PascalCase only for class files if the existing codebase adopts it.

## Suffixes

- `Command` for application input.
- `Dto` for transport or persistence transfer shapes.
- `View` for transport-neutral render models.
- `Event` for emitted domain events.
- `Port` for dependency interfaces.
- `Adapter` for infrastructure implementations.
- `Registry` for mapping and lookup services.
- `Catalog` for readonly loaded template collections.

## File Boundaries

One file should have one primary reason to change. Large systems can have:

- `types.ts`
- `events.ts`
- `system.ts`
- `rules.ts`
- `errors.ts`
- `index.ts`

Avoid dumping all game types into one global `types.ts`.

## Import Rules

- Engine imports must not reference `discord.js`.
- Domain files should not import application services.
- Application services may import systems and ports.
- Discord adapter may import application commands and view models.
- Infrastructure may implement ports but should not leak implementation details upstream.

