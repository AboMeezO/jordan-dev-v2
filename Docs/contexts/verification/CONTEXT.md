# Verification

## Purpose
Gate access to the Jordan Devs community by confirming that a prospective member is a genuine developer who will contribute positively.

## Glossary

### Verification
The process of proving a Discord member should be granted access to the community. Currently a minimal linking of a Clerk User to a Discord user ID + guild ID. Future versions will require a membership application form (GitHub profile, real name, age, location, job title, experience, tech stack, bio) with optional system-assisted checks and mandatory manual admin review.

### Verification Status
The current state of a Verification: `PENDING`, `VERIFIED`, `FAILED`, `ROLE_GRANT_PENDING`, or `ROLE_GRANT_FAILED`.

### Verification Event
An audit trail entry recording each step of a Verification's lifecycle (started, completed, failed, role grant triggered/completed/failed).

### Verification Role Grant Job
An async job that grants a Discord role to the verified member. Tracks attempt count and error details. Has its own lifecycle: `PENDING`, `COMPLETED`, `FAILED`.

### Membership Application (future)
A form submitted by a prospective member containing identity and developer-background information. Submitted data is displayed to reviewers alongside optional automated validity hints. Final approval or rejection is always decided by a human admin.

### Reviewer
A User with the authority to approve or reject membership applications. A reviewer role is represented as a System Role with appropriate verification-related permissions.
