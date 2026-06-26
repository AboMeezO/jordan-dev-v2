# Users & Roles

## Purpose
Manage who can access the Jordan Devs Platform and what they can do.

## Glossary

### User
A person with a Discord identity and/or Clerk account. At least one of `discordUserId` or `clerkUserId` must be set. In the Discord-only phase, Users are created on first bot interaction keyed to `discordUserId`. When Clerk hosting arrives, existing Users can be linked to a `clerkUserId` retroactively. A User may or may not be a community Member.

### Member
A User who has completed verification and has been granted access to the Discord server and/or system features. Every Member is a User, but not every User is a Member.

### System Role
A named set of permissions in the platform backend (e.g., "Moderator", "Admin"). Determines what a User can read and do through the API and dashboard. Not the same as a Discord Role.

### Discord Role
A native role on the Jordan Devs Discord server. Managed through Discord's own infrastructure.

### Game Role
A role within the Production Incident Game (e.g., `backend-engineer`, `devops`). Only affects game mechanics. Has no effect outside the game context.

### Permission
A granular action right (e.g., `user:read`, `moderation:manage`). System Roles are composed of Permissions. 12 permissions exist across 7 resource areas.

### Role Binding
An optional pairing between a System Role and a Discord Role. When creating a System Role, the admin may choose to create a matching Discord Role or link to an existing one. This lets admins configure whether platform permissions and Discord roles stay in sync or remain independent.
