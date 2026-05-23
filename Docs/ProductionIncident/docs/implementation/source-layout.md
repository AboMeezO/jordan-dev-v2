# Suggested Source Layout

The existing bot uses TypeScript, ESM, Discord.js, and CommandKit-style command/event/validation folders. The game should be added as a feature with a strict engine/adapter split.

```text
src/
  ProductionIncident/
    engine/
      application/
      domain/
      systems/
      events/
      ports/
      data/
    discord/
      commands/
      interactions/
      renderers/
      routing/
      registry/
    infrastructure/
      random/
      scheduler/
      logging/
      templates/
    testing/
```

## Engine Folder

`engine/domain`:

- Branded IDs.
- Domain entities.
- Value objects.
- Discriminated unions.
- State transition functions.

`engine/systems`:

- Session manager.
- Incident engine.
- Voting system.
- Escalation director.
- Chain reaction system.
- Commentary system.
- Statistics system.
- Reward/progression system.

`engine/application`:

- Public use cases called by adapters.
- Command handlers such as `startSession`, `joinSession`, `submitVote`, `advanceTick`, `endSession`.
- Converts adapter input DTOs into domain commands.

`engine/events`:

- Typed event definitions.
- Event bus interfaces.
- Event names and payload contracts.

`engine/ports`:

- Scheduler, random, clock, logger, catalog, persistence, and projection interfaces.

## Discord Folder

`discord/commands`:

- CommandKit slash command modules.
- No game logic.

`discord/interactions`:

- Button/select/modal interaction handlers.
- Custom ID decoding.
- Validation of Discord user/channel context.

`discord/renderers`:

- Embed/component builders.
- Text formatting.
- Message edit rules.
- Future image/canvas bridge points.

`discord/registry`:

- Maps `SessionId`/`IncidentId` to Discord message IDs, channel IDs, thread IDs, and cleanup metadata.

## Naming Expectations

- Domain systems use explicit names: `IncidentEngine`, `VotingSystem`, `EscalationDirector`.
- Application use cases use verbs: `StartIncidentSessionUseCase`, `SubmitIncidentVoteUseCase`.
- Discord adapter classes include `Discord`: `DiscordIncidentRenderer`, `DiscordInteractionRouter`.
- DTOs end with `Dto`.
- View models end with `View`.
- Events end with `Event`.
- Commands end with `Command`.

