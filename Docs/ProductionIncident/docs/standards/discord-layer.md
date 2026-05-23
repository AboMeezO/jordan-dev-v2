# Discord Layer Standards

## Responsibilities

The Discord layer may:

- Receive commands and interactions.
- Validate Discord-specific context.
- Create threads.
- Send, edit, and delete messages.
- Render embeds and components.
- Send ephemeral messages.
- Track message IDs for cleanup.

The Discord layer must not:

- Generate incident outcomes.
- Apply stat effects.
- Decide escalation rules.
- Store source-of-truth game state.
- Import internal engine classes when an application service API exists.

## Custom IDs

Custom IDs should encode routing information only:

- Feature namespace.
- Session ID.
- Interaction kind.
- Target entity ID.
- Optional version.

Do not encode success chances, effects, role logic, or hidden state in custom IDs.

## Rendering

Renderers consume transport-neutral view models. They are responsible for:

- Embed title, color, fields, footer, timestamp.
- Button labels, styles, disabled states.
- Select menu options.
- Text truncation.
- Discord API limits.
- Accessibility through clear labels.

## Message Registry

Track:

- Session ID to thread/channel ID.
- Incident ID to prompt message ID.
- Player ID to optional ephemeral response state where possible.
- Cleanup deadlines.

This registry is adapter state, not engine state.

## Failure Handling

- If a message send fails, report an adapter error and leave engine state consistent.
- If a component edit fails because the message is gone, record it and continue cleanup.
- If a user interacts with an expired component, call the application layer first or respond with a Discord-only expired message depending on whether the engine session still exists.

