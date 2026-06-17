
import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

import { listUserReminders } from "../Reminders/reminder-command.js";
import {
  buildReminderPanel,
  reminderInteractionFlags,
} from "../Reminders/reminder-panel.js";

export const data = new SlashCommandBuilder()
  .setName("reminders")
  .setDescription("Inspect and manage your active reminders.");

export async function run({
  interaction,
}: {
  readonly interaction: ChatInputCommandInteraction;
}): Promise<void> {
  const reminders = await listUserReminders(
    interaction.client,
    interaction.user.id,
  );

  await interaction.reply({
    components: [buildReminderPanel({ reminders })],
    flags: reminderInteractionFlags(),
  });
}
