import { commandTree } from "#ChatCommands";

import { formatDuration, shellOutput } from "../../format.js";

export const uptimeCommand = commandTree({
	allowPrefixless: true,
	description: "Print bot and process uptime.",
	name: "uptime",
	permission: "public",
	usage: {
		examples: [
			{
				command: "uptime",
				description:
					"Show Discord client uptime, process uptime, and gateway ping.",
			},
		],
		formats: ["uptime"],
		useCases: [
			"Check whether the bot has restarted recently.",
		],
	},
	async execute({ client, message }) {
		const clientUptime = client.uptime
			? formatDuration(Math.floor(client.uptime / 1000))
			: "not-ready";

		await message.reply(
			shellOutput([
				`client_uptime=${clientUptime}`,
				`process_uptime=${formatDuration(process.uptime())}`,
				`gateway_ping=${client.ws.ping}ms`,
				`ready_at=${client.readyAt?.toISOString() ?? "not-ready"}`,
			]),
		);
	},
});
