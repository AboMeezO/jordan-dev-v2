import {
	type Guild,
	type GuildMember,
	PermissionFlagsBits,
	type PermissionResolvable,
	type User,
} from "discord.js";

import type { ChatCommandContext } from "#ChatCommands";
import { shellOutput } from "#ChatCommands";

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

const GUILD_REQUIRED_RESPONSES = [
	"Moderating in DMs? What the fuck are you arresting them with, private-message energy?",
	"This command needs a server, dude. You cannot enforce the law in a hallway.",
	"You brought the ban hammer to a DM. That is not jurisdiction; that is cosplay.",
	"Moderation in DMs is like calling the cops on a loading screen. Go to the server.",
	"No guild, no gavel. The courtroom is literally not here.",
	"Bro tried to run server law in a private chat. The audacity is impressive; the jurisdiction is nonexistent.",
	"You are outside the server, my guy. Even Batman needs a city before he can do paperwork.",
	"This is a DM, not the moderation arena. Take the command where the suspects actually live.",
] as const;

const PERMISSION_DENIED_RESPONSES = [
	"You have the confidence of a supervillain and the permissions of a background NPC.",
	"Discord checked your badge and said: nice try, champ.",
	"You reached for the {label} lever with zero clearance. Bold. Incorrect. Hilarious.",
	"Bro brought main-character energy to a permission check and got defeated by a checkbox.",
	"The vibes said moderator. The permissions said absolutely fucking not.",
	"You are trying to operate the server machinery with a butter knife, dude.",
	"Access denied. Even the tutorial boss had more authority than this.",
	"You cannot invoke {label} by pure audacity. I checked.",
] as const;

const BOT_PERMISSION_MISSING_RESPONSES = [
	"I would help, but Discord did not give me the {label} keys. I am a locked-out bouncer.",
	"The bot has arrived at the crime scene and forgotten its badge. Spectacular.",
	"Discord said I can watch the chaos, but I cannot touch the {label} button.",
	"I have the enthusiasm of a SWAT team and the permissions of a houseplant.",
	"The {label} permission is missing. Somebody gave me a cape but no superpowers.",
	"Bro, I cannot do server law without the server-law DLC installed.",
	"I tried to open the door and Discord hit me with the invisible slap.",
	"No {label}, no action. Even the bot is getting nerfed by paperwork.",
] as const;

const TARGET_MISSING_RESPONSES = [
	"You brought the hammer, but forgot the person. Fantastic work, champ.",
	"The command is loaded, the target is not. Who the fuck am I supposed to bonk?",
	"Please provide a target, dude. I am good, but I am not psychic.",
	"You pointed the moderation cannon at absolutely nothing. Incredible aim.",
	"No target detected. The victim must be hiding behind your unfinished command.",
	"Bro submitted an arrest warrant with the name field blank.",
	"The ban hammer is waiting patiently for you to tell it where to swing.",
	"Target missing. This is less Judge Dredd and more confused intern.",
] as const;

const TARGET_NOT_FOUND_RESPONSES = [
	"I searched everywhere. Either that user entered the Shadow Realm or you typed the ID like a sleep-deprived goblin.",
	"That user is not here, dude. The target has successfully escaped the plot.",
	"User not found. Even the server detective board has no idea who you mean.",
	"I looked through the records and found nothing but your questionable target selection.",
	"That ID led nowhere. Congratulations, you have subpoenaed a ghost.",
	"No such user found. Either they vanished or Discord is gaslighting both of us.",
	"The server says this person does not exist here. Bro tried to moderate a myth.",
	"Target not found. The witness stand is empty and the courtroom is embarrassed for you.",
] as const;

const SELF_MODERATION_RESPONSES = [
	"You tried to {action} yourself. That is not moderation; that is a resignation letter with extra steps.",
	"Bro is beefing with himself so hard he requested a timeout. Absolute cinema.",
	"You cannot {action} yourself, dude. If you need to leave, use the door like an adult.",
	"Self-{action} is unavailable. Please resolve your internal character arc first.",
	"The enemy was inside you all along, but Discord still will not let you {action} yourself.",
	"What the fuck is this, a one-person intervention? Self-{action} denied.",
	"You selected yourself as the target. The server recommends touching grass instead.",
	"Trying to {action} yourself is bold. The self-destruct button is decorative, my guy.",
] as const;

const BOT_MODERATION_RESPONSES = [
	"You tried to {action} the bot? That is like challenging John Wick with a pool noodle.",
	"You cannot {action} the one thing doing the paperwork. Bold strategy. Completely unavailable.",
	"Bro attacked the staff member who runs the staff room. Please rethink this master plan.",
	"I am not going to {action} myself just because you asked nicely. I have standards.",
	"Targeting the bot is crazy. That is like unplugging the fire alarm during a fire drill.",
	"You aimed the {action} button at the server machinery. What is next, punching the Wi-Fi?",
	"Nice attempt, dude. The bot has plot armor and an extremely strict self-preservation policy.",
	"You want me to {action} me? That sentence alone should get you assigned a support ticket.",
] as const;

