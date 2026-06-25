import { channelPath, commandTree, shellOutput } from "#ChatCommands";

export const pwdCommand = commandTree({
	allowPrefixless: true,
	description: "Print the current Discord channel path.",
	name: "pwd",
	permission: "public",
	usage: {
		examples: [
			{
				command: "pwd",
				description: "Show the current guild/channel path.",
			},
		],
		formats: ["pwd"],
		useCases: [
			"See where a chat command is being executed.",
		],
	},
	async execute({ message }) {
		await message.reply(
			shellOutput([channelPath(message)]),
		);
	},
});
