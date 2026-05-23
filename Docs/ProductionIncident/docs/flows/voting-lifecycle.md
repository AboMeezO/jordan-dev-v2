# Voting Lifecycle Flow

## Trigger

An incident is generated with action options.

## Participating Systems

- Voting system.
- Runtime state manager.
- Interaction router.
- Application vote use case.
- Event bus.
- Discord renderer.

## Flow

1. Voting system opens window for incident actions.
2. Discord renderer sends buttons or selects.
3. Player clicks an action.
4. Interaction router decodes custom ID.
5. Application use case validates session, player, and incident.
6. Voting system records or replaces vote.
7. `vote.submitted` is emitted.
8. Optional vote progress view is rendered.
9. Vote timeout fires.
10. Voting system computes winner using deterministic tie rules.
11. `vote.closed` is emitted.
12. Incident engine resolves winning action.

## State Changes

- Vote map adds or updates player vote.
- Vote window changes from open to closed.
- Winning action is stored in resolution result.

## Caches Updated

- Vote state inside session.
- Scheduler handle removed after close.
- Discord registry may mark prompt as closed.

## Discord Actions

- Acknowledge interaction quickly.
- Optionally send ephemeral confirmation.
- Edit incident prompt to show closed state.
- Disable action components.

