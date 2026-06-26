# Verification

## Purpose
Gate access to the Jordan Devs community by confirming that a prospective member is a genuine developer who will contribute positively.

## Glossary

### User
A person with a Clerk account and/or Discord identity who can interact with the platform. At least one of `clerkUserId` or `discordUserId` must be set. In the Discord-only phase, users are created on first bot interaction keyed to `discordUserId`. When Clerk hosting arrives, existing users can be linked to a `clerkUserId` retroactively.

### Verification
The technical gate result. A record linking a User to a Discord server membership. Created as a consequence of Application approval. Tracks the outcome of the role-granting process. Lifecycle: `PENDING` → `ROLE_GRANT_PENDING` → `ROLE_GRANT_COMPLETED` / `ROLE_GRANT_FAILED`, or `FAILED`.

### Verification Event
An audit trail entry recording each step of a Verification's lifecycle (started, completed, failed, role grant triggered/completed/failed).

### Verification Role Grant Job
An async job that grants a Discord role to the verified member. Tracks attempt count and error details. Has its own lifecycle: `PENDING`, `COMPLETED`, `FAILED`.

### Membership Application
The core entity that owns the multi-step form data, the review state, and the admission decision. Distinct from Verification — an Application collects information; Verification enacts a technical gate. An Application is created when a User begins filling out the form (the Verification record exists beforehand as the pairing link). When an Application is approved, the existing Verification record is updated to `ROLE_GRANT_PENDING`. A User can have multiple Applications (if rejected and reapplies).

### Application Status
The lifecycle of a Membership Application: `drafting` → `submitted` → `under_review` → `approved` / `rejected`. Once submitted, the application is locked — the User cannot edit it while admins review it. `approved` and `rejected` are terminal states. A rejected User starts a new Application to reapply (previous data is preserved as an audit trail). An admin claims a `submitted` Application to transition it to `under_review`, preventing duplicate reviews.

### Application Section
A named grouping of related fields within a Membership Application (e.g. "Basic Info", "Project Details", "Background"). Sections are a UI concept — the Application model stores all fields as a flat set, not per-section records. The Discord bot uses sections to present one group of questions at a time; the Dashboard could render them as accordion panels. Sections are sequential in the Discord flow (must complete one to access the next) but appear all at once in the Dashboard.

### Referral Source
An open enum indicating how the Applicant discovered the community. Predefined options: `reddit`, `friend_invite`, `web_search`, `github`. An `other` option with a required free-text field captures any unlisted source.

### Application Review
The admin decision recorded inline on a Membership Application. Captures: `reviewedBy` (admin's User ID), `reviewedAt`, `decision` (`approved` / `rejected`), and `rejectionReason` (required on reject). A simplified model — not a first-class entity. Can be extracted into a `Review` entity later if multi-round review or analytics require it.

### Guild Config
A per-guild settings record stored in the database. Stores Discord role IDs for `unverifiedRoleId`, `verifiedRoleId`, and `reviewerRoleId`, plus the `verificationChannelId`. Managed through the Dashboard's guild config section. The bot reads these at runtime to determine which roles to assign and where to post review requests.

### Unverified Role
A Discord role auto-assigned to every new member on `guildMemberAdd`. Gates access to all channels except the verification channel. Replaced by the Verified role upon Application approval.

### Verified Role
A Discord role granted upon Application approval. Unlocks full community access. Swap is atomic: Unverified role is removed, Verified role is added in the same operation.

### Applicant
A User who has started but not yet completed the application process. An Applicant is not yet a Member.

### Reviewer
A User with the authority to approve or reject Membership Applications. Authorization mechanism depends on the interface: in Discord, a User is a Reviewer if they hold the designated "Reviewer" Discord role or have Administrator permissions on the guild. In the Dashboard, a Reviewer holds a System Role with verification-related permissions. The two mechanisms coexist — a User may be a Reviewer through one, both, or neither.
