import { z } from "zod/v3";
import { createTool } from "./index.js";

export const getCurrentBotInfo = createTool({
	name: "getCurrentBotInfo",
	description:
		"Get information about the current bot user.",
	inputSchema: z.object({}),
	execute: async (ctx) => {
		const user = ctx.client.user;
		if (!user) return "Bot user not available.";
		return JSON.stringify({
			id: user.id,
			username: user.username,
			discriminator: user.discriminator,
			bot: user.bot,
		});
	},
});
