import type { Message } from "discord.js";

import type {
  ChatCommandAvailabilityScope,
  ChatCommandDefinition,
} from "./types.js";

export type AvailabilityResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string };

export function checkCommandAvailability(
  command: ChatCommandDefinition,
  message: Message,
): AvailabilityResult {
  if (command.enabled === false) {
    return { allowed: false, reason: "This command is currently disabled." };
  }

  if (command.ownerOnly) {
    const ownerIds = getOwnerIds();

    if (!ownerIds.has(message.author.id)) {
      return {
        allowed: false,
        reason: "This command is restricted to bot owners.",
      };
    }
  }

  if (command.devOnly) {
    const devIds = getDevIds();

    if (!devIds.has(message.author.id)) {
      return {
        allowed: false,
        reason: "This command is restricted to developers.",
      };
    }
  }

  if (!message.guild) {
    return checkDmAvailability(command, message);
  }

  return checkGuildAvailability(command, message);
}

function checkDmAvailability(
  command: ChatCommandDefinition,
  message: Message,
): AvailabilityResult {
  const scope = command.availability;

  if (scope?.contexts && !scope.contexts.includes("dm")) {
    return { allowed: false, reason: "This command cannot be used in DMs." };
  }

  if (scope?.nsfwOnly) {
    return {
      allowed: false,
      reason: "This command can only be used in NSFW channels.",
    };
  }

  const ownerIds = getOwnerIds();

  if (command.permission === "owner" && !ownerIds.has(message.author.id)) {
    return {
      allowed: false,
      reason: "You do not have permission to use this command.",
    };
  }

  if (command.permission && command.permission !== "public" && command.permission !== "owner") {
    return {
      allowed: false,
      reason: "This command requires a server with appropriate permissions.",
    };
  }

  return checkUserAllowDeny(command, message);
}

function checkGuildAvailability(
  command: ChatCommandDefinition,
  message: Message,
): AvailabilityResult {
  const scope = command.availability;
  const guild = message.guild;

  if (!guild) {
    return { allowed: false, reason: "Unexpected error: guild context missing." };
  }

  if (scope?.contexts && !scope.contexts.includes("guild")) {
    return { allowed: false, reason: "This command cannot be used in servers." };
  }

  if (scope?.guildIds?.deny && scope.guildIds.deny.includes(guild.id)) {
    return { allowed: false, reason: "This command is not allowed in this server." };
  }

  if (scope?.guildIds?.allow && !scope.guildIds.allow.includes(guild.id)) {
    return { allowed: false, reason: "This command is not allowed in this server." };
  }

  const channel = message.channel;

  if (scope?.channelIds?.deny && channel && "id" in channel && scope.channelIds.deny.includes(channel.id)) {
    return { allowed: false, reason: "This command is not allowed in this channel." };
  }

  if (scope?.channelIds?.allow && channel && "id" in channel && !scope.channelIds.allow.includes(channel.id)) {
    return { allowed: false, reason: "This command is not allowed in this channel." };
  }

  if (scope?.categoryIds?.deny || scope?.categoryIds?.allow) {
    const parentId = "parentId" in channel && channel.parentId
      ? channel.parentId
      : undefined;

    if (parentId) {
      if (scope.categoryIds.deny && scope.categoryIds.deny.includes(parentId)) {
        return { allowed: false, reason: "This command is not allowed in this category." };
      }

      if (scope.categoryIds.allow && !scope.categoryIds.allow.includes(parentId)) {
        return { allowed: false, reason: "This command is not allowed in this category." };
      }
    } else if (scope.categoryIds.allow) {
      return { allowed: false, reason: "This command is not allowed outside specific categories." };
    }
  }

  if (scope?.nsfwOnly) {
    const nsfw = "nsfw" in channel && channel.nsfw === true;

    if (!nsfw) {
      return {
        allowed: false,
        reason: "This command can only be used in NSFW channels.",
      };
    }
  }

  if (scope?.roleIds?.deny || scope?.roleIds?.allow) {
    const member = message.member;

    if (member) {
      const memberRoleIds = new Set(member.roles.cache.keys());

      if (scope.roleIds?.deny) {
        for (const roleId of scope.roleIds.deny) {
          if (memberRoleIds.has(roleId)) {
            return { allowed: false, reason: "You have a role that cannot use this command." };
          }
        }
      }

      if (scope.roleIds?.allow) {
        const hasAllowed = scope.roleIds.allow.some((id) => memberRoleIds.has(id));

        if (!hasAllowed) {
          return { allowed: false, reason: "You do not have the required role for this command." };
        }
      }
    }
  }

  return checkUserAllowDeny(command, message);
}

function checkUserAllowDeny(
  command: ChatCommandDefinition,
  message: Message,
): AvailabilityResult {
  const scope = command.availability;
  const userId = message.author.id;

  if (scope?.userIds?.deny && scope.userIds.deny.includes(userId)) {
    return { allowed: false, reason: "You are not allowed to use this command." };
  }

  if (scope?.userIds?.allow && !scope.userIds.allow.includes(userId)) {
    return { allowed: false, reason: "You are not allowed to use this command." };
  }

  return { allowed: true };
}

function getOwnerIds(): ReadonlySet<string> {
  return new Set(
    (process.env.OWNER_IDS ?? process.env.OWNER_ID ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

function getDevIds(): ReadonlySet<string> {
  return new Set(
    (process.env.DEV_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}
