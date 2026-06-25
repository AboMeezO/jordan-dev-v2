import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

import {
	normalizeReminderDelivery,
	scheduleReminder,
} from "../../Reminders/reminder-command.js";

export const data = new SlashCommandBuilder()
	.setName("remind")
	.setDescription("Schedule a reminder.")
	.addStringOption((option) =>
		option
			.setName("time")
			.setDescription(
				"When to remind you. Example: 10m, in 2 hours, 09:30",
			)
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName("message")
			.setDescription("What to remind you about.")
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName("delivery")
			.setDescription("Where to send the reminder.")
			.addChoices(
				{ name: "This channel", value: "channel" },
				{ name: "DM", value: "dm" },
			),
	);

export async function run({
	interaction,
}: {
	readonly interaction: ChatInputCommandInteraction;
}): Promise<void> {
	const time = interaction.options.getString("time", true);
	const message = interaction.options.getString(
		"message",
		true,
	);
	const delivery = normalizeReminderDelivery(
		interaction.options.getString("delivery"),
	);

	try {
		const result = await scheduleReminder({
			client: interaction.client,
			userId: interaction.user.id,
			channelId: interaction.channelId,
			time,
			message,
			delivery,
		});

		await interaction.reply({
			content: `Reminder set for <t:${Math.floor(
				result.remindAt.getTime() / 1000,
			)}:R> in ${result.delivery === "dm" ? "your DMs" : "this channel"}.`,
			ephemeral: true,
		});
	} catch (error) {
		await interaction.reply({
			content:
				error instanceof Error
					? error.message
					: "Failed to set reminder.",
			ephemeral: true,
		});
	}
}
