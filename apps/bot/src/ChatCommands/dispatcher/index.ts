import type { Client, Message } from "discord.js";

import { logCommandExecution } from "#AuditLog";
import { Logger } from "#Logger";

import { checkCommandAvailability } from "../guards/availability.js";
import {
	checkCooldown,
	formatRemainingTime,
} from "../guards/cooldown.js";
import { parseChatCommandInput } from "../parser/index.js";
import { canUseChatCommand } from "../guards/permissions.js";
import type {
	ChatCommandRegistry,
	ChatCommandResolution,
} from "../registry/index.js";
import type { ChatCommandParseResult } from "../types.js";
import { renderUsageGuide } from "../output/usage-guide.js";

const log = new Logger("dispatch");

export interface DispatchChatCommandInput {
	readonly client: Client;
	readonly message: Message;
	readonly prefix: string;
	readonly registry: ChatCommandRegistry;
}

export async function dispatchChatCommand(
	input: DispatchChatCommandInput,
): Promise<boolean> {
	if (input.message.author.bot) {
		return false;
	}

	const resolved = resolveMessageCommand(input);

	if (!resolved) {
		return false;
	}

	const { parsed, resolution } = resolved;
	const firstSegment = parsed.segments[0];

	if (!firstSegment) {
		return false;
	}

	if (
		parsed.segments.length > 1 ||
		firstSegment.operators.length > 0
	) {
		await input.message.reply(
			"Pipelines and command chaining are parsed but not enabled yet.",
		);
		return true;
	}

	if (firstSegment.redirects.length > 0) {
		await input.message.reply(
			"Redirection syntax is parsed but Discord output targets are not enabled yet.",
		);
		return true;
	}

	if (!resolution.command.execute) {
		await input.message.reply(
			renderUsageGuide({
				command: resolution.command,
				commandPath: resolution.invocation.commandPath,
				permission: resolution.permission,
				prefix: resolution.invocation.prefix,
				subcommands: resolution.subcommands,
			}),
		);
		return true;
	}

	if (
		!canUseChatCommand(input.message, resolution.permission)
	) {
		await input.message.reply(
			"You do not have permission to use that command.",
		);
		return true;
	}

	const availability = checkCommandAvailability(
		resolution.command,
		input.message,
	);

	if (!availability.allowed) {
		await input.message.reply(availability.reason);
		return true;
	}

	const cooldown = checkCooldown(
		resolution.command,
		input.message,
	);

	if (
		!cooldown.allowed &&
		cooldown.remainingMs !== undefined
	) {
		await input.message.reply(
			`Please wait ${formatRemainingTime(cooldown.remainingMs)} before using this command again.`,
		);
		return true;
	}

	await resolution.command.execute({
		client: input.client,
		invocation: resolution.invocation,
		message: input.message,
		registry: input.registry,
	});

	const elevated =
		resolution.permission !== "public" &&
		resolution.permission !== "guild-member";
	logCommandExecution({
		command: resolution.invocation.commandPath.join(" "),
		userId: input.message.author.id,
		userTag: input.message.author.tag,
		guildId: input.message.guild?.id ?? null,
		channelId: input.message.channelId,
		timestamp: new Date().toISOString(),
		sudo: false,
		elevated,
		args: resolution.invocation.rawArgs.join(" "),
	}).catch((error) =>
		log.error("audit log failed:", error),
	);

	return true;
}

export async function executeChatCommandResolution(
	input: DispatchChatCommandInput & {
		readonly resolution: ChatCommandResolution;
	},
): Promise<boolean> {
	const { resolution } = input;

	if (!resolution.command.execute) {
		await input.message.reply(
			renderUsageGuide({
				command: resolution.command,
				commandPath: resolution.invocation.commandPath,
				permission: resolution.permission,
				prefix: resolution.invocation.prefix,
				subcommands: resolution.subcommands,
			}),
		);
		return true;
	}

	const availability = checkCommandAvailability(
		resolution.command,
		input.message,
	);

	if (!availability.allowed) {
		await input.message.reply(availability.reason);
		return true;
	}

	const cooldown = checkCooldown(
		resolution.command,
		input.message,
	);

	if (
		!cooldown.allowed &&
		cooldown.remainingMs !== undefined
	) {
		await input.message.reply(
			`Please wait ${formatRemainingTime(cooldown.remainingMs)} before using this command again.`,
		);
		return true;
	}

	await resolution.command.execute({
		client: input.client,
		invocation: resolution.invocation,
		message: input.message,
		registry: input.registry,
	});

	const elevated =
		resolution.permission !== "public" &&
		resolution.permission !== "guild-member";
	logCommandExecution({
		command: resolution.invocation.commandPath.join(" "),
		userId: input.message.author.id,
		userTag: input.message.author.tag,
		guildId: input.message.guild?.id ?? null,
		channelId: input.message.channelId,
		timestamp: new Date().toISOString(),
		sudo: false,
		elevated,
		args: resolution.invocation.rawArgs.join(" "),
	}).catch((error) =>
		log.error("audit log failed:", error),
	);

	return true;
}

function resolveMessageCommand(
	input: DispatchChatCommandInput,
):
	| {
			readonly parsed: ChatCommandParseResult;
			readonly resolution: ChatCommandResolution;
	  }
	| undefined {
	const prefixed = parseChatCommandInput(
		input.message.content,
		input.prefix,
	);

	if (prefixed) {
		const resolution = input.registry.resolve(prefixed);

		if (resolution) {
			return { parsed: prefixed, resolution };
		}

		return undefined;
	}

	const prefixless = parseChatCommandInput(
		input.message.content,
		"",
	);

	if (!prefixless) {
		return undefined;
	}

	const resolution = input.registry.resolve(prefixless);

	if (!resolution?.allowPrefixless) {
		return undefined;
	}

	return { parsed: prefixless, resolution };
}
