import { logCommandExecution } from "#AuditLog";
import {
	canUseChatCommand,
	commandTree,
	comparePermissionLevels,
	executeChatCommandResolution,
	parseChatCommandInput,
} from "#ChatCommands";
import { shellOutput } from "#ChatCommands";
import { Logger } from "#Logger";

const log = new Logger("sudo");

export const sudoCommand = commandTree({
	allowPrefixless: true,
	description:
		"Execute another bot chat command with administrator privileges.",
	name: "sudo",
	permission: "administrator",
	usage: {
		arguments: [
			{
				description: "The chat command to execute.",
				name: "command",
			},
		],
		examples: [
			{
				command: "sudo jd tools moderation audit",
				description:
					"Run a moderator command as a server administrator.",
			},
			{
				command: "sudo !reminders",
				description: "Run a prefix command through sudo.",
			},
		],
		formats: ["sudo <command>", "sudo !<command>"],
		notes: [
			"This command only elevates bot chat-command permissions.",
			"It does not execute host OS commands.",
			"Owner-only commands still require owner access.",
		],
		useCases: [
			"Run moderator/admin bot commands with an explicit elevation marker.",
			"Make privileged command use visible in chat.",
		],
	},
	async execute(context) {
		const target = context.invocation.rawArgs
			.join(" ")
			.trim();

		if (target.length === 0) {
			await context.message.reply(
				shellOutput(["usage=sudo <command>"]),
			);
			return;
		}

		const parsed =
			parseChatCommandInput(
				target,
				context.invocation.prefix || "!",
			) ?? parseChatCommandInput(target, "");

		if (!parsed) {
			await context.message.reply(
				shellOutput(["error=command not found"]),
			);
			return;
		}

		const resolution = context.registry.resolve(parsed);

		if (!resolution) {
			await context.message.reply(
				shellOutput(["error=command not found"]),
			);
			return;
		}

		if (
			parsed.prefix === "" &&
			!resolution.allowPrefixless
		) {
			await context.message.reply(
				shellOutput(["error=prefix required"]),
			);
			return;
		}

		if (resolution.invocation.commandPath[0] === "sudo") {
			await context.message.reply(
				shellOutput(["error=sudo recursion blocked"]),
			);
			return;
		}

		if (
			resolution.permission === "owner" &&
			!canUseChatCommand(context.message, "owner")
		) {
			await context.message.reply(
				shellOutput(["error=owner permission required"]),
			);
			return;
		}

		if (
			comparePermissionLevels(
				resolution.permission,
				"administrator",
			) > 0
		) {
			await context.message.reply(
				shellOutput(["error=permission denied"]),
			);
			return;
		}

		logCommandExecution({
			command: `sudo ${resolution.invocation.commandPath.join(" ")}`,
			userId: context.message.author.id,
			userTag: context.message.author.tag,
			guildId: context.message.guild?.id ?? null,
			channelId: context.message.channelId,
			timestamp: new Date().toISOString(),
			sudo: true,
			elevated: true,
			args: resolution.invocation.rawArgs.join(" "),
		}).catch((error) =>
			log.error("audit log failed:", error),
		);

		await context.message.reply(
			shellOutput([
				`sudo=${context.message.author.tag}`,
				`run=${resolution.invocation.commandPath.join(" ")}`,
				`as=administrator`,
			]),
		);

		await executeChatCommandResolution({
			client: context.client,
			message: context.message,
			prefix: context.invocation.prefix || "!",
			registry: context.registry,
			resolution,
		});
	},
});
