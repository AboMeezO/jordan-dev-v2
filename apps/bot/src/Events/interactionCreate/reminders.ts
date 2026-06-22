import type {
	ButtonInteraction,
	Client,
	Interaction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
} from "discord.js";
import { MessageFlags } from "discord.js";

import {
	cancelReminder,
	listUserReminders,
	toggleReminderDelivery,
	updateReminderMessage,
	updateReminderTime,
} from "../../Reminders/reminder-command.js";
import {
	buildReminderMessageModal,
	buildReminderPanel,
	buildReminderTimeModal,
	parseReminderCustomId,
	reminderInteractionFlags,
	reminderMessageFlags,
} from "../../Reminders/reminder-panel.js";
import type { ReminderRecord } from "../../Reminders/reminder-service.js";

export default async function (
	interaction: Interaction,
	client: Client,
): Promise<void> {
	if (
		!interaction.isButton() &&
		!interaction.isStringSelectMenu() &&
		!interaction.isModalSubmit()
	) {
		return;
	}

	const parsed = parseReminderCustomId(
		interaction.customId,
	);

	if (!parsed) {
		return;
	}

	if (interaction.isStringSelectMenu()) {
		await handleSelect(interaction, client);
		return;
	}

	if (interaction.isButton()) {
		await handleButton(
			interaction,
			client,
			parsed.action,
			parsed.reminderId,
		);
		return;
	}

	await handleModal(
		interaction,
		client,
		parsed.action,
		parsed.reminderId,
	);
}

async function handleSelect(
	interaction: StringSelectMenuInteraction,
	client: Client,
): Promise<void> {
	await interaction.deferUpdate();

	const selectedId = interaction.values[0];
	const reminders = await listUserReminders(
		client,
		interaction.user.id,
	);
	const selectedReminder = reminders.find(
		(reminder) => reminder.id === selectedId,
	);

	await interaction.editReply({
		components: [
			buildReminderPanel({ reminders, selectedReminder }),
		],
	});
}

async function handleButton(
	interaction: ButtonInteraction,
	client: Client,
	action: string,
	reminderId: string | undefined,
): Promise<void> {
	if (
		action === "toggle-delivery" ||
		action === "cancel"
	) {
		await interaction.deferUpdate();
	}

	const reminder = await findOwnedReminder(
		client,
		interaction.user.id,
		reminderId,
	);

	if (!reminder) {
		const content =
			"That reminder is no longer active.";

		if (interaction.deferred) {
			await interaction.editReply({ content });
		} else {
			await interaction.reply({
				content,
				flags: MessageFlags.Ephemeral,
			});
		}

		return;
	}

	if (action === "edit-message") {
		await interaction.showModal(
			buildReminderMessageModal(reminder),
		);
		return;
	}

	if (action === "edit-time") {
		await interaction.showModal(
			buildReminderTimeModal(reminder),
		);
		return;
	}

	if (action === "toggle-delivery") {
		const updated = await toggleReminderDelivery(
			client,
			reminder.id,
		);
		await updatePanelDeferred(
			interaction,
			client,
			updated?.id,
		);
		return;
	}

	if (action === "cancel") {
		await cancelReminder(client, reminder.id);
		await updatePanelDeferred(interaction, client);
	}
}

async function handleModal(
	interaction: ModalSubmitInteraction,
	client: Client,
	action: string,
	reminderId: string | undefined,
): Promise<void> {
	await interaction.deferReply({
		flags: MessageFlags.Ephemeral,
	});

	const reminder = await findOwnedReminder(
		client,
		interaction.user.id,
		reminderId,
	);

	if (!reminder) {
		await interaction.editReply({
			content:
				"That reminder is no longer active.",
		});
		return;
	}

	try {
		if (action === "modal-message") {
			const message = interaction.fields
				.getTextInputValue("message")
				.trim();
			await updateReminderMessage(
				client,
				reminder.id,
				message,
			);
		}

		if (action === "modal-time") {
			const time = interaction.fields
				.getTextInputValue("time")
				.trim();
			await updateReminderTime(client, reminder.id, time);
		}

		const reminders = await listUserReminders(
			client,
			interaction.user.id,
		);
		const selectedReminder = reminders.find(
			(item) => item.id === reminder.id,
		);

		await interaction.editReply({
			components: [
				buildReminderPanel({ reminders, selectedReminder }),
			],
		});
	} catch (error) {
		await interaction.editReply({
			content:
				error instanceof Error
					? error.message
					: "Failed to update reminder.",
		});
	}
}

async function updatePanelDeferred(
	interaction: ButtonInteraction,
	client: Client,
	selectedId?: string,
): Promise<void> {
	const reminders = await listUserReminders(
		client,
		interaction.user.id,
	);
	const selectedReminder = reminders.find(
		(reminder) => reminder.id === selectedId,
	);

	await interaction.editReply({
		components: [
			buildReminderPanel({ reminders, selectedReminder }),
		],
	});
}

async function findOwnedReminder(
	client: Client,
	userId: string,
	reminderId: string | undefined,
): Promise<ReminderRecord | undefined> {
	if (!reminderId) {
		return undefined;
	}

	const reminders = await listUserReminders(client, userId);
	return reminders.find(
		(reminder) => reminder.id === reminderId,
	);
}
