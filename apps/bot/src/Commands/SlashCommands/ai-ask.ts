import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { generateText } from "ai";
import { getOpencode } from "../../ai/providers/opencode.js";

export const data = new SlashCommandBuilder()
	.setName("ai-ask")
	.setDescription("Ask the AI a question using OpenCode.")
	.addStringOption((option) =>
		option
			.setName("prompt")
			.setDescription("Your question for the AI.")
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName("model")
			.setDescription(
				"Which model to use (default: claude-sonnet-4-5)",
			)
			.addChoices(
				{
					name: "DeepSeek V4 Flash (default)",
					value: "deepseek/deepseek-v4-flash",
				},
				{
					name: "Claude Sonnet 4.5",
					value: "anthropic/claude-sonnet-4-5-20250929",
				},
				{
					name: "Claude Haiku 4.5",
					value: "anthropic/claude-haiku-4-5-20251001",
				},
				{
					name: "Claude Opus 4.5",
					value: "anthropic/claude-opus-4-5-20251101",
				},
				{ name: "GPT-4o", value: "openai/gpt-4o" },
				{
					name: "Gemini 2.5 Flash",
					value: "google/gemini-2.5-flash",
				},
				{
					name: "Gemini 2.5 Pro",
					value: "google/gemini-2.5-pro",
				},
			),
	)
	.addStringOption((option) =>
		option
			.setName("agent")
			.setDescription(
				"OpenCode agent mode (default: general)",
			)
			.addChoices(
				{ name: "General (default)", value: "general" },
				{ name: "Build", value: "build" },
				{ name: "Plan", value: "plan" },
				{ name: "Explore", value: "explore" },
			),
	);

export async function run({
	interaction,
}: {
	readonly interaction: ChatInputCommandInteraction;
}): Promise<void> {
	const prompt = interaction.options.getString(
		"prompt",
		true,
	);
	const modelId =
		interaction.options.getString("model") ??
		"deepseek/deepseek-v4-flash";
	const agent =
		interaction.options.getString("agent") ?? "general";

	await interaction.deferReply();

	try {
		const opencode = getOpencode({ defaultAgent: agent });
		const model = opencode(modelId, { agent });
		const { text } = await generateText({
			model,
			prompt,
			maxRetries: 1,
		});

		await interaction.editReply({
			content:
				text.length > 1900
					? text.substring(0, 1900) +
						"\n\n*(response truncated)*"
					: text,
		});
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Unknown error";
		await interaction.editReply({
			content: `AI request failed: ${message}`,
		});
	}
}
