# Role Binding: optional pairing between System Roles and Discord Roles

System Roles (permission groups in the Jordan Devs backend) and Discord Roles (native Discord server roles) are separate concepts that can be linked or unlinked per admin choice — there is no automatic 1:1 sync, but the system provides a Role Binding abstraction to bridge them when desired.

**Status:** accepted

## Context

Jordan Devs manages two parallel role systems: System Roles that determine API/dashboard permissions, and Discord Roles that govern server access. An admin might want a "Moderator" System Role to automatically create/manage a "Moderator" Discord role, or they might want to grant dashboard permissions to someone without promoting them in Discord, or grant a vanity Discord role without giving system access.

## Considered Options

- **Strict 1:1 sync** — every System Role auto-creates and manages a matching Discord role. Simple but inflexible; forces the two systems to mirror each other.
- **Fully independent** — System Roles and Discord Roles are completely separate; admins manage them individually. Maximum flexibility but no tooling to keep them aligned.
- **Role Binding with optional pairing (chosen)** — a lightweight binding abstraction lets admins optionally pair System Roles to Discord Roles. The platform can provision/manage the Discord side when requested, or the admin can leave them independent.

## Consequences

- Adding a Role Binding abstraction adds a small schema and UI surface, but avoids the lock-in of either extreme.
- The binding is a future-facing seam: without it, the inevitable request "can we keep the Moderator role in sync automatically" would require retrofitting the entire role system.
- The optional nature of bindings means the verification role-grant flow must work with both bound and unbound roles.
