# Error Handling Standards

## Error Categories

- Validation errors: invalid external data or command input.
- Domain errors: illegal state transitions or missing domain entities.
- Infrastructure errors: filesystem, Discord API, scheduler, persistence.
- Configuration errors: invalid environment or template catalog.

## Domain Errors

Domain errors should be typed and predictable:

- `SessionNotFound`
- `SessionAlreadyRunning`
- `PlayerAlreadyJoined`
- `IncidentNotActive`
- `VotingClosed`
- `ActionNotAvailable`
- `RoleNotAllowed`

Application services should convert these into adapter-safe results.

## Result Handling

Prefer result unions for expected failures:

```ts
type SubmitVoteResult =
  | { readonly ok: true; readonly eventIds: readonly GameEventId[] }
  | { readonly ok: false; readonly error: GameCommandError };
```

Throw only for programmer errors, unrecoverable infrastructure failures, or startup validation failures.

## Discord Errors

Discord API failures must not corrupt engine state. If rendering fails after a valid state transition, log the adapter error and attempt a fallback message if the context still allows it.

