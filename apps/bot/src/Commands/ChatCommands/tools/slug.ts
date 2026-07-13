import slugify from "slugify";

import { subcommand } from "#ChatCommands";

export const slugCommand = subcommand({
	description: "Generate a URL-friendly slug from text.",
	name: "slug",
	usage: {
		arguments: [
			{
				description: "Text to convert into a slug.",
				name: "text",
				required: true,
			},
		],
		examples: [
			{
				command: "tools slug Hello World!",
				description: "Generate a slug.",
			},
		],
		formats: ["tools slug <text>"],
		useCases: ["Create consistent URL slugs."],
	},
	async execute({ invocation, message }) {
		const text = invocation.positionalArgs.join(" ");
		if (!text) {
			await message.reply("Usage: `tools slug <text>`");
			return;
		}
		const slug = slugify(text, {
			lower: true,
			strict: true,
		});
		await message.reply(`\`\`\`\n${slug}\n\`\`\``);
	},
});
