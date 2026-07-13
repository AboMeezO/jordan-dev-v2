import { z } from "zod/v3";
import { createTool } from "./index.js";

export const getMemberById = createTool({
	name: "getMemberById",
	description: "Get a guild member by their user ID.",
	inputSchema: z.object({
		guildId: z
			.string()
			.describe("The guild ID the member belongs to."),
		userId: z
			.string()
			.describe("The Discord user ID to look up."),
	}),
	execute: async (ctx, input) => {
		const guild = ctx.client.guilds.cache.get(
			input.guildId,
		);
		if (!guild)
			return `No guild found with ID ${input.guildId}.`;
		const member = await guild.members
			.fetch(input.userId)
			.catch(() => null);
		if (!member)
			return `No member found with ID ${input.userId} in guild ${input.guildId}.`;
		return JSON.stringify({
			id: member.id,
			displayName: member.displayName,
			joinedAt: member.joinedAt?.toISOString(),
			roles: member.roles.cache
				.map((r) => r.name)
				.filter((n) => n !== "@everyone"),
		});
	},
});
