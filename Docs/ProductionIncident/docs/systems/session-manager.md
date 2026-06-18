# Session Manager

## Responsibilities

- Create, locate, start, end, and cleanup game sessions.
- Own the active session cache.
- Enforce one active session per configured scope when required.
- Coordinate initial role assignment and lifecycle events.
- Provide application-level access to session runtime state.

## Boundaries

- Does not render Discord messages.
- Does not parse Discord interactions.
- Does not generate incident content directly.
- Does not store Discord channel or message IDs.

## Public APIs

Suggested operations:

- `createSession(command): CreateSessionResult`
- `joinSession(command): JoinSessionResult`
- `startSession(command): StartSessionResult`
- `getSession(sessionId): GameSessionRuntime | undefined`
- `endSession(command): EndSessionResult`
- `cleanupSession(sessionId, reason): CleanupResult`

## Runtime Lifecycle

1. Create waiting session.
2. Accept joins until start condition.
3. Assign roles.
4. Move status to running.
5. Delegate incident scheduling to escalation/director systems.
6. End on win, loss, timeout, or manual cleanup.
7. Cancel timers and remove cache entry.

## Data Flow

Input commands arrive from application services. The manager updates session state and emits events such as `session.created`, `player.joined`, `roles.assigned`, `session.started`, and `session.ended`.

## Cache Expectations

- `Map<SessionId, GameSessionRuntime>` is the authoritative active session cache.
- Secondary index by Discord scope may exist in the Discord adapter or application layer, not inside domain entities.
- Ended sessions should not remain in the active cache.

## Failure Handling

- Duplicate session: return typed domain error.
- Missing session: return typed domain error.
- Start with insufficient players: return typed domain error.
- Cleanup should be idempotent.

## TypeScript Expectations

- Branded `SessionId` and `PlayerId`.
- Lifecycle state as discriminated union.
- Public methods return result unions.
- Runtime snapshots exposed as readonly.
