# Message Rendering Standards

## Renderer Inputs

Renderers accept transport-neutral view models, not domain entities and not Discord interactions.

View model examples:

- `SessionLobbyView`
- `RoleAssignmentView`
- `IncidentPromptView`
- `VoteProgressView`
- `IncidentOutcomeView`
- `SessionSummaryView`
- `CommentaryView`

## Renderer Responsibilities

- Keep message structure consistent.
- Enforce Discord limits.
- Render action options with stable IDs.
- Disable expired components.
- Provide concise state summaries.
- Avoid exposing hidden mechanics such as exact random rolls unless the view explicitly permits it.

## Future Media

Renderers should be replaceable by richer renderers:

- Canvas-generated incident cards.
- Static images.
- Web dashboard cards.
- Spectator overlays.

Keep a single renderer interface so future output modes can be added without changing engine systems.

