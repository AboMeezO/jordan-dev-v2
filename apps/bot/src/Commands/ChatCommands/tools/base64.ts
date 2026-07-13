import { subcommand } from "#ChatCommands";

export const base64Command = subcommand({
	description: "Encode or decode Base64.",
	name: "base64",
	usage: {
		arguments: [
			{
				description: "Action to perform: encode or decode.",
				name: "action",
				required: true,
			},
			{
				description: "Text to encode or decode.",
				name: "text",
				required: true,
			},
		],
		examples: [
			{
				command: "tools base64 encode hello",
				description: "Base64 encode a string.",
			},
			{
				command: "tools base64 decode aGVsbG8=",
				description: "Base64 decode a string.",
			},
		],
		formats: ["tools base64 <encode|decode> <text>"],
		useCases: ["Quickly encode or decode Base64 strings."],
	},
	async execute({ invocation, message }) {
		const [action, ...rest] = invocation.positionalArgs;
		const text = rest.join(" ");
		if (!action || !text) {
			await message.reply(
				"Usage: `tools base64 <encode|decode> <text>`",
			);
			return;
		}
		try {
			const result =
				action === "encode"
					? Buffer.from(text).toString("base64")
					: action === "decode"
						? Buffer.from(text, "base64").toString("utf-8")
						: null;
			if (result === null) {
				await message.reply(
					"Action must be `encode` or `decode`.",
				);
				return;
			}
			await message.reply(`\`\`\`\n${result}\n\`\`\``);
		} catch {
			await message.reply("Invalid Base64 input.");
		}
	},
});
