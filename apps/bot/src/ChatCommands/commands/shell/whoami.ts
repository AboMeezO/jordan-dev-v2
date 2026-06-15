import { commandTree } from "#ChatCommands";

import {
  guildMember,
  permissionNames,
  roleNames,
  shellOutput,
  userDisplayName,
} from "./format.js";

export const whoamiCommand = commandTree({
  aliases: ["who"],
  allowPrefixless: true,
  description: "Print your Discord identity in this server.",
  name: "whoami",
  permission: "public",
  usage: {
    examples: [
      {
        command: "whoami",
        description: "Show your user, server nickname, roles, and permissions.",
      },
    ],
    formats: ["whoami"],
    useCases: ["Confirm which Discord account and server identity invoked a command."],
  },
  async execute({ message }) {
    const member = guildMember(message);
    const roles = roleNames(message);
    const permissions = permissionNames(message);

    await message.reply(shellOutput([
      `user=${message.author.tag}`,
      `display=${userDisplayName(message)}`,
      `uid=${message.author.id}`,
      `guild=${message.guild?.name ?? "dm"}`,
      `guild_id=${message.guild?.id ?? "none"}`,
      `joined=${member?.joinedAt?.toISOString() ?? "unknown"}`,
      `created=${message.author.createdAt.toISOString()}`,
      `roles=${roles.length > 0 ? roles.join(", ") : "none"}`,
      `permissions=${permissions.length > 0 ? permissions.join(", ") : "standard"}`,
    ]));
  },
});

