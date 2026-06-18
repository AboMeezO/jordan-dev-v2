import { resolve } from "node:path";

import { chatCommandTrees } from "./commands/index.js";
import { ChatCommandRegistry } from "./registry.js";
import { loadCommandDefinitions } from "./loader.js";

export async function createDefaultChatCommandRegistry(
): Promise<ChatCommandRegistry> {
	const registry = new ChatCommandRegistry();
	const basePath = resolve(import.meta.dirname, "commands");
	const commands = await loadCommandDefinitions(basePath, chatCommandTrees);

	for (const command of commands) {
		registry.register(command);
	}

	return registry;
}
