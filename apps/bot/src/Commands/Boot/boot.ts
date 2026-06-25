import { resolve } from "node:path";

import {
	ChatCommandRegistry,
	loadCommandDefinitions,
} from "#ChatCommands";

import { chatCommandTrees } from "./commands.js";

export async function createDefaultChatCommandRegistry(
): Promise<ChatCommandRegistry> {
	const registry = new ChatCommandRegistry();
	const basePath = resolve(import.meta.dirname, "../ChatCommands");
	const commands = await loadCommandDefinitions(basePath, chatCommandTrees);

	for (const command of commands) {
		registry.register(command);
	}

	return registry;
}
