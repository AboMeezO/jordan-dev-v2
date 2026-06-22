import type { Client } from "discord.js";

import { Logger } from "#Logger";

import type { CommandTreeNode } from "../../ChatCommands/index.js";
import {
	createDefaultChatCommandRegistry,
	renderCommandTree,
} from "../../ChatCommands/index.js";
import { getReminderService } from "../../Reminders/index.js";

const log = new Logger("client-ready");

function countTreeNodes(
	nodes: readonly CommandTreeNode[],
): number {
	let count = 0;
	for (const node of nodes) {
		count += 1;
		count += countTreeNodes(node.children);
	}
	return count;
}

export default async function (
	client: Client,
): Promise<void> {
	await getReminderService(client).initialize();
	log.info(`Client is ready as ${client.user?.tag}`);

	const registry = await createDefaultChatCommandRegistry();
		const trees = registry.listRootTreeNodes();
	const total = countTreeNodes(trees);

	const allLines = [`Loaded ${total} commands:`, renderCommandTree(trees)];
	console.log(allLines.join("\n"));
}
