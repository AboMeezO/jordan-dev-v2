import {
  type Message,
  PermissionFlagsBits,
  type PermissionsBitField,
} from "discord.js";

import type { ChatPermissionLevel } from "./types.js";

const permissionRank: Readonly<Record<ChatPermissionLevel, number>> = {
  administrator: 3,
  "guild-member": 1,
  moderator: 2,
  owner: 4,
  public: 0,
};

export function maxPermissionLevel(
  levels: readonly (ChatPermissionLevel | undefined)[],
): ChatPermissionLevel {
  return levels.reduce<ChatPermissionLevel>((highest, level) => {
    if (!level) {
      return highest;
    }

    return permissionRank[level] > permissionRank[highest] ? level : highest;
  }, "public");
}

export function canUseChatCommand(
  message: Message,
  level: ChatPermissionLevel,
): boolean {
  if (level === "public") {
    return true;
  }

  if (level === "owner") {
    return ownerIds().has(message.author.id);
  }

  if (!message.guild) {
    return false;
  }

  if (level === "guild-member") {
    return true;
  }

  const permissions = message.member?.permissions;

  if (!permissions) {
    return false;
  }

  if (level === "administrator") {
    return permissions.has(PermissionFlagsBits.Administrator);
  }

  return hasModeratorPermissions(permissions);
}

function hasModeratorPermissions(permissions: PermissionsBitField): boolean {
  return (
    permissions.has(PermissionFlagsBits.Administrator) ||
    permissions.has(PermissionFlagsBits.ManageGuild) ||
    permissions.has(PermissionFlagsBits.ManageMessages) ||
    permissions.has(PermissionFlagsBits.KickMembers) ||
    permissions.has(PermissionFlagsBits.BanMembers)
  );
}

function ownerIds(): ReadonlySet<string> {
  return new Set(
    (process.env.OWNER_IDS ?? process.env.OWNER_ID ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

