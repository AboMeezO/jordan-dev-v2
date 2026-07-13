import { z } from "zod/v3";
import { createTool } from "./index.js";

export const getUserById = createTool({
	name: "getUserById",
	description: "Get a Discord user by their user ID.",
	inputSchema: z.object({
		userId: z
			.string()
			.describe("The Discord user ID to look up."),
	}),
	execute: async (ctx, input) => {
		const user = await ctx.client.users
			.fetch(input.userId)
			.catch(() => null);
		if (!user)
			return `No user found with ID ${input.userId}.`;
		return JSON.stringify({
			id: user.id,
			username: user.username,
			discriminator: user.discriminator,
			bot: user.bot,
		});
	},
});
