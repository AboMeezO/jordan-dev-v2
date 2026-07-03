import { createEmbed } from "./tools/create-embed.js";
import { getChannelById } from "./tools/get-channel.js";
import { getCurrentBotInfo } from "./tools/get-bot-info.js";
import { getGuildById } from "./tools/get-guild.js";
import { getUserById } from "./tools/get-user.js";
import { getMemberById } from "./tools/get-member.js";

export const defaultTools = {
	createEmbed,
	getChannelById,
	getCurrentBotInfo,
	getGuildById,
	getUserById,
	getMemberById,
};
