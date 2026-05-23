# Interaction Router

## Responsibilities

- Receive Discord component interactions.
- Decode custom IDs.
- Validate Discord context.
- Convert interactions into application commands.
- Return adapter-safe responses.

## Boundaries

- Does not implement game rules.
- Does not inspect templates.
- Does not mutate session state directly.

## Runtime Flow

1. Receive Discord interaction.
2. Check feature namespace and custom ID version.
3. Decode session/entity IDs.
4. Validate user and channel context.
5. Call application service.
6. Render result or error response.

## Custom ID Shape

Use a versioned compact format:

```text
pi:v1:<sessionId>:<kind>:<targetId>
```

The exact encoder/decoder should be centralized and tested.

## Edge Cases

- Expired component.
- Session not found.
- User not in session.
- Duplicate vote.
- Interaction arrives after cleanup.
- Discord acknowledgement timeout.

