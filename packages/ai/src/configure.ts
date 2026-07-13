import type { Message, TextChannel } from "discord.js";
import type {
	ConfigureAI,
	AIGenerateResult,
} from "./types.js";
import { AiContext } from "./context.js";
import { createSystemPrompt } from "./system-prompt.js";
import type { AiMessage } from "./types.js";

const INTERNAL_STOP_TYPING =
	"<<{{[[((jdInternalStopTyping))]]}}>>";

const AIConfig: Required<ConfigureAI> = {
	disableBuiltInTools: false,

	messageFilter: async (_ctx, message) => {
		return message.mentions.users.has(
			message.client.user.id,
		);
	},

	prepareSystemPrompt: async (_ctx, message) =>
		createSystemPrompt(message),

	preparePrompt: async (_ctx, message) => {
		const recentMessages =
			await message.channel.messages.fetch({
				limit: 10,
				before: message.id,
			});

		const isMe = (id: string) =>
			id === message.client.user.id;

		const conversation: AiMessage = recentMessages
			.filter(
				(msg) =>
					msg.content &&
					(isMe(msg.author.id) || !msg.author.bot),
			)
			.reverse()
			.map((msg) => ({
				role: isMe(msg.author.id)
					? ("assistant" as const)
					: ("user" as const),
				content: msg.content,
			}));

		const ref = message.reference
			? await message.fetchReference().catch(() => null)
			: null;

		return [
			...conversation,
			{
				role: "user" as const,
				content: ref
					? `[replying to ${ref.author.username}: ${ref.content}]\n${message.content}`
					: message.content,
			},
		] as AiMessage;
	},

	selectAiModel: async () => {
		throw new Error(
			"No AI model selected. Call configureAI() with a selectAiModel function.",
		);
	},

	onProcessingStart: async (ctx, message) => {
		if (message.channel.isSendable()) {
			let stopped = false;
			const run = async () => {
				if (stopped) return clearInterval(interval);
				if (message.channel.isSendable()) {
					await message.channel
						.sendTyping()
						.catch(() => {});
				}
			};
			const interval = setInterval(run, 3000).unref();
			await run();
			ctx.store.set(INTERNAL_STOP_TYPING, () => {
				stopped = true;
				clearInterval(interval);
			});
		}
	},

	onProcessingFinish: async (ctx) => {
		const stop = ctx.store.get(INTERNAL_STOP_TYPING) as
			| (() => void)
			| undefined;
		if (stop) {
			stop();
			ctx.store.delete(INTERNAL_STOP_TYPING);
		}
	},

	onResult: async (_ctx, message, result) => {
		if (result.text) {
			await message.reply({
				content: result.text.substring(0, 2000),
				allowedMentions: { parse: [] },
			});
		}
	},

	onError: async (_ctx, message, _error) => {
		const channel = message.channel as TextChannel;
		if (channel.isSendable()) {
			await message
				.reply({
					content:
						"An error occurred while processing your request.",
					allowedMentions: { parse: [] },
				})
				.catch(() => {});
		}
	},
};

export function getAIConfig(): Required<ConfigureAI> {
	return AIConfig;
}

export function configureAI(config: ConfigureAI): void {
	Object.assign(AIConfig, config);
}
