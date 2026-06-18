import { subcommand } from "#ChatCommands";

import { shellOutput } from "../../../../format.js";
import {
	BAN_PERMISSION,
	MODERATION_USAGE_NOTES,
	moderationDenyOutput,
	moderationFailureOutput,
	moderationReason,
	parseModerationArgs,
	parseReason,
	requireBotPermission,
	requireGuild,
	requirePermission,
} from "./moderation-utils.js";

export const unbanCommand = subcommand({
	description: "Remove a server ban by user ID.",
	name: "unban",
	permission: "moderator",
	usage: {
		arguments: [
			{ description: "Discord user ID.", name: "user-id" },
			{
				description: "Reason for the unban.",
				name: "reason",
				required: false,
			},
		],
		examples: [
			{
				command:
					"jd tools moderation unban 123456789012345678 appeal accepted",
				description: "Unban a user by ID.",
			},
		],
		formats: [
			"jd tools moderation unban <user-id> [reason]",
		],
		notes: MODERATION_USAGE_NOTES,
		useCases: [
			"Restore access for a previously banned user.",
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

		if (!targetId) {
			await context.message.reply(
				moderationDenyOutput(
					"user id required",
					"Unban needs an ID. I cannot pardon a mysterious silhouette.",
				),
			);
			return;
		}

		const reason = parseReason(rest);
		try {
			await guild.members.unban(
				targetId,
				moderationReason(context, reason),
			);
		} catch (error) {
			await context.message.reply(
				moderationFailureOutput("unban", error),
			);
			return;
		}

		await context.message.reply(
			shellOutput([
				`action=unban`,
				`id=${targetId}`,
				`reason=${reason}`,
			]),
		);
	},
});
