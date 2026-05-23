# Event Map

This map gives implementation teams a shared starting point for typed event definitions. Names may change during implementation, but the event contracts must remain explicit and transport-neutral.

## Session Events

- `session.created`
- `player.joined`
- `player.left`
- `roles.assigned`
- `session.started`
- `session.recoveryStarted`
- `session.ended`
- `session.cleanedUp`

## Incident Events

- `incident.generated`
- `incident.prompted`
- `incident.expired`
- `incident.resolved`
- `incident.failed`

## Vote Events

- `vote.opened`
- `vote.submitted`
- `vote.replaced`
- `vote.closed`
- `vote.noVotes`

## Escalation Events

- `director.tick`
- `escalation.triggered`
- `escalation.reduced`
- `stat.thresholdCrossed`
- `stat.recovered`

## Chain Reaction Events

- `chainReaction.scheduled`
- `chainReaction.executed`
- `chainReaction.skipped`
- `delayedEffect.scheduled`
- `delayedEffect.applied`
- `delayedEffect.cancelled`

## Commentary and Statistics Events

- `commentary.cued`
- `statistics.updated`
- `reward.calculated`
- `progression.updated`

## Event Payload Rules

- Include IDs and scalar values.
- Include before/after stat values for stat changes.
- Include rule IDs for rule-driven behavior.
- Do not include Discord objects.
- Do not include mutable session references.
- Do not include functions.

