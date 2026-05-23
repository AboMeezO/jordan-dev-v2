# Commentary System

## Responsibilities

- Convert domain events and state thresholds into commentary cues.
- Select rule-based flavor messages.
- Avoid LLM usage.
- Keep commentary deterministic under seeded random.

## Boundaries

- Emits `CommentaryCue` or view models.
- Does not send Discord messages directly.
- Does not modify core game outcomes.

## Runtime Behavior

Commentary listens to events:

- Incident generated.
- Vote submitted.
- Incident resolved.
- Stat threshold crossed.
- Escalation triggered.
- Chain reaction scheduled.
- Session ended.

It evaluates commentary rules and emits one or more cues with priority and cooldown metadata.

## Best Practices

- Use cooldowns to prevent spam.
- Keep messages template-driven.
- Prefer state-aware text over random noise.
- Avoid leaking hidden success rolls unless intentionally configured.

## Cache Expectations

- Per-session commentary cooldown map.
- Optional recent cue history to reduce repetition.
- Readonly commentary rule catalog.

