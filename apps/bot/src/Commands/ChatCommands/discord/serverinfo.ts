import { ChannelType } from "discord.js";
import {
	ContainerBuilder,
	MessageFlags,
	SeparatorBuilder,
	TextDisplayBuilder,
} from "discord.js";

import { commandTree } from "#ChatCommands";

export const serverInfoCommand = commandTree({
	aliases: ["server-info", "guildinfo", "guild-info"],
	allowPrefixless: true,
	description:
		"Display useful information about the current Discord server.",
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
			{
				name: "section",
				description:
					"Optional: overview, roles, channels, emojis, boosts, security.",
				required: false,
			},
		],
		examples: [
			{
				command: "serverinfo",
				description: "Full server overview.",
			},
			{
				command: "serverinfo roles",
				description: "List server roles.",
			},
			{
				command: "serverinfo security",
				description: "Show security settings.",
			},
		],
	},
	async execute({ invocation, message }) {
		const guild = message.guild;

		if (!guild) {
			await message.reply(
				"This command can only be used in a server.",
			);
			return;
		}

		const section =
			invocation.positionalArgs[0]?.toLowerCase();

		if (section === "roles") {
			const roles = guild.roles.cache
				.filter((role) => role.id !== guild.id)
				.sort((a, b) => b.position - a.position)
				.map((role) => role.name)
				.slice(0, 50);

			const container =
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`**${guild.name}** — Roles (${roles.length})\n${roles.length > 0 ? roles.join(", ") : "none"}`,
					),
				);

			await message.reply({
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (section === "channels") {
			const channels = guild.channels.cache
				.filter((c) => c.type === ChannelType.GuildText)
				.map((c) => c.name)
				.slice(0, 50);

			const container =
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`**${guild.name}** — Text Channels (${channels.length})\n${channels.length > 0 ? channels.join(", ") : "none"}`,
					),
				);

			await message.reply({
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (section === "emojis") {
			const emojis = guild.emojis.cache
				.map((e) => e.name ?? "unknown")
				.slice(0, 50);

			const container =
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`**${guild.name}** — Emojis (${emojis.length})\n${emojis.length > 0 ? emojis.join(", ") : "none"}`,
					),
				);

			await message.reply({
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (section === "boosts") {
			const container =
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`**${guild.name}** — Boosts\nLevel: **${guild.premiumTier}**\nCount: **${guild.premiumSubscriptionCount ?? 0}**`,
					),
				);

			await message.reply({
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (section === "security") {
			const container =
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						[
							`**${guild.name}** — Security`,
							`Verification: **${guild.verificationLevel}**`,
							`MFA: **${guild.mfaLevel}**`,
							`Content Filter: **${guild.explicitContentFilter}**`,
							`Default Notifications: **${guild.defaultMessageNotifications}**`,
						].join("\n"),
					),
				);

			await message.reply({
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		const owner = guild.members.resolve(guild.ownerId);

		const container = new ContainerBuilder()
			.setAccentColor(
				guild.members.cache.get(guild.ownerId)
					?.displayColor ?? undefined,
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					[
						`**${guild.name}**`,
						`🆔 ${guild.id}`,
						`👑 ${owner?.user.username ?? guild.ownerId}`,
						`📅 <t:${Math.floor(guild.createdAt.getTime() / 1000)}:D>`,
					].join("\n"),
				),
			)
			.addSeparatorComponents(
				new SeparatorBuilder().setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					[
						`**Statistics**`,
						`👥 **${guild.memberCount}** members`,
						`📢 **${guild.channels.cache.size}** channels`,
						`🔰 **${guild.roles.cache.size}** roles`,
						`😀 **${guild.emojis.cache.size}** emojis`,
						`🚀 Level **${guild.premiumTier}** (**${guild.premiumSubscriptionCount ?? 0}** boosts)`,
						`🛡️ Verification: **${guild.verificationLevel}**`,
					].join("\n"),
				),
			);

		await message.reply({
			components: [container],
			content: "",
			embeds: [],
			flags: MessageFlags.IsComponentsV2,
		});
	},
});
