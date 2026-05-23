# Engine and Discord Boundaries

## Boundary Rule

The game engine is a pure simulation package. Discord is one possible transport. Every implementation decision must preserve the ability to replace Discord with another renderer such as Canvas, images, a web dashboard, spectator views, or another chat platform.

## Engine May Own

- `GameSession`
- `Player`
- `RoleAssignment`
- `Incident`
- `IncidentTemplate`
- `IncidentAction`
- `Vote`
- `GameStats`
- `GameEvent`
- `IncidentOutcome`
- `EscalationPlan`
- `CommentaryCue`
- Runtime session caches
- Template catalogs
- Deterministic randomization
- Timers through an injected scheduler port

## Engine Must Not Own

- `Client`
- `Interaction`
- `ButtonInteraction`
- `Guild`
- `TextChannel`
- `ThreadChannel`
- `EmbedBuilder`
- `ActionRowBuilder`
- Discord custom ID parsing implementation
- Discord message IDs as required fields on domain entities

If a domain event must later be rendered into a Discord edit, store that mapping in the Discord adapter cache, not in the domain object.

## Transport-Neutral View Models

The engine may return view models that describe meaning, not Discord mechanics.

Suggested examples:

```ts
interface IncidentPromptView {
  readonly kind: "incident-prompt";
  readonly sessionId: SessionId;
  readonly incidentId: IncidentId;
  readonly title: string;
  readonly description: string;
  readonly severity: IncidentSeverity;
  readonly expiresAt: UnixMillis;
  readonly actions: readonly ActionOptionView[];
}
```

The Discord renderer decides whether this becomes an embed, image, buttons, select menu, or dashboard card.

## Integration Ports

Suggested engine ports:

- `RandomSource`
- `Clock`
- `Scheduler`
- `EventPublisher`
- `TemplateCatalog`
- `StatsSink`
- `Logger`

Suggested adapter ports:

- `SessionCommandHandler`
- `InteractionCommandHandler`
- `GameRenderer`
- `DiscordMessageRegistry`
- `DiscordCleanupService`

## Anti-Patterns

- Passing `ButtonInteraction` into `GameSession.vote`.
- Building embeds inside incident generation.
- Encoding business rules in Discord custom IDs.
- Reading current session state from message content.
- Using Discord channel IDs as the only engine session identity without a branded type.
- Letting timer callbacks call Discord directly from inside engine classes.

