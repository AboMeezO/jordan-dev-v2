import {
	ChannelType,
	type GuildMember,
	type Message,
	PermissionFlagsBits,
} from "discord.js";

import type {
	ChatCommandContext,
	ChatCommandDefinition,
} from "#ChatCommands";

export function shellOutput(
	lines: readonly string[],
): string {
	return `\`\`\`ansi\n${lines.map(colorizeShellLine).join("\n").slice(0, 1900)}\n\`\`\``;
}

type AnsiColor =
	| "blue"
	| "cyan"
	| "green"
	| "magenta"
	| "red"
	| "white"
	| "yellow";

type AnsiStyle = "bold" | "normal";

const SUCCESS_VALUES = new Set([
	"ok",
	"ready",
	"true",
	"yes",
]);
const MUTED_VALUES = new Set([
	".",
	"direct-message",
	"dm",
	"empty",
	"none",
	"not-member",
	"not-ready",
	"standard",
	"unknown",
]);
const DANGER_KEYS = new Set(["denied", "error", "missing"]);
const KEY_VALUE_PATTERN = /(?:^|\s)([A-Za-z_][\w-]*)=/g;
const ACTION_COLORS: Readonly<Record<string, AnsiColor>> = {
	ban: "red",
	kick: "yellow",
	timeout: "magenta",
	unban: "green",
	untimeout: "green",
};

function colorizeShellLine(line: string): string {
	if (line.length === 0) {
		return line;
	}

	if (
		line === "not found" ||
		line.startsWith("No ") ||
		line.startsWith("error=")
	) {
		return colorizeKeyValueLine(line, "red");
	}

	if (/^[A-Z_]+(?:\s{2,}[A-Z_]+)+/.test(line)) {
		return ansi(line, "yellow", "bold");
	}

	if (line.includes("=")) {
		return colorizeKeyValueLine(line);
	}

	if (line.startsWith("/") || line.includes("/channels/")) {
		return ansi(line, "blue");
	}

	return ansi(line, "green");
}

function colorizeKeyValueLine(
	line: string,
	forcedValueColor?: AnsiColor,
): string {
	const fields = parseKeyValueFields(line);

	if (fields.length === 0) {
		return colorizeLooseToken(line);
	}

	const chunks: string[] = [];

	for (const field of fields) {
		if (field.leading.length > 0) {
			chunks.push(field.leading);
		}

		chunks.push(
			colorizeField(
				field.key,
				field.value,
				forcedValueColor,
			),
		);
	}

	return chunks.join("");
}

function colorizeField(
	key: string,
	value: string,
	forcedValueColor?: AnsiColor,
): string {
	const valueColor =
		forcedValueColor ?? valueColorFor(key, value);

	return `${ansi(key, keyColorFor(key), "bold")}${ansi("=", "white")}${ansi(
		value,
		valueColor,
		shouldBoldValue(key, value) ? "bold" : "normal",
	)}`;
}

function parseKeyValueFields(line: string): readonly {
	readonly key: string;
	readonly leading: string;
	readonly value: string;
}[] {
	const matches = [...line.matchAll(KEY_VALUE_PATTERN)];

	return matches.map((match, index) => {
		const matchIndex = match.index ?? 0;
		const fullMatch = match[0] ?? "";
		const key = match[1] ?? "";
		const keyStart = fullMatch.startsWith(" ")
			? matchIndex + 1
			: matchIndex;
		const valueStart = keyStart + key.length + 1;
		const nextMatch = matches[index + 1];
		const valueEnd = nextMatch?.index ?? line.length;
		const leading = line.slice(matchIndex, keyStart);

		return {
			key,
			leading,
			value: line.slice(valueStart, valueEnd).trimEnd(),
		};
	});
}

function colorizeLooseToken(token: string): string {
	if (/^\d{17,20}$/.test(token)) {
		return ansi(token, "magenta");
	}

	if (/^\d+(?:ms|s|m|h|d|w)$/.test(token)) {
		return ansi(token, "yellow");
	}

	return ansi(token, "green");
}

function keyColorFor(key: string): AnsiColor {
	if (DANGER_KEYS.has(key)) {
		return "red";
	}

	if (key === "action" || key === "sudo" || key === "run") {
		return "yellow";
	}

	if (
		key.endsWith("_id") ||
		key === "id" ||
		key === "uid" ||
		key === "gid" ||
		key === "cid"
	) {
		return "magenta";
	}

	return "cyan";
}

