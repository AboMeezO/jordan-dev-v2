# Testing

## Running Tests

Tests are standalone TypeScript files using `node:assert`. Run them with `tsx`:

```bash
pnpm --dir apps/bot exec tsx src/ChatCommands/chat-command-parser.test.ts
pnpm --dir apps/bot exec tsx src/ChatCommands/shell-commands.test.ts
pnpm --dir apps/bot exec tsx src/ChatCommands/network.test.ts
pnpm --dir apps/bot exec tsx src/ChatCommands/output.test.ts
pnpm --dir apps/bot exec tsx src/ChatCommands/validation.test.ts
pnpm --dir apps/bot exec tsx src/Reminders/reminder-time.test.ts
pnpm --dir apps/bot exec tsx src/Reminders/reminder-command.test.ts
pnpm --dir apps/bot exec tsx src/audit-log.test.ts
```

## Type Checking

```bash
pnpm --dir apps/bot typecheck
```

## Test File Conventions

- Test files end with `.test.ts`
- Tests use `node:assert/strict`
- Tests print "passed" on success
- No test framework is installed
