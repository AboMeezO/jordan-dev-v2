# Jordan Devs Dashboard

The dashboard is the TanStack Start application for authenticated Jordan Devs
operations UI. It currently provides the app shell, protected dashboard surface,
foundation primitives, and conventions needed before real system features are
added.

## Local Development

Run from the repository root:

```bash
pnpm --dir apps/dashboard dev
```

The dev server uses port `3000`.

## Scripts

```bash
pnpm --dir apps/dashboard lint
pnpm --dir apps/dashboard test
pnpm --dir apps/dashboard build
pnpm --dir apps/dashboard check:bundle
```

## Environment Variables

Dashboard environment parsing lives in `src/env.ts`.

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key for the client app.
- `VITE_API_URL`: optional backend API base URL. If omitted, API requests use
  app-relative paths.
- `VITE_APP_TITLE`: optional display/config title.
- `SERVER_URL`: optional server-side URL value.

Do not put server-only secrets behind a `VITE_` prefix.

## Auth Model

Clerk remains the identity/session provider. The app root wraps the dashboard in
`ClerkProvider`, and `ProtectedRoute` handles client-side UX states for checking
session, signed out, forbidden, and unavailable session data.

Client route protection is not security enforcement. Route loaders, server
handlers, and backend endpoints must still verify auth before returning protected
data.

## Session Bootstrap

After Clerk auth, the dashboard calls `GET /me` through `fetchSessionBootstrap`
with the Clerk bearer token. The response is validated with
`sessionBootstrapResponseSchema` from `@jordan-devs/shared`.

The `BackendSessionGate` component wraps the dashboard content and shows
`LoadingState` while `/me` loads and `InlineError` if it fails. On success,
it provides the session via `useBackendSession`.

## Permissions Model

Permission constants and helpers live in `packages/shared/src/permissions.ts` so
the backend can consume the same permission IDs later. Permission strings use a
resource/action shape, for example `settings:update`.

Dashboard helpers:

- `can`
- `canAll`
- `canAny`
- `normalizePermissions`
- `parsePermissionClaims`

Backend `/me` is the preferred source for effective permissions. `usePermission`
reads from the backend session context and fails closed when backend permissions
are unavailable.

`permissions: []` from `/me` is valid. It means the user is authenticated but
has no assigned backend permissions.

Frontend permission gates are UX only. Backend must enforce protected actions.

## API Client Pattern

Use `src/lib/api` for dashboard API calls.

- `apiRequest` handles JSON bodies, credentials, non-JSON responses, empty `204`
  responses, failed HTTP statuses, and optional Zod response parsing.
- `ApiClientError` carries normalized API error data.
- `VITE_API_URL` is the only dashboard API base URL setting.

Do not add fake endpoints. Add typed API functions only when a real backend
contract exists.

## TanStack Query Convention

Query key factories live in `src/lib/query/query-keys.ts`. Keep server-state in
TanStack Query and invalidate the relevant query keys after successful
mutations.

Mutation handling should follow this pattern:

- success: invalidate related query keys
- validation error: expose field errors
- auth/access error: show auth or access-denied UI
- unknown error: show `InlineError`

## Forms Convention

Dashboard forms use `@tanstack/react-form` with Zod schemas. This keeps the
dashboard aligned with TanStack Start, Router, Query, and Table, and avoids
adding a second form paradigm without a repo-specific reason.

Use `src/lib/forms` for schema validation, field-error extraction, submit-error
normalization, and dirty/reset conventions. Import `useForm` from
`src/lib/forms/tanstack-form` when building real forms.

## UI Primitives

Reusable app primitives live in `src/components/app`:

- `LoadingState`
- `EmptyState`
- `InlineError`
- `ConfirmDialog`
- `FormField`

Use these before creating one-off loading, empty, error, confirm, or field
layouts in feature code.

## Testing

Vitest uses `vitest.config.ts` so fast unit tests do not boot the full app Vite
plugin stack. Current tests cover permission helpers, API error/response parsing,
query conventions, and form validation helpers.

## Bundle Guard

Run:

```bash
pnpm --dir apps/dashboard check:bundle
```

The guard checks total dashboard JavaScript raw and gzip size under
`.output/public/assets`.

## Non-Goals

- Charts/Recharts are intentionally untouched.
- Frontend permission gates are UX only.
- Backend must enforce protected actions.
- Do not add fake endpoints.
- Do not redesign the shell during feature work.
