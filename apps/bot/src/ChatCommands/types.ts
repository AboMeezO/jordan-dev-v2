import type { Client, Message } from "discord.js";

import type { ChatCommandRegistry } from "./registry/index.js";

export type ChatPermissionLevel =
	| "public"
	| "guild-member"
	| "moderator"
	| "administrator"
	| "owner";

export interface ChatCommandContext {
	readonly client: Client;
	readonly message: Message;
	readonly invocation: ChatCommandInvocation;
	readonly registry: ChatCommandRegistry;
}

export interface ChatCommandAvailabilityScope {
	readonly contexts?: readonly ("guild" | "dm")[];
	readonly guildIds?: {
		readonly allow?: readonly string[];
		readonly deny?: readonly string[];
	};
	readonly channelIds?: {
		readonly allow?: readonly string[];
		readonly deny?: readonly string[];
	};
	readonly categoryIds?: {
		readonly allow?: readonly string[];
		readonly deny?: readonly string[];
	};
	readonly roleIds?: {
		readonly allow?: readonly string[];
		readonly deny?: readonly string[];
	};
	readonly userIds?: {
		readonly allow?: readonly string[];
		readonly deny?: readonly string[];
	};
	readonly nsfwOnly?: boolean;
}

export interface ChatCommandInputLimits {
	readonly maxInputLength?: number;
	readonly maxOutputLength?: number;
}

export interface ChatCommandDefinition {
	readonly name: string;
	readonly aliases?: readonly string[];
	readonly allowPrefixless?: boolean;
	readonly description: string;
	readonly kind?: ChatCommandNodeKind;
	readonly permission?: ChatPermissionLevel;
	readonly subcommands?: readonly ChatCommandDefinition[];
	readonly usage?: ChatCommandUsageGuide;
	readonly execute?: (
		context: ChatCommandContext,
	) => Promise<void> | void;

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

export type ChatCommandNodeKind =
	| "command"
	| "group"
	| "subcommand";

export interface ChatCommandUsageGuide {
	readonly formats?: readonly string[];
	readonly useCases?: readonly string[];
	readonly examples?: readonly ChatCommandUsageExample[];
	readonly arguments?: readonly ChatCommandArgumentGuide[];
	readonly options?: readonly ChatCommandOptionGuide[];
	readonly notes?: readonly string[];
}

export interface ChatCommandUsageExample {
	readonly command: string;
	readonly description?: string;
}

export interface ChatCommandArgumentGuide {
	readonly name: string;
	readonly description: string;
	readonly required?: boolean;
}

export interface ChatCommandOptionGuide {
	readonly name: string;
	readonly description: string;
	readonly aliases?: readonly string[];
	readonly required?: boolean;
	readonly valueName?: string;
}

export interface ChatCommandInvocation {
	readonly prefix: string;
	readonly commandPath: readonly string[];
	readonly rawArgs: readonly string[];
	readonly positionalArgs: readonly string[];
	readonly options: Readonly<
		Record<string, ChatCommandOptionValue>
	>;
	readonly source: ChatCommandParseResult;
}

export type ChatCommandOptionValue =
	| true
	| readonly string[];

export interface ChatCommandParseResult {
	readonly prefix: string;
	readonly segments: readonly ChatCommandSegment[];
}

export interface ChatCommandSegment {
	readonly words: readonly string[];
	readonly operators: readonly ChatCommandOperator[];
	readonly redirects: readonly ChatCommandRedirect[];
}

export interface ChatCommandOperator {
	readonly value: "|" | "&&" | "||" | ";";
	readonly index: number;
}

export interface ChatCommandRedirect {
	readonly operator: ">" | ">>" | "<" | "2>";
	readonly target: string | undefined;
	readonly index: number;
}

export interface CommandTreeNode {
	readonly name: string;
	readonly kind: ChatCommandNodeKind;
	readonly description: string;
	readonly category: string | null;
	readonly permission: ChatPermissionLevel;
	readonly aliases: readonly string[];
	readonly allowPrefixless: boolean;
	readonly enabled: boolean;
	readonly cooldown: number | null;
	readonly path: readonly string[];
	readonly children: CommandTreeNode[];
}
