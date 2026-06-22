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
INITIAL_ADMIN_CLERK_USER_ID=user_...
NODE_ENV=development
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
```

Set these in `apps/backend/.env` (backend-local) or in the root `.env` (repo-wide). Root `.env` takes precedence when both exist.

Secrets stay server-side. Do not expose Clerk secret keys or database URLs through frontend env variables.

## Database

The backend uses PostgreSQL with Prisma 6.

For local development, run PostgreSQL and set:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jordan_devs
```

The exact username, password, host, and database name can differ, but the URL must point to a PostgreSQL database reachable by the backend process.

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

Migration workflow:

```bash
pnpm --dir apps/backend db:validate
pnpm --dir apps/backend db:migrate
pnpm --dir apps/backend db:generate
```

Startup bootstrap runs automatically on next backend start.

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
```

Use these decorators on permission-protected routes. They compose `ClerkAuthGuard` and `PermissionGuard` in the correct order, so routes do not need a separate `@UseGuards(ClerkAuthGuard, PermissionGuard)` declaration.

Use `@UseGuards(ClerkAuthGuard)` directly only for authenticated routes that do not require a permission check.

Frontend permission gates are UX only. Backend guards and data checks are the security boundary.

### Permission Synchronization

`AuthorizationService.syncKnownPermissions()` is called automatically at application startup via `AuthorizationBootstrapService.onApplicationBootstrap()`.

The startup bootstrap always syncs known permissions from `@jordan-devs/shared`.

If `INITIAL_ADMIN_CLERK_USER_ID` is set, the bootstrap also creates or updates an `admin` role with all known permissions, upserts a local user for that Clerk user ID, and assigns the role. Use a Clerk user ID such as `user_...`, not an email address.

If `INITIAL_ADMIN_CLERK_USER_ID` is unset, the bootstrap only syncs known permissions and does not assign any administrator role.

### Quick start bootstrap

Startup bootstrap runs automatically. After running database migrations, simply start the backend:

```bash
pnpm run dev:backend
```

To bootstrap with an initial admin user, find your Clerk user ID (from the Clerk Dashboard → Users → your user → `User ID`) and set it in `apps/backend/.env`:

```txt
INITIAL_ADMIN_CLERK_USER_ID=user_2abc123...
```

Then start the backend. On startup you will see:

```
[Nest] INFO [AuthorizationBootstrapService] INITIAL_ADMIN_CLERK_USER_ID configured: user_2abc123...
[Nest] INFO [AuthorizationBootstrapService] Authorization bootstrap completed. 9 permission(s) synced, admin role: "admin", users assigned: 1.
```

## API Error Format

Successful responses are wrapped by a global response interceptor:

```ts
type ApiSuccessResponse<T> = {
	success: true;
	data: T;
	meta?: Record<string, unknown>;
};
```

Use `@SkipResponseTransform()` only for endpoints that must return raw framework responses, streams, file downloads, CSV exports, PDF exports, or other non-standard payloads. Do not use it for normal JSON API responses.

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

### Session Bootstrap

`GET /me` is an authenticated session bootstrap endpoint that returns the local user profile and effective permissions. It is protected by `ClerkAuthGuard` and does not require additional permissions. The response is wrapped by the global interceptor as `{ success: true, data: SessionBootstrap }`.

Session flow: Clerk token → `ClerkAuthGuard` → `AuthService.authenticateBearerToken` → local user upsert → `UserService.findById` → `AuthorizationService.getEffectivePermissions` → validated `SessionBootstrap`.

`permissions: []` is valid. It means the user is authenticated but has no assigned backend permissions. Permission seeding is a separate task.

Feature modules should keep controllers thin, put business decisions in services, and isolate Prisma access in repositories.

## Testing

Run:

```bash
pnpm --dir apps/backend test
```

Tests are fast Vitest unit tests. They do not call Clerk and do not require a live production database.

Current coverage includes config validation, health/readiness behavior, Zod validation errors, auth guard behavior, permission guard behavior, user identity upsert delegation, and verification response behavior.

Current tests are unit tests. Future integration tests should use a dedicated PostgreSQL test database, not the development or production database. Recommended pattern:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jordan_devs_test
```

Integration tests should apply Prisma migrations before running and clean data between tests with transactions or explicit truncation.

## Non-Goals

No full business features yet.
No dashboard UI changes.
No full role management UI yet.
No fake Discord role granting.
