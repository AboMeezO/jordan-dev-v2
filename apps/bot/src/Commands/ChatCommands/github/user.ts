import { Octokit } from "@octokit/rest";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	TextDisplayBuilder,
} from "discord.js";
import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
});

const userSchema = z.object({
	input: textInputSchema(200),
});

const GITHUB_BLUE = 0x2d_76_ee;

export const githubUserCommand = subcommand({
	name: "user",
	aliases: ["u"],
	description:
		"Fetch and display a GitHub user profile summary.",
	category: "Git / GitHub Tools",
	cooldown: 5_000,
	inputLimits: { maxInputLength: 200 },
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: ["github user <username>"],
		arguments: [
			{
				name: "username",
				description: "GitHub username or profile URL.",
				required: true,
			},
		],
		examples: [
			{
				command: "github user octocat",
				description: "Show GitHub profile for octocat.",
			},
		],
	},
	async execute({ invocation, message }) {
		const raw = invocation.positionalArgs.join(" ").trim();
		const result = userSchema.safeParse({ input: raw });

		if (!result.success) {
			await message.reply(
				result.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		let username = result.data.input;

		if (
			username.startsWith("https://") ||
			username.startsWith("http://")
		) {
			try {
				const parsed = new URL(username);
				const parts = parsed.pathname
					.replace(/\/$/, "")
					.split("/");
				username = parts[parts.length - 1] ?? "";
			} catch {
				await message.reply("Invalid GitHub profile URL.");
				return;
			}
		}

		try {
			const response =
				await octokit.rest.users.getByUsername({
					username,
				});
			const user = response.data;

			const infoLines: string[] = [`**${user.login}**`];

			if (user.name) {
				infoLines.push(user.name);
			}

			if (user.bio) {
				infoLines.push("");
				infoLines.push(user.bio.slice(0, 400));
			}

			infoLines.push("");
			infoLines.push(
				`**${user.public_repos}** public repos · **${user.followers}** followers · **${user.following}** following`,
			);

			if (user.company) {
				infoLines.push(`🏢 ${user.company}`);
			}

			if (user.location) {
				infoLines.push(`📍 ${user.location}`);
			}

			infoLines.push(
				`📅 Joined <t:${Math.floor(new Date(user.created_at).getTime() / 1000)}:D>`,
			);

			const container = new ContainerBuilder()
				.setAccentColor(GITHUB_BLUE)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						infoLines.join("\n"),
					),
				)
				.addMediaGalleryComponents(
					new MediaGalleryBuilder().addItems(
						new MediaGalleryItemBuilder()
							.setURL(user.avatar_url)
							.setDescription(`${user.login}'s avatar`),
					),
				);

			const buttons: ButtonBuilder[] = [
				new ButtonBuilder()
					.setLabel("View Profile")
					.setStyle(ButtonStyle.Link)
					.setURL(user.html_url),
			];

			if (user.blog) {
				buttons.unshift(
					new ButtonBuilder()
						.setLabel("Website")
						.setStyle(ButtonStyle.Link)
						.setURL(
							user.blog.startsWith("http")
								? user.blog
								: `https://${user.blog}`,
						),
				);
			}

			container.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					...buttons,
				),
			);

			await message.reply({
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			const status = (error as { status?: number }).status;

			if (status === 404) {
				await message.reply(
					`GitHub user "${username}" not found.`,
				);
			} else if (status === 403) {
				await message.reply(
					"GitHub API rate limit exceeded. Try again later.",
				);
			} else {
				await message.reply(
					"Could not fetch GitHub user information.",
				);
			}
		}
	},
});
