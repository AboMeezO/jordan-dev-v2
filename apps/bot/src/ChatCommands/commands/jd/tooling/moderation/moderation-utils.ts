import {
	type Guild,
	type GuildMember,
	PermissionFlagsBits,
	type PermissionResolvable,
	type User,
} from "discord.js";

import type { ChatCommandContext } from "#ChatCommands";

import { shellOutput } from "../../../shell/format.js";

const DISCORD_ID_PATTERN = /^\d{17,20}$/;
const MENTION_PATTERN = /^<@!?(\d{17,20})>$/;
const RELATIVE_DURATION_PATTERN =
	/^(?<amount>\d+)\s*(?<unit>s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/i;

const DURATION_MS: Readonly<Record<string, number>> = {
	d: 86_400_000,
	day: 86_400_000,
	days: 86_400_000,
	h: 3_600_000,
	hour: 3_600_000,
	hours: 3_600_000,
	hr: 3_600_000,
	hrs: 3_600_000,
	m: 60_000,
	min: 60_000,
	mins: 60_000,
	minute: 60_000,
	minutes: 60_000,
	s: 1000,
	sec: 1000,
	secs: 1000,
	second: 1000,
	seconds: 1000,
	w: 604_800_000,
	week: 604_800_000,
	weeks: 604_800_000,
};

export const BAN_PERMISSION =
	PermissionFlagsBits.BanMembers;
export const KICK_PERMISSION =
	PermissionFlagsBits.KickMembers;
export const TIMEOUT_PERMISSION =
	PermissionFlagsBits.ModerateMembers;
export const AUDIT_PERMISSION =
	PermissionFlagsBits.ViewAuditLog;

export const MODERATION_USAGE_NOTES = [
	"Targets can be user mentions or raw Discord user IDs.",
	"Reasons are passed to Discord audit logs.",
	"The bot can only act on members below its highest role.",
] as const;

export interface ModerationTarget {
	readonly id: string;
	readonly member?: GuildMember;
	readonly user?: User;
}

export function parseUserId(
	input: string,
): string | undefined {
	const mentionMatch = MENTION_PATTERN.exec(input);

	if (mentionMatch?.[1]) {
		return mentionMatch[1];
	}

	return DISCORD_ID_PATTERN.test(input) ? input : undefined;
}

export function parseModerationArgs(
	args: readonly string[],
): {
	readonly rest: readonly string[];
	readonly targetId: string | undefined;
} {
	const [targetInput, ...rest] = args;

	return {
		rest,
		targetId: targetInput
			? parseUserId(targetInput)
			: undefined,
	};
}

export function parseReason(
	args: readonly string[],
): string {
	return args.join(" ").trim() || "No reason provided.";
}

export function parseDurationMs(
	input: string | undefined,
): number | undefined {
	if (!input) {
		return undefined;
	}

	const match = RELATIVE_DURATION_PATTERN.exec(input);
	const groups = match?.groups;

	if (!groups?.amount || !groups.unit) {
		return undefined;
	}

	const amount = Number(groups.amount);
	const unitMs = DURATION_MS[groups.unit.toLowerCase()];

	if (
		!Number.isSafeInteger(amount) ||
		amount <= 0 ||
		!unitMs
	) {
		return undefined;
	}

	return amount * unitMs;
}

export function formatMs(totalMs: number): string {
	const totalSeconds = Math.floor(totalMs / 1000);
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor((totalSeconds % 86_400) / 3_600);
	const minutes = Math.floor((totalSeconds % 3_600) / 60);
	const seconds = totalSeconds % 60;

	return (
		[
			days > 0 ? `${days}d` : undefined,
			hours > 0 ? `${hours}h` : undefined,
			minutes > 0 ? `${minutes}m` : undefined,
			seconds > 0 ? `${seconds}s` : undefined,
		]
			.filter(Boolean)
			.join(" ") || "0s"
	);
}

export async function requireGuild(
	context: ChatCommandContext,
): Promise<Guild | undefined> {
	const guild = context.message.guild ?? undefined;

	if (!guild) {
		await context.message.reply(
			moderationDenyOutput(
				"guild required",
				"Moderation in DMs is just yelling into the void. Try this inside the server.",
			),
		);
		return undefined;
	}

	return guild;
}

export async function requirePermission(
	context: ChatCommandContext,
	permission: PermissionResolvable,
	label: string,
): Promise<boolean> {
	if (context.message.member?.permissions.has(permission)) {
		return true;
	}

	await context.message.reply(
		moderationDenyOutput(
			"permission denied",
			`You reached for the ${label} lever, but Discord looked at your badge and said no.`,
			[`missing=${label}`],
		),
	);
	return false;
}

export async function requireBotPermission(
	context: ChatCommandContext,
	guild: Guild,
	permission: PermissionResolvable,
	label: string,
): Promise<boolean> {
	const botMember = await guild.members.fetchMe();

	if (botMember.permissions.has(permission)) {
		return true;
	}

	await context.message.reply(
		moderationDenyOutput(
			"bot permission missing",
			`I would help, but Discord did not give me the ${label} keys.`,
			[`missing=${label}`],
		),
	);
	return false;
}

export async function resolveModerationTarget(
	context: ChatCommandContext,
	guild: Guild,
	targetId: string | undefined,
): Promise<ModerationTarget | undefined> {
	if (!targetId) {
		await context.message.reply(
			moderationDenyOutput(
				"target missing",
				"You brought the hammer but forgot to point at anything.",
			),
		);
		return undefined;
	}

	const member = await guild.members
		.fetch(targetId)
		.catch(() => undefined);
	const user =
		member?.user ??
		(await context.client.users
			.fetch(targetId)
			.catch(() => undefined));

	if (!member && !user) {
		await context.message.reply(
			moderationDenyOutput(
				"target not found",
				"I searched the castle records. Nobody by that ID lives here.",
				[`id=${targetId}`],
			),
		);
		return undefined;
	}

	return {
		id: targetId,
		...(member ? { member } : {}),
		...(user ? { user } : {}),
	};
}

export function targetLabel(
	target: ModerationTarget,
): string {
	return (
		target.member?.user.tag ?? target.user?.tag ?? target.id
	);
}

export function roleNamesForMember(
	member: GuildMember,
): readonly string[] {
	return member.roles.cache
		.filter((role) => role.id !== member.guild.id)
		.sort((left, right) => right.position - left.position)
		.map((role) => role.name);
}

export function permissionNamesForMember(
	member: GuildMember,
): readonly string[] {
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
		["view-audit-log", PermissionFlagsBits.ViewAuditLog],
	] as const;

	return namedPermissions
		.filter(([, permission]) =>
			member.permissions.has(permission),
		)
		.map(([name]) => name);
}

