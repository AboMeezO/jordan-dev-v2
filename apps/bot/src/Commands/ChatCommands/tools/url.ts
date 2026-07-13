import { subcommand } from "#ChatCommands";

export const urlCommand = subcommand({
	description: "Parse and inspect a URL.",
	name: "url",
	usage: {
		arguments: [
			{
				description: "URL to parse.",
				name: "url",
				required: true,
			},
		],
		examples: [
			{
				command: "tools url https://example.com/path?q=1",
				description: "Parse a URL into its components.",
			},
		],
		formats: ["tools url <url>"],
		useCases: ["Inspect URL components."],
	},
	async execute({ invocation, message }) {
		const input = invocation.positionalArgs.join(" ");
		if (!input) {
			await message.reply("Usage: `tools url <url>`");
			return;
		}

		try {
			const url = new URL(input);
			await message.reply(
				[
					`Protocol: \`${url.protocol}\``,
					`Hostname: \`${url.hostname}\``,
					`Port: \`${url.port || "(default)"}\``,
					`Path: \`${url.pathname}\``,
					`Query: \`${url.search || "(none)"}\``,
					`Hash: \`${url.hash || "(none)"}\``,
				].join("\n"),
			);
		} catch {
			await message.reply(`Invalid URL: \`${input}\``);
		}
	},
});
