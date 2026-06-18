# Chat Command Reference

## Command File Format

Each command file exports a `ChatCommandDefinition` created with `commandTree()`, `commandGroup()`, or `subcommand()`.

### commandTree()

For root commands with optional subcommands:

```ts
import { commandTree } from "#ChatCommands";

export const myCommand = commandTree({
    name: "mycommand",
    aliases: ["mc"],
    description: "Does something.",
    permission: "public",        // public | guild-member | moderator | administrator | owner
    allowPrefixless: true,       // can be used without prefix (default: true)
    category: "Utilities",       // for grouping in help output
    cooldown: 1000,              // ms between uses
    enabled: true,
    devOnly: false,
    ownerOnly: false,
    availability: {              // where the command can be used
        contexts: ["guild", "dm"],
    },
    usage: {
        formats: ["mycommand <arg>"],
        arguments: [{ name: "arg", description: "An argument", required: true }],
        examples: [{ command: "mycommand something", description: "Example" }],
        notes: ["Some note"],
    },
    execute(context) { /* ... */ },
});
```

### commandGroup()

For non-executable grouping nodes (always have subcommands):

```ts
import { commandGroup } from "#ChatCommands";

export const myGroup = commandGroup({
    name: "mygroup",
    description: "A group of related commands.",
    subcommands: [child1, child2],
});
```

### subcommand()

For leaf nodes inside a group:

```ts
import { subcommand } from "#ChatCommands";

export const childCmd = subcommand({
    name: "child",
    description: "Does a specific thing.",
    execute(context) { /* ... */ },
});
```

## Execute Context

The `execute` function receives:

```ts
interface ChatCommandContext {
    client: Client;             // Discord.js client
    message: Message;           // The triggering message
    invocation: ChatCommandInvocation; // Parsed invocation data
    registry: ChatCommandRegistry;     // Global registry
}
```

## Invocation Object

```ts
interface ChatCommandInvocation {
    prefix: string;             // The prefix used (! or empty)
    commandPath: readonly string[]; // ["tools", "base64"]
    rawArgs: readonly string[];     // Remaining tokens after command path
    positionalArgs: readonly string[]; // Positional arguments
    options: Record<string, ChatCommandOptionValue>; // --flag values
}
```
