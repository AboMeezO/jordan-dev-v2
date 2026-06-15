import { commandTree } from "#ChatCommands";

import { shellOutput } from "./format.js";

export const hostnameCommand = commandTree({
  allowPrefixless: true,
  description: "Print the current Discord server hostname.",
  name: "hostname",
  permission: "public",
  usage: {
    examples: [
      {
        command: "hostname",
        description: "Show the current guild name and ID.",
      },
    ],
    formats: ["hostname"],
    useCases: ["Confirm which server received the command."],
  },
  async execute({ message }) {
    await message.reply(shellOutput([
      message.guild
        ? `${message.guild.name} (${message.guild.id})`
        : "direct-message",
    ]));
  },
});

