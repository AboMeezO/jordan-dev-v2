import type { Client } from "discord.js";

import { Logger } from "#Logger";
import { getReminderService } from "../../Reminders/index.js";

const log = new Logger("client-ready");

export default async function (
	client: Client,
): Promise<void> {
	await getReminderService(client).initialize();
	log.info(`Client is ready as ${client.user?.tag}`);
}
