import type { Client } from "discord.js";

import { getReminderService } from "../../Reminders/index.js";

export default async function (
	client: Client,
): Promise<void> {
	await getReminderService(client).initialize();
	console.log(`Client is ready as ${client.user?.tag}`);
}
