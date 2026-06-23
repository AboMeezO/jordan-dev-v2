import type {
	ButtonInteraction,
	ChannelSelectMenuInteraction,
	Client,
	Interaction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
} from "discord.js";
import {
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ContainerBuilder,
	MessageFlags,
	TextDisplayBuilder,
} from "discord.js";

import {
	cancelReminder,
	listUserReminders,
	toggleReminderDelivery,
	updateReminderChannel,
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
		!interaction.isChannelSelectMenu() &&
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

	if (interaction.isChannelSelectMenu()) {
		await handleChannelSelect(interaction, client, parsed.reminderId);
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
		if (interaction.deferred) {
			await interaction.editReply({
				components: [
					new ContainerBuilder()
						.addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								"That reminder is no longer active.",
							),
						),
				],
			});
		} else {
			await interaction.reply({
				content: "That reminder is no longer active.",
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

	if (action === "change-channel") {
		const originalMessageId = interaction.message.id;

		const channelSelectContainer = new ContainerBuilder()
			.setAccentColor(0x00FFFF)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					"Select a channel for delivery:",
				),
			)
			.addActionRowComponents(
				new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
					new ChannelSelectMenuBuilder()
						.setCustomId(
							`rem:select-channel:${reminder.id}:${originalMessageId}`,
						)
						.setPlaceholder("Pick a channel")
						.setMinValues(1)
						.setMaxValues(1),
				),
			);

		await interaction.reply({
			components: [channelSelectContainer],
			flags: [
				MessageFlags.IsComponentsV2,
				MessageFlags.Ephemeral,
			],
		});
		return;
	}

	if (action === "cancel") {
		await cancelReminder(client, reminder.id);
		await updatePanelDeferred(interaction, client);
	}
}

async function handleChannelSelect(
	interaction: ChannelSelectMenuInteraction,
	client: Client,
	reminderIdPayload: string | undefined,
): Promise<void> {
	const channelId = interaction.values[0];

	if (!channelId) {
		await interaction.reply({
			content: "No channel selected.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	// The reminderIdPayload is "<reminderId>:<originalMessageId>"
	const parts = reminderIdPayload?.split(":") ?? [];
	const reminderId = parts[0];
	const originalMessageId = parts.slice(1).join(":");

	if (!reminderId || !originalMessageId) {
		await interaction.reply({
			content: "Invalid request.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const reminder = await findOwnedReminder(
		client,
		interaction.user.id,
		reminderId,
	);

	if (!reminder) {
		await interaction.reply({
			content: "That reminder is no longer active.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	try {
		await updateReminderChannel(client, reminder.id, channelId);

		const reminders = await listUserReminders(
			client,
			interaction.user.id,
		);
		const selectedReminder = reminders.find(
			(item) => item.id === reminder.id,
		);
		const newPanel = buildReminderPanel({
			reminders,
			selectedReminder,
		});

		// Dismiss the ephemeral channel select message
		await interaction.update({
			components: [
				new ContainerBuilder()
					.setAccentColor(0x00FFFF)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							"✅ Channel updated!",
						),
					),
			],
		});

		// Update the original panel
		try {
			await interaction.webhook.editMessage(originalMessageId, {
				components: [newPanel],
			});
		} catch {
			try {
				if (interaction.channel?.isTextBased()) {
					const originalMessage =
						await interaction.channel.messages.fetch(
							originalMessageId,
						);
					await originalMessage.edit({
						components: [newPanel],
					});
				}
			} catch {
				// Could not update original panel — user can refresh manually
			}
		}
	} catch (error) {
		await interaction.update({
			components: [
				new ContainerBuilder()
					.setAccentColor(0x00FFFF)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							error instanceof Error
								? error.message
								: "Failed to change channel.",
						),
					),
			],
		});
	}
}

async function handleModal(
	interaction: ModalSubmitInteraction,
	client: Client,
	action: string,
	reminderId: string | undefined,
): Promise<void> {
	await interaction.deferUpdate();

	const reminder = await findOwnedReminder(
		client,
		interaction.user.id,
		reminderId,
	);

	if (!reminder) {
		await interaction.editReply({
			components: [
				new ContainerBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							"That reminder is no longer active.",
						),
					),
			],
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

		if (selectedReminder) {
			await interaction.editReply({
				components: [
					buildReminderPanel({ reminders, selectedReminder }),
				],
			});
		} else {
			await interaction.editReply({
				components: [buildReminderPanel({ reminders })],
			});
		}
	} catch (error) {
		await interaction.editReply({
			components: [
				new ContainerBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							error instanceof Error
								? error.message
								: "Failed to update reminder.",
						),
					),
			],
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
