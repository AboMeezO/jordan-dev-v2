import type {
	ChatCommandAvailabilityScope,
	ChatCommandContext,
	ChatCommandDefinition,
	ChatCommandInputLimits,
	ChatCommandNodeKind,
	ChatCommandUsageGuide,
	ChatPermissionLevel,
} from "./types.js";

interface ChatCommandNodeInput {
	readonly name: string;
	readonly aliases?: readonly string[];
	readonly description: string;
	readonly permission?: ChatPermissionLevel;
	readonly subcommands?: readonly ChatCommandDefinition[];
	readonly usage?: ChatCommandUsageGuide;

	readonly category?: string;
	readonly enabled?: boolean;
	readonly devOnly?: boolean;
	readonly ownerOnly?: boolean;
	readonly cooldown?: number;
	readonly inputLimits?: ChatCommandInputLimits;
	readonly outputMode?:
		| "inline"
		| "attachment"
		| "inline-or-attachment";
	readonly availability?: ChatCommandAvailabilityScope;
}

interface ChatCommandTreeInput extends ChatCommandNodeInput {
	readonly allowPrefixless?: boolean;
	readonly execute?: (
		context: ChatCommandContext,
	) => Promise<void> | void;
}

interface ChatCommandGroupInput extends ChatCommandNodeInput {
	readonly execute?: (
		context: ChatCommandContext,
	) => Promise<void> | void;
}

interface ChatSubcommandInput extends ChatCommandNodeInput {
	readonly execute: (
		context: ChatCommandContext,
	) => Promise<void> | void;
}

export function commandTree(
	input: ChatCommandTreeInput,
): ChatCommandDefinition {
	return buildNode("command", input);
}

export function commandGroup(
	input: ChatCommandGroupInput,
): ChatCommandDefinition {
	return buildNode("group", input);
}

export function subcommand(
	input: ChatSubcommandInput,
): ChatCommandDefinition {
	return buildNode("subcommand", input);
}

function buildNode(
	kind: ChatCommandNodeKind,
	input:
		| ChatCommandTreeInput
		| ChatCommandGroupInput
		| ChatSubcommandInput,
): ChatCommandDefinition {
	return {
		...(input.aliases ? { aliases: input.aliases } : {}),
		...(kind === "command" &&
		(input as ChatCommandTreeInput).allowPrefixless !==
			undefined
			? {
					allowPrefixless: (input as ChatCommandTreeInput)
						.allowPrefixless,
				}
			: {}),
		description: input.description,
		...(input.execute ? { execute: input.execute } : {}),
		kind,
		name: input.name,
		...(input.permission
			? { permission: input.permission }
			: {}),
		...(input.subcommands
			? { subcommands: input.subcommands }
			: {}),
		...(input.usage ? { usage: input.usage } : {}),

		...(input.category ? { category: input.category } : {}),
		...(input.enabled !== undefined
			? { enabled: input.enabled }
			: {}),
		...(input.devOnly ? { devOnly: input.devOnly } : {}),
		...(input.ownerOnly
			? { ownerOnly: input.ownerOnly }
			: {}),
		...(input.cooldown !== undefined
			? { cooldown: input.cooldown }
			: {}),
		...(input.inputLimits
			? { inputLimits: input.inputLimits }
			: {}),
		...(input.outputMode
			? { outputMode: input.outputMode }
			: {}),
		...(input.availability
			? { availability: input.availability }
			: {}),
	};
}