export async function ensureCanModerateMember(
	context: ChatCommandContext,
	target: ModerationTarget,
	action: "ban" | "kick" | "timeout",
): Promise<boolean> {
	const member = target.member;

	if (!member) {
		return true;
	}

	if (member.id === context.message.author.id) {
		await context.message.reply(
			moderationDenyOutput(
				"self moderation blocked",
				`Trying to ${action} yourself is bold. The self-destruct button is decorative.`,
				[`target=${member.user.tag}`],
			),
		);
		return false;
	}

	if (member.id === context.client.user?.id) {
		await context.message.reply(
			moderationDenyOutput(
				"bot moderation blocked",
				`Trying to ${action} me with my own hands? That is not how this kingdom works.`,
				[`target=${member.user.tag}`],
			),
		);
		return false;
	}

	if (member.id === member.guild.ownerId) {
		await context.message.reply(
			moderationDenyOutput(
				"owner moderation blocked",
				`You just tried to ${action} the crown. The throne remains occupied.`,
				[`target=${member.user.tag}`],
			),
		);
		return false;
	}

	const caller = context.message.member;

	if (
		caller &&
		member.roles.highest.position >=
			caller.roles.highest.position &&
		member.id !== caller.id
	) {
		await context.message.reply(
			moderationDenyOutput(
				"role hierarchy blocked",
				`You tried to ${action} someone standing on an equal or higher step. Discord folded its arms.`,
				[
					`target=${member.user.tag}`,
					`target_role=${member.roles.highest.name}`,
					`your_role=${caller.roles.highest.name}`,
				],
			),
		);
		return false;
	}

	const allowed =
		action === "ban"
			? member.bannable
			: action === "kick"
				? member.kickable
				: member.moderatable;

	if (!allowed) {
		await context.message.reply(
			moderationDenyOutput(
				"bot hierarchy blocked",
				`I tried to ${action} them, but my highest role is not tall enough for that shelf.`,
				[
					`target=${member.user.tag}`,
					`target_role=${member.roles.highest.name}`,
				],
			),
		);
		return false;
	}

	return true;
}

export function moderationReason(
	context: ChatCommandContext,
	reason: string,
): string {
	return `${reason} | moderator=${context.message.author.tag} (${context.message.author.id})`;
}

export function moderationDenyOutput(
	title: string,
	message: string,
	details: readonly string[] = [],
): string {
	return shellOutput([
		`denied=${title}`,
		`message=${message}`,
		...details,
	]);
}

export function moderationFailureOutput(
	action: string,
	error: unknown,
): string {
	return moderationDenyOutput(
		`${action} failed`,
		"Discord rejected the paperwork at the counter.",
		[
			`details=${error instanceof Error ? error.message : "unknown error"}`,
		],
	);
}
