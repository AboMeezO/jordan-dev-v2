import type { Client, Message } from "discord.js";
import {
	createAIMessageHandler,
	configureAI,
} from "@jordan-devs/ai";
import { getOpencode } from "../../ai/providers/opencode.js";

let handler: ((message: Message) => Promise<void>) | null =
	null;

function getHandler(): (message: Message) => Promise<void> {
	if (!handler) {
		const opencode = getOpencode({
			defaultAgent: "general",
		});

		configureAI({
			selectAiModel: async (_ctx, message) => {
				const model = opencode(
					"deepseek/deepseek-v4-flash",
					{
						systemPrompt:
							`You are a helpful Discord bot in the server "${message.guild?.name ?? "DMs"}". ` +
							`Reply conversationally and keep responses under 2000 characters.`,
					},
				);
				return { model };
			},
			messageFilter: async (_ctx, message) => {
				return message.mentions.users.has(
					message.client.user.id,
				);
			},
		});

		handler = createAIMessageHandler();
	}
	return handler;
}

export default async function (
	message: Message,
	_client: Client,
): Promise<void> {
	await getHandler()(message);
}
