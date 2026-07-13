# Nested Command Example

## File: `src/ChatCommands/commands/github/index.ts`

```ts
import { commandTree } from "#ChatCommands";

export const githubCommandTree = commandTree({
	name: "github",
	aliases: ["gh"],
	description: "GitHub and Git tools.",
	category: "Git / GitHub Tools",
	cooldown: 1000,
	allowPrefixless: true,
	subcommands: [
		githubUserCommand,
		githubRepoCommand,
		githubIssueCommand,
		gitignoreCommand,
	],
});
```

Subcommands are defined in individual files in the same directory (`user.ts`, `repo.ts`, etc.) and imported into the index file.

Usage: `jd github user <username>`, `jd gh repo <owner>/<repo>`
