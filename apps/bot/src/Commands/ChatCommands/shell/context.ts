import {
	channelKind,
	channelPath,
	commandTree,
	shellOutput,
} from "#ChatCommands";

export const contextCommand = commandTree({
	aliases: ["env", "discord-env"],
	allowPrefixless: true,
	description:
		"Print safe Discord command environment values.",
	name: "context",
	permission: "public",
	usage: {
		examples: [
			{
				command: "context",
				description:
					"Show safe server/channel/user context for command execution.",
			},
		],
		formats: ["context"],
		notes: [
			"This command intentionally does not print process environment variables.",
			"Formerly named `env` — renamed to avoid confusion with Unix environment variables.",
		],
		useCases: [
			"Debug command context without exposing secrets.",
		],
	},
	async execute({ message }) {
		await message.reply(
			shellOutput([
				`JDEV_USER=${message.author.id}`,
				`JDEV_USER_TAG=${message.author.tag}`,
				`JDEV_GUILD=${message.guild?.id ?? "dm"}`,
				`JDEV_GUILD_NAME=${message.guild?.name ?? "direct-message"}`,
				`JDEV_CHANNEL=${message.channelId}`,
				`JDEV_CHANNEL_TYPE=${channelKind(message)}`,
				`JDEV_PWD=${channelPath(message)}`,
			]),
		);
	},
});
