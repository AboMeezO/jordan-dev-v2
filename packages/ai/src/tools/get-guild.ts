import { z } from "zod/v3";
import { createTool } from "./index.js";

export const getGuildById = createTool({
	name: "getGuildById",
	description:
		"Get information about a Discord guild by its ID.",
	inputSchema: z.object({
		guildId: z
			.string()
			.describe("The Discord guild ID to look up."),
	}),
	execute: async (ctx, input) => {
		const guild = ctx.client.guilds.cache.get(
			input.guildId,
		);
		if (!guild)
			return `No guild found with ID ${input.guildId}.`;
		return JSON.stringify({
			id: guild.id,
			name: guild.name,
			memberCount: guild.memberCount,
		});
	},
});
