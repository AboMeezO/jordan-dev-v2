import { subcommand } from "#ChatCommands";

export const echoCommand = subcommand({
	description: "Echo parsed arguments back to the channel.",
	name: "echo",
	usage: {
		arguments: [
			{
				description: "Text to echo back.",
				name: "text",
				required: false,
			},
		],
		examples: [
			{
				command: "jd echo hello from the parser",
				description: "Echo simple text.",
			},
			{
				command: 'jd echo "quoted text stays together"',
				description: "Use shell-like quoting.",
			},
		],
		formats: ["jd echo <text>"],
		useCases: ["Test argument parsing and quoted text."],
	},
	async execute({ invocation, message }) {
		const text = invocation.positionalArgs.join(" ").trim();
		await message.reply(
			text.length > 0 ? text : "Nothing to echo.",
		);
	},
});
