import { commandTree } from "#ChatCommands";

import {
  parsePrefixReminderArgs,
  scheduleReminder,
} from "../../Reminders/reminder-command.js";

export const remindCommand = commandTree({
  description: "Schedule a reminder.",
  name: "remind",
  permission: "public",
  usage: {
    arguments: [
      {
        description: "When the reminder should fire.",
        name: "time",
      },
      {
        description: "The reminder text.",
        name: "message",
      },
    ],
    examples: [
      {
        command: "!remind 10m check deploy",
        description: "Remind you in this channel after ten minutes.",
      },
      {
        command: "!remind --dm 09:30 standup",
        description: "Send the reminder to your DMs at 09:30.",
      },
    ],
    formats: ["!remind <time> <message>", "!remind --dm <time> <message>"],
    options: [
      {
        description: "Send the reminder privately instead of in this channel.",
        name: "dm",
      },
    ],
    useCases: [
      "Set a quick follow-up while discussing work in Discord.",
      "Send yourself a private reminder for later.",
    ],
  },
  async execute({ client, invocation, message }) {
    const { delivery, message: reminderMessage, time } =
      parsePrefixReminderArgs(invocation.rawArgs);

    if (!time || reminderMessage.length === 0) {
      await message.reply(
        `Usage: \`${invocation.prefix}remind 10m check deploy\` or \`${invocation.prefix}remind --dm 09:30 standup\`.`,
      );
      return;
    }

    try {
      const result = await scheduleReminder({
        channelId: message.channelId,
        client,
        delivery,
        message: reminderMessage,
        time,
        userId: message.author.id,
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
  },
});
