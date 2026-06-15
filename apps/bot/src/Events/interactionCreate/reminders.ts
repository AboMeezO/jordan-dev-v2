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

export default async function (
  interaction: Interaction,
  client: Client,
): Promise<void> {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) {
    return;
  }

  const parsed = parseReminderCustomId(interaction.customId);

  if (!parsed) {
    return;
  }

  if (interaction.isStringSelectMenu()) {
    await handleSelect(interaction, client);
    return;
  }

  if (interaction.isButton()) {
    await handleButton(interaction, client, parsed.action, parsed.reminderId);
    return;
  }

  await handleModal(interaction, client, parsed.action, parsed.reminderId);
}

async function handleSelect(
  interaction: StringSelectMenuInteraction,
  client: Client,
): Promise<void> {
  const selectedId = interaction.values[0];
  const reminders = listUserReminders(client, interaction.user.id);
  const selectedReminder = reminders.find((reminder) => reminder.id === selectedId);

  await interaction.update({
    components: [buildReminderPanel({ reminders, selectedReminder })],
    flags: reminderMessageFlags(),
  });
}

async function handleButton(
  interaction: ButtonInteraction,
  client: Client,
  action: string,
  reminderId: string | undefined,
): Promise<void> {
  const reminder = findOwnedReminder(client, interaction.user.id, reminderId);

  if (!reminder) {
    await interaction.reply({
      content: "That reminder is no longer active.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (action === "edit-message") {
    await interaction.showModal(buildReminderMessageModal(reminder));
    return;
  }

  if (action === "edit-time") {
    await interaction.showModal(buildReminderTimeModal(reminder));
    return;
  }

  if (action === "toggle-delivery") {
    const updated = toggleReminderDelivery(client, reminder.id);
    await updatePanel(interaction, client, updated?.id);
    return;
  }

  if (action === "cancel") {
    cancelReminder(client, reminder.id);
    await updatePanel(interaction, client);
  }
}

async function handleModal(
  interaction: ModalSubmitInteraction,
  client: Client,
  action: string,
  reminderId: string | undefined,
): Promise<void> {
  const reminder = findOwnedReminder(client, interaction.user.id, reminderId);

  if (!reminder) {
    await interaction.reply({
      content: "That reminder is no longer active.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    if (action === "modal-message") {
      const message = interaction.fields.getTextInputValue("message").trim();
      updateReminderMessage(client, reminder.id, message);
    }

    if (action === "modal-time") {
      const time = interaction.fields.getTextInputValue("time").trim();
      updateReminderTime(client, reminder.id, time);
    }

    const reminders = listUserReminders(client, interaction.user.id);
    const selectedReminder = reminders.find((item) => item.id === reminder.id);

    await interaction.reply({
      components: [buildReminderPanel({ reminders, selectedReminder })],
      flags: reminderInteractionFlags(),
    });
  } catch (error) {
    await interaction.reply({
      content: error instanceof Error ? error.message : "Failed to update reminder.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function updatePanel(
  interaction: ButtonInteraction,
  client: Client,
  selectedId?: string,
): Promise<void> {
  const reminders = listUserReminders(client, interaction.user.id);
  const selectedReminder = reminders.find((reminder) => reminder.id === selectedId);

  await interaction.update({
    components: [buildReminderPanel({ reminders, selectedReminder })],
    flags: reminderMessageFlags(),
  });
}

function findOwnedReminder(
  client: Client,
  userId: string,
  reminderId: string | undefined,
) {
  if (!reminderId) {
    return undefined;
  }

  return listUserReminders(client, userId).find(
    (reminder) => reminder.id === reminderId,
  );
}
