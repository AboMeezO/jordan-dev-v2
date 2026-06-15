import {
  ChannelType,
  type GuildMember,
  type Message,
  PermissionFlagsBits,
} from "discord.js";

import type {
  ChatCommandContext,
  ChatCommandDefinition,
} from "#ChatCommands";

export function shellOutput(lines: readonly string[]): string {
  return `\`\`\`\n${lines.join("\n").slice(0, 1900)}\n\`\`\``;
}

export function formatDuration(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return [
    days > 0 ? `${days}d` : undefined,
    hours > 0 ? `${hours}h` : undefined,
    minutes > 0 ? `${minutes}m` : undefined,
    `${seconds}s`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function guildMember(message: Message): GuildMember | undefined {
  return message.member ?? undefined;
}

export function userDisplayName(message: Message): string {
  return guildMember(message)?.displayName ?? message.author.displayName;
}

export function roleNames(message: Message): readonly string[] {
  return (
    guildMember(message)?.roles.cache
      .filter((role) => role.id !== message.guild?.id)
      .sort((left, right) => right.position - left.position)
      .map((role) => role.name) ?? []
  );
}

export function permissionNames(message: Message): readonly string[] {
  const permissions = guildMember(message)?.permissions;

  if (!permissions) {
    return [];
  }

  const namedPermissions = [
    ["administrator", PermissionFlagsBits.Administrator],
    ["manage-guild", PermissionFlagsBits.ManageGuild],
    ["manage-messages", PermissionFlagsBits.ManageMessages],
    ["kick-members", PermissionFlagsBits.KickMembers],
    ["ban-members", PermissionFlagsBits.BanMembers],
    ["moderate-members", PermissionFlagsBits.ModerateMembers],
  ] as const;

  return namedPermissions
    .filter(([, permission]) => permissions.has(permission))
    .map(([name]) => name);
}

export function channelPath(message: Message): string {
  const channel = message.channel;

  if (!message.guild) {
    return "/dm";
  }

  const channelName = "name" in channel ? channel.name : message.channelId;
  const category =
    "parent" in channel && channel.parent ? `${channel.parent.name}/` : "";

  return `/guilds/${message.guild.name}/channels/${category}${channelName}`;
}

export function channelKind(message: Message): string {
  switch (message.channel.type) {
    case ChannelType.GuildText:
      return "guild-text";
    case ChannelType.DM:
      return "dm";
    case ChannelType.GuildAnnouncement:
      return "announcement";
    case ChannelType.PublicThread:
    case ChannelType.PrivateThread:
    case ChannelType.AnnouncementThread:
      return "thread";
    default:
      return `type-${message.channel.type}`;
  }
}

export function sortedRootCommands(
  context: ChatCommandContext,
): readonly ChatCommandDefinition[] {
  return [...context.registry.listRootCommands()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

