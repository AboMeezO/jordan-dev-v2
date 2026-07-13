import { z } from "zod/v3";
import { createTool } from "./index.js";

export const getChannelById = createTool({
	name: "getChannelById",
	description: "Get details about a channel by its ID.",
	inputSchema: z.object({
		channelId: z
			.string()
			.describe("The Discord channel ID to look up."),
	}),
	execute: async (ctx, input) => {
		const channel = ctx.client.channels.cache.get(
			input.channelId,
		);
		if (!channel)
			return `No channel found with ID ${input.channelId}.`;

		return JSON.stringify({
			id: channel.id,
			name: "name" in channel ? channel.name : "unknown",
			type: channel.type,
		});
	},
});
