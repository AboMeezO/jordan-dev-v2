import { subcommand } from "#ChatCommands";

import { shellOutput } from "../../../../format.js";
import {
	AUDIT_PERMISSION,
	formatMs,
	moderationFailureOutput,
	requireBotPermission,
	requireGuild,
	requirePermission,
} from "./moderation-utils.js";

export const auditCommand = subcommand({
	aliases: ["logs"],
	description: "Show recent Discord audit log entries.",
	name: "audit",
	permission: "moderator",
	usage: {
		examples: [
			{
				command: "jd tools moderation audit",
				description:
					"Show the latest ten audit log entries.",
			},
			{
				command: "jd tools moderation audit 25",
				description: "Show up to 25 audit log entries.",
			},
		],
		formats: ["jd tools moderation audit [limit]"],
		useCases: [
			"Inspect recent moderation and server management activity.",
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
				AUDIT_PERMISSION,
				"view audit log",
			)) ||
			!(await requireBotPermission(
				context,
				guild,
				AUDIT_PERMISSION,
				"view audit log",
			))
		) {
			return;
		}

		const requestedLimit = Number(
			context.invocation.rawArgs[0] ?? 10,
		);
		const limit = Number.isSafeInteger(requestedLimit)
			? Math.min(Math.max(requestedLimit, 1), 25)
			: 10;
		const logs = await guild
			.fetchAuditLogs({ limit })
			.catch(async (error: unknown) => {
				await context.message.reply(
					moderationFailureOutput("audit", error),
				);
				return undefined;
			});

		if (!logs) {
			return;
		}
		const entries = [...logs.entries.values()];

		if (entries.length === 0) {
			await context.message.reply(
				shellOutput(["audit=empty"]),
			);
			return;
		}

		await context.message.reply(
			shellOutput(
				entries.map((entry) => {
					const targetId =
						typeof entry.target === "object" &&
						entry.target !== null &&
						"id" in entry.target
							? String(entry.target.id)
							: "unknown";

					return [
						`id=${entry.id}`,
						`action=${String(entry.action)}`,
						`executor=${entry.executor?.tag ?? "unknown"}`,
						`target=${targetId}`,
						`age=${formatMs(Date.now() - entry.createdTimestamp)}`,
						`reason=${entry.reason ?? "none"}`,
					].join(" ");
				}),
			),
		);
	},
});
