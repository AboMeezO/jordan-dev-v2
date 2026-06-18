# TypeScript Standards

## Compiler Baseline

The project already enables strict TypeScript settings including `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. New game code must preserve this level of strictness.

Required expectations:

- Explicit return types on public methods and exported functions.
- No implicit `any`.
- No explicit `any` unless a narrow interoperability boundary requires it and the reason is documented.
- Prefer `unknown` for external input, then validate.
- Avoid unsafe casts. If a cast is unavoidable, isolate it behind a validator or adapter.
- Use `readonly` for immutable properties, arrays, and maps wherever mutation is not required.
- Prefer discriminated unions for state machines and event payloads.
- Prefer branded string IDs over raw strings for domain identifiers.
- Use exhaustive `switch` handling with a `never` check for unions.

## Domain Typing

Use stable domain types:

```ts
type GameStatus =
	| "waiting"
	| "running"
	| "recovering"
	| "ended";

interface RunningSessionState {
	readonly status: "running";
	readonly activeIncidents: ReadonlyMap<
		IncidentId,
		Incident
	>;
}
```

Do not model runtime state as open string dictionaries.

## Events

Events must be typed as discriminated unions:

```ts
type GameEvent =
	| SessionStartedEvent
	| IncidentGeneratedEvent
	| VoteSubmittedEvent
	| IncidentResolvedEvent;
```

Event handlers must receive typed payloads. Avoid untyped event emitter names and unstructured payloads.

## DTO Separation

Use separate shapes for:

- External Discord input DTOs.
- Application commands.
- Domain entities.
- View models.
- Persistence DTOs.

Do not reuse Discord payloads as domain objects.

## Nullability

- Prefer optional fields only when absence is meaningful.
- Prefer explicit union states over nullable collections.
- Avoid non-null assertions except at validated startup boundaries.

## Mutation

- Runtime state may be mutated internally by state managers for performance.
- Public state returned from systems must be readonly snapshots or narrow query results.
- Do not expose mutable maps or arrays from session state.

## Anti-Patterns

- `Record<string, unknown>` as a long-lived domain model.
- Stringly typed status or event names scattered across files.
- `as SomeType` after JSON parsing without validation.
- Direct `Math.random()` calls inside domain systems.
- Direct `Date.now()` calls inside domain systems.