const OWNER_MODERATION_RESPONSES = [
	"Bro aimed the {action} hammer at the final boss. Put it down before the server lore gets rewritten.",
	"You tried to {action} the throne. The crown has diplomatic immunity, my guy.",
	"That is the server owner. You do not {action} the landlord because the wallpaper is ugly.",
	"The owner remains protected from {action}. Please direct your rebellion toward a legal target.",
	"You walked into the boss arena and selected the boss as your victim. Incredible confidence.",
	"Attempting to {action} the owner is how side characters become server legends for the wrong reason.",
	"The crown stays on. Your {action} request has been rejected by the monarchy.",
	"What the fuck was the plan there? The person who owns the server was never going to be an easy target.",
] as const;

const ROLE_HIERARCHY_RESPONSES = [
	"Sit down, little moderator. That target's role is higher than your entire career arc.",
	"You tried to {action} someone standing above your pay grade. Discord folded its arms.",
	"Role hierarchy says no. Your ban hammer cannot reach that shelf, dude.",
	"You have entered a boss fight with a wooden sword. That target outranks you.",
	"The target is on an equal or higher step. Translation: stop trying to speedrun a demotion.",
	"Bro challenged a higher role with pure confidence and no vertical clearance.",
	"Discord looked at the role ladder and told you to stay in your lane.",
	"That target is outside your jurisdiction. Please return to a level-appropriate villain.",
] as const;

const BOT_HIERARCHY_RESPONSES = [
	"I tried to {action} them, but my highest role is not tall enough for that shelf.",
	"The target's role is built different. My permissions just got hit with the short-kings update.",
	"I have reached the role ceiling, dude. Discord has put the target behind glass.",
	"My ban hammer bounced off their role and landed in the paperwork department.",
	"The hierarchy said I am not that guy. Apparently my role needs to hit the gym.",
	"I can see the target, but I cannot reach them. This is a moderation-themed tragedy.",
	"Discord gave me a ladder, then removed the last three steps. Absolutely disrespectful.",
	"That role is too high for me to {action}. I am powerful in theory and vertically challenged in practice.",
] as const;

const MODERATION_FAILURE_RESPONSES = [
	"Discord rejected the paperwork at the counter. The bureaucracy wins again.",
	"The {action} failed, dude. The server gods have denied your offering.",
	"I tried to {action} them and Discord hit me with the 'nuh uh' of the century.",
	"The command exploded somewhere between confidence and execution. What the fuck happened?",
	"{action} failed. Even the error message looks disappointed in us.",
	"The moderation machine made a sad noise and refused to elaborate.",
	"Discord said no, and unlike your group chat, Discord actually had a reason.",
	"The {action} attempt has been sent to the shadow realm. Check the technical details below.",
] as const;

function randomResponse(
	responses: readonly string[],
): string {
	const index = Math.floor(Math.random() * responses.length);

	return responses[index] ?? responses[0] ?? "Moderation denied.";
}

function actionResponse(
	responses: readonly string[],
	action: string,
): string {
	return randomResponse(responses).replaceAll("{action}", action);
}

function labelResponse(
	responses: readonly string[],
	label: string,
): string {
	return randomResponse(responses).replaceAll("{label}", label);
}

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

export { formatMs } from "#ChatCommands";

export async function requireGuild(
	context: ChatCommandContext,
): Promise<Guild | undefined> {
	const guild = context.message.guild ?? undefined;

	if (!guild) {
		await context.message.reply(
			moderationDenyOutput(
				"guild required",
				randomResponse(GUILD_REQUIRED_RESPONSES),
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
			labelResponse(PERMISSION_DENIED_RESPONSES, label),
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
			labelResponse(BOT_PERMISSION_MISSING_RESPONSES, label),
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
				randomResponse(TARGET_MISSING_RESPONSES),
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
				randomResponse(TARGET_NOT_FOUND_RESPONSES),
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
				actionResponse(SELF_MODERATION_RESPONSES, action),
				[`target=${member.user.tag}`],
			),
		);
		return false;
	}

	if (member.id === context.client.user?.id) {
		await context.message.reply(
			moderationDenyOutput(
				"bot moderation blocked",
				actionResponse(BOT_MODERATION_RESPONSES, action),
				[`target=${member.user.tag}`],
			),
		);
		return false;
	}

	if (member.id === member.guild.ownerId) {
		await context.message.reply(
			moderationDenyOutput(
				"owner moderation blocked",
				actionResponse(OWNER_MODERATION_RESPONSES, action),
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
				actionResponse(ROLE_HIERARCHY_RESPONSES, action),
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
				actionResponse(BOT_HIERARCHY_RESPONSES, action),
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
		actionResponse(MODERATION_FAILURE_RESPONSES, action),
		[
			`details=${error instanceof Error ? error.message : "unknown error"}`,
		],
	);
}
