# Backend Database Foundation

The backend uses PostgreSQL with Prisma. Migrations live under
`apps/backend/prisma/migrations`, and the Prisma schema lives at
`apps/backend/prisma/schema.prisma`.

Use `DatabaseService.transaction()` for multi-step write workflows. Future
ticket, order, verification, role-assignment, and settings updates should run
all dependent writes inside one transaction callback.

Do not rely on in-memory locks or single-instance deployment assumptions.
Concurrency protection should come from:

- database transactions for multi-step writes
- unique constraints for relationship tables such as `user_roles` and
  `role_permissions`
- atomic database operations where Prisma supports them
- idempotent upserts for identity and relationship creation

The current schema intentionally includes only the identity and authorization
tables needed for future features. Business tables should be added with the
first real feature that needs them.

Known permission IDs are synchronized automatically on application startup
via `AuthorizationBootstrapService`. Set `INITIAL_ADMIN_CLERK_USER_ID` to a
Clerk user ID when an initial local administrator role should be assigned.
Leave it unset to sync only the permission catalog without role assignment.
