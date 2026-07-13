import { createTool } from "@jordan-devs/ai";
import { z } from "zod";

export const getServerRoles = createTool({
	name: "getServerRoles",
	description:
		"List all roles in the current Discord server with their member counts.",
	inputSchema: z.object({}),
	execute: (ctx) => {
		const guild = ctx.message.guild;
		if (!guild)
			return "This command can only be used in a server.";

		const roles = guild.roles.cache
			.filter((role) => role.name !== "@everyone")
			.sort((a, b) => b.position - a.position)
			.map(
				(role) =>
					`${role.name}: ${role.members.size} members`,
			)
			.slice(0, 30);

		return roles.length > 0
			? `Server roles:\n${roles.join("\n")}`
			: "No roles found (excluding @everyone).";
	},
});

export const getChannelTopic = createTool({
	name: "getChannelTopic",
	description:
		"Get the topic and description of any text channel in the server.",
	inputSchema: z.object({
		channelName: z
			.string()
			.describe("The name of the channel to look up"),
	}),
	execute: (ctx, input) => {
		const guild = ctx.message.guild;
		if (!guild)
			return "This command can only be used in a server.";

		const channel = guild.channels.cache.find(
			(ch) =>
				ch.name === input.channelName && ch.isTextBased(),
		);

		if (!channel)
			return `No text channel named "${input.channelName}" found.`;
		if (!("topic" in channel))
			return `Channel "${input.channelName}" has no topic field.`;

		const topic = (channel as { topic: string | null })
			.topic;
		return topic
			? `Channel #${input.channelName} topic: ${topic}`
			: `Channel #${input.channelName} has no topic set.`;
	},
});

export const getMemberJoinDate = createTool({
	name: "getMemberJoinDate",
	description:
		"Get when a member joined the server and created their account.",
	inputSchema: z.object({
		userId: z
			.string()
			.describe("The Discord user ID to look up"),
	}),
	execute: async (ctx, input) => {
		const guild = ctx.message.guild;
		if (!guild)
			return "This command can only be used in a server.";

		const member = await guild.members
			.fetch(input.userId)
			.catch(() => null);
		if (!member)
			return `No member found with ID ${input.userId}.`;

		const joined =
			member.joinedAt?.toLocaleDateString() ?? "unknown";
		const created =
			member.user.createdAt.toLocaleDateString();
		return `Member ${member.user.username} (${input.userId}):
- Joined server: ${joined}
- Account created: ${created}
- Roles: ${
			member.roles.cache
				.filter((r) => r.name !== "@everyone")
				.map((r) => r.name)
				.join(", ") || "none"
		}`;
	},
});
