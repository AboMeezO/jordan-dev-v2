import { commandTree } from "#ChatCommands";

import { listUserReminders } from "../../Reminders/reminder-command.js";
import {
	buildReminderPanel,
	reminderMessageFlags,
} from "../../Reminders/reminder-panel.js";

export const remindersCommand = commandTree({
	aliases: ["reminder-list"],
	description: "Inspect and manage your active reminders.",
	name: "reminders",
	permission: "public",
	usage: {
		examples: [
			{
				command: "!reminders",
				description: "Open your reminder management panel.",
			},
		],
		formats: ["!reminders"],
		useCases: [
			"Review active reminders.",
			"Select a reminder to edit its message, time, delivery, or cancel it.",
		],
	},
	async execute({ client, message }) {
		const reminders = await listUserReminders(
			client,
			message.author.id,
		);

		await message.reply({
			components: [buildReminderPanel({ reminders })],
			flags: reminderMessageFlags(),
		});
	},
});
