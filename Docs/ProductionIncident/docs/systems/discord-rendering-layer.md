# Discord Rendering Layer

## Responsibilities

- Convert engine view models into Discord messages.
- Build embeds, components, select menus, and disabled states.
- Enforce Discord API constraints.
- Support future rich media renderers.

## Boundaries

- No game rules.
- No incident selection.
- No vote resolution.
- No source-of-truth state.

## Public APIs

- `renderSessionLobby(view): DiscordMessagePayload`
- `renderIncidentPrompt(view): DiscordMessagePayload`
- `renderVoteProgress(view): DiscordMessagePayload`
- `renderIncidentOutcome(view): DiscordMessagePayload`
- `renderSessionSummary(view): DiscordMessagePayload`
- `renderCommentary(view): DiscordMessagePayload`

## Integration Points

- Interaction router supplies encoded custom IDs.
- Message registry stores sent message references.
- Application service supplies view models.

## Failure Handling

- Truncate overly long fields.
- Disable unavailable actions.
- Fall back to plain content when embed construction would exceed limits.
- Log payload construction failures as adapter bugs.
