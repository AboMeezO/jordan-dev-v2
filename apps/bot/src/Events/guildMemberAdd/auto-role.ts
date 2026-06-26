import type { Client, GuildMember } from "discord.js";

import { handleGuildMemberAdd } from "../../Verification/index.js";

export default async function (
	member: GuildMember,
	client: Client,
): Promise<void> {
	await handleGuildMemberAdd(member, client);
}
