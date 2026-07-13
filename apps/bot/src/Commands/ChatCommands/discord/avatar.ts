import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	SeparatorBuilder,
	TextDisplayBuilder,
} from "discord.js";
import { z } from "zod";

import {
	commandTree,
	discordSnowflakeSchema,
	extractOptionString,
} from "#ChatCommands";

const SUPPORTED_SIZES = [
	16, 32, 64, 128, 256, 512, 1024, 2048, 4096,
] as const;

const avatarSchema = z.object({
	userId: discordSnowflakeSchema().optional(),
	size: z.coerce
		.number()
		.int()
		.refine(
			(s) =>
				(SUPPORTED_SIZES as readonly number[]).includes(s),
			{
				message: `Size must be one of: ${SUPPORTED_SIZES.join(", ")}`,
			},
		)
		.default(1024)
		.optional(),
});

export const avatarCommand = commandTree({
	aliases: ["pfp"],
	allowPrefixless: true,
	description: "Display a user's Discord avatar.",
	name: "avatar",
	permission: "public",
	category: "Discord Tools",
	cooldown: 2_000,
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: ["avatar [user mention or ID] [--size=1024]"],
		arguments: [
			{
				name: "user",
				description: "User mention or ID. Defaults to you.",
				required: false,
			},
		],
		options: [
			{
				name: "size",
				description: "Image size (16-4096)",
				valueName: "px",
			},
		],
		examples: [
			{ command: "avatar", description: "Your avatar." },
			{
				command: "avatar <@123456789012345678>",
				description: "Another user's avatar.",
			},
		],
	},
	async execute({ invocation, message, client }) {
		const rawId =
			invocation.positionalArgs[0]?.replace(
				/[<@!>]/g,
				"",
			) ?? message.author.id;

		const result = avatarSchema.safeParse({
			userId: rawId,
			size: extractOptionString(invocation.options, "size"),
		});

		if (!result.success) {
			await message.reply(
				result.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		const size = result.data.size ?? 1024;

		try {
			const user = await client.users.fetch(rawId);

			if (!user) {
				await message.reply("User not found.");
				return;
			}

			const globalAvatar = user.displayAvatarURL({
				size,
				extension: "png",
			});
			const gifAvatar = user.avatar?.startsWith("a_")
				? user.displayAvatarURL({ size, extension: "gif" })
				: undefined;

			const member = message.guild
				? message.guild.members.cache.get(user.id)
				: undefined;
			const serverAvatar = member?.avatar
				? member.displayAvatarURL({ size })
				: undefined;

			const infoLines: string[] = [
				`**${user.username}**'s Avatar`,
			];

			if (user.avatar?.startsWith("a_")) {
				infoLines.push("Animated");
			}

			const container = new ContainerBuilder()
				.setAccentColor(user.accentColor ?? undefined)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						infoLines.join("\n"),
					),
				);

			const galleryItems: MediaGalleryItemBuilder[] = [
				new MediaGalleryItemBuilder()
					.setURL(globalAvatar)
					.setDescription("Global avatar"),
			];

			if (serverAvatar) {
				galleryItems.push(
					new MediaGalleryItemBuilder()
						.setURL(serverAvatar)
						.setDescription("Server avatar"),
				);
			}

			container
				.addSeparatorComponents(
					new SeparatorBuilder().setDivider(true),
				)
				.addMediaGalleryComponents(
					new MediaGalleryBuilder().addItems(
						...galleryItems,
					),
				);

			const buttons: ButtonBuilder[] = [];

			for (const s of [256, 512, 1024, 2048] as const) {
				if (s === size) {
					continue;
				}

				buttons.push(
					new ButtonBuilder()
						.setLabel(`${s}px`)
						.setStyle(ButtonStyle.Link)
						.setURL(
							user.displayAvatarURL({
								size: s,
								extension: "png",
							}),
						),
				);
			}

			if (gifAvatar) {
				buttons.push(
					new ButtonBuilder()
						.setLabel("GIF")
						.setStyle(ButtonStyle.Link)
						.setURL(gifAvatar),
				);
			}

			if (buttons.length > 0) {
				container.addActionRowComponents(
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						...buttons,
					),
				);
			}

			await message.reply({
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch {
			await message.reply(
				"Could not fetch that user's avatar.",
			);
		}
	},
});
