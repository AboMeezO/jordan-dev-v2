import { subcommand } from "#ChatCommands";

import { shellOutput } from "../../../shell/format.js";
import {
	ensureCanModerateMember,
	formatMs,
	MODERATION_USAGE_NOTES,
	moderationDenyOutput,
	moderationFailureOutput,
	moderationReason,
	parseDurationMs,
	parseModerationArgs,
	parseReason,
	requireBotPermission,
	requireGuild,
	requirePermission,
	resolveModerationTarget,
	targetLabel,
	TIMEOUT_PERMISSION,
} from "./moderation-utils.js";

const MAX_TIMEOUT_MS = 28 * 86_400_000;

export const timeoutCommand = subcommand({
	description: "Timeout a member for a duration.",
	name: "timeout",
	permission: "moderator",
	usage: {
		arguments: [
			{
				description: "Member mention or Discord user ID.",
				name: "member",
			},
			{
				description:
					"Duration such as `10m`, `2h`, or `7d`.",
				name: "duration",
			},
			{
				description: "Reason for the timeout.",
				name: "reason",
				required: false,
			},
		],
		examples: [
			{
				command:
					"jd tools moderation timeout @user 10m cooldown",
				description: "Timeout a member for ten minutes.",
			},
		],
		formats: [
			"jd tools moderation timeout <member> <duration> [reason]",
		],
		notes: [
			...MODERATION_USAGE_NOTES,
			"Discord timeouts cannot exceed 28 days.",
		],
		useCases: [
			"Temporarily stop a member from sending messages.",
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
		const [durationInput, ...reasonArgs] = rest;
		const durationMs = parseDurationMs(durationInput);

		if (!durationMs || durationMs > MAX_TIMEOUT_MS) {
			await context.message.reply(
				moderationDenyOutput(
					"invalid duration",
					"That timeout duration fell out of the clock. Use something like 10m, 2h, or 7d.",
				),
			);
			return;
		}

		const target = await resolveModerationTarget(
			context,
			guild,
			targetId,
		);

		if (!target?.member) {
			await context.message.reply(
				moderationDenyOutput(
					"member required",
					"Timeouts only work on members who are actually in the server.",
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

		const reason = parseReason(reasonArgs);
		try {
			await target.member.timeout(
				durationMs,
				moderationReason(context, reason),
			);
		} catch (error) {
			await context.message.reply(
				moderationFailureOutput("timeout", error),
			);
			return;
		}

		await context.message.reply(
			shellOutput([
				`action=timeout`,
				`target=${targetLabel(target)}`,
				`id=${target.id}`,
				`duration=${formatMs(durationMs)}`,
				`reason=${reason}`,
			]),
		);
	},
});
