import { shellOutput,subcommand } from "#ChatCommands";

import {
	ensureCanModerateMember,
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
	TIMEOUT_PERMISSION,
} from "./moderation-utils.js";

export const untimeoutCommand = subcommand({
	aliases: ["unsilence"],
	description: "Remove a member timeout.",
	name: "untimeout",
	permission: "moderator",
	usage: {
		arguments: [
			{
				description: "Member mention or Discord user ID.",
				name: "member",
			},
			{
				description: "Reason for removing timeout.",
				name: "reason",
				required: false,
			},
		],
		examples: [
			{
				command:
					"jd tools moderation untimeout @user resolved",
				description: "Clear a member timeout.",
			},
		],
		formats: [
			"jd tools moderation untimeout <member> [reason]",
		],
		notes: MODERATION_USAGE_NOTES,
		useCases: [
			"Restore a member's ability to chat after a timeout.",
		],
	},
	async execute(context) {
		const guild = await requireGuild(context);

		if (!guild) {
			return;
		}

		if (
			!(await requirePermission(
				context,
				TIMEOUT_PERMISSION,
				"moderate members",
			)) ||
			!(await requireBotPermission(
				context,
				guild,
				TIMEOUT_PERMISSION,
				"moderate members",
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
					"I cannot remove a timeout from someone who is not in the room.",
				),
			);
			return;
		}

		if (
			!(await ensureCanModerateMember(
				context,
				target,
				"timeout",
			))
		) {
			return;
		}

		const reason = parseReason(rest);
		try {
			await target.member.timeout(
				null,
				moderationReason(context, reason),
			);
		} catch (error) {
			await context.message.reply(
				moderationFailureOutput("untimeout", error),
			);
			return;
		}

		await context.message.reply(
			shellOutput([
				`action=untimeout`,
				`target=${targetLabel(target)}`,
				`id=${target.id}`,
				`reason=${reason}`,
			]),
		);
	},
});
