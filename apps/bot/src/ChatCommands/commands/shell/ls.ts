import { commandTree } from "#ChatCommands";

import { shellOutput, sortedRootCommands } from "./format.js";

export const lsCommand = commandTree({
  allowPrefixless: true,
  description: "List command trees or subcommands.",
  name: "ls",
  permission: "public",
  usage: {
    arguments: [
      {
        description: "Optional command path to inspect.",
        name: "command-path",
        required: false,
      },
    ],
    examples: [
      {
        command: "ls",
        description: "List root command trees.",
      },
      {
        command: "ls jd tools",
        description: "List subcommands below a nested command group.",
      },
    ],
    formats: ["ls", "ls <command-path>"],
    useCases: ["Discover commands using shell-like syntax."],
  },
  async execute(context) {
    if (context.invocation.positionalArgs.length === 0) {
      await context.message.reply(shellOutput(
        sortedRootCommands(context).map((command) => command.name),
      ));
      return;
    }

    const resolution = context.registry.find(
      context.invocation.positionalArgs,
      context.invocation.prefix || "!",
    );

    if (!resolution) {
      await context.message.reply(shellOutput(["not found"]));
      return;
    }

    const names = resolution.subcommands.map((command) => command.name);
    await context.message.reply(shellOutput(names.length > 0 ? names : ["."]));
  },
});

