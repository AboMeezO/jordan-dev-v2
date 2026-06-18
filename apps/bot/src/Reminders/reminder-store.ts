import type { Client } from "discord.js";

import { ReminderService } from "./reminder-service.js";

let service: ReminderService | undefined;

export function getReminderService(
	client: Client,
): ReminderService {
	service ??= new ReminderService(client);
	return service;
}
