import { subcommand, shellOutput } from "#ChatCommands";
import {
	ensureCanModerateMember,
	KICK_PERMISSION,
	MODERATION_USAGE_NOTES,
	moderationDenyOutput,
	moderationFailureOutput,
	moderationReason,
	parseModerationArgs,
	parseReason,
	requireBotPermission,
	requireGuild,
	requirePermission,
	resolveModerationTarget,
	targetLabel,
} from "./moderation-utils.js";

export const kickCommand = subcommand({
	description: "Kick a member from the server.",
	name: "kick",
	permission: "moderator",
	usage: {
		arguments: [
			{
				description: "Member mention or Discord user ID.",
				name: "member",
			},
			{
				description: "Reason for the kick.",
				name: "reason",
				required: false,
			},
		],
		examples: [
			{
				command:
					"jd tools moderation kick @user raid cleanup",
				description: "Kick a server member.",
			},
		],
		formats: ["jd tools moderation kick <member> [reason]"],
		notes: MODERATION_USAGE_NOTES,
		useCases: ["Remove a member without banning them."],
	},
	async execute(context) {
		const guild = await requireGuild(context);

		if (!guild) {
			return;
		}

		if (
			!(await requirePermission(
				context,
				KICK_PERMISSION,
				"kick members",
			)) ||
			!(await requireBotPermission(
				context,
				guild,
				KICK_PERMISSION,
				"kick members",
			))
		) {
			return;
		}

		const { rest, targetId } = parseModerationArgs(
			context.invocation.rawArgs,
		);
		const target = await resolveModerationTarget(
			context,
			guild,
			targetId,
		);

		if (!target?.member) {
			await context.message.reply(
				moderationDenyOutput(
					"member required",
					"Kicking a non-member is like firing someone who does not work here.",
				),
			);
			return;
		}

		if (
			!(await ensureCanModerateMember(
				context,
				target,
				"kick",
			))
		) {
			return;
		}

		const reason = parseReason(rest);
		try {
			await target.member.kick(
				moderationReason(context, reason),
			);
		} catch (error) {
			await context.message.reply(
				moderationFailureOutput("kick", error),
			);
			return;
		}

		await context.message.reply(
			shellOutput([
				`action=kick`,
				`target=${targetLabel(target)}`,
				`id=${target.id}`,
				`reason=${reason}`,
			]),
		);
	},
});
