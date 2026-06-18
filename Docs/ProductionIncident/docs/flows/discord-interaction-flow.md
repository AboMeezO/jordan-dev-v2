# Discord Interaction Flow

## Trigger

A user clicks a button, selects an option, submits a modal, or invokes a slash command.

## Participating Systems

- CommandKit command/event handlers.
- Discord interaction router.
- Custom ID codec.
- Application use cases.
- Engine systems.
- Discord renderer.

## Flow

1. Discord handler receives interaction.
2. Router validates interaction type and feature namespace.
3. Router decodes custom ID or command options.
4. Router builds typed application command.
5. Application use case executes engine operation.
6. Result union is returned.
7. Renderer creates Discord response.
8. Registry updates message references when needed.

## State Changes

Only application use cases and engine systems change game state.

## Caches Updated

- Discord registry may update message references.
- Engine caches update only through systems.

## Discord Actions

- Defer or reply within Discord timing requirements.
- Send ephemeral errors for invalid user actions.
- Edit messages after successful state changes.
