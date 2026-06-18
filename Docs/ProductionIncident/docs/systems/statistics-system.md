# Statistics System

## Responsibilities

- Track session and player contribution metrics.
- Produce end-of-session summaries.
- Feed reward/progression calculations.
- Optionally persist summary DTOs through a port.

## Boundaries

- Does not alter game outcomes.
- Does not render final embeds directly.
- Does not store Discord IDs as statistics identities unless through adapter metadata.

## Metrics

Suggested metrics:

- Incidents generated.
- Incidents resolved.
- Incidents failed.
- Votes submitted.
- Winning votes.
- Role-specific actions.
- Stat damage prevented.
- Chain reactions triggered.
- Escalation peak.
- Survival duration.

## Data Flow

Statistics can be event-driven. Subscribe to domain events and update counters, or derive summaries from event history at session end.

## Cache Expectations

- Per-session counters are retained while session is active.
- Completed summary may be passed to persistence and then removed from active memory.
