# Chat Command System

## Overview

The chat command system provides shell-like commands that work in Discord text channels. Commands are defined as tree structures with subcommands, permissions, cooldowns, and availability scopes.

## Key Files

- `src/ChatCommands/index.ts` — barrel exports
- `src/ChatCommands/types.ts` — `ChatCommandDefinition`, `CommandTreeNode`, etc.
- `src/ChatCommands/hierarchy.ts` — `commandTree()`, `commandGroup()`, `subcommand()` builders
- `src/ChatCommands/registry.ts` — `ChatCommandRegistry` class
- `src/ChatCommands/loader.ts` — dynamic file system scanner
- `src/ChatCommands/default-registry.ts` — async registry factory
- `src/ChatCommands/parser.ts` — `parseChatCommandInput()` shell-like parser
- `src/ChatCommands/dispatcher.ts` — `dispatchChatCommand()` execution pipeline
- `src/ChatCommands/usage-guide.ts` — `renderUsageGuide()`, `renderCommandTree()`

## Command Definition

Commands are built with `commandTree()`, `commandGroup()`, or `subcommand()` from `src/ChatCommands/hierarchy.ts`:

```ts
const myCommand = commandTree({
	name: "example",
	description: "An example command.",
	permission: "public",
	async execute(context) {
		/* ... */
	},
});
```

## Loading

Commands are loaded dynamically by `src/ChatCommands/loader.ts`, which scans the `commands/` directory recursively. The `createDefaultChatCommandRegistry()` factory returns a `Promise<ChatCommandRegistry>`.

## Tree Rendering

The system supports rendering command trees as:

- Discord-formatted trees with `├──`/`└──` connectors (`renderCommandTree()`)
- Shell-style `key=value` output (`renderCommandTreeShell()`)

## Permission Levels

`public` → `guild-member` → `moderator` → `administrator` → `owner`
