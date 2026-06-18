import type { Client, Message } from "discord.js";

import {
	createDefaultChatCommandRegistry,
	dispatchChatCommand,
} from "../../ChatCommands/index.js";

import type { ChatCommandRegistry } from "../../ChatCommands/index.js";

const DEFAULT_PREFIX = "!";
let registryPromise: Promise<ChatCommandRegistry> | null = null;

async function getRegistry(): Promise<ChatCommandRegistry> {
	if (!registryPromise) {
		registryPromise = createDefaultChatCommandRegistry();
	}
	return registryPromise;
}

export default async function (
	message: Message,
	client: Client,
): Promise<void> {
	const registry = await getRegistry();
	await dispatchChatCommand({
		client,
		message,
		prefix: process.env.PREFIX ?? DEFAULT_PREFIX,
		registry,
	});
}