function valueColorFor(
	key: string,
	value: string,
): AnsiColor {
	const normalized = value.toLowerCase();

	if (
		DANGER_KEYS.has(key) ||
		normalized.includes("denied") ||
		normalized.includes("blocked")
	) {
		return "red";
	}

	if (key === "action" && ACTION_COLORS[normalized]) {
		return ACTION_COLORS[normalized];
	}

	if (SUCCESS_VALUES.has(normalized)) {
		return "green";
	}

	if (normalized === "false" || normalized === "no") {
		return "red";
	}

	if (MUTED_VALUES.has(normalized)) {
		return "white";
	}

	if (
		/^\d{17,20}$/.test(value) ||
		key.endsWith("_id") ||
		key === "id"
	) {
		return "magenta";
	}

	if (
		/^\d+(?:ms|s|m|h|d|w)$/.test(value) ||
		key.includes("duration") ||
		key.includes("uptime") ||
		key.includes("age")
	) {
		return "yellow";
	}

	if (
		value.startsWith("/") ||
		value.includes("/channels/")
	) {
		return "blue";
	}

	return "green";
}

function shouldBoldValue(
	key: string,
	value: string,
): boolean {
	return (
		key === "action" ||
		DANGER_KEYS.has(key) ||
		SUCCESS_VALUES.has(value.toLowerCase()) ||
		value.toLowerCase() === "false"
	);
}

function ansi(
	text: string,
	color: AnsiColor,
	style: AnsiStyle = "normal",
): string {
	const colors = {
		blue: 34,
		cyan: 36,
		green: 32,
		magenta: 35,
		red: 31,
		white: 37,
		yellow: 33,
	} as const;
	const styles = {
		bold: 1,
		normal: 0,
	} as const;

	return `\u001b[${styles[style]};${colors[color]}m${text}\u001b[0m`;
}

export function formatDuration(
	totalSeconds: number,
): string {
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor((totalSeconds % 86_400) / 3_600);
	const minutes = Math.floor((totalSeconds % 3_600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	return [
		days > 0 ? `${days}d` : undefined,
		hours > 0 ? `${hours}h` : undefined,
		minutes > 0 ? `${minutes}m` : undefined,
		`${seconds}s`,
	]
		.filter(Boolean)
		.join(" ");
}

export function guildMember(
	message: Message,
): GuildMember | undefined {
	return message.member ?? undefined;
}

export function userDisplayName(message: Message): string {
	return (
		guildMember(message)?.displayName ??
		message.author.displayName
	);
}

export function roleNames(
	message: Message,
): readonly string[] {
	return (
		guildMember(message)
			?.roles.cache.filter(
				(role) => role.id !== message.guild?.id,
			)
			.sort((left, right) => right.position - left.position)
			.map((role) => role.name) ?? []
	);
}

export function permissionNames(
	message: Message,
): readonly string[] {
	const permissions = guildMember(message)?.permissions;

	if (!permissions) {
		return [];
	}

	const namedPermissions = [
		["administrator", PermissionFlagsBits.Administrator],
		["manage-guild", PermissionFlagsBits.ManageGuild],
		["manage-messages", PermissionFlagsBits.ManageMessages],
		["kick-members", PermissionFlagsBits.KickMembers],
		["ban-members", PermissionFlagsBits.BanMembers],
		[
			"moderate-members",
			PermissionFlagsBits.ModerateMembers,
		],
	] as const;

	return namedPermissions
		.filter(([, permission]) => permissions.has(permission))
		.map(([name]) => name);
}

export function channelPath(message: Message): string {
	const channel = message.channel;

	if (!message.guild) {
		return "/dm";
	}

	const channelName =
		"name" in channel ? channel.name : message.channelId;
	const category =
		"parent" in channel && channel.parent
			? `${channel.parent.name}/`
			: "";

	return `/guilds/${message.guild.name}/channels/${category}${channelName}`;
}

export function channelKind(message: Message): string {
	switch (message.channel.type) {
		case ChannelType.GuildText:
			return "guild-text";
		case ChannelType.DM:
			return "dm";
		case ChannelType.GuildAnnouncement:
			return "announcement";
		case ChannelType.PublicThread:
		case ChannelType.PrivateThread:
		case ChannelType.AnnouncementThread:
			return "thread";
		default:
			return `type-${message.channel.type}`;
	}
}

export function sortedRootCommands(
	context: ChatCommandContext,
): readonly ChatCommandDefinition[] {
	return [...context.registry.listRootCommands()].sort(
		(left, right) => left.name.localeCompare(right.name),
	);
}
