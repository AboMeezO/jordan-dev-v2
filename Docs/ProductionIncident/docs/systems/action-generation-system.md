# Action Generation System

## Responsibilities

- Select action options for generated incidents.
- Respect incident tags, action tags, role restrictions, severity, and current session state.
- Ensure each incident has valid player-facing choices.
- Provide multiple viable options with different consequences.

## Boundaries

- Does not tally votes.
- Does not apply action effects.
- Does not decide Discord component layout.

## Runtime Behavior

1. Receive incident template and generation context.
2. Query action catalog by tags.
3. Filter by severity and constraints.
4. Score candidates.
5. Select final action set deterministically through injected random.
6. Return readonly action option models.

## Suggested Interfaces

- `ActionCatalog`
- `ActionSelectionRule`
- `GeneratedActionOption`
- `ActionGenerationContext`

## Edge Cases

- Too few actions: use fallback safe actions configured in data.
- Role-locked action with no matching player: hide or keep disabled based on rule.
- Duplicate semantic actions: deduplicate by action ID or exclusive group.

