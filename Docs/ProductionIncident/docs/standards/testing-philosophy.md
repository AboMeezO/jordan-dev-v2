# Testing Philosophy

The engine is deterministic and rule-based, so test it as a backend simulation, not as a Discord bot.

## Priorities

1. Domain correctness.
2. Deterministic behavior.
3. State transition safety.
4. Event emission order.
5. Adapter boundary compliance.
6. Discord rendering shape.

## Engine Tests

Use fake clock, fake scheduler, and seeded random source. Tests should assert exact outcomes for fixed seeds and rule inputs.

## Adapter Tests

Adapter tests should assert:

- Custom ID decoding.
- Application command construction.
- Renderer output shape.
- Expired interaction handling.
- Missing session handling.

Do not require live Discord API access for standard CI tests.
