# Voting System

## Responsibilities

- Open and close voting windows.
- Accept player votes.
- Enforce one active vote per player per incident unless replacement is allowed.
- Resolve winning action.
- Emit vote events and final tally events.

## Boundaries

- Does not render buttons.
- Does not parse Discord custom IDs.
- Does not apply incident effects.

## Public APIs

- `openVote(sessionId, incidentId, actionIds, closesAt)`
- `submitVote(command): SubmitVoteResult`
- `closeVote(sessionId, incidentId): CloseVoteResult`
- `getVoteState(sessionId, incidentId): VoteStateView`

## Resolution Rules

Define deterministic tie behavior before implementation. Recommended:

1. Highest weighted vote count wins.
2. If tied, prefer lower-risk action.
3. If still tied, use seeded random.
4. If no votes, apply configured no-vote fallback.

## Cache Expectations

- Active vote windows stored by incident ID inside session state.
- Vote map keyed by player ID.
- Vote history retained for statistics until session cleanup.

## Failure Handling

- Vote after close: typed `VotingClosed`.
- Unknown action: typed `ActionNotAvailable`.
- Unknown player: typed `PlayerNotInSession`.
- Role not allowed: typed `RoleNotAllowed`.

