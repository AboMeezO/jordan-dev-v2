import { commandTree } from "#ChatCommands";

import {
  guildMember,
  permissionNames,
  roleNames,
  shellOutput,
} from "./format.js";

export const idCommand = commandTree({
  allowPrefixless: true,
  description: "Print Discord IDs and role groups for your account.",
  name: "id",
  permission: "public",
  usage: {
    examples: [
      {
        command: "id",
        description: "Show Discord user, guild, channel, role, and permission IDs.",
      },
    ],
    formats: ["id"],
    useCases: ["Copy exact Discord IDs without opening developer mode menus."],
  },
  async execute({ message }) {
    const member = guildMember(message);
    const roles = roleNames(message);
    const permissions = permissionNames(message);

    await message.reply(shellOutput([
      `uid=${message.author.id}(${message.author.username})`,
      `gid=${message.guild?.id ?? "dm"}(${message.guild?.name ?? "direct-message"})`,
      `cid=${message.channelId}`,
      `member=${member?.id ?? message.author.id}`,
      `groups=${roles.length > 0 ? roles.join(", ") : "none"}`,
      `permissions=${permissions.length > 0 ? permissions.join(", ") : "standard"}`,
    ]));
  },
});

