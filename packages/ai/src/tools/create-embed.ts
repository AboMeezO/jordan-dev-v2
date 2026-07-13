import { z } from "zod/v3";
import { createTool } from "./index.js";

export const createEmbed = createTool({
	name: "createEmbed",
	description: "Create an embedded message and send it to the current channel.",
	inputSchema: z.object({
		title: z.string().optional().describe("The title of the embed."),
		description: z.string().optional().describe("The description text of the embed."),
		color: z.string().optional().describe("A hex color for the embed sidebar (e.g. #FF6600)."),
		fields: z
			.array(
				z.object({
					name: z.string(),
					value: z.string(),
					inline: z.boolean().optional(),
				}),
			)
			.optional()
			.describe("Array of field objects for the embed."),
		footer: z.string().optional().describe("Footer text."),
	}),
	execute: async (ctx, input) => {
		const channel = ctx.message.channel;
		if (!channel.isSendable()) return "Cannot send messages in this channel.";

		const embed: Record<string, unknown> = {};
		if (input.title) embed.title = input.title;
		if (input.description) embed.description = input.description;
		if (input.color) embed.color = parseInt(input.color.replace("#", ""), 16);
		if (input.fields) embed.fields = input.fields;
		if (input.footer) embed.footer = { text: input.footer };

		await channel.send({ embeds: [embed as any] });
		return "Embed sent successfully.";
	},
});
