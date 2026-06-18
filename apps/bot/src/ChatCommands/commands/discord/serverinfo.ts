import { ChannelType } from "discord.js";

import { commandTree } from "#ChatCommands";
import { shellOutput } from "../shell/format.js";

export const serverInfoCommand = commandTree({
  aliases: ["server-info", "guildinfo", "guild-info"],
  allowPrefixless: true,
  description: "Display useful information about the current Discord server.",
  name: "serverinfo",
  permission: "public",
  category: "Discord Tools",
  cooldown: 5_000,
  availability: {
    contexts: ["guild"],
  },
  usage: {
    formats: ["serverinfo [section]"],
    arguments: [
      { name: "section", description: "Optional: overview, roles, channels, emojis, boosts, security.", required: false },
    ],
    examples: [
      { command: "serverinfo", description: "Full server overview." },
      { command: "serverinfo roles", description: "List server roles." },
      { command: "serverinfo security", description: "Show security settings." },
    ],
  },
  async execute({ invocation, message }) {
    const guild = message.guild;

    if (!guild) {
      await message.reply("This command can only be used in a server.");
      return;
    }

    const section = invocation.positionalArgs[0]?.toLowerCase();

    if (section === "roles") {
      const roles = guild.roles.cache
        .filter((role) => role.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map((role) => role.name)
        .slice(0, 50);

      await message.reply(shellOutput([
        `roles=${roles.length > 0 ? roles.join(", ") : "none"}`,
      ]));
      return;
    }

    if (section === "channels") {
      const channels = guild.channels.cache
        .filter((c) => c.type === ChannelType.GuildText)
        .map((c) => c.name)
        .slice(0, 50);

      await message.reply(shellOutput([
        `text_channels=${channels.length > 0 ? channels.join(", ") : "none"}`,
      ]));
      return;
    }

    if (section === "emojis") {
      const emojis = guild.emojis.cache.map((e) => e.name ?? "unknown").slice(0, 50);

      await message.reply(shellOutput([
        `emojis=${emojis.length}`,
        ...(emojis.length > 0 ? [`names=${emojis.join(", ")}`] : []),
      ]));
      return;
    }

    if (section === "boosts") {
      await message.reply(shellOutput([
        `boost_level=${guild.premiumTier}`,
        `boost_count=${guild.premiumSubscriptionCount ?? 0}`,
      ]));
      return;
    }

    if (section === "security") {
      await message.reply(shellOutput([
        `verification_level=${guild.verificationLevel}`,
        `mfa_level=${guild.mfaLevel}`,
        `content_filter=${guild.explicitContentFilter}`,
        `notifications=${guild.defaultMessageNotifications}`,
      ]));
      return;
    }

    const owner = guild.members.resolve(guild.ownerId);

    const lines = [
      `name=${guild.name}`,
      `id=${guild.id}`,
      `owner=${owner?.user.username ?? guild.ownerId}`,
      `created=${guild.createdAt.toISOString()}`,
      `members=${guild.memberCount}`,
      `channels=${guild.channels.cache.size}`,
      `roles=${guild.roles.cache.size}`,
      `emojis=${guild.emojis.cache.size}`,
      `boost_level=${guild.premiumTier}`,
      `boost_count=${guild.premiumSubscriptionCount ?? 0}`,
      `verification=${guild.verificationLevel}`,
    ];

    await message.reply(shellOutput(lines));
  },
});
