import { AsyncLocalStorage } from "node:async_hooks";
import type { Message } from "discord.js";
import { AiContext } from "./context.js";

const worker = new AsyncLocalStorage<{
	message: Message;
	ctx: AiContext;
}>();

export function getAiWorkerContext(): {
	message: Message;
	ctx: AiContext;
} {
	const ctx = worker.getStore();

	if (!ctx) {
		throw new Error(
			"AI context is not available. Ensure you are inside an AI handler execution.",
		);
	}

	return ctx;
}

export function runInAiWorkerContext<R>(
	ctx: AiContext,
	message: Message,
	callback: () => R,
): R {
	return worker.run({ message, ctx }, callback);
}
