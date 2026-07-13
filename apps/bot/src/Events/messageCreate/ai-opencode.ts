import {
	configureAI,
	createAIMessageHandler,
} from "@jordan-devs/ai";
import type { Message } from "discord.js";

import { getOpencode } from "../../ai/providers/opencode.js";

let handler: ((message: Message) => Promise<void>) | null =
	null;

function getHandler(): (message: Message) => Promise<void> {
	if (!handler) {
		const opencode = getOpencode({
			defaultAgent: "general",
		});

		configureAI({
			// eslint-disable-next-line @typescript-eslint/require-await
			selectAiModel: async (_ctx, message) => {
				const model = opencode(
					"opencode/deepseek-v4-flash-free",
					{
						systemPrompt:
							`You are a helpful Discord bot in the server "${message.guild?.name ?? "DMs"}". ` +
							`Reply conversationally and keep responses under 2000 characters.`,
					},
				);
				return { model };
			},
			// eslint-disable-next-line @typescript-eslint/require-await
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
): Promise<void> {
	await getHandler()(message);
}
