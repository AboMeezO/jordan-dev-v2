# Basic Command Example

## File: `src/ChatCommands/commands/tools/base64.ts`

```ts
import { commandTree } from "#ChatCommands";

export const base64Command = commandTree({
    name: "base64",
    aliases: ["b64"],
    description: "Encode or decode Base64.",
    category: "Dev Utilities",
    permission: "public",
    cooldown: 500,
    availability: {
        contexts: ["guild", "dm"],
    },
    usage: {
        formats: ["base64 encode <text>", "base64 decode <text>"],
        arguments: [
            { name: "action", description: "encode or decode", required: true },
            { name: "text", description: "The text to process", required: true },
        ],
        examples: [
            { command: "base64 encode hello", description: "Encodes 'hello'" },
        ],
    },
    execute: async ({ invocation, message }) => {
        const action = invocation.positionalArgs[0];
        const text = invocation.positionalArgs.slice(1).join(" ");
        // ... encode/decode logic
    },
});
```

This command is automatically loaded by the dynamic loader from the `commands/tools/` directory.
