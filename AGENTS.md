# Jordan Devs Agent Guide

## Project Overview

This repository is a pnpm monorepo for the Jordan Devs platform.

- `apps/dashboard`: TanStack Start dashboard written in TypeScript.
- `apps/backend`: NestJS backend running on Fastify.
- `packages/shared`: shared schemas, permissions, and contracts used by both apps.
- Backend persistence uses Prisma with PostgreSQL.
- Authentication uses Clerk.
- Authorization contracts and permission IDs are shared through `packages/shared`.

## Golden Rules

- Start by checking `git status --short`.
- Do not modify unrelated files.
- Do not commit pre-existing user changes.
- Keep commits small and reviewable.
- Use conventional commits.
- Run relevant verification before committing.
- Do not mention tools, agents, or generated-code context in commit messages.
- Do not add broad abstractions without actual usage.
- Do not build fake features or placeholder business flows.
- Do not replace chosen libraries without explicit instruction.
- Preserve the current frontend/backend architecture unless the task explicitly asks for an architecture change.

## TypeScript Rules

- Do not use `any`.
- Do not use `as any`.
- Use `unknown` at boundaries, then narrow with schemas or type guards.
- Use Zod for runtime validation of untrusted input.
- Prefer typed DTOs and schemas from `packages/shared`.
- Do not suppress TypeScript or ESLint errors unless there is a documented unavoidable reason.
- Do not use `ts-ignore` without an explanation and a narrow follow-up path.
- Avoid non-null assertions unless the value is proven safe at that point.
- Prefer exact types over `Record<string, unknown>` when the shape is known.
- Keep generated files generated; fix their source generator or configuration instead of hand-editing them.

## Frontend Rules

- Do not touch charts or Recharts code unless explicitly requested.
- Preserve visual design unless the task says otherwise.
- Use existing dashboard primitives before adding new UI primitives.
- Follow existing TanStack Query conventions for server state.
- Use TanStack Form for forms.
- Frontend permission gates are UX only.
- Backend remains the source of truth for authorization.
- Do not expose private tokens or backend secrets in frontend code.

## Backend Rules

- Use the validated config service, not scattered `process.env` reads.
- Use Prisma through the database, repository, and service pattern already present in `apps/backend`.
- Use database constraints and transactions for concurrency-sensitive workflows.
- Use `ClerkAuthGuard` for protected identity.
- Use `RequirePermissions` or `RequireAnyPermission` for permission-protected endpoints.
- Feature modules must import the modules they depend on.
- Use Zod validation and normalized API errors.
- Use `SkipResponseTransform` only for streams, downloads, or raw responses.
- Do not fake Discord role granting or business side effects.

## Shared Package Rules

- Shared schemas and permission IDs belong in `packages/shared`.
- Do not duplicate contracts between frontend and backend.
- Keep `packages/shared` runtime-safe and dependency-light.
- Avoid backend-only or frontend-only dependencies in `packages/shared`.

## Verification Rules

Use the smallest relevant verification set first, then broaden before committing.

- Shared package: `pnpm run build:shared`
- Backend build: `pnpm run build:backend`
- Backend tests: `pnpm --dir apps/backend test`
- Dashboard lint: `pnpm --dir apps/dashboard lint`
- Dashboard tests: `pnpm --dir apps/dashboard test`
- Dashboard build: `pnpm --dir apps/dashboard build`
- Dashboard bundle budget: `pnpm --dir apps/dashboard check:bundle`

Do not document or require commands that are not present in `package.json` files.

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues; external PRs are also treated as a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

All five canonical labels use their default names. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monorepo — `CONTEXT-MAP.md` at the root points to per-context `CONTEXT.md` files. See `docs/agents/domain.md`.

### Skill usage by task

| Task category                       | Load skill                                                                                                                                    | When                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Backend features                    | `nestjs-best-practices`                                                                                                                       | Always                             |
| Dashboard UI                        | `shadcn`, `design-taste-frontend`, `impeccable`, `redesign-existing-projects`, `emil-design-eng`, `nothing-design`, `full-output-enforcement` | Always                             |
| Landing page (website)              | `design-taste-frontend`, `impeccable`, `imagegen-frontend-web`, `emil-design-eng`, `redesign-existing-projects`, `full-output-enforcement`    | Always                             |
| Codebase refactoring / architecture | `improve-codebase-architecture`                                                                                                               | Always                             |
| Animation review                    | `review-animations`                                                                                                                           | Only when explicitly asked         |
| Any code generation                 | `full-output-enforcement`                                                                                                                     | Always (prevents truncated output) |

`setup-matt-pocock-skills` and `design-taste-frontend-v1` are for human use only — do not load them.

## Commit Rules

- Use conventional commits.
- One logical change per commit.
- Keep commits small, focused, and reviewable.
- Do not commit after every file edit or partial step.
- Commit only when a complete logical change is implemented, reviewed, and verified.
- Run the smallest relevant verification set before committing.
- If a task requires multiple unrelated logical changes, split them into separate commits.
- Do not bundle cleanup, refactors, formatting, or unrelated fixes with feature work.
- Do not commit pre-existing user changes.
- Do not stage files blindly.
- Review `git status --short` and the relevant diff before staging.
- Stage only files that belong to the current logical change.
- Do not mention tools, agents, AI, or generated-code context in commit messages.
- Commit messages must be project-focused and describe the actual repository change.
- Do not commit if relevant checks fail, unless the user explicitly instructs otherwise and the failure is documented.
- Do not create empty commits.
- Do not rewrite history, amend commits, rebase, force-push, or squash unless explicitly instructed.
- Do not push unless explicitly instructed.
