# Role System

## Responsibilities

- Define game roles and capabilities.
- Assign roles to players.
- Expose role modifiers for voting, action eligibility, and effects.
- Keep role data separate from Discord guild roles.

## Boundaries

- Does not require Discord role objects.
- Does not render role messages.
- Does not make incident resolution decisions outside configured modifiers.

## Role Examples

- DevOps.
- Backend Engineer.
- QA.
- Security Engineer.
- Intern.

## Suggested Data

- Role ID.
- Display name.
- Weighting/modifier rules.
- Allowed action tags.
- Private clue rules.
- Risk modifiers.

## Runtime Behavior

Roles can be assigned randomly, by lobby choice, or by deterministic balancing. The assignment strategy should be injected or configured.

## Anti-Patterns

- Reusing Discord guild role IDs as game role IDs.
- Hard-coding role checks in Discord button handlers.
- Letting role assignment depend on join order unless explicitly intended.

