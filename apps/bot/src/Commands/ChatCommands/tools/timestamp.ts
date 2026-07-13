import { subcommand } from "#ChatCommands";

export const timestampCommand = subcommand({
	description: "Format Unix timestamps or current time.",
	name: "timestamp",
	usage: {
		arguments: [
			{
				description: "Unix timestamp in seconds (optional, defaults to now).",
				name: "timestamp",
				required: false,
			},
		],
		examples: [
			{
				command: "tools timestamp",
				description: "Show current time in various formats.",
			},
			{
				command: "tools timestamp 1735689600",
				description: "Format a specific Unix timestamp.",
			},
		],
		formats: ["tools timestamp [unix-timestamp]"],
		useCases: [
			"Convert Unix timestamps to human-readable dates.",
		],
	},
	async execute({ invocation, message }) {
		const raw = invocation.positionalArgs.join(" ");
		const date = raw
			? new Date(Number(raw) * 1000)
			: new Date();

		if (isNaN(date.getTime())) {
			await message.reply(`Invalid timestamp: \`${raw}\``);
			return;
		}

		await message.reply(
			[
				`Unix: \`${Math.floor(date.getTime() / 1000)}\``,
				`ISO: \`${date.toISOString()}\``,
				`UTC: \`${date.toUTCString()}\``,
				`Local: \`${date.toLocaleString()}\``,
			].join("\n"),
		);
	},
});
