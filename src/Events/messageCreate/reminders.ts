import type { Client, Message } from "discord.js";

import { listUserReminders } from "../../Reminders/reminder-command.js";
import {
  buildReminderPanel,
  reminderMessageFlags,
} from "../../Reminders/reminder-panel.js";

const DEFAULT_PREFIX = "!";

export default async function (
  message: Message,
  client: Client,
): Promise<void> {
  if (message.author.bot) {
    return;
  }

  const prefix = process.env.PREFIX ?? DEFAULT_PREFIX;

  if (message.content.trim().toLowerCase() !== `${prefix}reminders`) {
    return;
  }

  const reminders = listUserReminders(client, message.author.id);

  await message.reply({
    components: [buildReminderPanel({ reminders })],
    flags: reminderMessageFlags(),
  });
}
