import {
  renderCommandList,
  renderUsageGuide,
  subcommand,
} from "#ChatCommands";

export const helpCommand = subcommand({
  description: "Show command usage guides.",
  name: "help",
  usage: {
    arguments: [
      {
        description: "Optional command path, such as `jd tools args`.",
        name: "command-path",
        required: false,
      },
    ],
    examples: [
      {
        command: "jd help",
        description: "List the available command trees.",
      },
      {
        command: "jd help jd tools args",
        description: "Show a nested command guide.",
      },
    ],
    formats: ["jd help", "jd help <command-path>"],
    useCases: [
      "Discover available command trees.",
      "Inspect formats, arguments, options, examples, and use cases.",
    ],
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
        `No command guide found for \`${invocation.positionalArgs.join(" ")}\`.`,
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
