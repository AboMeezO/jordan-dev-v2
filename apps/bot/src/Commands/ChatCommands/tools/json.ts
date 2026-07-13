import { subcommand } from "#ChatCommands";

export const jsonCommand = subcommand({
	description: "Format, validate, or minify JSON.",
	name: "json",
	usage: {
		arguments: [
			{
				description: "Action: format, validate, or minify.",
				name: "action",
				required: true,
			},
			{
				description: "JSON string to process.",
				name: "json",
				required: true,
			},
		],
		examples: [
			{
				command: "tools json format '{\"a\":1}'",
				description: "Format JSON with indentation.",
			},
			{
				command: "tools json validate '{\"a\":1}'",
				description: "Validate a JSON string.",
			},
		],
		formats: ["tools json <format|validate|minify> <json>"],
		useCases: ["Format JSON for readability."],
	},
	async execute({ invocation, message }) {
		const [action, ...rest] = invocation.positionalArgs;
		const input = rest.join(" ");
		if (!action || !input) {
			await message.reply(
				"Usage: `tools json <format|validate|minify> <json>`",
			);
			return;
		}

		try {
			const parsed: unknown = JSON.parse(input);
			switch (action) {
				case "format": {
					await message.reply(
						`\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``,
					);
					return;
				}
				case "validate": {
					await message.reply("Valid JSON.");
					return;
				}
				case "minify": {
					await message.reply(
						`\`\`\`\n${JSON.stringify(parsed)}\n\`\`\``,
					);
					return;
				}
				default: {
					await message.reply(
						"Action must be `format`, `validate`, or `minify`.",
					);
				}
			}
		} catch {
			await message.reply("Invalid JSON input.");
		}
	},
});
