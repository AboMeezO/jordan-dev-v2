import { randomUUID } from "node:crypto";

import { subcommand } from "#ChatCommands";

export const uuidCommand = subcommand({
	description: "Generate a random UUID v4.",
	name: "uuid",
	usage: {
		examples: [
			{
				command: "tools uuid",
				description: "Generate a new UUID.",
			},
		],
		formats: ["tools uuid"],
		useCases: ["Generate UUIDs for testing or reference."],
	},
	async execute({ message }) {
		await message.reply(`\`\`\`\n${randomUUID()}\n\`\`\``);
	},
});
