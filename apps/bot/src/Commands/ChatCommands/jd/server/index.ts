import { commandGroup } from "#ChatCommands";

import { statusCommand } from "./status.js";

export const serverGroup = commandGroup({
	description: "Server information examples.",
	name: "server",
	subcommands: [statusCommand],
	usage: {
		formats: ["jd server <subcommand>"],
		useCases: ["Group server inspection commands."],
	},
});
