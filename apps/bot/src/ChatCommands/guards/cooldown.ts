import type { Message } from "discord.js";

import { getPrivilegedIds } from "#Config";

import type { ChatCommandDefinition } from "../types.js";

interface CooldownEntry {
	readonly expiresAt: number;
}

const userCooldowns = new Map<string, CooldownEntry>();

export interface CooldownResult {
	readonly allowed: boolean;
	readonly remainingMs?: number;
}

export function checkCooldown(
	command: ChatCommandDefinition,
	message: Message,
): CooldownResult {
	if (!command.cooldown || command.cooldown <= 0) {
		return { allowed: true };
	}

	const ownerDevIds = getPrivilegedIdsCached();

	if (ownerDevIds.has(message.author.id)) {
		return { allowed: true };
	}

	const key = `${command.name}:${message.author.id}`;
	const existing = userCooldowns.get(key);

	if (existing) {
		const remaining = existing.expiresAt - Date.now();

		if (remaining > 0) {
			return { allowed: false, remainingMs: remaining };
		}

		userCooldowns.delete(key);
	}

	const expiresAt = Date.now() + command.cooldown;
	userCooldowns.set(key, { expiresAt });

	return { allowed: true };
}

export function formatRemainingTime(ms: number): string {
	if (ms < 1000) {
		return `${Math.ceil(ms)}ms`;
	}

	const seconds = Math.ceil(ms / 1000);

	if (seconds < 60) {
		return `${seconds}s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	return remainingSeconds > 0
		? `${minutes}m ${remainingSeconds}s`
		: `${minutes}m`;
}

function getPrivilegedIdsCached(): ReadonlySet<string> {
	return getPrivilegedIds();
}
