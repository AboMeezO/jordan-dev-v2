import {
	commandTree,
	formatDuration,
	shellOutput,
} from "#ChatCommands";

export const psCommand = commandTree({
	allowPrefixless: true,
	description:
		"Print bot process and Discord cache status.",
	name: "ps",
	permission: "public",
	usage: {
		examples: [
			{
				command: "ps",
				description:
					"Show process and Discord cache counters.",
			},
		],
		formats: ["ps"],
		useCases: [
			"Quickly inspect whether the bot process is alive and connected.",
		],
	},
	async execute({ client, message }) {
		await message.reply(
			shellOutput([
				"PID   NAME                 UPTIME     STATUS",
				`${process.pid}  jordan-devs-bot     ${formatDuration(process.uptime()).padEnd(10)} ready=${client.isReady()}`,
				"",
				`guilds=${client.guilds.cache.size}`,
				`channels=${client.channels.cache.size}`,
				`users=${client.users.cache.size}`,
				`gateway_ping=${client.ws.ping}ms`,
			]),
		);
	},
});
