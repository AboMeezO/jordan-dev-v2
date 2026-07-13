import { createEmbed } from "./tools/create-embed.js";
import { getCurrentBotInfo } from "./tools/get-bot-info.js";
import { getChannelById } from "./tools/get-channel.js";
import { getGuildById } from "./tools/get-guild.js";
import { getMemberById } from "./tools/get-member.js";
import { getUserById } from "./tools/get-user.js";

export const defaultTools = {
	createEmbed,
	getChannelById,
	getCurrentBotInfo,
	getGuildById,
	getUserById,
	getMemberById,
};
