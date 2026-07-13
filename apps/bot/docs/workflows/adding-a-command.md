# Adding a Chat Command

## 1. Create a command file

Place it in the appropriate subdirectory of `src/ChatCommands/commands/`:

```ts
// src/ChatCommands/commands/tools/hello.ts
import { commandTree } from "#ChatCommands";

export const helloCommand = commandTree({
	name: "hello",
	description: "Say hello.",
	permission: "public",
	async execute({ message }) {
		await message.reply("Hello!");
	},
});
```

## 2. No registration needed

The dynamic loader (`src/ChatCommands/loader.ts`) scans the `commands/` directory automatically. New files are picked up on next bot restart.

## 3. Adding subcommands

For a command with subcommands, create a group:

```ts
export const myGroup = commandGroup({
	name: "mygroup",
	description: "A group of commands.",
	subcommands: [subCommand1, subCommand2],
});
```

## 4. Adding slash commands

Place the file in `src/Commands/`. CommandKit auto-discovers it.

## 5. Test

Run existing tests to verify nothing broke:

```bash
pnpm --dir apps/bot exec tsx src/ChatCommands/shell-commands.test.ts
```
