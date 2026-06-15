import {
  commandTree,
  renderCommandList,
  renderUsageGuide,
} from "#ChatCommands";

export const manCommand = commandTree({
  aliases: ["help"],
  allowPrefixless: true,
  description: "Show a command manual page.",
  name: "man",
  permission: "public",
  usage: {
    arguments: [
      {
        description: "Command path to inspect.",
        name: "command-path",
        required: false,
      },
    ],
    examples: [
      {
        command: "man whoami",
        description: "Show the manual page for `whoami`.",
      },
      {
        command: "man jd tools args",
        description: "Show the manual page for a nested command.",
      },
    ],
    formats: ["man", "man <command-path>"],
    useCases: ["Read formats, examples, arguments, options, and use cases."],
  },
  async execute({ invocation, message, registry }) {
    if (invocation.positionalArgs.length === 0) {
      await message.reply(renderCommandList(registry.listRootCommands()));
      return;
    }

    const resolution = registry.find(
      invocation.positionalArgs,
      invocation.prefix || "!",
    );

    if (!resolution) {
      await message.reply(
        `No manual entry for \`${invocation.positionalArgs.join(" ")}\`.`,
      );
      return;
    }

    await message.reply(renderUsageGuide({
      command: resolution.command,
      commandPath: resolution.invocation.commandPath,
      permission: resolution.permission,
      prefix: resolution.invocation.prefix,
      subcommands: resolution.subcommands,
    }));
  },
});

