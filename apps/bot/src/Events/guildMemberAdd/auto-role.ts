import type { GuildMember } from "discord.js";

import { handleGuildMemberAdd } from "../../Verification/index.js";

export default async function (
	member: GuildMember,
): Promise<void> {
	await handleGuildMemberAdd(member);
}
