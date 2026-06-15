import { commandTree } from "#ChatCommands";

import { echoCommand } from "./echo.js";
import { helpCommand } from "./help.js";
import { pingCommand } from "./ping.js";
import { serverGroup } from "./server/index.js";
import { toolsGroup } from "./tooling/index.js";

export const jdCommand = commandTree({
  aliases: ["jdev"],
  allowPrefixless: true,
  description: "Jordan Devs command examples.",
  name: "jd",
  permission: "public",
  subcommands: [
    helpCommand,
    pingCommand,
    echoCommand,
    toolsGroup,
    serverGroup,
  ],
  usage: {
    examples: [
      {
        command: "jd ping",
        description: "Check command dispatch.",
      },
      {
        command: "jd help remind",
        description: "Show the guide for the prefix-only reminder command.",
      },
    ],
    formats: ["jd <subcommand>", "jd <group> <subcommand>"],
    useCases: [
      "Try nested command syntax without using slash commands.",
      "Explore command guide rendering.",
    ],
  },
});
