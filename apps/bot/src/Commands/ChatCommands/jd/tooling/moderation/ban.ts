import { shellOutput,subcommand } from "#ChatCommands";

import {
	BAN_PERMISSION,
	ensureCanModerateMember,
	MODERATION_USAGE_NOTES,
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

export const banCommand = subcommand({
	description: "Ban a user from the server.",
	name: "ban",
	permission: "moderator",
	usage: {
		arguments: [
			{
				description: "User mention or Discord user ID.",
				name: "user",
			},
			{
				description: "Reason for the ban.",
				name: "reason",
				required: false,
			},
		],
		examples: [
			{
				command:
					"jd tools moderation ban @user repeated spam",
				description:
					"Ban a member and write the reason to audit logs.",
			},
		],
		formats: ["jd tools moderation ban <user> [reason]"],
		notes: MODERATION_USAGE_NOTES,
		useCases: ["Remove abusive accounts from the server."],
	},
	async execute(context) {
		const guild = await requireGuild(context);

		if (!guild) {
			return;
		}

		if (
			!(await requirePermission(
				context,
				BAN_PERMISSION,
				"ban members",
			)) ||
			!(await requireBotPermission(
				context,
				guild,
				BAN_PERMISSION,
				"ban members",
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

		if (
			!target ||
			!(await ensureCanModerateMember(
				context,
				target,
				"ban",
			))
		) {
			return;
		}

		const reason = parseReason(rest);
		try {
			await guild.members.ban(target.id, {
				reason: moderationReason(context, reason),
			});
		} catch (error) {
			await context.message.reply(
				moderationFailureOutput("ban", error),
			);
			return;
		}

		await context.message.reply(
			shellOutput([
				`action=ban`,
				`target=${targetLabel(target)}`,
				`id=${target.id}`,
				`reason=${reason}`,
			]),
		);
	},
});
