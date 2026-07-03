// import type { Client, Message } from "discord.js";

// import { createAIMessageHandler, configureAI } from "@jordan-devs/ai";

// let handler: ((message: Message) => Promise<void>) | null = null;

// function getHandler(): (message: Message) => Promise<void> {
// 	if (!handler) {
// 		configureAI({
// 			selectAiModel: async () => {
// 				const { google } = await import("@ai-sdk/google");
// 				return {
// 					model: google("gemini-2.0-flash"),
// 				};
// 			},
// 		});
// 		handler = createAIMessageHandler();
// 	}
// 	return handler;
// }

// export default async function (message: Message, _client: Client): Promise<void> {
// 	await getHandler()(message);
// }
