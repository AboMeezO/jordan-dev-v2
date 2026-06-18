import { commandTree } from "#ChatCommands";

import { githubIssueCommand } from "./issue.js";
import { githubRepoCommand } from "./repo.js";
import { githubUserCommand } from "./user.js";
import { gitignoreCommand } from "./gitignore_.js";

export const githubCommandTree = commandTree({
  name: "github",
  aliases: ["gh"],
  description: "GitHub and Git tools.",
  category: "Git / GitHub Tools",
  cooldown: 1_000,
  availability: {
    contexts: ["guild", "dm"],
  },
  subcommands: [
    githubUserCommand,
    githubRepoCommand,
    githubIssueCommand,
    gitignoreCommand,
  ],
});
