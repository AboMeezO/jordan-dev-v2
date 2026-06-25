import { subcommand } from "#ChatCommands";

export const statusCommand = subcommand({
	description: "Show the current Discord server name.",
	name: "status",
	usage: {
		examples: [
			{
				command: "jd server status",
				description: "Check the current server context.",
			},
		],
		formats: ["jd server status"],
		useCases: [
			"Confirm the bot received the command in a guild.",
		],
	},
	async execute({ message }) {
		await message.reply(
			message.guild
				? `${message.guild.name} is reachable.`
				: "This command is not running inside a server.",
		);
	},
});
