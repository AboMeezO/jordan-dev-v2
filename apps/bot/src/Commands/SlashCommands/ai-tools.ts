import { generateText, stepCountIs } from "ai";
import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

import {
	getChannelTopic,
	getMemberJoinDate,
	getServerRoles,
} from "../../ai/tools/example-tools.js";

export const data = new SlashCommandBuilder()
	.setName("ai-tools")
	.setDescription(
		"Demonstrate AI tool calling — get server info via natural language.",
	)
	.addStringOption((option) =>
		option
			.setName("query")
			.setDescription(
				"Ask about roles, channels, or members in natural language.",
			)
			.setRequired(true),
	);

export async function run({
	interaction,
}: {
	readonly interaction: ChatInputCommandInteraction;
}): Promise<void> {
	const query = interaction.options.getString(
		"query",
		true,
	);

	await interaction.deferReply();

	try {
		const { google } = await import("@ai-sdk/google");
		const model = google("gemini-2.0-flash");

		const { text } = await generateText({
			model,
			system:
				"You are a helpful Discord assistant. Use the available tools to answer questions about this server.",
			prompt: query,
			stopWhen: stepCountIs(3),
			tools: {
				getServerRoles,
				getChannelTopic,
				getMemberJoinDate,
			},
			maxRetries: 1,
		});

		const reply = text
			? text.substring(0, 1900)
			: "I processed your request but had no response text.";

		await interaction.editReply({ content: reply });
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Unknown error";
		await interaction.editReply({
			content: `Request failed: ${message}`,
		});
	}
}
