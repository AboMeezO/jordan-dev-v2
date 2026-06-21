# Backend

NestJS/Fastify API for Jordan Devs platform services. This app is the backend foundation for later users, roles, permissions, verification, guilds, tickets, orders, teams, settings, and statistics features.

## Local Development

Install dependencies from the repository root:

```bash
pnpm install
```

Run the backend in development:

```bash
pnpm run dev:backend
```

Build the backend:

```bash
pnpm run build:backend
```

## Scripts

```bash
pnpm --dir apps/backend build
pnpm --dir apps/backend test
pnpm --dir apps/backend db:validate
pnpm --dir apps/backend db:generate
pnpm --dir apps/backend db:migrate
```

Root helpers:

```bash
pnpm run build:shared
pnpm run build:backend
```

## Environment Variables

Backend config is validated at startup with `@t3-oss/env-core` and Zod.

Required:

```txt
CLERK_SECRET_KEY
CLERK_JWT_KEY
DATABASE_URL
```

Optional/defaulted:

```txt
NODE_ENV=development
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
```

Secrets stay server-side. Do not expose Clerk secret keys or database URLs through frontend env variables.

## Database

The backend uses PostgreSQL with Prisma 6.

Schema:

```txt
apps/backend/prisma/schema.prisma
```

Migrations:

```txt
apps/backend/prisma/migrations
```

The first migration creates only foundation tables:

```txt
users
roles
permissions
user_roles
role_permissions
```

Relationship tables have unique constraints so concurrent role and permission assignment cannot create duplicate mappings.

Use `DatabaseService.transaction()` for multi-step writes. Future ticket, order, verification, role-assignment, and settings workflows should keep related reads and writes inside a Prisma transaction and prefer database constraints or atomic operations over read-modify-write logic.

## Auth Model

Clerk remains the identity provider. Backend protected routes should use `ClerkAuthGuard`, which:

```txt
extracts a Bearer token
verifies it with Clerk using validated backend config
upserts the local user identity
attaches a typed request user
```

Use `@CurrentUser()` in controllers instead of parsing auth headers locally.

## Permission Model

Permission IDs come from `@jordan-devs/shared`.

Backend authorization is enforced by:

```txt
@RequirePermissions(...)
@RequireAnyPermission(...)
PermissionGuard
AuthorizationService
```

Frontend permission gates are UX only. Backend guards and data checks are the security boundary.

### Permission Synchronization

`AuthorizationService.syncKnownPermissions()` can upsert the shared permission IDs into the database, but it is intentionally not run automatically at application startup.

Reason: startup-time database writes are hidden production side effects. Permission synchronization should run as an explicit operational step when permissions are added or changed, or as part of a future seed/admin migration workflow.

Until that workflow exists, run synchronization from a deliberate script or maintenance task that imports `AuthorizationService` and calls `syncKnownPermissions()` after database migrations have been applied.

## API Error Format

Successful responses are wrapped by a global response interceptor:

```ts
type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};
```

API errors are normalized to:

```ts
type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
```

The global exception filter normalizes validation, auth, forbidden, not-found, and unknown errors. Production unknown errors do not expose stack traces.

## Validation

Use Zod schemas with `ZodValidationPipe` for request DTO validation. Validation failures return `VALIDATION_ERROR` with field-level errors.

Shared schemas should live in `packages/shared` when both dashboard and backend consume the contract.

## Module Structure

```txt
src/
  app.module.ts
  main.ts
  common/
    decorators/
    errors/
    filters/
    types/
    validation/
  config/
  database/
  modules/
    auth/
    authorization/
    health/
    users/
    verification/
```

Feature modules should keep controllers thin, put business decisions in services, and isolate Prisma access in repositories.

## Testing

Run:

```bash
pnpm --dir apps/backend test
```

Tests are fast Vitest unit tests. They do not call Clerk and do not require a live production database.

Current coverage includes config validation, health/readiness behavior, Zod validation errors, auth guard behavior, permission guard behavior, user identity upsert delegation, and verification response behavior.

## Non-Goals

No full business features yet.
No dashboard UI changes.
No full role management UI yet.
No fake Discord role granting.
