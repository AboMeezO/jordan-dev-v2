import { generateText, stepCountIs } from "ai";
import type { Message } from "discord.js";
import { getAIConfig } from "./configure.js";
import { AiContext } from "./context.js";
import { runInAiWorkerContext } from "./ai-context-worker.js";
import { defaultTools } from "./built-in-tools.js";

export function createAIMessageHandler(): (
	message: Message,
) => Promise<void> {
	return async (message: Message) => {
		if (message.author.bot) return;
		if (!message.content?.length) return;
		if (
			!message.channel.isTextBased() ||
			!message.channel.isSendable()
		)
			return;

		const config = getAIConfig();

		const ctx = new AiContext({
			message,
			params: {},
			client: message.client,
		});

		const shouldContinue = await config.messageFilter(
			ctx,
			message,
		);
		if (!shouldContinue) return;

		await runInAiWorkerContext(ctx, message, async () => {
			const systemPrompt = await config.prepareSystemPrompt(
				ctx,
				message,
			);
			const prompt = await config.preparePrompt(
				ctx,
				message,
			);
			const {
				model,
				abortSignal,
				stopWhen,
				tools: userTools,
				...restOptions
			} = await config.selectAiModel(ctx, message);

			const promptOrMessage = (
				typeof prompt === "string"
					? { prompt }
					: { messages: prompt }
			) as
				| { prompt: string; messages: never }
				| {
						messages: import("./types.js").AiMessage;
						prompt: never;
				  };

			await config.onProcessingStart(ctx, message);

			try {
				const result = await generateText({
					model,
					abortSignal:
						abortSignal ?? AbortSignal.timeout(60_000),
					system: systemPrompt,
					stopWhen: stopWhen ?? stepCountIs(5),
					...restOptions,
					tools: {
						...(!config.disableBuiltInTools &&
							defaultTools),
						...userTools,
					} as any,
					...promptOrMessage,
				});

				await config.onResult(ctx, message, result);
			} catch (e) {
				await config.onError(ctx, message, e as Error);
			} finally {
				await config.onProcessingFinish(ctx, message);
			}
		});
	};
}
