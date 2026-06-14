import type { Client, Message } from "discord.js";

import {
  parsePrefixReminderArgs,
  scheduleReminder,
} from "../../Reminders/reminder-command.js";

const DEFAULT_PREFIX = "!";

export default async function (
  message: Message,
  client: Client,
): Promise<void> {
  if (message.author.bot) {
    return;
  }

  const prefix = process.env.PREFIX ?? DEFAULT_PREFIX;
  const [commandName, ...args] = message.content.trim().split(/\s+/);

  if (commandName?.toLowerCase() !== `${prefix}remind`) {
    return;
  }

  const { delivery, message: reminderMessage, time } =
    parsePrefixReminderArgs(args);

  if (!time || reminderMessage.length === 0) {
    await message.reply(
      `Usage: \`${prefix}remind 10m check deploy\` or \`${prefix}remind --dm 09:30 standup\`.`,
    );
    return;
  }

  try {
    const result = scheduleReminder({
      client,
      userId: message.author.id,
      channelId: message.channelId,
      time,
      message: reminderMessage,
      delivery,
    });

    await message.reply(
      `Reminder set for <t:${Math.floor(result.remindAt.getTime() / 1000)}:R> in ${
        result.delivery === "dm" ? "your DMs" : "this channel"
      }.`,
    );
  } catch (error) {
    await message.reply(
      error instanceof Error ? error.message : "Failed to set reminder.",
    );
  }
}
