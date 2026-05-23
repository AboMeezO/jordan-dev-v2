# Template Data

Templates are data-driven blueprints. They must never contain executable code and must be validated before use.

## Template Categories

- Incident templates.
- Action templates.
- Role definitions.
- Commentary rules.
- Escalation rules.
- Chain reaction rules.
- Reward/progression tables.

## Loading Rules

Responsibilities:

- Load all templates during startup.
- Validate raw external data from `unknown`.
- Convert arrays into readonly maps keyed by stable IDs.
- Reject duplicate IDs.
- Reject references to missing actions, roles, tags, or incident categories.
- Freeze or treat catalogs as readonly after startup.

Boundaries:

- Template loaders may use filesystem APIs.
- Engine systems consume only typed catalogs.
- Discord layer does not load templates.

## Incident Template Expectations

Required concepts:

- Stable template ID.
- Category.
- Weight.
- Severity range.
- Tags.
- Root causes.
- Affected services.
- Title variants.
- Description variants.
- Action tag references.
- Optional chain reaction references.
- Optional escalation modifiers.

## Action Template Expectations

Required concepts:

- Stable action ID.
- Human label.
- Tags.
- Allowed roles.
- Base success rate.
- Stat effects on success.
- Stat effects on failure.
- Risk profile.
- Optional delayed effects.
- Optional chain triggers.

## Versioning

Add a schema version to template files once the first implementation exists. The loader should reject unsupported major versions and provide migration notes for minor versions.

