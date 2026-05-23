# Test Strategy

Testing should prioritize engine correctness because the game is deterministic and rule-based.

## Unit Tests

Required coverage:

- Incident template validation.
- Weighted template selection.
- Runtime incident generation.
- Voting resolution.
- Tie behavior.
- No-vote behavior.
- Role restrictions.
- Stat effects.
- Chain reaction scheduling.
- Escalation thresholds.
- Session cleanup.
- Event emission order.

Use fake implementations for:

- `RandomSource`
- `Clock`
- `Scheduler`
- `TemplateCatalog`
- `EventPublisher`

## Integration Tests

Scope:

- Application use cases with real engine systems and fake infrastructure ports.
- Discord interaction router decoding into engine commands.
- Renderer output shape for representative view models.

Do not require a real Discord client for routine tests.

## Snapshot Tests

Use sparingly for transport-neutral view models and Discord renderer payloads. Avoid brittle snapshots of timestamps, generated IDs, or random ordering unless those values are fixed by test fakes.

## Performance Tests

Minimum checks:

- Many concurrent sessions can tick without timer leakage.
- Template lookup is constant time.
- Vote submission does not scan unrelated sessions.
- Cleanup removes scheduler handles.

