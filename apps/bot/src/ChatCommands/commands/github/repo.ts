import { Octokit } from "@octokit/rest";
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

import { subcommand } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
});

const REPO_PATTERN = /^([\w.-]+)\/([\w.-]+)$/;

const repoSchema = z.object({
	input: textInputSchema(200),
});

const GITHUB_BLUE = 0x2d_76_ee;

export const githubRepoCommand = subcommand({
	name: "repo",
	aliases: ["r"],
	description:
		"Fetch and display a GitHub repository summary.",
	category: "Git / GitHub Tools",
	cooldown: 5_000,
	inputLimits: { maxInputLength: 200 },
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: ["github repo <owner/repo>"],
		arguments: [
			{
				name: "repo",
				description:
					"Repository in owner/repo format or URL.",
				required: true,
			},
		],
		examples: [
			{
				command: "github repo octocat/Hello-World",
				description: "Show repository info.",
			},
		],
	},
	async execute({ invocation, message }) {
		const raw = invocation.positionalArgs.join(" ").trim();
		const result = repoSchema.safeParse({ input: raw });

		if (!result.success) {
			await message.reply(
				result.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		let input = result.data.input;

		if (
			input.startsWith("https://") ||
			input.startsWith("http://")
		) {
			try {
				const parsed = new URL(input);
				const parts = parsed.pathname
					.replace(/\/$/, "")
					.split("/");
				const owner = parts[parts.length - 2];
				const repo = parts[parts.length - 1];

				if (!owner || !repo) {
					await message.reply("Invalid GitHub URL.");
					return;
				}

				input = `${owner}/${repo}`;
			} catch {
				await message.reply("Invalid GitHub URL.");
				return;
			}
		}

		const match = input.match(REPO_PATTERN);

		if (!match) {
			await message.reply(
				"Invalid repository format. Use owner/repo.",
			);
			return;
		}

		const [, owner, repo] = match as [
			string,
			string,
			string,
		];

		try {
			const response = await octokit.rest.repos.get({
				owner,
				repo,
			});
			const r = response.data;

			const infoLines: string[] = [`**${r.full_name}**`];

			if (r.description) {
				infoLines.push(r.description.slice(0, 400));
			}

			infoLines.push("");
			infoLines.push(
				`★ **${r.stargazers_count}**  ⑂ **${r.forks_count}**  ◉ **${r.open_issues_count}** open issues`,
			);

			if (r.language) {
				infoLines.push(`🔹 ${r.language}`);
			}

			if (r.license?.spdx_id) {
				infoLines.push(`📜 ${r.license.spdx_id}`);
			}

			infoLines.push(`🌿 ${r.default_branch}`);

			if (r.archived) {
				infoLines.push("📦 Archived");
			}

			if (r.fork) {
				infoLines.push("⑂ Fork");
			}

			if (r.topics && r.topics.length > 0) {
				infoLines.push("");
				infoLines.push(
					r.topics
						.slice(0, 10)
						.map((t) => `\`${t}\``)
						.join(" "),
				);
			}

			infoLines.push("");
			infoLines.push(
				`Created <t:${Math.floor(new Date(r.created_at).getTime() / 1000)}:D> · Updated <t:${Math.floor(new Date(r.updated_at).getTime() / 1000)}:R>`,
			);

			const container = new ContainerBuilder()
				.setAccentColor(GITHUB_BLUE)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						infoLines.join("\n"),
					),
				);

			if (r.owner?.avatar_url) {
				container
					.addSeparatorComponents(
						new SeparatorBuilder().setDivider(true),
					)
					.addMediaGalleryComponents(
						new MediaGalleryBuilder().addItems(
							new MediaGalleryItemBuilder()
								.setURL(r.owner.avatar_url)
								.setDescription(`${r.owner.login}`),
						),
					);
			}

			let latestRelease: string | undefined;

			try {
				const release =
					await octokit.rest.repos.getLatestRelease({
						owner,
						repo,
					});
				latestRelease = release.data.tag_name;
			} catch {
				// No release found, skip
			}

			const buttons: ButtonBuilder[] = [
				new ButtonBuilder()
					.setLabel("View Repository")
					.setStyle(ButtonStyle.Link)
					.setURL(r.html_url),
			];

			if (latestRelease) {
				buttons.unshift(
					new ButtonBuilder()
						.setLabel(`Latest: ${latestRelease}`)
						.setStyle(ButtonStyle.Link)
						.setURL(`${r.html_url}/releases/latest`),
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
					`Repository "${owner}/${repo}" not found.`,
				);
			} else if (status === 403) {
				await message.reply(
					"GitHub API rate limit exceeded.",
				);
			} else {
				await message.reply(
					"Could not fetch repository information.",
				);
			}
		}
	},
});
