import { distance } from "fastest-levenshtein";

import type { ChatCommandRegistry, CommandTreeNode } from "#ChatCommands";
import {
	commandTree,
	renderCommandTree,
	toTreeNode,
} from "#ChatCommands";

import { shellOutput } from "#ChatCommands";

interface FlatEntry {
	readonly name: string;
	readonly aliases: readonly string[];
	readonly path: string;
}

function collectFlatNames(
	registry: ChatCommandRegistry,
): FlatEntry[] {
	const entries: FlatEntry[] = [];

	function walk(
		nodes: CommandTreeNode[],
	): void {
		for (const node of nodes) {
			entries.push({
				aliases: node.aliases,
				name: node.name,
				path: node.path.join(" "),
			});

			if (node.children.length > 0) {
				walk(node.children);
			}
		}
	}

	walk(registry.listRootTreeNodes());
	return entries;
}

export const whichCommand = commandTree({
	aliases: ["where"],
	allowPrefixless: true,
	description:
		"Show whether a bot tool exists and display its command tree.",
	name: "which",
	permission: "public",
	usage: {
		arguments: [
			{
				description: "Command or tool name to look up.",
				name: "tool-name",
				required: true,
			},
		],
		examples: [
			{
				command: "which whoami",
				description:
					"Show the command tree for the whoami command.",
			},
			{
				command: "which tools json",
				description:
					"Show the command tree for the json subcommand.",
			},
			{
				command: "which nonexistent",
				description: "Show suggestions for a typo.",
			},
		],
		formats: ["which <tool-name>"],
		useCases: [
			"Check whether a command exists before using it.",
			"Find the canonical name and aliases for a command.",
			"Discover similar commands when you forget the exact name.",
		],
	},
	async execute({ invocation, message, registry }) {
		const input = invocation.positionalArgs
			.join(" ")
			.trim()
			.toLowerCase();

		if (!input) {
			await message.reply(
				shellOutput(["usage=which <tool-name>"]),
			);
			return;
		}

		const path = input.split(/\s+/);
		const resolved = registry.find(path, "");

		if (resolved) {
			const treeNode = toTreeNode(
				resolved.command,
				path,
			);
			const tree = renderCommandTree([treeNode]);
			await message.reply(
				shellOutput([`found=true`, `path=${path.join(" ")}`, "", tree]),
			);
			return;
		}

		const allEntries = collectFlatNames(registry);
		const suggestions = allEntries
			.map((entry) => ({
				name: entry.name,
				path: entry.path,
				score: distance(input, entry.name),
			}))
			.sort((a, b) => a.score - b.score)
			.filter((s) => s.score <= 5)
			.slice(0, 5);

		if (suggestions.length > 0) {
			await message.reply(
				shellOutput([
					`found=false`,
					`input=${input}`,
					...suggestions.map((s) => `suggestion=${s.path}`),
				]),
			);
		} else {
			await message.reply(
				shellOutput([`found=false`, `input=${input}`]),
			);
		}
	},
});
