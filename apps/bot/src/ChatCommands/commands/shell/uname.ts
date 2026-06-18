import { commandTree } from "#ChatCommands";

import { shellOutput } from "./format.js";

export const unameCommand = commandTree({
	allowPrefixless: true,
	description: "Print bot runtime information.",
	name: "uname",
	permission: "public",
	usage: {
		examples: [
			{
				command: "uname",
				description:
					"Show bot runtime, Node.js, platform, and Discord.js details.",
			},
		],
		formats: ["uname"],
		useCases: [
			"Inspect the bot runtime environment without exposing secrets.",
		],
	},
	async execute({ client, message }) {
		await message.reply(
			shellOutput([
				"system=Jordan Devs Assistant",
				`bot=${client.user?.tag ?? "unknown"}`,
				`node=${process.version}`,
				`platform=${process.platform}`,
				`arch=${process.arch}`,
				`pid=${process.pid}`,
			]),
		);
	},
});
