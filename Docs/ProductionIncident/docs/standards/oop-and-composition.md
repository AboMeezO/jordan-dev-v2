# OOP and Composition Guidelines

## Design Position

Use object-oriented structure where it clarifies ownership and lifecycle, but prefer composition for behavior that changes by rule, template, role, or runtime context.

## Good Class Ownership

Classes are appropriate for:

- `SessionManager` owning active session cache.
- `IncidentEngine` coordinating incident generation/resolution.
- `EscalationDirector` owning pacing state.
- `VotingSystem` owning vote rules.
- `DiscordInteractionRouter` owning Discord interaction routing.
- `DiscordIncidentRenderer` owning Discord payload construction.

## Prefer Composition For

- Random source.
- Clock.
- Scheduler.
- Template catalogs.
- Role assignment strategies.
- Incident selection strategies.
- Tie-break strategies.
- Commentary rule evaluators.
- Reward formulas.

These should be injected as interfaces or small strategy objects instead of inherited base classes.

## Avoid Deep Inheritance

Do not create inheritance trees such as:

- `BaseIncident -> MemoryLeakIncident -> SevereMemoryLeakIncident`
- `BaseRole -> DevOpsRole -> SeniorDevOpsRole`
- `BaseDiscordRenderer -> IncidentRenderer -> SevereIncidentRenderer`

Use data plus rule evaluators instead. Templates and strategy objects are easier to test, extend, and validate.

## SOLID Expectations

- Single responsibility: one system owns one domain capability.
- Open/closed: add new templates, rules, and strategies without rewriting core systems.
- Liskov substitution: keep interfaces small enough that implementations are genuinely replaceable.
- Interface segregation: avoid giant service interfaces.
- Dependency inversion: high-level engine systems depend on ports, not concrete Discord/filesystem/timer implementations.

## Naming

- Behavior strategies end with `Strategy`, `Resolver`, `Selector`, or `Evaluator`.
- Stateful services end with `Manager`, `Director`, `System`, or `Registry`.
- Infrastructure implementations include their technology when useful, such as `NodeScheduler` or `JsonTemplateCatalog`.

## Anti-Patterns

- Abstract base classes with many optional methods.
- Boolean constructor flags that switch major behavior.
- Utility classes that hide mutable global state.
- Static methods that call time, random, filesystem, or Discord APIs.
- Service locators used from inside domain entities.
