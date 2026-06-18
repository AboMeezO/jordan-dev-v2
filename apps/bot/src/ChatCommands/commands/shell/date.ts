import { commandTree } from "#ChatCommands";

import { shellOutput } from "./format.js";

export const dateCommand = commandTree({
	aliases: ["time"],
	allowPrefixless: true,
	description: "Print the current bot time.",
	name: "date",
	permission: "public",
	usage: {
		examples: [
			{
				command: "date",
				description:
					"Show ISO and Discord-formatted timestamps.",
			},
		],
		formats: ["date"],
		useCases: [
			"Compare bot time with local time when scheduling work.",
		],
	},
	async execute({ message }) {
		const now = new Date();
		const timestamp = Math.floor(now.getTime() / 1000);

		await message.reply(
			shellOutput([
				`iso=${now.toISOString()}`,
				`unix=${timestamp}`,
				`discord=<t:${timestamp}:F>`,
				`relative=<t:${timestamp}:R>`,
			]),
		);
	},
});
