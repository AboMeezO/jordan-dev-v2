import { distance } from "fastest-levenshtein";

import { commandTree } from "#ChatCommands";
import { shellOutput } from "./format.js";

export const whichCommand = commandTree({
	aliases: ["where"],
	allowPrefixless: true,
	description:
		"Show whether a bot tool exists and display its metadata.",
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
					"Show metadata for the whoami command.",
			},
			{
				command: "which json",
				description: "Show metadata for the json tool.",
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

		const allCommands = collectAllCommands(
			registry.listRootCommands(),
		);

		const direct = allCommands.find(
			(cmd) =>
				cmd.name.toLowerCase() === input ||
				cmd.aliases?.some((a) => a.toLowerCase() === input),
		);

		if (direct) {
			const lines: string[] = [
				`found=true`,
				`name=${direct.name}`,
				`category=${direct.category ?? "uncategorized"}`,
				`description=${direct.description}`,
			];

			if (direct.aliases && direct.aliases.length > 0) {
				lines.push(`aliases=${direct.aliases.join(", ")}`);
			}

			if (
				direct.permission &&
				direct.permission !== "public"
			) {
				lines.push(`permission=${direct.permission}`);
			}

			if (direct.enabled === false) {
				lines.push("status=disabled");
			}

			if (direct.ownerOnly) {
				lines.push("access=owner-only");
			}

			if (direct.devOnly) {
				lines.push("access=dev-only");
			}

			if (direct.availability?.contexts) {
				lines.push(
					`contexts=${direct.availability.contexts.join(", ")}`,
				);
			}

			if (direct.cooldown) {
				lines.push(`cooldown=${direct.cooldown}ms`);
			}

			await message.reply(shellOutput(lines));
			return;
		}

		const suggestions = allCommands
			.map((cmd) => ({
				name: cmd.name,
				score: distance(input, cmd.name),
			}))
			.sort((a, b) => a.score - b.score)
			.filter((s) => s.score <= 5)
			.slice(0, 5);

		if (suggestions.length > 0) {
			await message.reply(
				shellOutput([
					`found=false`,
					`input=${input}`,
					...suggestions.map((s) => `suggestion=${s.name}`),
				]),
			);
		} else {
			await message.reply(
				shellOutput([`found=false`, `input=${input}`]),
			);
		}
	},
});

interface FlatCommandInfo {
	readonly name: string;
	readonly aliases: readonly string[] | undefined;
	readonly category: string | undefined;
	readonly description: string;
	readonly permission: string | undefined;
	readonly enabled: boolean | undefined;
	readonly ownerOnly: boolean | undefined;
	readonly devOnly: boolean | undefined;
	readonly cooldown: number | undefined;
	readonly availability:
		| { readonly contexts?: readonly string[] }
		| undefined;
}

function collectAllCommands(
	definitions: readonly {
		readonly name: string;
		readonly aliases?: readonly string[];
		readonly category?: string;
		readonly description: string;
		readonly permission?: string;
		readonly enabled?: boolean;
		readonly ownerOnly?: boolean;
		readonly devOnly?: boolean;
		readonly cooldown?: number;
		readonly subcommands?: readonly unknown[];
		readonly availability?: {
			readonly contexts?: readonly string[];
		};
	}[],
): FlatCommandInfo[] {
	const result: FlatCommandInfo[] = [];

	function walk(
		defs: readonly {
			readonly name: string;
			readonly aliases?: readonly string[];
			readonly category?: string;
			readonly description: string;
			readonly permission?: string;
			readonly enabled?: boolean;
			readonly ownerOnly?: boolean;
			readonly devOnly?: boolean;
			readonly cooldown?: number;
			readonly subcommands?: readonly unknown[];
			readonly availability?: {
				readonly contexts?: readonly string[];
			};
		}[],
	): void {
		for (const def of defs) {
			result.push({
				aliases: def.aliases,
				category: def.category,
				description: def.description,
				name: def.name,
				permission: def.permission,
				enabled: def.enabled,
				ownerOnly: def.ownerOnly,
				devOnly: def.devOnly,
				cooldown: def.cooldown,
				availability: def.availability,
			});

			if (def.subcommands && def.subcommands.length > 0) {
				walk(def.subcommands as typeof defs);
			}
		}
	}

	walk(definitions);
	return result;
}
