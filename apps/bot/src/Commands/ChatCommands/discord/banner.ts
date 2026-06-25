import {
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	TextDisplayBuilder,
} from "discord.js";
import { z } from "zod";

import { commandTree, discordSnowflakeSchema, extractOptionString } from "#ChatCommands";

const SUPPORTED_SIZES = [
	16, 32, 64, 128, 256, 512, 1024, 2048, 4096,
] as const;

const bannerSchema = z.object({
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

export const bannerCommand = commandTree({
	aliases: ["user-banner"],
	allowPrefixless: true,
	description:
		"Display a user's Discord profile banner or accent color.",
	name: "banner",
	permission: "public",
	category: "Discord Tools",
	cooldown: 2_000,
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: ["banner [user mention or ID] [--size=1024]"],
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
			{ command: "banner", description: "Your banner." },
			{
				command: "banner <@123456789012345678>",
				description: "Another user's banner.",
			},
		],
	},
	async execute({ invocation, message, client }) {
		const rawId =
			invocation.positionalArgs[0]?.replace(
				/[<@!>]/g,
				"",
			) ?? message.author.id;

		const result = bannerSchema.safeParse({
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
			const user = await client.users.fetch(rawId, {
				force: true,
			});

			if (!user) {
				await message.reply("User not found.");
				return;
			}

			const bannerUrl = user.bannerURL({
				size,
				extension: "png",
			});
				if (bannerUrl) {
				const infoLines: string[] = [
					`**${user.username}**'s Banner`,
				];

				if (user.banner?.startsWith("a_")) {
					infoLines.push("Animated");
				}

				const container = new ContainerBuilder()
					.setAccentColor(user.accentColor ?? undefined)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							infoLines.join("\n"),
						),
					)
					.addMediaGalleryComponents(
						new MediaGalleryBuilder().addItems(
							new MediaGalleryItemBuilder()
								.setURL(bannerUrl)
								.setDescription(
									`${user.username}'s banner`,
								),
						),
					);

				await message.reply({
					components: [container],
					content: "",
					embeds: [],
					flags: MessageFlags.IsComponentsV2,
				});
			} else if (user.hexAccentColor) {
				const container = new ContainerBuilder()
					.setAccentColor(user.accentColor ?? undefined)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`**${user.username}** has no banner.\nAccent color: **${user.hexAccentColor}**`,
						),
					);

				await message.reply({
					components: [container],
					content: "",
					embeds: [],
					flags: MessageFlags.IsComponentsV2,
				});
			} else {
				await message.reply(
					"This user has no banner or accent color.",
				);
			}
		} catch {
			await message.reply(
				"Could not fetch that user's banner.",
			);
		}
	},
});
