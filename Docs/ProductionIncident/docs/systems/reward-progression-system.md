# Reward and Progression System

## Responsibilities

- Convert statistics into player rewards.
- Define progression rules.
- Support future persistence.
- Keep rewards deterministic and explainable.

## Boundaries

- Does not depend on Discord user objects.
- Does not control incident outcomes.
- Does not require persistence in the initial implementation.

## Runtime Behavior

At session end:

1. Receive `SessionSummary`.
2. Evaluate reward rules.
3. Produce `PlayerRewardResult` values.
4. Emit progression events.
5. Optionally persist through a port.

## Suggested Rewards

- XP.
- Role mastery counters.
- Badges.
- Leaderboard points.
- Cosmetic titles.

## Best Practices

- Keep reward formulas data-driven.
- Clamp rewards.
- Make failure sessions still produce contribution rewards where configured.
- Version progression rules before persistence is introduced.

